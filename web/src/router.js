// Rotas com URL própria para cada página.
// No servidor usa caminhos reais (/lugares/quintal-do-centro); aberto como
// arquivo (onde-sair.html) usa o mesmo caminho depois do # (#/lugares/...).
import { useEffect, useState } from "react";
import { PLACES, ROTEIROS, AFFINITIES, ALL_STORIES, PAGES } from "./data.js";
import { slugify } from "./admin/store.js";

export const HASH_MODE = typeof location !== "undefined" && location.protocol === "file:";

// caminho atual, sempre começando por "/" (com ?query, sem #âncora)
export function currentPath() {
  if (HASH_MODE) return (location.hash.replace(/^#/, "") || "/").replace(/^([^/])/, "/$1");
  return location.pathname + location.search;
}

const listeners = new Set();
const emit = () => listeners.forEach(fn => fn(currentPath()));
if (typeof window !== "undefined") {
  window.addEventListener(HASH_MODE ? "hashchange" : "popstate", emit);
  // link antigo (#/admin/...) aberto com o site já carregado
  if (!HASH_MODE) window.addEventListener("hashchange", () => { if (location.hash.startsWith("#/")) { migrateLegacyHash(); emit(); } });
}

export function go(path, { replace = false } = {}) {
  if (path === currentPath()) { emit(); return; }
  if (HASH_MODE) {
    if (replace) history.replaceState(null, "", "#" + path); else location.hash = path;
  } else {
    history[replace ? "replaceState" : "pushState"](null, "", path);
  }
  emit();
}

export const onPathChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export const href = (path) => (HASH_MODE ? "#" + path : path);

export function usePath() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => { listeners.add(setPath); return () => listeners.delete(setPath); }, []);
  return path;
}

// Links antigos do painel (#/admin/...) passam a usar /admin/...
export function migrateLegacyHash() {
  if (!HASH_MODE && location.hash.startsWith("#/")) {
    history.replaceState(null, "", location.hash.slice(1));
  }
}

// ---------------------------------------------------------------------
// Tela ↔ URL
// ---------------------------------------------------------------------
export const slugOf = (x) => x?.slug || slugify(x?.name || x?.title || x?.label || "");
export const bySlug = (list, s) => list.find(x => slugOf(x) === s) || list.find(x => x.id === s);

export const placePath = (p) => "/lugares/" + slugOf(typeof p === "string" ? PLACES.find(x => x.id === p) || { slug: p } : p);
export const roteiroPath = (r) => "/roteiros/" + slugOf(typeof r === "string" ? ROTEIROS.find(x => x.id === r) || { slug: r } : r);
export const storyPath = (s) => "/radar/" + slugOf(typeof s === "string" ? ALL_STORIES.find(x => x.id === s) || { slug: s } : s);
export const vibePath = (aff) => "/vibes/" + slugOf(AFFINITIES.find(a => a.id === aff) || { slug: aff });

const STATIC = {
  home: "/", lista: "/lugares", roteiros: "/roteiros", mapa: "/guia", favoritos: "/perfil/favoritos",
  perfil: "/perfil", notificacoes: "/notificacoes", onboarding: "/cidade", historias: "/radar",
};

export function toPath(screen, params = {}) {
  switch (screen) {
    case "lista": {
      const base = params.aff ? vibePath(params.aff) : "/lugares";
      return params.q ? `${base}?busca=${encodeURIComponent(params.q)}` : base;
    }
    case "detalhe": return placePath(params.id);
    case "roteiro": return roteiroPath(params.id);
    case "historia": return storyPath(params.id);
    case "pagina": return "/" + slugOf(PAGES.find(x => x.id === params.id) || { slug: params.id });
    case "mapa": return params.id ? "/guia/" + slugOf(PLACES.find(x => x.id === params.id) || { slug: params.id }) : "/guia";
    case "perfil": return { favoritos: "/perfil/favoritos", favRoteiros: "/perfil/favoritos/roteiros", meus: "/perfil/roteiros", conta: "/perfil/conta" }[params.tab] || "/perfil";
    case "meuRoteiro": return "/perfil/roteiros/" + encodeURIComponent(params.id);
    case "meuRoteiroEditar": {
      if (params.id && params.id !== "novo") return "/perfil/roteiros/" + encodeURIComponent(params.id) + "/editar";
      const q = new URLSearchParams();
      if (params.lugar) q.set("lugar", slugOf(PLACES.find(x => x.id === params.lugar) || { slug: params.lugar }));
      if (params.copiar) q.set("copiar", params.copiar.startsWith("ur") ? params.copiar : slugOf(ROTEIROS.find(x => x.id === params.copiar) || { slug: params.copiar }));
      return "/perfil/roteiros/novo" + (q.toString() ? "?" + q : "");
    }
    case "entrar": return params.mode === "cadastro" ? "/cadastro" : params.mode === "boas-vindas" ? "/boas-vindas" : "/entrar";
    default: return STATIC[screen] || "/";
  }
}

// Devolve { screen, params } — ou { screen: "404" } quando nada corresponde
export function fromPath(full) {
  const [pathname, search = ""] = full.split("?");
  const q = new URLSearchParams(search);
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const [a, b] = parts;
  const notFound = { screen: "404", params: {} };
  // área da conta: /perfil, /perfil/favoritos[/roteiros], /perfil/roteiros[/novo|/:id[/editar]], /perfil/conta
  if (a === "perfil" || a === "favoritos") {
    const [, , c, d, e] = parts;
    const rest = a === "favoritos" ? ["favoritos", b, c] : [b, c, d, e];
    const [x, y, z, w] = rest;
    if (!x) return { screen: "perfil", params: { tab: "favoritos" } };
    if (x === "favoritos" && !z) return y === "roteiros" ? { screen: "perfil", params: { tab: "favRoteiros" } } : !y ? { screen: "perfil", params: { tab: "favoritos" } } : notFound;
    if (x === "conta" && !y) return { screen: "perfil", params: { tab: "conta" } };
    if (x === "roteiros") {
      if (!y) return { screen: "perfil", params: { tab: "meus" } };
      if (y === "novo" && !z) return { screen: "meuRoteiroEditar", params: { id: "novo", lugar: q.get("lugar") ? (bySlug(PLACES, q.get("lugar"))?.id || "") : "", copiar: q.get("copiar") || "" } };
      if (!z) return { screen: "meuRoteiro", params: { id: y } };
      if (z === "editar" && !w) return { screen: "meuRoteiroEditar", params: { id: y } };
    }
    return notFound;
  }
  if (parts.length > 2) return notFound;
  if (!a) return { screen: "home", params: {} };
  switch (a) {
    case "lugares": {
      if (!b) return { screen: "lista", params: q.get("busca") ? { q: q.get("busca") } : {} };
      const p = bySlug(PLACES, b);
      return p ? { screen: "detalhe", params: { id: p.id } } : notFound;
    }
    case "vibes": {
      const v = b && bySlug(AFFINITIES, b);
      if (!v) return notFound;
      return { screen: "lista", params: { aff: v.id, ...(q.get("busca") ? { q: q.get("busca") } : {}) } };
    }
    case "roteiros": {
      if (!b) return { screen: "roteiros", params: {} };
      const r = bySlug(ROTEIROS, b);
      return r ? { screen: "roteiro", params: { id: r.id } } : notFound;
    }
    case "radar": case "historias": {   // /historias: endereço antigo do blog (o App troca pela URL nova)
      if (!b) return { screen: "historias", params: {} };
      const s = bySlug(ALL_STORIES, b);
      return s ? { screen: "historia", params: { id: s.id } } : notFound;
    }
    case "guia": {
      if (!b) return { screen: "mapa", params: {} };
      const p = bySlug(PLACES, b);
      return p ? { screen: "mapa", params: { id: p.id } } : notFound;
    }
    case "entrar": case "cadastro": case "boas-vindas":
      return b ? notFound : { screen: "entrar", params: { mode: a } };
    default: {
      const screen = Object.keys(STATIC).find(k => STATIC[k] === "/" + a);
      if (screen && !b) return { screen, params: {} };
      // página de conteúdo publicada: /{slug}
      const pg = !b && PAGES.find(x => x.slug === a);
      return pg ? { screen: "pagina", params: { id: pg.id } } : notFound;
    }
  }
}
