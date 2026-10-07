// Login social (OAuth 2.0): Google, Instagram e TikTok
// Início:   GET /api/oauth/{provider}           → redireciona para o provedor
// Retorno:  GET /api/oauth/{provider}/callback  → cria/atualiza a conta e volta ao site
// (rotas reescritas em vercel.json para ?provider=&step=)
// Cada provedor só fica ativo quando suas credenciais existem nas variáveis de ambiente.
import crypto from "node:crypto";
import { updateUsers, userCookie, newUserId } from "./_lib/users.js";
import { handle } from "./_lib/http.js";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

const PROVIDERS = {
  google: {
    id: () => process.env.GOOGLE_CLIENT_ID, secret: () => process.env.GOOGLE_CLIENT_SECRET,
    authorize: (cfg, redirect, state) => "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
      client_id: cfg.id, redirect_uri: redirect, response_type: "code", scope: "openid email profile", state, prompt: "select_account",
    }),
    async profile(cfg, code, redirect) {
      const t = await post("https://oauth2.googleapis.com/token", { code, client_id: cfg.id, client_secret: cfg.secret, redirect_uri: redirect, grant_type: "authorization_code" });
      const p = await getJSON("https://openidconnect.googleapis.com/v1/userinfo", t.access_token);
      return { providerId: p.sub, name: p.name || p.given_name, email: p.email_verified ? p.email : null, avatar: p.picture || null };
    },
  },
  instagram: {
    // Instagram API com login do Instagram (contas profissionais: criador ou empresa)
    id: () => process.env.INSTAGRAM_CLIENT_ID, secret: () => process.env.INSTAGRAM_CLIENT_SECRET,
    authorize: (cfg, redirect, state) => "https://www.instagram.com/oauth/authorize?" + new URLSearchParams({
      client_id: cfg.id, redirect_uri: redirect, response_type: "code", scope: "instagram_business_basic", state,
    }),
    async profile(cfg, code, redirect) {
      const t = await post("https://api.instagram.com/oauth/access_token", { client_id: cfg.id, client_secret: cfg.secret, grant_type: "authorization_code", redirect_uri: redirect, code });
      const p = await getJSON("https://graph.instagram.com/v21.0/me?fields=user_id,username,name,profile_picture_url&access_token=" + encodeURIComponent(t.access_token));
      return { providerId: String(p.user_id || t.user_id), name: p.name || p.username, email: null, avatar: p.profile_picture_url || null, handle: p.username };
    },
  },
  tiktok: {
    id: () => process.env.TIKTOK_CLIENT_KEY, secret: () => process.env.TIKTOK_CLIENT_SECRET,
    authorize: (cfg, redirect, state) => "https://www.tiktok.com/v2/auth/authorize/?" + new URLSearchParams({
      client_key: cfg.id, redirect_uri: redirect, response_type: "code", scope: "user.info.basic", state,
    }),
    async profile(cfg, code, redirect) {
      const t = await post("https://open.tiktokapis.com/v2/oauth/token/", { client_key: cfg.id, client_secret: cfg.secret, code, grant_type: "authorization_code", redirect_uri: redirect });
      const r = await getJSON("https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name", t.access_token);
      const p = r.data?.user || {};
      return { providerId: p.open_id || t.open_id, name: p.display_name, email: null, avatar: p.avatar_url || null };
    },
  },
};

export const providers = () => Object.fromEntries(Object.entries(PROVIDERS).map(([k, p]) => [k, !!(p.id() && p.secret())]));

async function post(url, params) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: new URLSearchParams(params) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error("token: " + (data.error_description || data.error?.message || data.error || r.status));
  return data;
}
async function getJSON(url, token) {
  const r = await fetch(url, { headers: token ? { authorization: "Bearer " + token } : {} });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("perfil: " + r.status);
  return data;
}

const origin = (request) => {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const u = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || u.host;
  const proto = request.headers.get("x-forwarded-proto") || u.protocol.replace(":", "");
  return `${proto}://${host}`;
};
const sign = (v) => crypto.createHmac("sha256", SECRET).update("oauth:" + v).digest("base64url");
const back = (request, hash, cookies = []) => {
  const h = new Headers({ location: origin(request) + "/#/" + hash, "cache-control": "no-store" });
  cookies.forEach(c => h.append("set-cookie", c));
  return new Response(null, { status: 302, headers: h });
};

export const GET = handle(async (request) => {
  const q = new URL(request.url).searchParams;
  const name = q.get("provider");
  const p = PROVIDERS[name];
  if (!p) return back(request, "entrar?erro=provedor");
  const cfg = { id: p.id(), secret: p.secret() };
  if (!cfg.id || !cfg.secret) return back(request, `entrar?erro=indisponivel&provedor=${name}`);
  const redirect = `${origin(request)}/api/oauth/${name}/callback`;

  if (q.get("step") !== "callback") {
    const state = crypto.randomBytes(16).toString("base64url");
    const next = (q.get("next") || "").replace(/[^\w\-/=?&]/g, "").slice(0, 60);
    const value = `${name}.${state}.${Buffer.from(next).toString("base64url")}`;
    const secure = process.env.VERCEL ? "; Secure" : "";
    return new Response(null, { status: 302, headers: {
      location: p.authorize(cfg, redirect, state),
      "set-cookie": `os_oauth=${value}.${sign(value)}; Path=/api/oauth; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
      "cache-control": "no-store",
    } });
  }

  // retorno do provedor
  const clear = "os_oauth=; Path=/api/oauth; HttpOnly; SameSite=Lax; Max-Age=0";
  if (q.get("error")) return back(request, "entrar?erro=cancelado", [clear]);
  const raw = (request.headers.get("cookie") || "").split(/;\s*/).find(c => c.startsWith("os_oauth="))?.slice(9) || "";
  const [pv, st, nx, sig] = raw.split(".");
  if (!sig || sign(`${pv}.${st}.${nx}`) !== sig || pv !== name || st !== q.get("state")) return back(request, "entrar?erro=sessao", [clear]);

  let prof;
  try { prof = await p.profile(cfg, q.get("code"), redirect); }
  catch (e) { console.error("oauth", name, e.message); return back(request, `entrar?erro=falha&provedor=${name}`, [clear]); }

  const user = await updateUsers((users) => {
    let u = users.find(x => x.providers?.[name] === prof.providerId) || (prof.email && users.find(x => x.email === prof.email.toLowerCase()));
    if (u?.status === "bloqueado") return u;
    if (!u) {
      u = { id: newUserId(), name: prof.name || "Nova pessoa", email: prof.email ? prof.email.toLowerCase() : null, hash: null, providers: {}, avatar: prof.avatar,
        city: "sp", vibes: [], faves: [], plan: "Grátis", status: "ativo", marketing: false, onboarded: false, joined: new Date().toISOString(), sessionVersion: 0 };
      users.push(u);
    }
    u.providers = { ...(u.providers || {}), [name]: prof.providerId };
    if (!u.avatar && prof.avatar) u.avatar = prof.avatar;
    if (prof.handle) u.instagram = "@" + prof.handle;
    u.lastSeen = new Date().toISOString();
    return u;
  });
  if (user.status === "bloqueado") return back(request, "entrar?erro=bloqueado", [clear]);
  const next = Buffer.from(nx || "", "base64url").toString();
  return back(request, user.onboarded ? (next || "conta") : "boas-vindas", [clear, userCookie(user)]);
});
