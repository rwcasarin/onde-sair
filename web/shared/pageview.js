// Conteúdo por página: o site pede só o que a tela do endereço precisa (GET /api/content?view=/caminho).
// Recebe o recorte público (publicView) e devolve um pedaço dele com o mesmo formato.
// Toda resposta traz listas (places, roteiros, stories, events), mesmo vazias, e `complete` (as que vieram
// inteiras). Com `shell`,
// também o que todas as telas usam (configurações, menus, cidades, vibes, páginas, notificações).

import { upcoming } from "../src/events.js";

const slugify = (s = "") => s.toString().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
// mesma regra do router do site: slug salvo, slug do nome/título ou id
const matches = (x, s) => (x.slug || slugify(x.name || x.title || x.label || "")) === s;
const bySlug = (list, s) => list.find(x => matches(x, s)) || list.find(x => x.id === s);

const SHELL_KEYS = ["settings", "menus", "home", "cities", "vibes", "types", "eventCategories", "radarCategories", "pages", "campaigns", "updates"];

// lugares citados num roteiro, post ou evento
const roteiroPlaces = (r) => (r.steps || []).map(s => s.place).filter(Boolean);
const storyPlaces = (s) => [...String(s.body || "").matchAll(/data-place="([\w-]+)"/g)].map(m => m[1]).concat(s.places || []);
const eventPlaces = (e) => (e.venue ? [e.venue] : []);

// "Confira também" do detalhe (mesma regra de src/screens/detalhe.jsx): mesma cidade, mais vibes em comum, mesmo tipo desempata
function similarTo(places, p) {
  return places.filter(x => x.id !== p.id && x.city === p.city)
    .map(x => ({ x, score: (x.affs || []).filter(a => (p.affs || []).includes(a)).length + (x.type === p.type ? 0.5 : 0) }))
    .sort((m, n) => n.score - m.score).slice(0, 2).map(m => m.x);
}
// roteiros que passam pelo lugar ou são da cidade dele (a cidade do roteiro é a da 1ª parada publicada)
function cityRoteiros(pv, p) {
  const byId = new Map(pv.places.map(x => [x.id, x]));
  return pv.roteiros.filter(r => roteiroPlaces(r).includes(p.id) || byId.get(roteiroPlaces(r).find(id => byId.has(id)))?.city === p.city);
}

// Listas que a tela usa por inteiro: com elas já completas na memória, o site abre a tela sem pedir nada
export function viewCovers(path) {
  const [a, b] = String(path || "/").split("?")[0].split("/").filter(Boolean);
  switch (a) {
    case undefined: case "perfil": case "favoritos": return ["places", "roteiros", "stories", "events"];
    case "lugares": return b ? ["places", "roteiros"] : [];
    case "guia": return b ? ["places"] : [];          // /guia/{lugar}: o endereço precisa achar o lugar
    case "roteiros": return b ? ["roteiros", "places"] : [];
    case "radar": case "historias": return b ? ["stories", "places"] : [];
    case "eventos": return b ? ["events", "places"] : [];
    default: return [];                              // listas (pedem a própria página), Guia, busca e páginas: só o básico
  }
}

// Quais conjuntos a tela do caminho usa
function need(pv, path) {
  const [a, b] = String(path || "/").split("?")[0].split("/").filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch { return s; } });
  const all = { places: true, roteiros: true, stories: true, events: true };
  switch (a) {
    case undefined: {                               // home: dicas do dia, posts em destaque e agenda
      const home = pv.home || {};
      // agenda: os próximos 6 de cada cidade (a home mostra os da cidade escolhida)
      const cities = [...new Set((pv.events || []).map(e => e.city))];
      const eventIds = cities.flatMap(c => upcoming((pv.events || []).filter(e => e.city === c)).slice(0, 6).map(e => e.id));
      return { placeIds: (home.tips || []).map(t => t.place), storyIds: home.storyIds || [], roteiroIds: (home.vibeRoteiros || []).map(v => v.roteiro), eventIds };
    }
    case "lugares": {
      if (!b) return {};                            // a lista pede a própria página (src/listings.js)
      const p = bySlug(pv.places, b);
      if (!p) return {};
      // detalhe: o lugar, os 2 do "Confira também" e os roteiros da cidade (os pins do mapa vêm quando ele aparece)
      return { placeIds: [p.id, ...similarTo(pv.places, p).map(x => x.id)], roteiroIds: cityRoteiros(pv, p).map(r => r.id) };
    }
    case "guia": { const p = b && bySlug(pv.places, b); return p ? { placeIds: [p.id] } : {}; }
    // listas, Guia e busca pedem os próprios dados; os detalhes usam os vizinhos ("mais roteiros/posts/eventos")
    case "roteiros": return b ? { roteiros: true } : {};
    case "radar": case "historias": return b ? { stories: true } : {};
    case "eventos": return b ? { events: true } : {};
    case "perfil": case "favoritos": return all;     // área da conta (favoritos, roteiros, eventos)
    default: return {};                              // páginas, login, cidade, notificações: só o básico
  }
}

// have: listas que o site já tem inteiras (não precisam vir de novo)
export function pageView(pv, path, { shell = true, have = [] } = {}) {
  const n = need(pv, path);
  const places = new Set(n.placeIds || []);
  const roteiroIds = new Set(n.roteiroIds || []);
  const roteiros = n.roteiros ? pv.roteiros : pv.roteiros.filter(r => roteiroIds.has(r.id) || (n.roteiroWith && roteiroPlaces(r).includes(n.roteiroWith)));
  const storyIds = new Set(n.storyIds || []);
  const stories = n.stories ? pv.stories : pv.stories.filter(s => storyIds.has(s.id));
  const eventIds = new Set(n.eventIds || []);
  const events = n.events ? (pv.events || []) : (pv.events || []).filter(e => eventIds.has(e.id));
  // lugares citados no que vai junto (para nomes, fotos e cidade)
  roteiros.forEach(r => roteiroPlaces(r).forEach(id => places.add(id)));
  stories.forEach(s => storyPlaces(s).forEach(id => places.add(id)));
  events.forEach(e => eventPlaces(e).forEach(id => places.add(id)));
  const out = {
    places: n.places ? pv.places : pv.places.filter(p => places.has(p.id)),
    roteiros, stories, events,
    // listas que foram inteiras
    complete: [n.places && "places", n.roteiros && "roteiros", n.stories && "stories", n.events && "events"].filter(Boolean),
  };
  for (const k of have) if (out[k]) { out[k] = []; out.complete = out.complete.filter(c => c !== k); }
  if (shell) {
    for (const k of SHELL_KEYS) if (pv[k] !== undefined) out[k] = pv[k];
    // quantos lugares cada vibe tem (o site não recebe todos os lugares para contar)
    out.vibeCounts = Object.fromEntries((pv.vibes || []).map(v => [v.id, pv.places.filter(p => (p.affs || []).includes(v.id)).length]));
  }
  return out;
}
