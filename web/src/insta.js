// Instagram dos lugares: link do perfil e posts recentes (via /api/instagram)
import { useEffect, useState } from "react";

// "@perfil", "perfil" ou link do perfil → link do perfil
export function instaProfile(handle = "") {
  const h = String(handle).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
  return h ? `https://www.instagram.com/${h}/` : null;
}

// Últimos posts do perfil do lugar; [] enquanto carrega ou se o perfil não estiver disponível
export function useInstaPosts(place) {
  const on = !!place && place.showInstagram !== false && !!instaProfile(place.insta);
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    setPosts([]);
    if (!on) return;
    let alive = true;
    fetch(`/api/instagram?place=${encodeURIComponent(place.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive && d?.status === "ok") setPosts(d.posts.map(x => x.url)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [on, place?.id, place?.insta]); // eslint-disable-line
  return posts;
}

// Checagem do perfil pelo painel: { status, posts, username }
export async function checkInstaProfile(handle) {
  const r = await fetch(`/api/instagram?u=${encodeURIComponent(handle)}`, { credentials: "same-origin" });
  if (!r.ok) return { status: r.status === 400 ? "invalido" : "erro", posts: [] };
  return r.json();
}
