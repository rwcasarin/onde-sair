// Conteúdo por página: o site pede só o que a tela do endereço precisa (GET /api/content?view=/caminho).
// Recebe o recorte público (publicView) e devolve um pedaço dele com o mesmo formato.
// Toda resposta traz listas (places, roteiros, stories, events), mesmo vazias, e `complete` (as que vieram
// inteiras); o detalhe de um lugar traz também `pins` (os outros da cidade, só para o mapa). Com `shell`,
// também o que todas as telas usam (configurações, menus, cidades, vibes, páginas, notificações).

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
// pin do mapa: só o que o mapa e o card dele mostram
const PIN = ["id", "slug", "name", "sub", "type", "city", "bairro", "end", "cep", "geo", "map", "affs"];
const pin = (p) => Object.fromEntries(PIN.filter(k => p[k] !== undefined).map(k => [k, p[k]]));

// Listas que a tela usa por inteiro: com elas já completas na memória, o site abre a tela sem pedir nada
export function viewCovers(path) {
  const [a, b] = String(path || "/").split("?")[0].split("/").filter(Boolean);
  switch (a) {
    case undefined: case "busca": case "perfil": case "favoritos": return ["places", "roteiros", "stories", "events"];
    case "lugares": return b ? ["places", "roteiros"] : ["places"];
    case "vibes": return ["places", "roteiros"];
    case "guia": return ["places"];
    case "roteiros": return ["roteiros", "places"];
    case "radar": case "historias": return ["stories", "places"];
    case "eventos": return ["events", "places"];
    default: return [];                              // só o básico
  }
}

// Quais conjuntos a tela do caminho usa
function need(pv, path) {
  const [a, b] = String(path || "/").split("?")[0].split("/").filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch { return s; } });
  const all = { places: true, roteiros: true, stories: true, events: true };
  switch (a) {
    case undefined: {                               // home: dicas do dia, posts em destaque e agenda
      const home = pv.home || {};
      return { placeIds: (home.tips || []).map(t => t.place), storyIds: home.storyIds || [], roteiroIds: (home.vibeRoteiros || []).map(v => v.roteiro), events: true };
    }
    case "lugares": {
      if (!b) return { places: true };
      const p = bySlug(pv.places, b);
      if (!p) return {};
      // detalhe: o lugar, os 2 do "Confira também", os roteiros da cidade e os outros da cidade só como pins do mapa
      return { placeIds: [p.id, ...similarTo(pv.places, p).map(x => x.id)], roteiroIds: cityRoteiros(pv, p).map(r => r.id), pinsCity: p.city, pinsBut: p.id };
    }
    case "vibes": return { places: true, roteiros: true };
    case "guia": return { places: true };
    case "roteiros": return { roteiros: true };
    case "radar": case "historias": return { stories: true };
    case "eventos": return { events: true };
    case "busca": case "perfil": case "favoritos": return all;   // busca em tudo; área da conta (favoritos, roteiros, eventos)
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
  const events = n.events ? (pv.events || []) : [];
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
  if (n.pinsCity && !have.includes("places")) out.pins = pv.places.filter(p => p.city === n.pinsCity && p.id !== n.pinsBut && !places.has(p.id)).map(pin);
  for (const k of have) if (out[k]) { out[k] = []; out.complete = out.complete.filter(c => c !== k); }
  if (shell) {
    for (const k of SHELL_KEYS) if (pv[k] !== undefined) out[k] = pv[k];
    // quantos lugares cada vibe tem (o site não recebe todos os lugares para contar)
    out.vibeCounts = Object.fromEntries((pv.vibes || []).map(v => [v.id, pv.places.filter(p => (p.affs || []).includes(v.id)).length]));
  }
  return out;
}
