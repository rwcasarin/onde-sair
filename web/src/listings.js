// Listagens do site (Lugares, Vibes, Roteiros, Radar, Eventos e Busca): filtros, contagens, ordenação e página.
// Roda no servidor (GET /api/content?list=…, sobre o conteúdo publicado) e devolve só a página atual, com as
// contagens que os filtros mostram. As telas montam o pedido com listQuery() e desenham o que volta.
import { PLACES, ROTEIROS, ALL_STORIES, EVENTS, TYPES, EVENT_CATEGORIES, RADAR_CATEGORIES, VIBE_ORDER, AFFINITIES, CITIES } from "./data.js";
import { htmlToText } from "./richtext.js";
import { matchesWhen, WEEK_ORDER, DAY_SLUGS, PERIODS as WHEN_PERIODS } from "./hours.js";
import { WHEN, inRange, isPast, byAgenda, venueName, eventCats } from "./events.js";
import { roteiroVibes, roteiroBairros } from "./vibes.js";
import { SITE, publishedDate, slugify } from "./admin/store.js";
import { search, shortcuts, didYouMean, kindsOn } from "./search.js";
import { fslug, sortBy, recentOf, eventPriceLevel, PRICE_LEVELS, vibeFromSlug } from "./listutil.js";

export const PER_PAGE = 12;
export const STOPS = [["curto", "Até 3 paradas", (n) => n <= 3], ["longo", "4 paradas ou mais", (n) => n >= 4]];
export const RADAR_PERIODS = [["semana", "Últimos 7 dias", 7], ["mes", "Últimos 30 dias", 30], ["trimestre", "Últimos 3 meses", 90], ["ano", "Último ano", 365]];
export const RADAR_FORMATS = [["lista", "Listas de lugares", (x) => x.places.length >= 2], ["novidade", "Novidades e notícias", (x) => x.places.length < 2]];
export const TUDO_MAX = { place: 6, event: 3, roteiro: 3, story: 3, page: 4 };
const KINDS_VIBES = [["lugar", "Lugares"], ["roteiro", "Roteiros"]];

const placeById = (id) => PLACES.find(p => p.id === id);
const affLabel = (id) => AFFINITIES.find(a => a.id === id)?.label || id;
const byLabel = (a, b) => a.localeCompare(b, "pt-BR");
const ageDays = (iso) => { const t = Date.parse(iso); return Number.isNaN(t) ? Infinity : (Date.now() - t) / 864e5; };
const catsOf = (e) => eventCats(e).map(catSlug);   // slugs das categorias do evento
const catSlug = (c) => c.slug || fslug(c.label);

// ---------------------------------------------------------------------
// Filtros no link: { chave: [parâmetro, tipo] } — os mesmos nomes das telas (useFilters)
// ---------------------------------------------------------------------
const WHEN_KEYS = { aberto: ["aberto", "bool"], dia: ["dia", "one"], periodo: ["periodo", "one"] };
export const LIST_DEFS = {
  lugares: { vibe: ["vibe", "one"], busca: ["busca", "one"], cidade: ["cidade", "one"], bairro: ["bairro", "set"], tipo: ["tipo", "set"], ...WHEN_KEYS, ordem: ["ordem", "one"] },
  vibes: { vibe: ["vibe", "one"], busca: ["busca", "one"], mostrar: ["mostrar", "set"], cidade: ["cidade", "one"], bairro: ["bairro", "set"], tipo: ["tipo", "set"], tamanho: ["tamanho", "set"], ...WHEN_KEYS, ordem: ["ordem", "one"] },
  roteiros: { vibe: ["vibe", "one"], busca: ["busca", "one"], cidade: ["cidade", "one"], bairro: ["bairro", "set"], tamanho: ["tamanho", "set"], ordem: ["ordem", "one"] },
  radar: { categoria: ["categoria", "one"], busca: ["busca", "one"], publicado: ["publicado", "set"], formato: ["formato", "set"], cidade: ["cidade", "one"], bairro: ["bairro", "set"], vibe: ["vibe", "set"], autor: ["autor", "set"], ordem: ["ordem", "one"] },
  eventos: { vibe: ["vibe", "one"], busca: ["busca", "one"], quando: ["quando", "one"], categoria: ["categoria", "set"], cidade: ["cidade", "one"], bairro: ["bairro", "set"], preco: ["preco", "set"], encerrados: ["encerrados", "bool"], ordem: ["ordem", "one"] },
  busca: { q: ["q", "one"], tipo: ["tipo", "one"], ordem: ["ordem", "one"], cidade: ["cidade", "one"], bairro: ["bairro", "set"], vibe: ["vibe", "set"], tipoLugar: ["tipo-de-lugar", "set"], ...WHEN_KEYS, quando: ["quando", "one"], categoria: ["categoria", "set"], encerrados: ["encerrados", "bool"], tamanho: ["paradas", "set"], radar: ["assunto", "set"] },
};

// estado da tela → pedido (cidade "todas" vai vazia)
export function listQuery(kind, f, { page = 1, map = false } = {}) {
  const q = new URLSearchParams({ list: kind });
  for (const [k, [param, type]] of Object.entries(LIST_DEFS[kind])) {
    const v = f[k];
    if (type === "set") { if (v?.size) q.set(param, [...v].sort().join(",")); }
    else if (type === "bool") { if (v) q.set(param, "1"); }
    else if (v && !(k === "cidade" && v === "todas")) q.set(param, v);
  }
  if (page > 1) q.set("pagina", String(page));
  if (map) q.set("mapa", "1");
  return q.toString();
}
// pedido → estado (no servidor)
export function parseList(kind, q) {
  const f = {};
  for (const [k, [param, type]] of Object.entries(LIST_DEFS[kind] || {})) {
    const raw = q.get(param);
    f[k] = type === "set" ? new Set(raw ? raw.split(",").filter(Boolean) : []) : type === "bool" ? raw === "1" : (raw || "");
  }
  return f;
}

// contagens do filtro "Dia e horário" (cada opção conta sobre os outros filtros)
const WHEN_DAYS = ["hoje", ...WEEK_ORDER.map(d => DAY_SLUGS[d])];
function whenCounts(count, when, test) {
  const c = (patch) => count("when", x => test(x, { ...when, ...patch }));
  return { agora: c({ agora: true }), dia: Object.fromEntries(WHEN_DAYS.map(d => [d, c({ dia: d })])), periodo: Object.fromEntries(WHEN_PERIODS.map(([v]) => [v, c({ periodo: v })])) };
}
// motor comum: base, testes por filtro e contagens que ignoram o próprio filtro
function engine(base, tests) {
  const pass = (x, skip) => Object.entries(tests).every(([k, t]) => k === skip || t(x));
  const count = (key, fn) => base.filter(x => pass(x, key) && fn(x)).length;
  const opts = (key, list, get) => list.map(([value, label]) => ({ value, label, count: count(key, x => get(x).includes(value)) }));
  return { pass, count, opts, results: base.filter(x => pass(x)) };
}
const cityTally = (list, cityOf) => list.reduce((m, x) => { cityOf(x).forEach(c => { if (c) m[c] = (m[c] || 0) + 1; }); return m; }, {});
const bairrosOf = (list, get) => [...new Set(list.flatMap(get).filter(Boolean))].sort(byLabel).map(b => [fslug(b), b]);

// ---------------------------------------------------------------------
// Cada lista: devolve { results (com .ref = { kind, id }), total, cityCounts, facets, ... }
// ---------------------------------------------------------------------
const placeText = (p) => fslug([p.name, p.bairro, p.type, htmlToText(p.desc || ""), p.sub, ...(p.tags || [])].join(" "));
const TIPOS = () => TYPES.map(t => [fslug(t.label), t.label]);

function lugares(f) {
  const vibe = f.vibe, query = f.busca, cityF = f.cidade;
  const when = { agora: f.aberto, dia: f.dia, periodo: f.periodo };
  const anyCity = PLACES.filter(p => (!vibe || p.affs.includes(vibe)) && (!query || placeText(p).includes(fslug(query))));
  const base = anyCity.filter(p => !cityF || p.city === cityF);
  const e = engine(base, {
    bairro: (p) => !f.bairro.size || f.bairro.has(fslug(p.bairro)),
    tipo: (p) => !f.tipo.size || f.tipo.has(fslug(p.type)),
    when: (p) => matchesWhen(p, when),
  });
  const results = f.ordem && f.ordem !== "relevancia" ? sortBy(e.results, f.ordem, { name: (p) => p.name }) : e.results;
  return {
    results: results.map(p => ({ ref: { kind: "place", id: p.id }, place: p })),
    cityCounts: cityTally(anyCity, p => [p.city]),
    facets: { bairro: e.opts("bairro", bairrosOf(base, p => [p.bairro]), p => [fslug(p.bairro)]), tipo: e.opts("tipo", TIPOS(), p => [fslug(p.type)]) },
    when: whenCounts(e.count, when, matchesWhen),
  };
}

function roteiroFacts(r) {
  const stops = r.steps.map(s => s.place && placeById(s.place)).filter(Boolean);
  const bairros = roteiroBairros(r, placeById);
  return { kind: "roteiro", id: r.id, name: r.title, r, vibes: roteiroVibes(r), city: stops[0]?.city || "", bairros, stops: r.steps.length,
    text: fslug([r.title, r.desc, ...bairros, ...(r.tags || []).map(t => t[0] || t), ...stops.map(p => p.name)].join(" ")) };
}
// junta lugares e roteiros alternando, para a listagem não ficar em blocos
function interleave(list) {
  const a = list.filter(x => x.kind === "lugar"), b = list.filter(x => x.kind === "roteiro");
  const out = []; const step = Math.max(1, Math.round(a.length / Math.max(1, b.length)));
  let j = 0;
  a.forEach((x, i) => { out.push(x); if ((i + 1) % step === 0 && j < b.length) out.push(b[j++]); });
  return [...out, ...b.slice(j)];
}

function vibes(f) {
  const aff = f.vibe, query = f.busca, cityF = f.cidade, kinds = f.mostrar;
  const when = { agora: f.aberto, dia: f.dia, periodo: f.periodo };
  const all = [
    ...PLACES.map(p => ({ kind: "lugar", id: p.id, name: p.name, vibes: p.affs || [], city: p.city, bairros: [p.bairro].filter(Boolean), p, text: placeText(p) })),
    ...(SITE.roteirosHidden ? [] : ROTEIROS.map(roteiroFacts)),
  ];
  const anyCity = all.filter(x => (!aff || x.vibes.includes(aff)) && (!query || x.text.includes(fslug(query))));
  const base = anyCity.filter(x => !cityF || x.city === cityF);
  const shown = (kind) => !kinds.size || kinds.has(kind);
  const e = engine(base, {
    mostrar: (x) => shown(x.kind),
    bairro: (x) => !f.bairro.size || x.bairros.some(b => f.bairro.has(fslug(b))),
    tipo: (x) => x.kind !== "lugar" || !f.tipo.size || f.tipo.has(fslug(x.p.type)),
    when: (x) => x.kind !== "lugar" || matchesWhen(x.p, when),
    tamanho: (x) => x.kind !== "roteiro" || !f.tamanho.size || STOPS.some(([k, , fn]) => f.tamanho.has(k) && fn(x.stops)),
  });
  const rank = (x) => (aff ? x.vibes.indexOf(aff) : 0);
  const results = !f.ordem || f.ordem === "relevancia" ? interleave([...e.results].sort((x, y) => rank(x) - rank(y))) : sortBy(e.results, f.ordem, { name: (x) => x.name });
  const nPlaces = results.filter(x => x.kind === "lugar").length;
  return {
    results: results.map(x => ({ ref: x.kind === "lugar" ? { kind: "place", id: x.id } : { kind: "roteiro", id: x.id }, place: x.p })),
    cityCounts: cityTally(anyCity, x => [x.city]),
    facets: {
      mostrar: KINDS_VIBES.map(([value, label]) => ({ value, label, count: e.count("mostrar", x => x.kind === value) })),
      bairro: e.opts("bairro", bairrosOf(base, x => x.bairros), x => x.bairros.map(fslug)),
      tipo: TIPOS().map(([value, label]) => ({ value, label, count: e.count("tipo", x => x.kind === "lugar" && fslug(x.p.type) === value) })),
      tamanho: STOPS.map(([value, label, fn]) => ({ value, label, count: e.count("tamanho", x => x.kind === "roteiro" && fn(x.stops)) })),
    },
    when: whenCounts(e.count, when, (x, w) => x.kind === "lugar" && matchesWhen(x.p, w)),
    extra: { nPlaces, nRots: results.length - nPlaces, hasRoteiros: all.some(x => x.kind === "roteiro") },
  };
}

function roteiros(f) {
  const vibe = vibeFromSlug(f.vibe), query = f.busca, cityF = f.cidade;
  const all = ROTEIROS.map(roteiroFacts);
  const anyCity = all.filter(x => (!vibe || x.vibes.includes(vibe)) && (!query || x.text.includes(fslug(query))));
  const base = anyCity.filter(x => !cityF || x.city === cityF);
  const e = engine(base, {
    bairro: (x) => !f.bairro.size || x.bairros.some(b => f.bairro.has(fslug(b))),
    tamanho: (x) => !f.tamanho.size || STOPS.some(([k, , fn]) => f.tamanho.has(k) && fn(x.stops)),
  });
  let results = e.results;
  if (f.ordem === "paradas") results = [...results].sort((x, y) => x.stops - y.stops);
  else if (f.ordem && f.ordem !== "relevancia") results = sortBy(results, f.ordem, { name: (x) => x.r.title });
  else if (vibe) results = [...results].sort((x, y) => x.vibes.indexOf(vibe) - y.vibes.indexOf(vibe));
  return {
    results: results.map(x => ({ ref: { kind: "roteiro", id: x.id } })),
    cityCounts: cityTally(anyCity, x => [x.city]),
    facets: {
      bairro: e.opts("bairro", bairrosOf(base, x => x.bairros), x => x.bairros.map(fslug)),
      tamanho: STOPS.map(([value, label, fn]) => ({ value, label, count: e.count("tamanho", x => fn(x.stops)) })),
    },
    extra: { anyInCity: Object.fromEntries(CITIES.map(c => [c.id, all.some(x => x.city === c.id)])) },
  };
}

function storyFacts(s) {
  const ids = [...new Set([...String(s.body || "").matchAll(/data-place="([\w-]+)"/g)].map(m => m[1]).concat(s.places || []))];
  const places = ids.map(placeById).filter(Boolean);
  return { s, id: s.id, cat: s.tag || "", places, date: publishedDate(s) || "", author: (s.author || "").trim(),
    cities: [...new Set(places.map(p => p.city).filter(Boolean))],
    bairros: [...new Set(places.map(p => p.bairro).filter(Boolean))],
    vibes: [...new Set(places.flatMap(p => p.affs || []))],
    text: fslug([s.title, s.desc, s.tag, s.author, htmlToText(s.body || ""), ...places.flatMap(p => [p.name, p.bairro])].join(" ")) };
}
// categorias com posts publicados, na ordem do painel (as que não estão no painel vêm no fim)
export function radarCats(all = ALL_STORIES.map(storyFacts)) {
  const used = [...new Set(all.map(x => x.cat).filter(Boolean))];
  const ordered = RADAR_CATEGORIES.filter(c => used.includes(c.label));
  return [...ordered, ...used.filter(t => !ordered.some(c => c.label === t)).map(t => ({ label: t, tone: ALL_STORIES.find(s => s.tag === t)?.tone }))]
    .map(c => ({ label: c.label, tone: c.tone, slug: slugify(c.label) }));
}

function radar(f) {
  const all = ALL_STORIES.map(storyFacts);
  const cats = radarCats(all);
  const cat = cats.find(c => c.slug === f.categoria) || null;
  const query = f.busca, cityF = f.cidade;
  // busca + cidade valem para tudo; posts sem lugar citado não têm cidade e aparecem em qualquer uma
  const anyCity = all.filter(x => !query || x.text.includes(fslug(query)));
  const base = anyCity.filter(x => !cityF || !x.cities.length || x.cities.includes(cityF));
  const e = engine(base, {
    categoria: (x) => !cat || x.cat === cat.label,
    publicado: (x) => !f.publicado.size || RADAR_PERIODS.some(([k, , d]) => f.publicado.has(k) && ageDays(x.date) <= d),
    formato: (x) => !f.formato.size || RADAR_FORMATS.some(([k, , fn]) => f.formato.has(k) && fn(x)),
    bairro: (x) => !f.bairro.size || x.bairros.some(b => f.bairro.has(fslug(b))),
    vibe: (x) => !f.vibe.size || x.vibes.some(v => f.vibe.has(v)),
    autor: (x) => !f.autor.size || f.autor.has(fslug(x.author)),
  });
  const results = f.ordem === "az" ? [...e.results].sort((a, b) => a.s.title.localeCompare(b.s.title, "pt-BR"))
    : [...e.results].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const VIBES = VIBE_ORDER.filter(v => base.some(x => x.vibes.includes(v))).map(v => [v, affLabel(v)]);
  const AUTHORS = [...new Set(base.map(x => x.author).filter(Boolean))].sort(byLabel).map(a => [fslug(a), a]);
  return {
    results: results.map(x => ({ ref: { kind: "story", id: x.id } })),
    cityCounts: cityTally(anyCity, x => x.cities),
    facets: {
      publicado: RADAR_PERIODS.map(([value, label, d]) => ({ value, label, count: e.count("publicado", x => ageDays(x.date) <= d) })),
      formato: RADAR_FORMATS.map(([value, label, fn]) => ({ value, label, count: e.count("formato", fn) })),
      bairro: e.opts("bairro", bairrosOf(base, x => x.bairros), x => x.bairros.map(fslug)),
      vibe: e.opts("vibe", VIBES, x => x.vibes),
      autor: e.opts("autor", AUTHORS, x => [fslug(x.author)]),
    },
    extra: {
      cats: cats.map(c => ({ ...c, count: e.count("categoria", x => x.cat === c.label) })),
      all: e.count("categoria", () => true),
      anyInCity: Object.fromEntries(CITIES.map(c => [c.id, all.some(x => x.cities.includes(c.id))])),
    },
  };
}

function eventos(f) {
  const vibe = vibeFromSlug(f.vibe), query = f.busca, cityF = f.cidade, when = f.quando, showPast = f.encerrados;
  const now = new Date();
  const text = (e) => fslug([e.title, e.tagline, htmlToText(e.desc || ""), venueName(e), e.bairro, ...(e.tags || [])].join(" "));
  const anyCity = EVENTS.filter(e => (showPast || !isPast(e, now)) && (!vibe || (e.affs || []).includes(vibe)) && (!query || text(e).includes(fslug(query))));
  const base = anyCity.filter(e => !cityF || e.city === cityF);
  const en = engine(base, {
    quando: (e) => !when || inRange(e, (WHEN.find(w => w[0] === when) || WHEN[0])[2](now)),
    categoria: (e) => !f.categoria.size || catsOf(e).some(c => f.categoria.has(c)),
    bairro: (e) => !f.bairro.size || f.bairro.has(fslug(e.bairro)),
    preco: (e) => !f.preco.size || f.preco.has(String(eventPriceLevel(e))),
  });
  const results = !f.ordem || f.ordem === "data" ? [...en.results].sort(byAgenda(now)) : sortBy(en.results, f.ordem, { name: (e) => e.title, price: eventPriceLevel });
  return {
    results: results.map(e => ({ ref: { kind: "event", id: e.id } })),
    cityCounts: cityTally(anyCity, e => [e.city]),
    facets: {
      quando: WHEN.map(([value, label, fn]) => ({ value, label, count: en.count("quando", e => inRange(e, fn(now))) })),
      bairro: en.opts("bairro", bairrosOf(base, e => [e.bairro]), e => [fslug(e.bairro)]),
      categoria: EVENT_CATEGORIES.map(c => ({ value: catSlug(c), label: c.label, count: en.count("categoria", e => catsOf(e).includes(catSlug(c))) })),
      preco: PRICE_LEVELS.map(o => ({ value: o.value, label: o.value === "0" ? "Gratuito" : o.label, count: en.count("preco", e => String(eventPriceLevel(e)) === o.value) })),
    },
    extra: { anyInCity: Object.fromEntries(CITIES.map(c => [c.id, EVENTS.some(e => e.city === c.id)])) },
  };
}

// Busca: resultados de todo o site em abas, com os filtros de cada tipo
const BUSCA_KEYS = { lugares: ["cidade", "bairro", "tipoLugar", "vibe", "when"], eventos: ["quando", "cidade", "bairro", "categoria", "vibe"], roteiros: ["cidade", "bairro", "vibe", "tamanho"], radar: ["radar"], paginas: [] };
export const BUSCA_SORTS = { lugares: ["relevancia", "az", "recentes"], eventos: ["relevancia", "data", "az"], roteiros: ["relevancia", "az", "recentes", "paradas"], radar: ["relevancia", "recentes", "az"], paginas: ["relevancia", "az"] };
const docRef = (d) => ({ kind: d.kind, id: d.id });

function busca(f) {
  const query = f.q.trim();
  const kinds = kindsOn();
  const tab = kinds.some(k => k.id === f.tipo) ? f.tipo : "tudo";
  const K = kinds.find(k => k.id === tab);
  const cityF = f.cidade, now = new Date();
  const when = { agora: f.aberto, dia: f.dia, periodo: f.periodo };
  const found = query ? search(query, { kinds: kinds.map(k => k.kind) }) : { results: [], partial: false };
  // eventos encerrados só entram com o filtro ligado
  const all = found.results.filter(d => d.kind !== "event" || !d.past || f.encerrados);
  const byKind = (kind) => all.filter(d => d.kind === kind);
  const tabCounts = Object.fromEntries(kinds.map(k => [k.id, byKind(k.kind).length]));
  const head = { query, tab, total: all.length, partial: !!found.partial, tabCounts, anyFound: found.results.length,
    suggestion: !all.length && query ? didYouMean(query) : "", shortcuts: query ? shortcuts(query, 8) : [] };
  if (!K) {
    // aba Tudo: as primeiras de cada tipo
    const groups = kinds.map(k => ({ id: k.id, kind: k.kind, total: tabCounts[k.id], refs: byKind(k.kind).slice(0, TUDO_MAX[k.kind]).map(docRef), docs: byKind(k.kind).slice(0, TUDO_MAX[k.kind]) }));
    return { results: [], extra: { ...head, groups: groups.map(({ docs, ...g }) => g) }, docs: groups.flatMap(g => g.docs) };
  }
  const vibesOf = (d) => d.kind === "roteiro" ? roteiroVibes(d.item) : d.item.affs || [];
  const tests = {
    cidade: (d) => !cityF || d.city === cityF,
    bairro: (d) => !f.bairro.size || d.bairros.some(b => f.bairro.has(fslug(b))),
    vibe: (d) => !f.vibe.size || vibesOf(d).some(a => f.vibe.has(a)),
    tipoLugar: (d) => !f.tipoLugar.size || f.tipoLugar.has(fslug(d.item.type)),
    quando: (d) => !f.quando || inRange(d.item, (WHEN.find(w => w[0] === f.quando) || WHEN[0])[2](now)),
    categoria: (d) => !f.categoria.size || catsOf(d.item).some(c => f.categoria.has(c)),
    tamanho: (d) => !f.tamanho.size || STOPS.some(([k, , fn]) => f.tamanho.has(k) && fn(d.item.steps?.length || 0)),
    radar: (d) => !f.radar.size || f.radar.has(fslug(d.item.tag)),
    when: (d) => matchesWhen(d.item, when),
  };
  const KEYS = BUSCA_KEYS[tab] || [];
  const base = byKind(K.kind);
  const e = engine(base, Object.fromEntries(KEYS.map(k => [k, tests[k]])));
  let results = e.results;
  if (f.ordem === "data") { const agenda = byAgenda(now); results = [...results].sort((a, b) => agenda(a.item, b.item)); }
  else if (f.ordem === "paradas") results = [...results].sort((a, b) => (a.item.steps?.length || 0) - (b.item.steps?.length || 0));
  else if (f.ordem === "recentes") results = [...results].sort((a, b) => recentOf(b.item).localeCompare(recentOf(a.item)));
  else if (f.ordem && f.ordem !== "relevancia") results = sortBy(results, f.ordem, { name: (d) => d.title });
  const RCATS = [...new Set([...RADAR_CATEGORIES.map(c => c.label), ...base.map(d => d.item.tag)].filter(Boolean))].map(l => [fslug(l), l]);
  const facets = {};
  if (KEYS.includes("bairro")) facets.bairro = e.opts("bairro", bairrosOf(base, d => d.bairros), d => d.bairros.map(fslug));
  if (KEYS.includes("tipoLugar")) facets.tipoLugar = e.opts("tipoLugar", TIPOS(), d => [fslug(d.item.type)]);
  if (KEYS.includes("categoria")) facets.categoria = e.opts("categoria", EVENT_CATEGORIES.map(c => [catSlug(c), c.label]), d => d.kind === "event" ? catsOf(d.item) : []);
  if (KEYS.includes("vibe")) facets.vibe = e.opts("vibe", VIBE_ORDER.map(id => [id, affLabel(id)]), vibesOf);
  if (KEYS.includes("tamanho")) facets.tamanho = STOPS.map(([value, label, fn]) => ({ value, label, count: e.count("tamanho", d => fn(d.item.steps?.length || 0)) }));
  if (KEYS.includes("radar")) facets.radar = e.opts("radar", RCATS, d => [fslug(d.item.tag)]);
  if (KEYS.includes("quando")) facets.quando = WHEN.map(([value, label, fn]) => ({ value, label, count: e.count("quando", d => inRange(d.item, fn(now))) }));
  return {
    results: results.map(d => ({ ref: docRef(d), doc: d })),
    cityCounts: KEYS.includes("cidade") ? base.filter(d => e.pass(d, "cidade")).reduce((m, d) => (d.city ? { ...m, [d.city]: (m[d.city] || 0) + 1 } : m), {}) : {},
    facets,
    when: KEYS.includes("when") ? whenCounts(e.count, when, (d, w) => matchesWhen(d.item, w)) : null,
    extra: { ...head, keys: KEYS, base: base.length },
  };
}

const LISTS = { lugares, vibes, roteiros, radar, eventos, busca };

// item da página → objetos que o site precisa para desenhar o card (com lugares citados)
function collect(refs, docs = []) {
  const out = { places: new Map(), roteiros: new Map(), stories: new Map(), events: new Map() };
  const addPlace = (id) => { const p = placeById(id); if (p) out.places.set(p.id, p); };
  for (const { kind, id } of refs) {
    if (kind === "place") addPlace(id);
    else if (kind === "roteiro") { const r = ROTEIROS.find(x => x.id === id); if (r) { out.roteiros.set(id, r); r.steps.forEach(s => s.place && addPlace(s.place)); } }
    else if (kind === "story") { const s = ALL_STORIES.find(x => x.id === id); if (s) { out.stories.set(id, s); storyFacts(s).places.forEach(p => out.places.set(p.id, p)); } }
    else if (kind === "event") { const e = EVENTS.find(x => x.id === id); if (e) { out.events.set(id, e); if (e.venue) addPlace(e.venue); } }
  }
  // páginas (resultado de busca) vão como documento pronto
  const pages = docs.filter(d => d.kind === "page").map(d => ({ id: d.id, title: d.title, path: d.path, excerpt: d.item.excerpt || "" }));
  return { places: [...out.places.values()], roteiros: [...out.roteiros.values()], stories: [...out.stories.values()], events: [...out.events.values()], pages };
}
// pin do mapa: só o que o mapa e o card dele mostram
const PIN = ["id", "slug", "name", "sub", "type", "city", "bairro", "end", "cep", "geo", "map", "affs"];
export const pinOf = (p) => Object.fromEntries(PIN.filter(k => p[k] !== undefined).map(k => [k, p[k]]));

// Roda a lista sobre o conteúdo já carregado nos arrays do site (ver hydrate no servidor)
export function runList(kind, q) {
  const fn = LISTS[kind];
  if (!fn) return null;
  const f = parseList(kind, q);
  const m = fn(f);
  const total = m.results.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, parseInt(q.get("pagina"), 10) || 1), pages);
  const slice = m.results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const refs = slice.map(x => x.ref);
  const docRefs = m.docs || slice.filter(x => x.doc).map(x => x.doc);
  return {
    list: {
      kind, total, page, pages, per: PER_PAGE, refs,
      cityCounts: m.cityCounts || {}, facets: m.facets || {}, when: m.when || null, extra: m.extra || {},
      // modo mapa: todos os resultados como pins
      ...(q.get("mapa") === "1" ? { pins: m.results.filter(x => x.place).map(x => pinOf(x.place)) } : {}),
    },
    db: collect([...refs, ...(m.docs || []).map(docRef)], docRefs),
  };
}

// Sugestões da caixa de busca (enquanto a pessoa digita): atalhos e os primeiros de cada tipo
export function suggest(q) {
  const t = String(q || "").trim();
  if (!t) return { groups: [], total: 0, toks: [] };
  const { results, tokens: toks } = search(t);
  const groups = [["Atalhos", shortcuts(t, 4).map(s => ({ type: "shortcut", ...s }))]];
  kindsOn().forEach(k => {
    const list = results.filter(r => r.kind === k.kind).slice(0, k.kind === "place" ? 4 : 3)
      .map(d => ({ type: "doc", label: d.title, path: d.path, d: { kind: d.kind, id: d.id, title: d.title, path: d.path, sub: d.sub || "", past: !!d.past, img: d.kind === "story" ? d.item.img : undefined } }));
    if (list.length) groups.push([k.label, list]);
  });
  return { groups: groups.filter(([, l]) => l.length), total: results.length, toks, dym: results.length ? "" : didYouMean(t) };
}
