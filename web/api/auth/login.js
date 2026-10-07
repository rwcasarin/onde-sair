// POST /api/auth/login { email, password, remember }
import { loadTeam, verifyPassword, sessionCookie, publicMember } from "../_lib/auth.js";
import { writeJSON } from "../_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "../_lib/http.js";

// limite de tentativas (por instância): 5 erros → 30 s de bloqueio
const attempts = new Map();

export const POST = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const { email = "", password = "", remember = false } = await body(request);
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
