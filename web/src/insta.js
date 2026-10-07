// Instagram: links de posts e perfil dos lugares
// Aceita links de post/reel (instagram.com/p/…, /reel/…, /tv/…) e devolve o link canônico.
const POST_RE = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]{5,})\/?(?:[?#].*)?$/i;

export function instaPost(url = "") {
  const m = String(url).trim().match(POST_RE);
  if (!m) return null;
  const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
  return `https://www.instagram.com/${kind}/${m[2]}/`;
}

// "@perfil", "perfil" ou link do perfil → link do perfil
export function instaProfile(handle = "") {
  const h = String(handle).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
  return h ? `https://www.instagram.com/${h}/` : null;
}
