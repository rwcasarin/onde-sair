// Códigos incorporados nas páginas de conteúdo (vídeos, mapas, playlists, posts, formulários…).
// · Players conhecidos (YouTube, Vimeo, Spotify, Google Maps…) viram um <iframe> só com o endereço do player.
// · Qualquer outro código roda isolado numa moldura sem acesso ao site (sandbox), sem ler cookies nem a página.
const PLAYERS = [
  // [hosts, nome, proporção (largura/altura) ou null para altura fixa]
  [["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"], "YouTube", 16 / 9],
  [["player.vimeo.com"], "Vimeo", 16 / 9],
  [["open.spotify.com"], "Spotify", null],
  [["w.soundcloud.com"], "SoundCloud", null],
  [["widget.deezer.com"], "Deezer", null],
  [["www.google.com", "maps.google.com"], "Google Maps", null, /^\/maps\//],
  [["docs.google.com"], "Google Forms", null, /^\/forms\//],
  [["calendar.google.com"], "Google Agenda", null],
  [["www.instagram.com"], "Instagram", null, /^\/(p|reel|tv)\/[\w-]+\/embed/],
  [["www.tiktok.com"], "TikTok", null, /^\/embed\//],
  [["www.facebook.com"], "Facebook", null, /^\/plugins\//],
  [["player.twitch.tv"], "Twitch", 16 / 9],
];
const MAX = 20000;

function player(src) {
  let u; try { u = new URL(src); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const p = PLAYERS.find(([hosts, , , path]) => hosts.includes(u.hostname) && (!path || path.test(u.pathname)));
  if (!p) return null;
  if (p[1] === "YouTube" && !u.pathname.startsWith("/embed/")) return null;
  return { src: u.href, provider: p[1], ratio: p[2] };
}

// Link simples colado no lugar do código (ex.: endereço do vídeo) → player
function fromUrl(url) {
  let u; try { u = new URL(url.trim()); } catch { return null; }
  const h = u.hostname.replace(/^www\./, "");
  if (h === "youtube.com" && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
  if (h === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
  if (h === "youtube.com" && u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
  if (h === "vimeo.com" && /^\/\d+/.test(u.pathname)) return `https://player.vimeo.com/video${u.pathname.match(/^\/\d+/)[0]}`;
  if (h === "open.spotify.com" && !u.pathname.startsWith("/embed/")) return `https://open.spotify.com/embed${u.pathname}`;
  if (h === "instagram.com" && /^\/(p|reel|tv)\/[\w-]+/.test(u.pathname)) return `https://www.instagram.com${u.pathname.match(/^\/(p|reel|tv)\/[\w-]+/)[0]}/embed`;
  if (h === "tiktok.com" && /\/video\/(\d+)/.test(u.pathname)) return `https://www.tiktok.com/embed/v2/${u.pathname.match(/\/video\/(\d+)/)[1]}`;
  return u.href;
}

// Lê o código colado: { kind: "player", src, provider, ratio, height } | { kind: "sandbox", provider } | null
export function parseEmbed(code = "") {
  const c = String(code).trim();
  if (!c || c.length > MAX) return null;
  if (/^https?:\/\/\S+$/.test(c)) {
    const p = player(fromUrl(c));
    return p ? { kind: "player", ...p, height: p.ratio ? null : 380 } : null;
  }
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(c, "text/html");
  // post do Instagram ou do TikTok (blockquote + script) → player oficial
  const ig = doc.querySelector("blockquote.instagram-media")?.getAttribute("data-instgrm-permalink");
  if (ig) { const p = player(fromUrl(ig.split("?")[0])); if (p) return { kind: "player", ...p, height: 620 }; }
  const tt = doc.querySelector("blockquote.tiktok-embed")?.getAttribute("data-video-id");
  if (tt && /^\d+$/.test(tt)) return { kind: "player", ...player(`https://www.tiktok.com/embed/v2/${tt}`), height: 740 };
  // um único iframe de um player conhecido
  const frames = doc.querySelectorAll("iframe");
  const other = [...doc.body.children].filter(n => n.tagName !== "IFRAME" && n.tagName !== "BR");
  if (frames.length === 1 && !other.length && !doc.querySelector("script")) {
    const f = frames[0], p = player(f.getAttribute("src") || "");
    if (p) {
      const w = parseInt(f.getAttribute("width"), 10), h = parseInt(f.getAttribute("height"), 10);
      return { kind: "player", ...p, ratio: p.ratio || null, height: p.ratio ? null : Math.min(Math.max(h || 380, 80), 1200), title: f.getAttribute("title") || p.provider, width: w || null };
    }
  }
  return { kind: "sandbox", provider: "Código personalizado" };
}

// Documento da moldura isolada: links abrem em nova aba e a altura é avisada ao site
export function sandboxDoc(code, id) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">
<style>html,body{margin:0;padding:0;background:transparent;font-family:system-ui,sans-serif}body{overflow:hidden}img,iframe,video{max-width:100%}</style></head><body>${code}
<script>(function(){var last=0;function send(){var h=Math.ceil(document.documentElement.scrollHeight);if(h!==last){last=h;parent.postMessage({osEmbed:${JSON.stringify(id)},h:h},"*");}}
if(window.ResizeObserver)new ResizeObserver(send).observe(document.documentElement);addEventListener("load",send);setInterval(send,800);send();})();</script></body></html>`;
}

export const SANDBOX = "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation";
export const PLAYER_ALLOW = "autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write";

// Monta os incorporados dentro de um elemento (site): troca cada <figure class="embed"> pela moldura
export function mountEmbeds(root) {
  if (!root) return () => {};
  const frames = new Map();
  root.querySelectorAll("figure.embed[data-embed]").forEach((fig, i) => {
    let code = ""; try { code = decodeURIComponent(fig.getAttribute("data-embed")); } catch { return; }
    const e = parseEmbed(code);
    fig.textContent = "";
    if (!e) return;
    const f = document.createElement("iframe");
    f.loading = "lazy"; f.title = e.title || e.provider;
    if (e.kind === "player") {
      f.src = e.src; f.allow = PLAYER_ALLOW; f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
      if (e.ratio) { f.style.aspectRatio = String(e.ratio); f.style.height = "auto"; } else f.style.height = e.height + "px";
      fig.classList.add("embed-player");
    } else {
      const id = "e" + i + Math.random().toString(36).slice(2, 7);
      f.setAttribute("sandbox", SANDBOX);
      f.srcdoc = sandboxDoc(code, id);
      f.style.height = "200px";
      frames.set(id, f);
      fig.classList.add("embed-code");
    }
    fig.appendChild(f);
  });
  const onMsg = (ev) => {
    const d = ev.data; if (!d || typeof d !== "object" || !frames.has(d.osEmbed)) return;
    const f = frames.get(d.osEmbed);
    if (ev.source !== f.contentWindow) return;
    f.style.height = Math.min(Math.max(+d.h || 0, 40), 4000) + "px";
  };
  window.addEventListener("message", onMsg);
  return () => window.removeEventListener("message", onMsg);
}
