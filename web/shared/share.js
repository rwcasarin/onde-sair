// Meta tags de compartilhamento (WhatsApp, Instagram, Facebook, X, LinkedIn…).
// Esses robôs não executam o JavaScript do site: /api/share devolve o index.html já com
// título, descrição e imagem da página pedida (ver vercel.json).
import { autoTitle, autoDesc, withSite } from "../src/seo.js";

export const SHARE_DEFAULT_IMG = "images/site/compartilhar.jpg";   // Configurações › SEO

const slugify = (s = "") => s.toString().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const slugOf = (x) => x?.slug || slugify(x?.name || x?.title || x?.label || "");
const bySlug = (list = [], s) => list.find(x => slugOf(x) === s) || list.find(x => x.id === s);

// endereço público de uma imagem: só as enviadas pelo painel existem de verdade
export function mediaUrl(origin, media, path) {
  const v = path && media?.[path];
  return v ? `${origin}/api/media?p=${encodeURIComponent(path)}&v=${v}` : "";
}

// { title, desc, image, type } da página; db = conteúdo público (publicView)
export function shareMeta(db, media, path, origin) {
  const s = db.settings || {};
  const fallbackImg = mediaUrl(origin, media, SHARE_DEFAULT_IMG) || mediaUrl(origin, media, db.home?.hero?.img);
  const base = { title: s.seoTitle || "Onde Sair · O lugar certo pra cada vibe", desc: s.seoDesc || "", image: fallbackImg, type: "website" };
  const [, a = "", b = ""] = decodeURIComponent(path.split("?")[0]).replace(/\/+$/, "").split("/");
  const item = (kind, list, img) => {
    const x = bySlug(list, b);
    if (!x) return null;
    return { title: x.seo?.title || autoTitle(kind, x), desc: x.seo?.desc || autoDesc(kind, x) || base.desc,
      image: mediaUrl(origin, media, img(x)) || fallbackImg, type: "article" };
  };
  let m = null;
  if (b) {
    if (a === "lugares") m = item("places", db.places, x => `images/lugares/${x.id}.jpg`);
    else if (a === "roteiros") m = item("roteiros", db.roteiros, x => `images/roteiros/${x.id}.jpg`);
    else if (a === "eventos") m = item("events", db.events, x => `images/eventos/${x.id}.jpg`);
    else if (a === "radar") m = item("stories", db.stories, x => x.img || `images/historias/${x.id}.jpg`);
  } else if (a) {
    const pg = bySlug(db.pages, a);
    if (pg) m = { ...base, title: pg.seo?.title || withSite(pg.title), desc: pg.seo?.desc || pg.excerpt || base.desc };
    else {
      const t = { lugares: "Lugares", roteiros: "Roteiros", eventos: "Eventos · Agenda da cidade", radar: "Radar · Novidades e listas", vibes: "Vibes · Lugares e roteiros por clima", guia: "Guia da cidade" }[a];
      if (t) m = { ...base, title: withSite(t) };
    }
  }
  return m || base;
}

const esc = (t = "") => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// injeta as tags no <head> do index.html
export function injectMeta(html, meta, url) {
  const tags = [
    `<meta name="description" content="${esc(meta.desc)}">`,
    `<meta property="og:site_name" content="Onde Sair">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:type" content="${meta.type}">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    ...(meta.image ? [`<meta property="og:image" content="${esc(meta.image)}">`, `<meta name="twitter:image" content="${esc(meta.image)}">`] : []),
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${esc(meta.title)}">`,
    `<meta name="twitter:description" content="${esc(meta.desc)}">`,
  ].join("\n  ");
  return html.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>\n  ${tags}`);
}
