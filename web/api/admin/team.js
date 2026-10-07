// Equipe do painel (somente administradores)
// POST   { name, email, role }      → convida e devolve uma senha provisória (mostrada uma vez)
// PATCH  { id, role?, status?, resetPassword? } → altera perfil/status ou gera nova senha provisória
// DELETE ?id=…                      → remove o acesso
import crypto from "node:crypto";
import { requireUser, loadTeam, hashPassword, publicMember } from "../_lib/auth.js";
import { writeJSON } from "../_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "../_lib/http.js";
import { can, ROLES } from "../../shared/roles.js";

async function guard(request) {
  if (!isCmsCall(request)) throw Object.assign(new Error("Requisição inválida"), { status: 403 });
  const user = await requireUser(request);
  if (!can(user, "team.manage")) throw Object.assign(new Error("Só administradores gerenciam a equipe."), { status: 403 });
  return user;
}
const activeAdmins = (team) => team.filter(t => t.role === "admin" && t.status === "ativo").length;

export const POST = handle(async (request) => {
  await guard(request);
  const { name = "", email = "", role = "curador" } = await body(request);
  if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "Nome ou e-mail inválido.");
  if (!ROLES[role]) return fail(400, "Perfil inválido.");
  const { data: team, etag } = await loadTeam();
  if (team.some(t => t.email.toLowerCase() === email.toLowerCase())) return fail(400, "Essa pessoa já está na equipe.");
  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const member = { id: "t" + crypto.randomBytes(4).toString("hex"), name: name.trim(), email: email.toLowerCase(), role, status: "ativo", hash: hashPassword(tempPassword), lastLogin: null, sessionVersion: 0 };
  team.push(member);
  await writeJSON("team", team, etag);
  return json({ member: publicMember(member), tempPassword, team: team.map(publicMember) });
});

export const PATCH = handle(async (request) => {
  const me = await guard(request);
  const { id, role, status, resetPassword } = await body(request);
  const { data: team, etag } = await loadTeam();
  const t = team.find(x => x.id === id);
  if (!t) return fail(404, "Pessoa não encontrada.");
  if (role && !ROLES[role]) return fail(400, "Perfil inválido.");
  if (t.id === me.id && role && role !== "admin") return fail(400, "Você não pode remover o seu próprio acesso de administrador.");
  const next = { ...t, ...(role ? { role } : {}), ...(status ? { status } : {}) };
  const after = team.map(x => x.id === id ? next : x);
  if (activeAdmins(after) < 1) return fail(400, "O painel precisa de pelo menos um administrador ativo.");
  if ((role && role !== t.role) || (status && status !== t.status)) next.sessionVersion = (t.sessionVersion || 0) + 1;
  let tempPassword;
  if (resetPassword) {
    tempPassword = crypto.randomBytes(9).toString("base64url");
    next.hash = hashPassword(tempPassword);
    next.sessionVersion = (t.sessionVersion || 0) + 1;
  }
  await writeJSON("team", after, etag);
  return json({ team: after.map(publicMember), tempPassword });
});

export const DELETE = handle(async (request) => {
  const me = await guard(request);
  const id = new URL(request.url).searchParams.get("id");
  if (id === me.id) return fail(400, "Você não pode remover a si mesmo.");
  const { data: team, etag } = await loadTeam();
  const after = team.filter(x => x.id !== id);
  if (activeAdmins(after) < 1) return fail(400, "Não dá para remover o último administrador.");
  await writeJSON("team", after, etag);
  return json({ team: after.map(publicMember) });
});
