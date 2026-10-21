// Busca do site: um índice só com lugares, eventos, roteiros, posts do Radar e páginas,
// mais atalhos (vibes, tipos, bairros e categorias). Ignora acentos e maiúsculas, entende
// plural, tolera um erro de digitação e pesa mais o que está no nome/título.
import { PLACES, ROTEIROS, ALL_STORIES, EVENTS, PAGES, AFFINITIES, TYPES, EVENT_CATEGORIES, RADAR_CATEGORIES, CITIES } from "./data.js";
import { htmlToText } from "./richtext.js";
import { isPast, venueName } from "./events.js";
import { roteiroVibes, roteiroBairros } from "./vibes.js";
import { slugify, publishedDate, SITE } from "./admin/store.js";
import { placePath, roteiroPath, storyPath, eventPath, vibePath } from "./router.js";

export const KINDS = [
  { id: "lugares", kind: "place", label: "Lugares", one: "lugar", many: "lugares", icon: "pin" },
  { id: "eventos", kind: "event", label: "Eventos", one: "evento", many: "eventos", icon: "calendar" },
  { id: "roteiros", kind: "roteiro", label: "Roteiros", one: "roteiro", many: "roteiros", icon: "map" },
  { id: "radar", kind: "story", label: "Radar", one: "post", many: "posts", icon: "sparkle" },
  { id: "paginas", kind: "page", label: "Páginas", one: "página", many: "páginas", icon: "list" },
];
export const kindInfo = (kind) => KINDS.find(k => k.kind === kind || k.id === kind);
// seções pausadas e escondidas no painel ficam fora da busca
export const kindsOn = () => KINDS.filter(k => !(k.kind === "event" && SITE.eventsPaused && SITE.eventsHidden) && !(k.kind === "roteiro" && SITE.roteirosPaused && SITE.roteirosHidden));

// ---------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------
export const norm = (s = "") => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const STOP = new Set(["a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas", "um", "uma", "para", "pra", "pro", "com", "por", "ao", "the", "y"]);
// plural e variações simples: "bares" ~ "bar", "cafes" ~ "cafe", "pasteis" ~ "pastel"
export const stem = (w) => {
  if (w.length <= 3) return w;
  if (w.endsWith("oes") || w.endsWith("aes")) return w.slice(0, -3) + "ao";
  if (w.endsWith("eis")) return w.slice(0, -3) + "el";
  if (w.endsWith("res") || w.endsWith("zes") || w.endsWith("ses")) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
};
// sinônimos do jeito que as pessoas buscam
const SYN = { barzinho: "bar", boteco: "bar", buteco: "bar", pub: "bar", cerveja: "chope", chopp: "chope", balada: "festa", night: "noite", cafeteria: "cafe",
  padoca: "padaria", hamburguer: "burger", hamburgueria: "burger", lanche: "burger", sorvete: "gelato", sorveteria: "gelato", japones: "japonesa", sushi: "japonesa",
  pizza: "pizzaria", show: "musica", rock: "musica", jazz: "musica", crianca: "crianca", criancas: "crianca", kids: "crianca", familia: "crianca",
  date: "dates", encontro: "dates", romantico: "dates", parque: "parque", trilha: "natureza", praca: "praca" };
export function tokens(q) {
  const all = norm(q).split(" ").filter(Boolean);
  const kept = all.filter(w => !STOP.has(w));
  return (kept.length ? kept : all).slice(0, 8);
}

function lev1(a, b, max) {           // distância de edição com limite (para tolerar erro de digitação)
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let cur = [i], best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev.splice(0, prev.length, ...cur);
  }
  return prev[b.length];
}

// quanto uma palavra da busca bate com as palavras de um campo (0 a 1)
function wordScore(t, words) {
  const st = stem(t), syn = SYN[t] || SYN[st];
  let best = 0;
  for (const w of words) {
    if (w === t || stem(w) === st) return 1;
    if (syn && (w === syn || stem(w) === stem(syn))) best = Math.max(best, .9);
    else if (w.startsWith(t) && t.length >= 2) best = Math.max(best, t.length >= 3 ? .75 : .5);
    else if (t.length >= 4 && w.includes(t)) best = Math.max(best, .5);
    // erro de digitação: só em palavras de 5+ letras, com a mesma inicial e tamanho parecido
    else if (t.length >= 5 && best < .45 && w[0] === t[0] && Math.abs(w.length - t.length) <= 1 && lev1(st, stem(w), t.length >= 8 ? 2 : 1) <= (t.length >= 8 ? 2 : 1)) best = .45;
  }
  return best;
}

// ---------------------------------------------------------------------
// Índice
// ---------------------------------------------------------------------
const W = { title: 8, key: 4, sub: 2.5, text: 1 };
const field = (weight, ...parts) => { const s = norm(parts.flat().filter(Boolean).join(" ")); return { w: weight, s, words: [...new Set(s.split(" ").filter(Boolean))] }; };
const placeBy = (id) => PLACES.find(p => p.id === id);
const affLabel = (id) => AFFINITIES.find(a => a.id === id)?.label || "";
const cityName = (id) => CITIES.find(c => c.id === id)?.name || "";

function docsOf() {
  const on = new Set(kindsOn().map(k => k.kind));
  const docs = [];
  PLACES.forEach(p => docs.push({ kind: "place", id: p.id, item: p, title: p.name, path: placePath(p),
    sub: [p.type, p.bairro].filter(Boolean).join(" · "), city: p.city, bairros: p.bairro ? [p.bairro] : [], date: publishedDate(p) || "",
    fields: [field(W.title, p.name), field(W.key, p.type, p.sub, p.bairro, p.tags, (p.affs || []).map(affLabel)),
      field(W.sub, p.tagline, cityName(p.city)), field(W.text, htmlToText(p.desc || ""), p.dica, (p.reasons || []).map(r => r[1]))] }));
  if (on.has("event")) EVENTS.forEach(e => {
    const cat = EVENT_CATEGORIES.find(c => c.id === e.category);
    docs.push({ kind: "event", id: e.id, item: e, title: e.title, path: eventPath(e), past: isPast(e),
      sub: [cat?.label, venueName(e) || e.bairro].filter(Boolean).join(" · "), city: e.city, bairros: e.bairro ? [e.bairro] : [], date: e.startAt || "",
      fields: [field(W.title, e.title), field(W.key, cat?.label, venueName(e), e.bairro, e.tags, (e.affs || []).map(affLabel)),
        field(W.sub, e.tagline, cityName(e.city)), field(W.text, htmlToText(e.desc || ""))] });
  });
  if (on.has("roteiro")) ROTEIROS.forEach(r => {
    const stops = (r.steps || []).map(s => (s.place && placeBy(s.place)?.name) || s.title).filter(Boolean);
    const bairros = roteiroBairros(r, placeBy);
    const first = (r.steps || []).map(s => s.place && placeBy(s.place)).find(Boolean);
    docs.push({ kind: "roteiro", id: r.id, item: r, title: r.title, path: roteiroPath(r),
      sub: [`${r.steps?.length || 0} paradas`, bairros.slice(0, 2).join(", ")].filter(Boolean).join(" · "), city: first?.city || "", bairros, date: publishedDate(r) || "",
      fields: [field(W.title, r.title), field(W.key, roteiroVibes(r).map(affLabel), bairros, (r.tags || []).map(t => t[0] || t)),
        field(W.sub, stops, r.stats?.tempo), field(W.text, r.desc, htmlToText(r.about || ""), (r.steps || []).map(s => s.desc || s.text))] });
  });
  ALL_STORIES.forEach(s => docs.push({ kind: "story", id: s.id, item: s, title: s.title, path: storyPath(s),
    sub: s.tag || "Radar", city: "", bairros: [], date: publishedDate(s) || "",
    fields: [field(W.title, s.title), field(W.key, s.tag, (s.places || []).map(id => placeBy(id)?.name)), field(W.sub, s.desc), field(W.text, htmlToText(s.body || ""))] }));
  PAGES.forEach(pg => docs.push({ kind: "page", id: pg.id, item: pg, title: pg.title, path: "/" + (pg.slug || slugify(pg.title)),
    sub: "Página", city: "", bairros: [], date: publishedDate(pg) || "",
    fields: [field(W.title, pg.title), field(W.sub, pg.excerpt), field(W.text, htmlToText(pg.body || ""))] }));
  return docs;
}

let cache = { sig: "", docs: [] };
export function searchDocs() {
  const sig = [PLACES, ROTEIROS, ALL_STORIES, EVENTS, PAGES].map(l => l.length + (l[0]?.id || "") + (l[0]?.updatedAt || "")).join("|") + SITE.eventsHidden + SITE.roteirosHidden + SITE.eventsPaused + SITE.roteirosPaused;
  if (sig !== cache.sig) cache = { sig, docs: docsOf() };
  return cache.docs;
}

// pontuação: todas as palavras precisam aparecer (modo "e"); se nada aparecer, o modo "ou" sugere parciais
function scoreDoc(d, toks, phrase, any) {
  let total = 0, hits = 0;
  for (const t of toks) {
    let best = 0;
    for (const f of d.fields) { const s = wordScore(t, f.words) * f.w; if (s > best) best = s; }
    if (best > 0) hits++;
    else if (!any) return 0;
    total += best;
  }
  if (!hits) return 0;
  const title = norm(d.title);
  if (phrase && title === phrase) total += 30;
  else if (phrase && title.startsWith(phrase)) total += 14;
  else if (phrase.length > 3 && d.fields.some(f => f.s.includes(phrase))) total += 6;
  if (d.past) total *= .55;                       // evento encerrado vem depois
  return any ? total * (hits / toks.length) : total;
}

export function search(q, { kinds } = {}) {
  const toks = tokens(q);
  if (!toks.length) return { results: [], partial: false, tokens: [] };
  const phrase = norm(q);
  const docs = searchDocs().filter(d => !kinds || kinds.includes(d.kind));
  const run = (any) => docs.map(d => ({ ...d, score: scoreDoc(d, toks, phrase, any) })).filter(d => d.score > 0).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "pt-BR"));
  let results = run(false), partial = false;
  if (!results.length && toks.length > 1) { results = run(true); partial = results.length > 0; }
  return { results, partial, tokens: toks };
}

// ---------------------------------------------------------------------
// Atalhos: vibes, tipos, bairros e categorias que batem com a busca
// ---------------------------------------------------------------------
export function shortcuts(q, limit = 6) {
  const toks = tokens(q);
  if (!toks.length) return [];
  const out = [];
  const add = (kind, label, path, icon, extra = "") => {
    const words = norm(label + " " + extra).split(" ");
    const s = toks.reduce((acc, t) => acc + wordScore(t, words), 0) / toks.length;
    if (s >= .74) out.push({ kind, label, path, icon, score: s + (norm(label) === norm(q) ? 1 : 0) });
  };
  AFFINITIES.filter(a => a.active !== false).forEach(a => add("Vibe", a.label, vibePath(a.id), "heart", a.id));
  TYPES.forEach(t => add("Tipo", t.label, "/lugares?tipo=" + slugify(t.label), t.icon || "pin"));
  [...new Set(PLACES.map(p => p.bairro).filter(Boolean))].forEach(b => add("Bairro", b, "/lugares?bairro=" + slugify(b), "pin"));
  if (kindsOn().some(k => k.kind === "event")) EVENT_CATEGORIES.forEach(c => add("Categoria de evento", c.label, "/eventos?categoria=" + (c.slug || slugify(c.label)), c.icon || "calendar"));
  RADAR_CATEGORIES.forEach(c => add("Radar", c.label, "/radar?categoria=" + slugify(c.label), "sparkle"));
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

// "Você quis dizer": a palavra conhecida mais parecida com cada palavra da busca
export function didYouMean(q) {
  const toks = tokens(q);
  if (!toks.length) return "";
  const vocab = new Set();
  searchDocs().forEach(d => d.fields.slice(0, 2).forEach(f => f.words.forEach(w => w.length >= 3 && vocab.add(w))));
  let changed = false;
  const fixed = toks.map(t => {
    if (vocab.has(t) || t.length < 4) return t;
    let best = t, bd = 3;
    for (const w of vocab) { const dd = lev1(t, w, 2); if (dd < bd) { bd = dd; best = w; } }
    if (best !== t) changed = true;
    return best;
  });
  return changed ? fixed.join(" ") : "";
}

// trechos destacados (<mark>) para as sugestões
export function highlightParts(text = "", toks = []) {
  if (!toks.length || !text) return [text];
  const base = String(text).normalize("NFD");
  const plain = base.replace(/[̀-ͯ]/g, "").toLowerCase();
  // índice do texto original para cada letra sem acento
  const map = []; for (let i = 0; i < base.length; i++) if (!/[̀-ͯ]/.test(base[i])) map.push(i);
  const marks = [];
  toks.forEach(t => {
    const re = new RegExp("(^|[^a-z0-9])(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "g");
    let m; while ((m = re.exec(plain.replace(/[̀-ͯ]/g, "")))) { const s = m.index + m[1].length; marks.push([s, s + t.length]); }
  });
  if (!marks.length) return [text];
  marks.sort((a, b) => a[0] - b[0]);
  const merged = []; marks.forEach(m => { const l = merged[merged.length - 1]; if (l && m[0] <= l[1]) l[1] = Math.max(l[1], m[1]); else merged.push([...m]); });
  const orig = base; const out = []; let last = 0;
  const at = (i) => (i < map.length ? map[i] : orig.length);
  merged.forEach(([s, e]) => { out.push(orig.slice(at(last), at(s)).normalize("NFC")); out.push({ mark: orig.slice(at(s), at(e)).normalize("NFC") }); last = e; });
  out.push(orig.slice(at(last)).normalize("NFC"));
  return out.filter(x => x !== "");
}

// ---------------------------------------------------------------------
// Buscas recentes (só neste navegador)
// ---------------------------------------------------------------------
const RKEY = "os-buscas-recentes";
export function recentSearches() { try { return JSON.parse(localStorage.getItem(RKEY) || "[]").slice(0, 6); } catch { return []; } }
export function saveRecent(q) {
  const v = String(q || "").trim(); if (v.length < 2) return;
  try { localStorage.setItem(RKEY, JSON.stringify([v, ...recentSearches().filter(x => norm(x) !== norm(v))].slice(0, 6))); } catch { /* sem storage */ }
}
export function clearRecent() { try { localStorage.removeItem(RKEY); } catch { /* sem storage */ } }
export function removeRecent(q) { try { localStorage.setItem(RKEY, JSON.stringify(recentSearches().filter(x => x !== q))); } catch { /* sem storage */ } }
