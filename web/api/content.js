// GET /api/content — conteúdo publicado (lido pelo site público)
// GET /api/content?view=/caminho[&shell=0] — só o que a tela do caminho precisa (ver shared/pageview.js);
//   shell=0 deixa de fora o básico (configurações, menus, cidades…) que o site já recebeu;
//   have=places,roteiros… deixa de fora as listas que o site já tem inteiras
import { readJSON } from "./_lib/storage.js";
import { useDb, dbPublicContent } from "./_lib/db.js";
import { json, handle } from "./_lib/http.js";
import { publicView } from "../shared/roles.js";
import { pageView } from "../shared/pageview.js";

const CACHE = { "cache-control": "public, s-maxage=5, stale-while-revalidate=60" };

async function load() {
  if (useDb()) return dbPublicContent();
  const [content, media] = await Promise.all([readJSON("content"), readJSON("media")]);
  return content ? { content: content.data, media: media?.data || {} } : null;
}

export const GET = handle(async (request) => {
  const q = new URL(request.url).searchParams;
  const data = await load();
  if (!data) return json({ empty: true }, 200, { "cache-control": "no-store" });
  const pv = publicView(data.content);
  if (!q.has("view")) return json({ db: { ...pv, media: data.media } }, 200, CACHE);
  const shell = q.get("shell") !== "0";
  const have = (q.get("have") || "").split(",").filter(Boolean);
  return json({ db: { ...pageView(pv, q.get("view"), { shell, have }), ...(shell ? { media: data.media } : {}) } }, 200, CACHE);
});
