// GET /api/admin/db — banco completo para o painel
// PUT /api/admin/db { db, etag, force? } — grava, validando permissões do perfil (force: só admin)
import { requireUser, loadTeam, publicMember } from "../_lib/auth.js";
import { readJSON, writeJSON, Conflict } from "../_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "../_lib/http.js";
import { can } from "../../shared/roles.js";
import { loadUsers, updateUsers } from "../_lib/users.js";

// Contas reais do site, no formato da tela "Usuários" do painel
const asMember = (u) => ({
  id: u.id, name: u.name, email: u.email || "(sem e-mail)", city: u.city, status: u.status || "ativo",
  saves: (u.faves || []).length, reviews: 0, joined: u.joined, lastSeen: u.lastSeen,
  vibes: u.vibes || [], marketing: !!u.marketing,
});

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const [content, media, team, users] = await Promise.all([readJSON("content"), readJSON("media"), loadTeam(), loadUsers()]);
  const members = can(user, "members.manage") ? users.data.map(asMember) : [];
  return json({
    user, etag: content?.etag || null,
    db: content ? { ...content.data, members, media: media?.data || {}, team: team.data.map(publicMember) } : null,
  });
});

const COLLS = ["places", "roteiros", "stories", "pages"];
const LIVE = ["publicado", "agendado", "arquivado"];
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Retorna a primeira violação de permissão encontrada (ou null)
function violation(user, prev, next) {
  if (!prev) return can(user, "settings.edit") ? null : "Só um administrador pode criar o banco inicial.";
  for (const c of COLLS) {
    const before = new Map((prev[c] || []).map(x => [x.id, x]));
    const after = new Map((next[c] || []).map(x => [x.id, x]));
    if (!can(user, "content.edit") && !same(prev[c], next[c])) return "Seu perfil não edita conteúdo.";
    if (!can(user, "content.delete") && [...before.keys()].some(id => !after.has(id))) return "Seu perfil não exclui conteúdo.";
    if (!can(user, "content.publish")) {
      for (const [id, item] of after) {
        const old = before.get(id);
        if (LIVE.includes(item.status) && !same(old, item)) return "Seu perfil não publica: envie para revisão.";
      }
    }
  }
  const guard = [["content.publish", ["radarCategories"]], ["home.edit", ["home", "vibes", "menus"]], ["reviews.moderate", ["reviews"]], ["members.manage", ["members"]], ["notify.send", ["campaigns"]], ["settings.edit", ["settings", "cities"]]];
  for (const [perm, keys] of guard) {
    if (!can(user, perm) && keys.some(k => !same(prev[k], next[k]))) return "Seu perfil não pode alterar esta área.";
  }
  return null;
}

export const PUT = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const user = await requireUser(request);
  const { db, etag, force } = await body(request);
  if (!db || !Array.isArray(db.places)) return fail(400, "Banco inválido");
  if (force && !can(user, "settings.edit")) return fail(403, "Só administradores podem sobrescrever o conteúdo.");
  const { team, media, members, ...content } = db; // equipe, mídia e contas têm rotas próprias
  content.activity = (content.activity || []).slice(0, 200);
  const cur = await readJSON("content", etag || undefined);
  if (cur && !force && cur.etag !== etag) return fail(409, "conflict", { etag: cur.etag });
  content.members = cur?.data?.members || [];
  const why = violation(user, cur?.data, content);
  if (why) return fail(403, why);
  try {
    // force (só admin): grava a versão enviada mesmo que o servidor tenha mudado
    const nextEtag = await writeJSON("content", content, force ? undefined : cur ? cur.etag : null);
    return json({ ok: true, etag: nextEtag });
  } catch (e) {
    if (e instanceof Conflict) { const c = await readJSON("content"); return fail(409, "conflict", { etag: c?.etag }); }
    throw e;
  }
});

// PATCH /api/admin/db { memberIds, patch: { status } } — ações sobre contas do site
export const PATCH = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const user = await requireUser(request);
  if (!can(user, "members.manage")) return fail(403, "Seu perfil não gerencia usuários.");
  const { memberIds = [], patch = {} } = await body(request);
  const ok = {};
  if (["ativo", "bloqueado"].includes(patch.status)) ok.status = patch.status;
  const users = await updateUsers((list) => {
    list.forEach(u => {
      if (!memberIds.includes(u.id)) return;
      if (ok.status === "bloqueado" && u.status !== "bloqueado") u.sessionVersion = (u.sessionVersion || 0) + 1; // derruba a sessão
      Object.assign(u, ok);
    });
    return list;
  });
  return json({ members: users.map(asMember) });
});
