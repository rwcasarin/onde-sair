// POST /api/auth/login { email, password, remember }  ou  { credential, remember } (Google)
import { loadTeam, verifyPassword, sessionCookie, publicMember } from "../_lib/auth.js";
import { writeJSON } from "../_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "../_lib/http.js";
import { verifyGoogle } from "../_lib/google.js";

// limite de tentativas (por instância): 5 erros → 30 s de bloqueio
const attempts = new Map();

export const POST = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const { email = "", password = "", remember = false, credential } = await body(request);

  // Google: entra quem já faz parte da equipe com o mesmo e-mail (o Google não cria acesso ao painel)
  if (credential) {
    let g;
    try { g = await verifyGoogle(credential); }
    catch (e) { return fail(e.status || 401, e.message); }
    const { data: team, etag } = await loadTeam();
    const u = team.find(t => t.email.toLowerCase() === g.email);
    if (!u) return fail(403, "not-member");
    if (u.status !== "ativo") return fail(403, "inactive");
    if (u.googleSub && g.sub && u.googleSub !== g.sub) return fail(403, "not-member");
    u.googleSub = g.sub; u.lastLogin = new Date().toISOString();
    if (!u.avatar && g.picture) u.avatar = g.picture;
    await writeJSON("team", team, etag).catch(() => {});
    return json({ user: publicMember(u) }, 200, { "set-cookie": sessionCookie(u, remember) });
  }

  const key = (request.headers.get("x-forwarded-for") || "").split(",")[0] + "|" + email.toLowerCase();
  const a = attempts.get(key) || { n: 0, until: 0 };
  if (Date.now() < a.until) return fail(429, "locked", { wait: Math.ceil((a.until - Date.now()) / 1000) });

  const { data: team, etag } = await loadTeam();
  const u = team.find(t => t.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || !verifyPassword(password, u.hash)) {
    a.n += 1;
    if (a.n >= 5) { a.n = 0; a.until = Date.now() + 30000; attempts.set(key, a); return fail(429, "locked", { wait: 30 }); }
    attempts.set(key, a);
    return fail(401, "invalid", { left: 5 - a.n });
  }
  if (u.status !== "ativo") return fail(403, "inactive");
  attempts.delete(key);
  u.lastLogin = new Date().toISOString();
  await writeJSON("team", team, etag).catch(() => {}); // registro do último acesso é opcional
  return json({ user: publicMember(u) }, 200, { "set-cookie": sessionCookie(u, remember) });
});
