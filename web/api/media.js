// GET /api/media?p=images/lugares/p1.jpg — entrega imagens enviadas pelo painel
import { readFile } from "./_lib/storage.js";
import { fail, handle } from "./_lib/http.js";

export const GET = handle(async (request) => {
  const p = new URL(request.url).searchParams.get("p") || "";
  if (!/^images\/[\w\-./]+\.(jpe?g|png|webp)$/i.test(p) || p.includes("..")) return fail(400, "Caminho inválido");
  const f = await readFile(p);
  if (!f) return fail(404, "Imagem não encontrada");
  return new Response(f.stream, { headers: { "content-type": f.contentType, "cache-control": "public, max-age=31536000, immutable" } });
});
