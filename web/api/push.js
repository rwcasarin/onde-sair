// Push no celular (app Android) via Firebase Cloud Messaging — uma função, duas ações (limite do plano Hobby)
// POST ?action=register { token, city? } → o app guarda o aparelho para receber push
// POST ?action=send     { campaign: { id, kind, title, body, audience } } → equipe (notify.send) dispara o push
// Configuração: variável de ambiente FIREBASE_SERVICE_ACCOUNT com o JSON da conta de serviço do Firebase
import crypto from "node:crypto";
import { requireUser } from "./_lib/auth.js";
import { currentUser, loadUsers } from "./_lib/users.js";
import { readJSON, writeJSON, Conflict } from "./_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "./_lib/http.js";
import { can } from "../shared/roles.js";

const action = (request) => new URL(request.url).searchParams.get("action");
const clean = (s, max = 80) => String(s || "").trim().slice(0, max);
const MAX_DEVICES = 50000;

// Lê, altera e grava a lista de aparelhos com nova tentativa em caso de gravação simultânea
async function updateDevices(fn) {
  for (let i = 0; i < 4; i++) {
    const cur = await readJSON("push");
    const devices = [...(cur?.data || [])];
    const result = fn(devices);
    try { await writeJSON("push", devices, cur ? cur.etag : null); return result; }
    catch (e) { if (!(e instanceof Conflict)) throw e; }
  }
  throw Object.assign(new Error("Muitas gravações ao mesmo tempo. Tente de novo."), { status: 409 });
}

// ---------- Firebase: token de acesso a partir da conta de serviço ----------
function serviceAccount() {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "");
    return sa.client_email && sa.private_key && sa.project_id ? sa : null;
  } catch { return null; }
}
let cached = null;
async function accessToken(sa) {
  if (cached && cached.exp > Date.now() + 60e3) return cached.token;
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat, exp: iat + 3600 });
  const jwt = unsigned + "." + crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.access_token) throw Object.assign(new Error("Não foi possível autenticar no Firebase. Confira FIREBASE_SERVICE_ACCOUNT."), { status: 502 });
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 };
  return cached.token;
}

// Envia para um aparelho: "ok" | "gone" (token inválido, sai da lista) | "error"
async function sendOne(sa, token, deviceToken, c) {
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: JSON.stringify({ message: {
      token: deviceToken,
      notification: { title: c.title, body: c.body },
      data: { id: c.id, kind: c.kind, route: "/notificacoes" },
      android: { priority: "high", notification: { color: "#3B2A7C", channel_id: "geral" } },
    } }),
  }).catch(() => null);
  if (!r) return "error";
  if (r.ok) return "ok";
  const err = await r.json().catch(() => ({}));
  const code = err?.error?.details?.find?.(d => d.errorCode)?.errorCode || err?.error?.status;
  return r.status === 404 || code === "UNREGISTERED" || code === "INVALID_ARGUMENT" ? "gone" : "error";
}

// Público do painel: "Todos" | "Cidade: <nome>" | "Vibe: <nome>"
async function audienceFilter(audience) {
  if (!audience || audience === "Todos") return () => true;
  const content = (await readJSON("content").catch(() => null))?.data || {};
  const users = new Map(((await loadUsers()).data || []).map(u => [u.id, u]));
  const [type, ...rest] = String(audience).split(": "), name = rest.join(": ");
  if (type === "Cidade") {
    const city = (content.cities || []).find(c => c.name === name);
    const ids = new Set([name, city?.id].filter(Boolean));
    return (d) => ids.has(users.get(d.userId)?.city || d.city);
  }
  if (type === "Vibe") {
    const vibe = (content.vibes || []).find(v => v.label === name);
    const ids = new Set([name, vibe?.id, vibe?.slug].filter(Boolean));
    return (d) => (users.get(d.userId)?.vibes || []).some(v => ids.has(v));
  }
  return () => true;
}

export const POST = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const act = action(request);

  if (act === "register") {
    const { token, city } = await body(request, 8 * 1024);
    if (!token || typeof token !== "string" || token.length > 4096) return fail(400, "Token inválido.");
    const user = await currentUser(request).catch(() => null);
    await updateDevices((devices) => {
      const i = devices.findIndex(d => d.token === token);
      const d = { token, userId: user?.id || (i >= 0 ? devices[i].userId : null) || null, city: clean(city, 60) || null, at: new Date().toISOString() };
      if (i >= 0) devices[i] = d; else devices.push(d);
      if (devices.length > MAX_DEVICES) devices.splice(0, devices.length - MAX_DEVICES);
    });
    return json({ ok: true });
  }

  if (act === "send") {
    const user = await requireUser(request);
    if (!can(user, "notify.send")) return fail(403, "Sem permissão para enviar notificações.");
    const sa = serviceAccount();
    if (!sa) return fail(503, "push-off", { message: "Push ainda não configurado (FIREBASE_SERVICE_ACCOUNT)." });
    const { campaign: c = {} } = await body(request, 16 * 1024);
    const msg = { id: clean(c.id, 40), kind: clean(c.kind, 40), title: clean(c.title, 60), body: clean(c.body, 140) };
    if (!msg.title || !msg.body) return fail(400, "Título e mensagem são obrigatórios.");
    const devices = (await readJSON("push"))?.data || [];
    const match = await audienceFilter(c.audience);
    const targets = devices.filter(match);
    const token = await accessToken(sa);
    const gone = new Set();
    let sent = 0, failed = 0;
    for (let i = 0; i < targets.length; i += 100) {            // lotes em paralelo, sem estourar conexões
      const res = await Promise.all(targets.slice(i, i + 100).map(d => sendOne(sa, token, d.token, msg)));
      res.forEach((r, j) => { if (r === "ok") sent++; else { failed++; if (r === "gone") gone.add(targets[i + j].token); } });
    }
    if (gone.size) await updateDevices((list) => { const keep = list.filter(d => !gone.has(d.token)); list.length = 0; list.push(...keep); }).catch(() => {});
    return json({ sent, failed, devices: targets.length });
  }

  return fail(400, "Ação inválida");
});
