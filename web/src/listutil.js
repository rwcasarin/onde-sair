// Funções puras das listagens, usadas pelo site e pelo servidor (sem React): slug dos filtros,
// ordenação, preço de evento e vibe no link.
import { PRICE_BUCKETS, AFFINITIES, VIBE_ORDER } from "./data.js";
import { slugify } from "./admin/store.js";

export const fslug = (s = "") => slugify(String(s));

// Preço: a mesma escala em lugares, roteiros e eventos (por pessoa)
export const PRICE_LEVELS = PRICE_BUCKETS.map(b => ({ value: String(b.level), label: b.level ? `${"$".repeat(b.level)} · ${b.label}` : b.label }));
// evento: pelo valor "a partir de" (sem valor informado, fica fora do filtro de preço)
export function eventPriceLevel(e) {
  const p = e.price || {};
  if (p.free) return 0;
  const v = +p.from;
  if (!v) return null;
  return v <= 50 ? 1 : v <= 120 ? 2 : 3;
}

export const recentOf = (x) => String(x.publishedAt || x.createdAt || x.updatedAt || "");
export function sortBy(list, key, { name, price }) {
  const out = [...list];
  if (key === "az") return out.sort((a, b) => name(a).localeCompare(name(b), "pt-BR"));
  if (key === "preco") return out.sort((a, b) => (price(a) ?? 9) - (price(b) ?? 9));
  if (key === "recentes") return out.sort((a, b) => recentOf(b.r || b.p || b).localeCompare(recentOf(a.r || a.p || a)));
  return out;
}

// vibe no link: ?vibe=para-dates (links antigos ?vibe=pra-relaxar também funcionam)
const vibeLabel = (id) => AFFINITIES.find(a => a.id === id)?.label || "";
export function vibeFromSlug(s) {
  if (!s) return "";
  const core = (x) => x.replace(/^(para|pra)-(a-)?/, "");
  return VIBE_ORDER.find(id => slugify(vibeLabel(id)) === s || id === s) || VIBE_ORDER.find(id => core(slugify(vibeLabel(id))) === core(s)) || "";
}
export const vibeSlug = (id) => (id ? slugify(vibeLabel(id) || id) : "");
