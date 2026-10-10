// Menus do site (superior e rodapé), editáveis no painel.
// Item: { id, label, type: "site" | "page" | "url", target?, page?, url?, newTab? }
import { PAGES, MENUS } from "./data.js";
import { toPath } from "./router.js";
import { SITE } from "./admin/store.js";

// Telas do site que podem entrar no menu (target → rótulo, rota e quando fica "ativo")
export const SITE_TARGETS = [
  { id: "home",           label: "Início (Hoje)",                 screen: "home",      active: (c) => c === "home" },
  { id: "vibes",          label: "Vibes (lugares e roteiros)",    screen: "vibes",     active: (c) => c === "vibes" },
  { id: "home#vibes",     label: "Vibes (seção da home)",         screen: "home",      params: { anchor: "vibes" }, active: () => false },
  { id: "lista",          label: "Lugares",                       screen: "lista",     active: (c, p) => (c === "lista" && !p.aff) || c === "detalhe" },
  { id: "roteiros",       label: "Roteiros",                      screen: "roteiros",  active: (c) => c === "roteiros" || c === "roteiro" },
  { id: "eventos",        label: "Eventos (agenda)",              screen: "eventos",   active: (c) => c === "eventos" || c === "evento" },
  { id: "mapa",           label: "Guia da cidade",                screen: "mapa",      active: (c) => c === "mapa" },
  { id: "historias",      label: "Radar (blog)",                  screen: "historias", active: (c) => c === "historias" || c === "historia" },
  { id: "home#parceiros", label: "Para parceiros (seção da home)", screen: "home",     params: { anchor: "parceiros" }, active: () => false },
  { id: "favoritos",      label: "Favoritos",                     screen: "favoritos", active: (c, p) => c === "perfil" && p.tab === "favoritos" },
];
export const siteTarget = (id) => SITE_TARGETS.find(t => t.id === id);

// Resolve o item: { href (caminho), screen, params, external, newTab } — ou null se não deve aparecer
export function resolveItem(item, pages = PAGES) {
  if (!item?.label?.trim() || item.hidden) return null;   // item oculto no painel
  // roteiros pausados e escondidos: links para roteiros saem dos menus
  if (SITE.eventsHidden && ((item.type === "site" && item.target === "eventos") || (item.type === "url" && /^\/eventos(\/|$|\?)/.test((item.url || "").trim())))) return null;
  if (SITE.roteirosHidden && ((item.type === "site" && item.target === "roteiros") || (item.type === "url" && /^\/roteiros(\/|$|\?)/.test((item.url || "").trim())))) return null;
  if (item.type === "page") {
    const pg = pages.find(p => p.id === item.page);
    return pg ? { path: toPath("pagina", { id: pg.id }), screen: "pagina", params: { id: pg.id } } : null;   // página não publicada: some
  }
  if (item.type === "url") {
    const url = (item.url || "").trim();
    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(url)) return null;
    return url.startsWith("/") && !url.startsWith("//") ? { path: url, internal: true, newTab: !!item.newTab } : { url, external: true, newTab: item.newTab !== false };
  }
  const t = siteTarget(item.target);
  return t ? { path: toPath(t.screen, t.params), screen: t.screen, params: t.params } : null;
}

export function isActive(item, current, params = {}) {
  if (item.type === "page") return current === "pagina" && params.id === item.page;
  if (item.type === "site") return !!siteTarget(item.target)?.active(current, params);
  return false;
}

// Itens visíveis de um menu ("header", "footer", "legal")
export const menuItems = (name) => (MENUS[name] || []).map(it => ({ it, to: resolveItem(it) })).filter(x => x.to);
