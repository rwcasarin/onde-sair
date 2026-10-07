// Posts do Instagram do lugar (embed oficial do Instagram, sem token).
// O embed.js troca o <blockquote> por um iframe; por isso cada post vive num nó fora do controle do React.
import { useEffect, useRef } from "react";

let loading = null;
function loadEmbed() {
  if (window.instgrm) return Promise.resolve(window.instgrm);
  if (!loading) loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://www.instagram.com/embed.js"; s.async = true;
    s.onload = () => resolve(window.instgrm);
    s.onerror = () => { loading = null; reject(new Error("instagram")); };
    document.body.appendChild(s);
  });
  return loading;
}

function InstaPost({ url }) {
  const box = useRef(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    el.innerHTML = "";
    const q = document.createElement("blockquote");
    q.className = "instagram-media";
    q.setAttribute("data-instgrm-permalink", url + "?utm_source=ig_embed");
    q.setAttribute("data-instgrm-version", "14");
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noreferrer"; a.className = "insta-fallback"; a.textContent = "Ver post no Instagram";
    q.appendChild(a); el.appendChild(q);
    loadEmbed().then((ig) => ig?.Embeds?.process()).catch(() => {});
    return () => { el.innerHTML = ""; };
  }, [url]);
  return <div className="insta-post" ref={box} />;
}

export function InstaFeed({ posts }) {
  return (
    <div className="insta-feed" role="list">
      {posts.map(url => <div role="listitem" key={url} className="insta-item"><InstaPost url={url} /></div>)}
    </div>
  );
}
