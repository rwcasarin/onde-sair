// POST /api/admin/media { path, dataUrl } — envia imagem (JPEG/PNG/WebP até 4 MB)
// DELETE /api/admin/media?p=… — remove
import { requireUser } from "../_lib/auth.js";
import { readJSON, writeJSON, writeFile, deleteFile, Conflict } from "../_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "../_lib/http.js";
import { can } from "../../shared/roles.js";

const VALID = /^images\/[\w\-./]+\.(jpe?g|png|webp)$/i;

async function updateMap(fn) {
  for (let i = 0; i < 4; i++) {          // tenta de novo se outra gravação aconteceu no meio
    const cur = await readJSON("media");
    const map = fn({ ...(cur?.data || {}) });
    try { await writeJSON("media", map, cur ? cur.etag : null); return map; }
    catch (e) { if (!(e instanceof Conflict)) throw e; }
  }
  throw Object.assign(new Error("Muitas gravações simultâneas, tente de novo."), { status: 409 });
}

export const POST = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const user = await requireUser(request);
  if (!can(user, "media.manage")) return fail(403, "Seu perfil não gerencia mídia.");
  const { path = "", dataUrl = "" } = await body(request);
  if (!VALID.test(path) || path.includes("..")) return fail(400, "Caminho inválido");
  const m = dataUrl.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (!m) return fail(400, "Formato de imagem não suportado");
  const buf = Buffer.from(m[3], "base64");
  if (buf.length > 4 * 1024 * 1024) return fail(413, "Imagem acima de 4 MB");
  await writeFile(path, buf, m[1]);
  const version = Date.now().toString(36);
  await updateMap(map => ({ ...map, [path]: version }));
  return json({ ok: true, version });
});

export const DELETE = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const user = await requireUser(request);
  if (!can(user, "media.manage")) return fail(403, "Seu perfil não gerencia mídia.");
  const p = new URL(request.url).searchParams.get("p") || "";
  if (!VALID.test(p)) return fail(400, "Caminho inválido");
  await deleteFile(p);
  await updateMap(map => { delete map[p]; return map; });
  return json({ ok: true });
});
