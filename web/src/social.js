// Redes sociais do site (Configurações › Redes): o painel guarda o @ ou o endereço;
// aqui vira o link completo. Campo vazio não aparece no site.
const handle = (v) => String(v || "").trim().replace(/^https?:\/\/(www\.)?[^/]+\/?/i, "").replace(/^\/+|\/+$/g, "");
const isUrl = (v) => /^https?:\/\//i.test(String(v || "").trim());

export const SOCIAL = [
  { id: "instagram", label: "Instagram", url: (v) => isUrl(v) ? v.trim() : `https://www.instagram.com/${handle(v).replace(/^@/, "")}` },
  { id: "tiktok", label: "TikTok", url: (v) => isUrl(v) ? v.trim() : `https://www.tiktok.com/@${handle(v).replace(/^@/, "")}` },
  { id: "youtube", label: "YouTube", url: (v) => isUrl(v) ? v.trim() : `https://www.youtube.com/${handle(v).startsWith("@") || handle(v).includes("/") ? handle(v) : "@" + handle(v)}` },
  { id: "spotify", label: "Spotify", url: (v) => isUrl(v) ? v.trim() : `https://open.spotify.com/search/${encodeURIComponent(String(v).trim())}` },
];

export function socialLinks(settings = {}) {
  return SOCIAL.filter(s => handle(settings[s.id]).replace(/^@/, "")).map(s => ({ id: s.id, label: s.label, url: s.url(settings[s.id]) }));
}
