// GET /api/content — conteúdo publicado (lido pelo site público)
// GET /api/content?view=/caminho[&shell=0][&have=…] — só o que a tela do caminho precisa (ver shared/pageview.js);
//   shell=0 deixa de fora o básico (configurações, menus, cidades…) que o site já recebeu;
//   have=places,roteiros… deixa de fora as listas que o site já tem inteiras
// GET /api/content?list=lugares|vibes|roteiros|radar|eventos|busca&…filtros&pagina=N[&mapa=1] — uma página da listagem (src/listings.js)
// GET /api/content?suggest=texto — sugestões da caixa de busca
// GET /api/content?pins=cidade — lugares da cidade só como pins do mapa
// (uma função só: limite de funções do plano Hobby)
import { readJSON } from "./_lib/storage.js";
import { useDb, dbPublicContent } from "./_lib/db.js";
import { json, handle } from "./_lib/http.js";
import { publicView } from "../shared/roles.js";
import { pageView } from "../shared/pageview.js";
import { hydratePublic } from "../src/admin/store.js";
import { runList, suggest, pinOf } from "../src/listings.js";
import { resetSearchCache } from "../src/search.js";
import { PLACES } from "../src/data.js";

// horários ("aberto agora", eventos de hoje) no fuso do site, não no do servidor
process.env.TZ = "America/Sao_Paulo";

const CACHE = { "cache-control": "public, s-maxage=5, stale-while-revalidate=60" };
// home e lista de eventos: sempre direto do banco (sem cópia na CDN)
const FRESH = { "cache-control": "no-store" };
const isHome = (view) => (String(view || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/") === "/";

async function load() {
  if (useDb()) return dbPublicContent();
  const [content, media] = await Promise.all([readJSON("content"), readJSON("media")]);
  return content ? { content: content.data, media: media?.data || {}, version: content.etag } : null;
}

// conteúdo nos arrays do site (só quando muda: a mesma instância atende vários pedidos)
let hydrated = null;
function hydrate(pv, version) {
  if (version && version === hydrated) return;
  hydratePublic(pv);
  resetSearchCache();
  hydrated = version || null;
}

export const GET = handle(async (request) => {
  const q = new URL(request.url).searchParams;
  const data = await load();
  if (!data) return json({ empty: true }, 200, { "cache-control": "no-store" });
  const pv = publicView(data.content);
  if (q.has("list") || q.has("suggest") || q.has("pins")) {
    hydrate(pv, data.version);
    if (q.has("suggest")) return json(suggest(q.get("suggest")), 200, CACHE);
    if (q.has("pins")) return json({ pins: PLACES.filter(p => p.city === q.get("pins")).map(pinOf) }, 200, CACHE);
    const out = runList(q.get("list"), q);
    return out ? json(out, 200, q.get("list") === "eventos" ? FRESH : CACHE) : json({ error: "lista desconhecida" }, 400);
  }
  if (!q.has("view")) return json({ db: { ...pv, media: data.media } }, 200, CACHE);
  const shell = q.get("shell") !== "0";
  const have = (q.get("have") || "").split(",").filter(Boolean);
  return json({ db: { ...pageView(pv, q.get("view"), { shell, have }), ...(shell ? { media: data.media } : {}) } }, 200, isHome(q.get("view")) ? FRESH : CACHE);
});
