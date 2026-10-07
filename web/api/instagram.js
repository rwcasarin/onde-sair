// GET /api/instagram?place=<id> — últimos posts do Instagram de um lugar publicado (site)
// GET /api/instagram?u=<perfil>   — checagem do perfil pelo painel (exige login)
//
// Usa o Business Discovery da API do Instagram (Graph API): a conta profissional do Onde Sair
// consulta os posts de outros perfis profissionais (empresa/criador) públicos, sem precisar de
// autorização de cada lugar. Perfis privados, pessoais ou inexistentes voltam como "indisponivel".
// Variáveis de ambiente: INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ID (id da conta do Onde Sair).
import { readJSON } from "./_lib/storage.js";
import { json, fail, handle } from "./_lib/http.js";
import { requireUser } from "./_lib/auth.js";
import { isLive } from "../shared/roles.js";

const LIMIT = 10;
const TTL = 60 * 60 * 1000;   // 1 h em memória (além do cache da CDN)
const memo = new Map();

export const cleanHandle = (h = "") => String(h).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
const validHandle = (h) => /^[A-Za-z0-9._]{1,30}$/.test(h);

async function fetchProfile(handle) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN, me = process.env.INSTAGRAM_BUSINESS_ID;
  if (!token || !me) return { status: "nao-configurado", posts: [] };
  const hit = memo.get(handle);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const base = process.env.INSTAGRAM_GRAPH_URL || "https://graph.facebook.com/v23.0";
  const fields = `business_discovery.username(${handle}){username,media_count,media.limit(${LIMIT}){permalink,media_type,timestamp}}`;
  let data;
  try {
    const r = await fetch(`${base}/${me}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
    const j = await r.json().catch(() => ({}));
    if (j.business_discovery) {
      const posts = (j.business_discovery.media?.data || [])
        .filter(m => /^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[\w-]+\/?$/.test(m.permalink || ""))
        .slice(0, LIMIT)
        .map(m => ({ url: m.permalink, type: m.media_type, at: m.timestamp }));
      data = { status: posts.length ? "ok" : "sem-posts", username: j.business_discovery.username, posts };
    } else if (j.error && (j.error.error_subcode === 2207013 || j.error.code === 110 || /cannot find user|not.*business/i.test(j.error.message || ""))) {
      data = { status: "indisponivel", posts: [] };   // privado, pessoal ou inexistente
    } else {
      console.error("instagram", j.error || r.status);
      return { status: "erro", posts: [] };              // não guarda: tenta de novo na próxima
    }
  } catch (e) {
    console.error("instagram", e);
    return { status: "erro", posts: [] };
  }
  memo.set(handle, { at: Date.now(), data });
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
    return json(await fetchProfile(h));
  }
  // site: só lugares publicados com a seção ligada
  const id = q.get("place") || "";
  const content = await readJSON("content");
  const p = (content?.data?.places || []).find(x => x.id === id && isLive(x));
  if (!p) return fail(404, "Lugar não encontrado");
  const h = cleanHandle(p.insta);
  if (p.showInstagram === false || !validHandle(h)) return json({ status: "desligado", posts: [] }, 200, { "cache-control": "public, s-maxage=60" });
  const data = await fetchProfile(h);
  const cache = data.status === "erro" || data.status === "nao-configurado" ? "public, s-maxage=60" : "public, s-maxage=3600, stale-while-revalidate=86400";
  return json(data, 200, { "cache-control": cache });
});
