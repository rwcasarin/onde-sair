// POST /api/auth/password { current, next } — troca a própria senha
import { requireUser, loadTeam, verifyPassword, hashPassword, sessionCookie } from "../_lib/auth.js";
import { writeJSON } from "../_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "../_lib/http.js";

export const POST = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const me = await requireUser(request);
  const { current = "", next = "" } = await body(request);
  if (next.length < 8) return fail(400, "A nova senha precisa de pelo menos 8 caracteres.");
  const { data: team, etag } = await loadTeam();
  const u = team.find(t => t.id === me.id);
  if (!verifyPassword(current, u.hash)) return fail(400, "A senha atual não confere.");
  u.hash = hashPassword(next);
  u.sessionVersion = (u.sessionVersion || 0) + 1; // derruba sessões antigas
  await writeJSON("team", team, etag);
  return json({ ok: true }, 200, { "set-cookie": sessionCookie(u, true) });
});
