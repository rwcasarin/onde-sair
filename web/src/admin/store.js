// =====================================================================
// Onde Sair · CMS — camada de dados do painel administrativo
//
// Dois modos, escolhidos automaticamente na carga:
//  · NUVEM  — publicado no Vercel: o conteúdo vem de /api/content e o painel
//             grava em /api/admin/* (Vercel Blob). Login real com sessão.
//  · LOCAL  — arquivo único / sem servidor: tudo fica no localStorage.
// Tudo que é PUBLICADO é sincronizado nos arrays que o site público
// já lê (PLACES, ROTEIROS, STORIES…), então o site reflete as edições.
// =====================================================================
import {
  CITIES, AFFINITIES, ROTEIROS, PLACES, NOTIFICATIONS, TAGLINES,
  VIBE_STYLE, VIBE_ORDER, VIBE_PAGE, HERO, TIPS_TODAY, STORIES, ALL_STORIES, VIBE_ROTEIROS,
  VIBE_TO_ROTEIRO, BRAND_VALUES, PLACE_TIPS, ROTEIRO_TAGS, PAGES, MENUS, SEED_PAGES, SEED_MENUS, RADAR_CATEGORIES,
} from "../data.js";
import { applyUpdates } from "./updates.js";

const KEY = "onde-sair-cms-v1";
const SESSION_KEY = "onde-sair-cms-session";
const clone = (x) => JSON.parse(JSON.stringify(x));
const now = () => new Date().toISOString();
// data relativa a hoje; itens "de hoje" nunca ficam no futuro
const daysAgo = (d, h = 10) => {
  const t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, 12, 0, 0);
  if (d >= 0 && t > new Date()) t.setTime(Date.now() - (d + 1) * 36e5 * 2);
  return t.toISOString();
};

export const slugify = (s = "") => s.toString().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ---------------------------------------------------------------------
// Papéis e permissões
// ---------------------------------------------------------------------
import { ROLES, PERMISSIONS, ROLE_PERMS, can, isLive } from "../../shared/roles.js";
export { ROLES, PERMISSIONS, can, isLive };
export const rolePerms = (role) => ROLE_PERMS[role] || [];

export const STATUS = {
  rascunho:  { label: "Rascunho",   tone: "gray" },
  revisao:   { label: "Em revisão", tone: "amber" },
  agendado:  { label: "Agendado",   tone: "blue" },
  publicado: { label: "Publicado",  tone: "green" },
  arquivado: { label: "Arquivado",  tone: "muted" },
};

// ---------------------------------------------------------------------
// Semente — gerada a partir do conteúdo atual do site
// ---------------------------------------------------------------------
const BAIRROS_BASE = ["Centro", "Jardins", "Vila Nova", "Boa Vista", "Santa Cecília", "Zona Norte"];
const FIRST = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio", "Gabi", "Heitor", "Isa", "João", "Larissa", "Marcos", "Nina", "Otávio", "Paula", "Rafa", "Sofia", "Tiago", "Vera", "Yuri"];
const LAST = ["Souza", "Lima", "Alves", "Costa", "Rocha", "Martins", "Ferraz", "Prado", "Nunes", "Barros"];

function seed() {
  const editors = ["Marina F.", "Lucas P.", "Ana C.", "Carlos M.", "Rafael S."];
  const places = clone(PLACES).map((p, i) => ({
    ...p, city: "sp", status: "publicado",
    slug: slugify(p.name),
    seo: { title: `${p.name} · ${p.sub} em ${p.bairro} | Onde Sair`, desc: p.desc },
    createdAt: daysAgo(90 - i * 3), updatedAt: daysAgo(i % 9, 9 + (i % 8)), updatedBy: editors[i % editors.length],
  }));
  // dois rascunhos para o fluxo editorial ficar visível
  places.push({
    ...clone(places[0]), id: "p16", name: "Empório Lume", slug: "emporio-lume", type: "Restaurantes", bairro: "Vila Nova",
    sub: "Empório e café", cuisine: "Café e empório", tagline: "Café coado, pão de queijo e prateleiras de achados mineiros.",
    desc: "Empório com café nos fundos e produtos de pequenos produtores.", dica: "Peça o pão de queijo recheado com doce de leite.",
    affs: ["relax", "eco"], tags: ["Café", "Empório"], status: "revisao", rating: 0, reviews: 0,
    note: "", map: { x: 30, y: 44, label: "EL" }, createdAt: daysAgo(2), updatedAt: daysAgo(1, 16), updatedBy: "Carlos M.",
    seo: { title: "", desc: "" },
  });
  places.push({
    ...clone(places[4]), id: "p17", name: "Terraço Aurora", slug: "terraco-aurora", bairro: "Boa Vista", sub: "Bar de cobertura",
    tagline: "Drinks no alto com DJ ao pôr do sol.", desc: "Cobertura com DJ e drinks clássicos.", dica: "",
    status: "rascunho", rating: 0, reviews: 0, reasons: [["eye", "Vista do alto"]], tags: ["Drinks"],
    createdAt: daysAgo(0, 9), updatedAt: daysAgo(0, 11), updatedBy: "Rafael S.", seo: { title: "", desc: "" },
  });

  const roteiros = clone(ROTEIROS).map((r, i) => ({
    ...r, status: "publicado", slug: slugify(r.title), tags: ROTEIRO_TAGS[r.id] || [],
    createdAt: daysAgo(80 - i * 5), updatedAt: daysAgo(i * 2 + 1), updatedBy: editors[(i + 2) % editors.length],
  }));

  const stories = clone(STORIES).map((s, i) => ({
    ...s, status: "publicado", slug: slugify(s.title), author: editors[i],
    body: `${s.desc}\n\nEscreva aqui o texto completo da história. Use parágrafos curtos, dicas práticas e o tom de amigo que mora na cidade há 10 anos.`,
    createdAt: daysAgo(30 - i * 6), updatedAt: daysAgo(i * 3 + 2), updatedBy: editors[i],
  }));
  stories.push({
    id: "s4", tag: "Agenda", tone: "purple", shape: "teal", title: "O que fazer no feriado prolongado", status: "agendado",
    publishAt: daysAgo(-3, 8), desc: "Roteiros curtos para quem fica na cidade.", img: "images/home/historia-4.jpg",
    slug: "o-que-fazer-no-feriado-prolongado", author: "Ana C.", body: "Rascunho da história do feriado.",
    createdAt: daysAgo(4), updatedAt: daysAgo(0, 8), updatedBy: "Ana C.",
  });

  const vibes = VIBE_ORDER.map(id => {
    const a = AFFINITIES.find(x => x.id === id);
    return { ...clone(a), ...clone(VIBE_PAGE[id]), icon: VIBE_STYLE[id].icon, cls: VIBE_STYLE[id].cls, active: true };
  });

  const home = {
    hero: { title: "Qual é\na vibe hoje?", lede: "Descubra lugares, experiências e pessoas para viver uma cidade mais viva. Não é uma agenda, é uma dica.", ...clone(HERO) },
    tips: clone(TIPS_TODAY),
    storyIds: STORIES.map(s => s.id),
    vibeRoteiros: VIBE_ROTEIROS.map(v => ({ ...clone(v), roteiro: VIBE_TO_ROTEIRO[v.id] })),
    brandValues: clone(BRAND_VALUES),
  };

  const placeNames = places.map(p => p.id);
  const reviewTexts = [
    "Fui num sábado e foi perfeito, atendimento muito atencioso.", "Achei caro para o que entrega, mas o lugar é lindo.",
    "A dica do balcão funcionou demais! Voltarei com certeza.", "Música alta demais pra conversar, fora isso tudo ótimo.",
    "Melhor pôr do sol da cidade, ponto.", "Fila enorme, mas valeu a pena. Chegue cedo.",
    "Levei meus pais e eles amaram. Ótimo pra família.", "Comida veio fria e demorou bastante.",
    "Drinks excelentes, equipe simpática.", "Lugar escondido incrível, não conhecia!",
    "Visita rápida, achei ok.", "Recomendo a sobremesa da casa, sensacional.",
  ];
  const statuses = ["pendente", "pendente", "pendente", "aprovada", "aprovada", "pendente", "aprovada", "rejeitada", "aprovada", "pendente", "aprovada", "aprovada"];
  const reviews = reviewTexts.map((text, i) => ({
    id: "rv" + (i + 1), place: placeNames[i % 15], author: `${FIRST[i]} ${LAST[i % LAST.length]}`, rating: [5, 3, 5, 4, 5, 4, 5, 2, 5, 5, 3, 5][i],
    text, status: statuses[i], featured: i === 0 || i === 4 || i === 8, createdAt: daysAgo(i % 6, 8 + i), reports: i === 7 ? 2 : 0,
  }));

  const members = Array.from({ length: 28 }, (_, i) => ({
    id: "u" + (i + 1), name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
    email: `${slugify(FIRST[i % FIRST.length])}.${slugify(LAST[(i * 3) % LAST.length])}${i}@email.com`,
    city: ["sorocaba", "sp", "rio", "bh", "cwb", "poa", "rec"][i % 7],
    status: i === 5 ? "bloqueado" : i % 9 === 0 ? "pendente" : "ativo",
    saves: (i * 7) % 40, reviews: i % 6, joined: daysAgo(10 + i * 9), lastSeen: daysAgo(i % 12),
  }));

  const team = [
    { id: "t1", name: "Renata Casarin", email: "admin@ondesair.com.br", password: "admin123", role: "admin", status: "ativo", lastLogin: daysAgo(0, 8) },
    { id: "t2", name: "Ana Carvalho", email: "editora@ondesair.com.br", password: "editor123", role: "editor", status: "ativo", lastLogin: daysAgo(1, 14) },
    { id: "t3", name: "Carlos Moura", email: "curador@ondesair.com.br", password: "curador123", role: "curador", status: "ativo", lastLogin: daysAgo(2, 19) },
    { id: "t4", name: "Lucas Prado", email: "lucas@ondesair.com.br", password: "convite", role: "curador", status: "convidado", lastLogin: null },
  ];

  const cities = clone(CITIES).map(c => ({ ...c, active: true, bairros: c.id === "sorocaba" ? [] : c.id === "sp" ? [...BAIRROS_BASE] : BAIRROS_BASE.slice(0, 3) }));
  cities.push({ id: "for", name: "Fortaleza", sub: "CE", active: false, bairros: [] });

  const campaigns = [
    ...clone(NOTIFICATIONS).map((n, i) => ({ ...n, audience: "Todos", status: "enviada", sentAt: daysAgo(i, 18), reach: 1200 - i * 140, opens: 380 - i * 40 })),
    { id: "n6", kind: "AGENDA", title: "Feriado chegando: 5 roteiros curtos", body: "Pra quem fica na cidade e quer aproveitar sem pegar estrada.", audience: "Vibe: Pra relaxar", status: "agendada", scheduledAt: daysAgo(-2, 9), unread: true },
  ];

  const settings = {
    siteName: "Onde Sair", tagline: TAGLINES.sub, campaign: TAGLINES.campaign,
    contactEmail: "contato@ondesair.com.br", instagram: "@ondesair", tiktok: "@ondesair", youtube: "/ondesair", spotify: "Onde Sair",
    seoTitle: "Onde Sair · O lugar certo pra cada vibe", seoDesc: "Curadoria por afinidade: lugares, roteiros e experiências escolhidos por quem vive a cidade.",
    defaultCity: "sorocaba", announcement: { enabled: false, text: "Novidade: roteiros de feriado já estão no ar!", tone: "primary" },
    newsletter: true, maintenance: false, reviewsRequireApproval: true,
  };

  const activity = [
    { at: daysAgo(0, 11), who: "Rafael S.", action: "criou o rascunho", target: "Terraço Aurora", type: "lugar" },
    { at: daysAgo(0, 8), who: "Ana C.", action: "agendou", target: "O que fazer no feriado prolongado", type: "história" },
    { at: daysAgo(1, 16), who: "Carlos M.", action: "enviou para revisão", target: "Empório Lume", type: "lugar" },
    { at: daysAgo(1, 10), who: "Marina F.", action: "atualizou", target: "Quintal do Centro", type: "lugar" },
    { at: daysAgo(2, 15), who: "Lucas P.", action: "publicou", target: "Domingo sem pressa", type: "roteiro" },
  ];

  const pages = clone(SEED_PAGES).map((pg, i) => ({
    ...pg, status: "rascunho", seo: { title: "", desc: "", noindex: false },
    createdAt: daysAgo(1, 9 + i), updatedAt: daysAgo(1, 9 + i), updatedBy: "Curadoria · Onde Sair",
  }));
  const menus = clone(SEED_MENUS);

  return { version: 1, places, roteiros, stories, pages, menus, vibes, home, reviews, members, team, cities, campaigns, settings, activity, media: {} };
}

// ---------------------------------------------------------------------
// Estado + persistência
// ---------------------------------------------------------------------
const SEED = seed();       // calculado antes de qualquer sincronização
let db = load();
const listeners = new Set();

function load() {
  let d = clone(SEED);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) d = { ...d, ...JSON.parse(raw) };
  } catch { /* storage indisponível */ }
  // modo local: o conteúdo novo entra direto no banco do navegador
  if (logUpdates(d, applyUpdates(d))) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage indisponível */ }
  }
  return d;
}
// Registra na atividade o conteúdo que entrou por atualização (ver updates.js)
function logUpdates(d, applied) {
  applied.forEach(u => {
    d.activity = [{ at: now(), who: "Sistema", action: "adicionou " + u.label, target: u.names.join(", "), type: "lugar" }, ...(d.activity || [])].slice(0, 200);
  });
  return applied.length > 0;
}

let storageError = null;
function persist() {
  if (REMOTE) return;
  try { localStorage.setItem(KEY, JSON.stringify(db)); storageError = null; }
  catch (e) { storageError = e; }
}

// ---------------------------------------------------------------------
// Modo nuvem (API no Vercel)
// ---------------------------------------------------------------------
export let REMOTE = false;          // true quando /api responde
let adminLoaded = false;            // painel carregou o banco completo
let etag = null;                    // versão do banco no servidor
let base = null;                    // último estado confirmado pelo servidor (para mesclar)
export const sync = { status: "idle", error: null, at: null };  // idle | saving | saved | error | conflict

export async function api(path, { method = "GET", body } = {}) {
  const r = await fetch("/api/" + path, {
    method, credentials: "same-origin",
    headers: { "x-cms": "1", ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || "Erro " + r.status), { status: r.status, data });
  return data;
}

// Carga inicial do site: tenta a API; sem ela, segue no modo local
export async function boot() {
  if (location.protocol === "file:") return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    // no-cache: o navegador sempre confere com a CDN (sem servir uma cópia velha depois de uma edição)
    const r = await fetch("/api/content", { signal: ctrl.signal, cache: "no-cache", headers: { accept: "application/json" } });
    clearTimeout(t);
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return;
    const data = await r.json();
    REMOTE = true;
    db = data.db ? { ...clone(SEED), ...data.db } : clone(SEED);
    applyUpdates(db);   // só na memória: o visitante já vê o conteúdo novo; quem grava é o painel
    syncPublic();
  } catch { /* offline ou sem API: modo local */ }
}

// Painel: carrega o banco completo (cria a partir da semente se estiver vazio)
export async function adminLoad() {
  if (!REMOTE) return;
  const r = await api("admin/db");
  if (r.db) { db = { ...clone(SEED), ...r.db }; etag = r.etag; base = contentOf(db); }
  else {
    const seedDb = { ...clone(SEED), team: [] };
    const w = await api("admin/db", { method: "PUT", body: { db: seedDb, etag: null } });
    etag = w.etag; db = { ...seedDb, team: db.team };
    const again = await api("admin/db"); db = { ...clone(SEED), ...again.db }; etag = again.etag; base = contentOf(db);
  }
  adminLoaded = true;
  // conteúdo novo do código (updates.js): grava no servidor na primeira carga de um administrador,
  // único perfil que pode mexer em cidades e publicar tudo de uma vez
  if (can(r.user, "settings.edit") && logUpdates(db, applyUpdates(db))) { syncPublic(); notify(); await pushRemote(); return; }
  notify();
}

const contentOf = (d) => { const { team, media, members, ...content } = d; return clone(content); };
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Mescla em 3 vias: aplica sobre a versão do servidor só o que mudou aqui desde a última sincronização
function merge(server, baseC, local) {
  const out = clone(server);
  for (const key of Object.keys(local)) {
    if (same(baseC[key], local[key])) continue;                 // não mexi aqui
    const L = local[key], B = baseC[key], S = server[key];
    if (key === "activity") {                                     // união dos registros
      const seen = new Set((S || []).map(a => a.at + a.who + a.action + a.target));
      out.activity = [...(L || []).filter(a => !seen.has(a.at + a.who + a.action + a.target)), ...(S || [])].slice(0, 200);
    } else if (Array.isArray(L) && L.every(x => x && x.id) && Array.isArray(S)) {   // coleções por id
      const bMap = new Map((B || []).map(x => [x.id, x])), lMap = new Map(L.map(x => [x.id, x]));
      let arr = S.filter(x => !(bMap.has(x.id) && !lMap.has(x.id)));            // excluídos aqui
      arr = arr.map(x => lMap.has(x.id) && !same(bMap.get(x.id), lMap.get(x.id)) ? lMap.get(x.id) : x);  // alterados aqui
      const added = L.filter(x => !bMap.has(x.id) && !arr.some(y => y.id === x.id));
      out[key] = [...added, ...arr];
    } else if (L && typeof L === "object" && !Array.isArray(L) && S && typeof S === "object") {   // objetos: campo a campo
      out[key] = { ...S };
      for (const k of Object.keys(L)) if (!same((B || {})[k], L[k])) out[key][k] = L[k];
    } else out[key] = L;
  }
  return out;
}

let saving = false, pending = false;
let waiters = [];
// Resolve quando as gravações em andamento terminarem: true = salvo no servidor
export function whenSynced() {
  if (!REMOTE || !adminLoaded) return Promise.resolve(true);
  if (!saving && !pending) return Promise.resolve(sync.status !== "error" && sync.status !== "conflict");
  return new Promise(r => waiters.push(r));
}
async function pushRemote({ force = false } = {}) {
  if (saving) { pending = true; return; }
  saving = true; pending = false; sync.status = "saving"; sync.error = null; notify();
  let content = contentOf(db);
  try {
    if (force) {                                             // admin: aplica as minhas alterações por cima da versão do servidor
      const latest = await api("admin/db");
      content = merge(contentOf(latest.db), base || {}, content);
      const r = await api("admin/db", { method: "PUT", body: { db: content, etag: latest.etag, force: true } });
      etag = r.etag; base = content; sync.status = "saved"; sync.at = now();
      db = { ...db, ...content, team: latest.db.team, media: latest.db.media };
      syncPublic();
    } else for (let attempt = 0; ; attempt++) {
      try {
        const r = await api("admin/db", { method: "PUT", body: { db: content, etag } });
        etag = r.etag; base = content; sync.status = "saved"; sync.at = now();
        break;
      } catch (e) {
        if (e.status !== 409 || attempt >= 2) throw e;
        const latest = await api("admin/db");                 // outra pessoa salvou: mescla e tenta de novo
        content = merge(contentOf(latest.db), base || {}, content);
        etag = latest.etag;
        db = { ...db, ...content, team: latest.db.team, media: latest.db.media };
        syncPublic();
      }
    }
  } catch (e) {
    sync.status = e.status === 409 ? "conflict" : "error";
    sync.error = e.status === 409 ? "Este conteúdo foi alterado em outra sessão enquanto você editava." : e.message;
  }
  saving = false;
  notify();
  // alterações feitas durante o salvamento: grava em seguida (se deu erro, ficam para a próxima tentativa)
  if (pending && sync.status === "saved") { pushRemote(); return; }
  const done = waiters; waiters = [];
  done.forEach(r => r(sync.status === "saved"));
}
export function retrySave() { pushRemote(); }
// Admin: grava a versão deste navegador mesmo havendo alterações de outra sessão
export async function forceSave() { await pushRemote({ force: true }); return sync.status === "saved"; }
export async function reloadFromServer() { sync.status = "idle"; sync.error = null; await adminLoad(); }
export const lastStorageError = () => storageError;

export const getDB = () => db;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify(newSnapshot = true) { if (newSnapshot) db = { ...db }; listeners.forEach(fn => fn(db)); }
function commit() {
  db = { ...db }; persist(); syncPublic(); notify();
  if (REMOTE && adminLoaded) pushRemote();
}

export function resetDemo() { const keep = { team: db.team, media: db.media }; db = { ...clone(SEED), ...(REMOTE ? keep : {}) }; commit(); }
export function importDB(data) { const keep = { team: db.team, media: db.media }; db = { ...clone(SEED), ...data, ...(REMOTE ? keep : {}) }; commit(); }

// ---------------------------------------------------------------------
// Sincroniza o conteúdo publicado com o site público
// ---------------------------------------------------------------------
const replace = (arr, items) => arr.splice(0, arr.length, ...items);

// Conteúdo salvo antes da remoção do VIP: limpa campos e campanhas que não existem mais
function stripLegacy(d) {
  [d.places, d.roteiros].forEach(list => (list || []).forEach(x => { delete x.vip; }));
  (d.members || []).forEach(m => { delete m.plan; });
  if (d.campaigns) {
    d.campaigns = d.campaigns.filter(c => c.kind !== "VIP");
    d.campaigns.forEach(c => { if (/VIP/.test(c.audience || "")) c.audience = "Todos"; });
  }
}

export function syncPublic() {
  stripLegacy(db);
  replace(PLACES, db.places.filter(isLive));
  replace(ROTEIROS, db.roteiros.filter(isLive).map(r => ({ ...r, paradas: r.steps.length })));
  // a cor da etiqueta vem sempre da categoria (gerenciada no painel)
  const catTone = (s) => (db.radarCategories || []).find(c => c.label === s.tag)?.tone || s.tone;
  replace(ALL_STORIES, db.stories.filter(isLive).map(s => ({ ...s, tone: catTone(s), img: s.img || `images/historias/${s.id}.jpg` })));
  replace(PAGES, (db.pages || []).filter(isLive));
  replace(RADAR_CATEGORIES, clone(db.radarCategories || []));
  Object.assign(MENUS, clone(db.menus || SEED_MENUS));
  replace(STORIES, db.home.storyIds.map(id => db.stories.find(s => s.id === id)).filter(s => s && isLive(s)).map(s => ({ ...s, tone: catTone(s), img: s.img || `images/historias/${s.id}.jpg` })));

  const vibes = db.vibes.filter(v => v.active);
  replace(AFFINITIES, vibes.map(v => ({ id: v.id, label: v.label, sub: v.sub, slug: v.slug, tint: v.tint, count: db.places.filter(p => isLive(p) && p.affs.includes(v.id)).length })));
  replace(VIBE_ORDER, vibes.map(v => v.id));
  vibes.forEach(v => {
    VIBE_STYLE[v.id] = { icon: v.icon, cls: v.cls };
    VIBE_PAGE[v.id] = { lede: v.lede, note: v.note, features: v.features };
  });

  Object.assign(HERO, db.home.hero);
  replace(TIPS_TODAY, db.home.tips.filter(t => PLACES.some(p => p.id === t.place) && VIBE_STYLE[t.aff]));
  replace(VIBE_ROTEIROS, db.home.vibeRoteiros);
  db.home.vibeRoteiros.forEach(v => { VIBE_TO_ROTEIRO[v.id] = v.roteiro; });
  replace(BRAND_VALUES, db.home.brandValues);

  replace(CITIES, db.cities.filter(c => c.active));
  replace(NOTIFICATIONS, db.campaigns.filter(c => c.status === "enviada").map(c => ({ ...c })));

  const featured = db.reviews.filter(r => r.status === "aprovada" && r.featured);
  if (featured.length) {
    replace(PLACE_TIPS, featured.map(r => ({
      place: r.place, name: r.author, when: relTime(r.createdAt), text: r.text, tags: [["Avaliação " + r.rating + "★", "vibe-yellow"]],
    })));
  }
  Object.assign(TAGLINES, { sub: db.settings.tagline, campaign: db.settings.campaign });
  SITE.announcement = db.settings.announcement;
  SITE.maintenance = db.settings.maintenance;
  SITE.mapsKey = db.settings.mapsKey || "";
  SITE.seoTitle = db.settings.seoTitle || "";
  SITE.seoDesc = db.settings.seoDesc || "";
  SITE.defaultCity = CITIES.some(c => c.id === db.settings.defaultCity) ? db.settings.defaultCity : CITIES[0]?.id;
}
// Configurações lidas pelo site público (faixa de aviso, manutenção)
export const SITE = { announcement: null, maintenance: false, defaultCity: "sorocaba", mapsKey: "", seoTitle: "", seoDesc: "" };

// ---------------------------------------------------------------------
// Mídia enviada pelo painel (sobrepõe os arquivos em images/…)
// ---------------------------------------------------------------------
// valor no mapa: data URL (modo local) ou versão do arquivo no Blob (modo nuvem)
export const resolveMedia = (path) => {
  const v = path && db.media?.[path];
  // caminhos relativos (images/…) viram absolutos: as páginas agora têm URL própria (/lugares/x)
  if (!v) return path && location.protocol !== "file:" && /^images\//.test(path) ? "/" + path : path;
  return v.startsWith("data:") ? v : `/api/media?p=${encodeURIComponent(path)}&v=${v}`;
};
export async function setMedia(path, dataUrl, user) {
  if (REMOTE) {
    const r = await api("admin/media", { method: "POST", body: { path, dataUrl } });
    db.media = { ...db.media, [path]: r.version };
  } else {
    db.media = { ...db.media, [path]: dataUrl };
  }
  log(user, "enviou imagem", path, "mídia");
  commit();
  return REMOTE || !storageError;
}
export async function removeMedia(path, user) {
  if (REMOTE) await api("admin/media?p=" + encodeURIComponent(path), { method: "DELETE" });
  const { [path]: _, ...rest } = db.media;
  db.media = rest;
  log(user, "removeu imagem", path, "mídia");
  commit();
}

// ---------------------------------------------------------------------
// Atividade
// ---------------------------------------------------------------------
function log(user, action, target, type) {
  db.activity = [{ at: now(), who: user?.name || "Sistema", action, target, type }, ...db.activity].slice(0, 200);
}

// ---------------------------------------------------------------------
// CRUD genérico de coleções com fluxo editorial
// ---------------------------------------------------------------------
const TYPE_LABEL = { places: "lugar", roteiros: "roteiro", stories: "história", pages: "página" };
const PREFIX = { places: "p", roteiros: "r", stories: "s", pages: "pg" };
// endereços já usados pelo site: páginas de conteúdo (/{slug}) não podem usá-los
export const RESERVED_SLUGS = ["lugares", "vibes", "roteiros", "historias", "radar", "guia", "entrar", "cadastro", "boas-vindas", "perfil", "favoritos",
  "notificacoes", "cidade", "admin", "api", "assets", "images", "index", "404"];
const titleOf = (item) => item.name || item.title || item.id;

export function nextId(coll) {
  const n = Math.max(0, ...db[coll].map(x => parseInt(String(x.id).replace(/\D/g, ""), 10) || 0)) + 1;
  return PREFIX[coll] + n;
}

// Slug único na coleção (é o endereço da página: /lugares/{slug})
export function uniqueSlug(coll, slug, id) {
  const base = slugify(slug) || PREFIX[coll] + Date.now().toString(36);
  let s = base, n = 2;
  const taken = (v) => db[coll].some(x => x.id !== id && x.slug === v) || (coll === "pages" && RESERVED_SLUGS.includes(v));
  while (taken(s)) s = `${base}-${n++}`;
  return s;
}

export function saveItem(coll, item, user, { status } = {}) {
  const exists = db[coll].some(x => x.id === item.id);
  const prev = db[coll].find(x => x.id === item.id);
  const id = item.id || nextId(coll);
  const next = {
    ...item,
    id,
    slug: uniqueSlug(coll, item.slug || titleOf(item), id),
    status: status || item.status || "rascunho",
    updatedAt: now(), updatedBy: user?.name,
    createdAt: item.createdAt || now(),
  };
  db[coll] = exists ? db[coll].map(x => x.id === next.id ? next : x) : [next, ...db[coll]];
  const verb = !exists ? "criou" : next.status !== prev?.status
    ? { publicado: "publicou", revisao: "enviou para revisão", rascunho: "voltou para rascunho", agendado: "agendou", arquivado: "arquivou" }[next.status]
    : "atualizou";
  log(user, verb, titleOf(next), TYPE_LABEL[coll]);
  commit();
  return next;
}

export function setStatus(coll, ids, status, user) {
  db[coll] = db[coll].map(x => ids.includes(x.id) ? { ...x, status, updatedAt: now(), updatedBy: user?.name } : x);
  log(user, `alterou status para "${STATUS[status].label}" de`, `${ids.length} ${TYPE_LABEL[coll]}(s)`, TYPE_LABEL[coll]);
  commit();
}

export function removeItems(coll, ids, user) {
  const names = db[coll].filter(x => ids.includes(x.id)).map(titleOf);
  db[coll] = db[coll].filter(x => !ids.includes(x.id));
  if (coll === "places") db.home.tips = db.home.tips.filter(t => !ids.includes(t.place));
  if (coll === "stories") db.home.storyIds = db.home.storyIds.filter(id => !ids.includes(id));
  log(user, "excluiu", names.join(", "), TYPE_LABEL[coll]);
  commit();
}

export function duplicateItem(coll, id, user) {
  const src = db[coll].find(x => x.id === id);
  const copy = { ...clone(src), id: nextId(coll), status: "rascunho", slug: "" };
  if (copy.name) copy.name += " (cópia)"; else copy.title += " (cópia)";
  return saveItem(coll, copy, user);
}

// ---------------------------------------------------------------------
// Demais coleções
// ---------------------------------------------------------------------
export function saveVibes(vibes, user) { db.vibes = vibes; log(user, "atualizou", "vibes", "vibes"); commit(); }
export function saveHome(home, user) { db.home = home; log(user, "atualizou", "home", "home"); commit(); }
// Categorias do Radar: renomear ou trocar a cor atualiza os posts; excluídas movem os posts (moves: { idExcluída: idDestino })
export function saveRadarCategories(cats, user, moves = {}) {
  const prev = db.radarCategories || [];
  const byId = Object.fromEntries(cats.map(c => [c.id, c]));
  db.stories = db.stories.map(st => {
    const old = prev.find(c => c.label === st.tag);
    if (!old) return st;
    const cat = byId[old.id] || byId[moves[old.id]];
    if (!cat || (cat.label === st.tag && cat.tone === st.tone)) return st;
    return { ...st, tag: cat.label, tone: cat.tone };
  });
  db.radarCategories = cats;
  log(user, "atualizou", "categorias do Radar", "radar"); commit();
}
export function saveMenus(menus, user) { db.menus = menus; log(user, "atualizou", "menus", "menus"); commit(); }
export function saveSettings(settings, user) { db.settings = settings; log(user, "atualizou", "configurações", "config"); commit(); }
// Cadastro rápido a partir do editor de lugar (sem duplicidade: ignora acentos e maiúsculas)
const normName = (s = "") => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
export function addCity({ name, sub }, user) {
  name = (name || "").replace(/\s+/g, " ").trim(); sub = (sub || "").trim().toUpperCase();
  if (name.length < 2) return { error: "Informe o nome da cidade." };
  if (!/^[A-Z]{2}$/.test(sub)) return { error: "Informe a sigla do estado (2 letras)." };
  const dup = db.cities.find(c => normName(c.name) === normName(name) && (c.sub || "").toUpperCase() === sub);
  if (dup) return { city: dup, existed: true };
  let id = slugify(name).slice(0, 12), n = 2;
  if (db.cities.some(c => c.id === id)) id = (slugify(name).slice(0, 9) + "-" + sub.toLowerCase());
  while (db.cities.some(c => c.id === id)) id = slugify(name).slice(0, 9) + "-" + n++;
  const city = { id, name, sub, active: false, bairros: [] };
  db.cities = [...db.cities, city];
  log(user, "cadastrou a cidade", `${name} (${sub})`, "config"); commit();
  return { city };
}
export function addBairro(cityId, name, user) {
  name = (name || "").replace(/\s+/g, " ").trim();
  const city = db.cities.find(c => c.id === cityId);
  if (!city) return { error: "Escolha a cidade antes do bairro." };
  if (name.length < 2) return { error: "Informe o nome do bairro." };
  const dup = city.bairros.find(b => normName(b) === normName(name));
  if (dup) return { bairro: dup, existed: true };
  db.cities = db.cities.map(c => c.id === cityId ? { ...c, bairros: [...c.bairros, name].sort((a, b) => a.localeCompare(b, "pt-BR")) } : c);
  log(user, "cadastrou o bairro", `${name} · ${city.name}`, "config"); commit();
  return { bairro: name };
}
export function saveCities(cities, user) { db.cities = cities; log(user, "atualizou", "cidades e bairros", "config"); commit(); }

export function moderate(ids, patch, user) {
  db.reviews = db.reviews.map(r => ids.includes(r.id) ? { ...r, ...patch } : r);
  const what = patch.status ? { aprovada: "aprovou", rejeitada: "rejeitou", pendente: "reabriu" }[patch.status] : patch.featured ? "destacou" : "removeu destaque de";
  log(user, what, `${ids.length} avaliação(ões)`, "avaliação");
  commit();
}
export function removeReviews(ids, user) { db.reviews = db.reviews.filter(r => !ids.includes(r.id)); log(user, "excluiu", `${ids.length} avaliação(ões)`, "avaliação"); commit(); }

export async function updateMembers(ids, patch, user) {
  if (REMOTE) {
    const r = await api("admin/db", { method: "PATCH", body: { memberIds: ids, patch } });
    db.members = r.members;
    log(user, patch.status === "bloqueado" ? "bloqueou" : "atualizou", `${ids.length} usuário(s)`, "usuário");
    commit();
    return;
  }
  db.members = db.members.map(m => ids.includes(m.id) ? { ...m, ...patch } : m);
  log(user, patch.status === "bloqueado" ? "bloqueou" : "atualizou", `${ids.length} usuário(s)`, "usuário");
  commit();
}

// Equipe: no modo nuvem passa pela API (senhas nunca chegam ao navegador)
export async function inviteMember(member, user) {
  if (REMOTE) {
    const r = await api("admin/team", { method: "POST", body: member });
    db.team = r.team; log(user, "convidou", member.name, "equipe"); commit();
    return { member: r.member, tempPassword: r.tempPassword };
  }
  const tempPassword = Math.random().toString(36).slice(2, 10);
  const next = { ...member, id: "t" + Date.now().toString(36), status: "ativo", password: tempPassword, lastLogin: null };
  db.team = [...db.team, next]; log(user, "convidou", next.name, "equipe"); commit();
  return { member: next, tempPassword };
}
export async function updateTeamMember(id, patch, user) {
  let tempPassword;
  if (REMOTE) { const r = await api("admin/team", { method: "PATCH", body: { id, ...patch } }); db.team = r.team; tempPassword = r.tempPassword; }
  else {
    if (patch.resetPassword) tempPassword = Math.random().toString(36).slice(2, 10);
    const { resetPassword, ...rest } = patch;
    db.team = db.team.map(t => t.id === id ? { ...t, ...rest, ...(tempPassword ? { password: tempPassword } : {}) } : t);
  }
  log(user, patch.resetPassword ? "redefiniu a senha de" : "atualizou o acesso de", db.team.find(t => t.id === id)?.name, "equipe"); commit();
  return { tempPassword };
}
export async function removeTeamMember(id, user) {
  const t = db.team.find(x => x.id === id);
  if (REMOTE) { const r = await api("admin/team?id=" + encodeURIComponent(id), { method: "DELETE" }); db.team = r.team; }
  else db.team = db.team.filter(x => x.id !== id);
  log(user, "removeu da equipe", t?.name, "equipe"); commit();
}

export function saveCampaign(c, user) {
  const exists = db.campaigns.some(x => x.id === c.id);
  const next = exists ? c : { ...c, id: "n" + (db.campaigns.length + 1) + Date.now().toString(36).slice(-3), unread: true };
  if (next.status === "enviada") { next.sentAt = now(); next.reach = 0; next.opens = 0; }
  db.campaigns = exists ? db.campaigns.map(x => x.id === next.id ? next : x) : [next, ...db.campaigns];
  log(user, next.status === "enviada" ? "enviou a notificação" : next.status === "agendada" ? "agendou a notificação" : "salvou a notificação", next.title, "notificação");
  commit();
  return next;
}
export function removeCampaign(id, user) { db.campaigns = db.campaigns.filter(c => c.id !== id); log(user, "excluiu notificação", id, "notificação"); commit(); }

// ---------------------------------------------------------------------
// Autenticação (demonstração — em produção: backend + hash de senha + 2FA)
// ---------------------------------------------------------------------
let attempts = 0, lockedUntil = 0;
export async function login(email, password, remember) {
  if (REMOTE) {
    try {
      const r = await api("auth/login", { method: "POST", body: { email, password, remember } });
      await adminLoad();
      log(r.user, "entrou no painel", "", "acesso"); commit();
      return { user: r.user };
    } catch (e) {
      if (e.status === 429) return { error: "locked", wait: e.data?.wait || 30 };
      if (e.status === 403) return { error: "inactive" };
      if (e.status === 401) return { error: "invalid", left: e.data?.left ?? 5 };
      return { error: "network", message: e.message };
    }
  }
  if (Date.now() < lockedUntil) return { error: "locked", wait: Math.ceil((lockedUntil - Date.now()) / 1000) };
  const u = db.team.find(t => t.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.password !== password) {
    attempts += 1;
    if (attempts >= 5) { lockedUntil = Date.now() + 30000; attempts = 0; return { error: "locked", wait: 30 }; }
    return { error: "invalid", left: 5 - attempts };
  }
  if (u.status !== "ativo") return { error: "inactive" };
  attempts = 0;
  db.team = db.team.map(t => t.id === u.id ? { ...t, lastLogin: now() } : t);
  log(u, "entrou no painel", "", "acesso");
  commit();
  const session = { id: u.id, at: now() };
  try { (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* */ }
  return { user: publicUser(u) };
}
export async function logout() {
  if (REMOTE) { await api("auth/logout", { method: "POST" }).catch(() => {}); adminLoaded = false; return; }
  try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch { /* */ }
}
// Sessão atual (assíncrono: no modo nuvem consulta o servidor)
export async function currentUser() {
  if (REMOTE) {
    try {
      const r = await api("auth/me");
      if (r.user && !adminLoaded) await adminLoad();
      return r.user || null;
    } catch { return null; }
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const u = db.team.find(t => t.id === JSON.parse(raw).id && t.status === "ativo");
    return u ? publicUser(u) : null;
  } catch { return null; }
}
export async function changePassword(user, current, next) {
  if (REMOTE) { await api("auth/password", { method: "POST", body: { current, next } }); return; }
  const u = db.team.find(t => t.id === user.id);
  if (u.password !== current) throw new Error("A senha atual não confere.");
  if (next.length < 8) throw new Error("A nova senha precisa de pelo menos 8 caracteres.");
  db.team = db.team.map(t => t.id === user.id ? { ...t, password: next } : t); commit();
}
const publicUser = ({ password, ...u }) => u;

// ---------------------------------------------------------------------
// Utilidades de exibição
// ---------------------------------------------------------------------
export function relTime(iso) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const fut = diff < 0, s = Math.abs(diff);
  const t = s < 60 ? "agora" : s < 3600 ? `${Math.round(s / 60)} min` : s < 86400 ? `${Math.round(s / 3600)} h` : `${Math.round(s / 86400)} d`;
  if (t === "agora") return t;
  return fut ? `em ${t}` : `há ${t}`;
}
export const fmtDate = (iso, withTime = true) => iso
  ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) })
  : "—";

// sincroniza já na carga do módulo (antes do site renderizar)
syncPublic();
