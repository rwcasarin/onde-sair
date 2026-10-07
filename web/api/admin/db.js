// GET /api/admin/db — banco completo para o painel
// PUT /api/admin/db { db, etag } — grava, validando permissões do perfil
import { requireUser, loadTeam, publicMember } from "../_lib/auth.js";
import { readJSON, writeJSON, Conflict } from "../_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "../_lib/http.js";
import { can } from "../../shared/roles.js";

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const [content, media, team] = await Promise.all([readJSON("content"), readJSON("media"), loadTeam()]);
  return json({
    user, etag: content?.etag || null,
    db: content ? { ...content.data, media: media?.data || {}, team: team.data.map(publicMember) } : null,
  });
});

const COLLS = ["places", "roteiros", "stories"];
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
  const guard = [["home.edit", ["home", "vibes"]], ["reviews.moderate", ["reviews"]], ["members.manage", ["members"]], ["notify.send", ["campaigns"]], ["settings.edit", ["settings", "cities"]]];
  for (const [perm, keys] of guard) {
    if (!can(user, perm) && keys.some(k => !same(prev[k], next[k]))) return "Seu perfil não pode alterar esta área.";
  }
  return null;
}

export const PUT = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const user = await requireUser(request);
  const { db, etag } = await body(request);
  if (!db || !Array.isArray(db.places)) return fail(400, "Banco inválido");
  const { team, media, ...content } = db; // equipe e mídia têm rotas próprias
  content.activity = (content.activity || []).slice(0, 200);
  const cur = await readJSON("content");
  if (cur && cur.etag !== etag) return fail(409, "conflict", { etag: cur.etag });
  const why = violation(user, cur?.data, content);
  if (why) return fail(403, why);
  try {
    const nextEtag = await writeJSON("content", content, cur ? cur.etag : null);
    return json({ ok: true, etag: nextEtag });
  } catch (e) {
    if (e instanceof Conflict) { const c = await readJSON("content"); return fail(409, "conflict", { etag: c?.etag }); }
    throw e;
  }
});
