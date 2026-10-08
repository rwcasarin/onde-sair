// GET /api/instagram?place=<id> — últimos posts do Instagram de um lugar publicado (site)
// GET /api/instagram?u=<perfil>   — checagem do perfil pelo painel (exige login)
//
// Usa o Business Discovery da API do Instagram (Graph API): a conta profissional do Onde Sair
// consulta os posts de outros perfis profissionais (empresa/criador) públicos, sem precisar de
// autorização de cada lugar. Perfis privados, pessoais ou inexistentes voltam como "indisponivel".
// Credenciais: Configurações › Integrações no painel (ou INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ID).
import { readJSON } from "./_lib/storage.js";
import { json, fail, handle } from "./_lib/http.js";
import { requireUser } from "./_lib/auth.js";
import { isLive } from "../shared/roles.js";
import { instagramCreds } from "./_lib/secrets.js";
import { graph, explain, isUnavailable } from "./_lib/instagram.js";

const LIMIT = 10;
const TTL = 60 * 60 * 1000;   // 1 h em memória (além do cache da CDN)
const memo = new Map();

export const cleanHandle = (h = "") => String(h).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
const validHandle = (h) => /^[A-Za-z0-9._]{1,30}$/.test(h);

async function fetchProfile(handle) {
  const creds = await instagramCreds();
  if (!creds) return { status: "nao-configurado", posts: [] };
  const { token, businessId: me } = creds;
  const hit = memo.get(handle);
  if (hit && hit.me !== me + token.slice(-6)) memo.delete(handle);
  if (memo.has(handle) && Date.now() - hit.at < TTL) return hit.data;
  const fields = `business_discovery.username(${handle}){username,media_count,media.limit(${LIMIT}){permalink,media_type,timestamp}}`;
  const r = await graph(me, fields, token);
  let data;
  if (r.data?.business_discovery) {
    const bd = r.data.business_discovery;
    const posts = (bd.media?.data || [])
      .filter(m => /^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[\w-]+\/?$/.test(m.permalink || ""))
      .slice(0, LIMIT)
      .map(m => ({ url: m.permalink, type: m.media_type, at: m.timestamp }));
    data = { status: posts.length ? "ok" : "sem-posts", username: bd.username, posts };
  } else if (isUnavailable(r.error)) {
    data = { status: "indisponivel", posts: [] };   // privado, pessoal ou inexistente
  } else {
    console.error("instagram", handle, r.error);
    return { status: "erro", posts: [], detail: explain(r.error || {}) };   // não guarda: tenta de novo na próxima
  }
  memo.set(handle, { at: Date.now(), data, me: me + token.slice(-6) });
  return data;
}

export const GET = handle(async (request) => {
  const q = new URL(request.url).searchParams;
  // checagem do painel: qualquer perfil, sem cache
  if (q.has("u")) {
    await requireUser(request);
    const h = cleanHandle(q.get("u"));
    if (!validHandle(h)) return fail(400, "Perfil inválido");
    memo.delete(h);
    return json(await fetchProfile(h));   // inclui o motivo do erro (só para o painel)
  }
  // site: só lugares publicados com a seção ligada
  const id = q.get("place") || "";
  const content = await readJSON("content");
  const p = (content?.data?.places || []).find(x => x.id === id && isLive(x));
  if (!p) return fail(404, "Lugar não encontrado");
  const h = cleanHandle(p.insta);
  if (p.showInstagram === false || !validHandle(h)) return json({ status: "desligado", posts: [] }, 200, { "cache-control": "public, s-maxage=60" });
  const { detail, ...data } = await fetchProfile(h);   // o motivo técnico não vai para o site
  const cache = data.status === "erro" || data.status === "nao-configurado" ? "public, s-maxage=60" : "public, s-maxage=3600, stale-while-revalidate=86400";
  return json(data, 200, { "cache-control": cache });
});
