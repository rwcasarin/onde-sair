// Vibes de roteiros: não há mais "vibe principal" — a lista é ordenada.
import { AFFINITIES } from "./data.js";

// Vibes de um roteiro, na ordem (roteiros antigos tinham aff = vibe principal)
export const roteiroVibes = (r) => [...new Set([r?.aff, ...(r?.vibes || [])].filter(Boolean))];

// Bairros de um roteiro, na ordem do percurso e sem repetir: o do lugar de cada parada
// ou, em parada livre, o bairro informado nela. `findPlace` busca o lugar pelo id.
// (roteiros antigos tinham um campo "bairros" digitado: vale só enquanto houver parada livre sem bairro)
export function roteiroBairros(r, findPlace) {
  const steps = r?.steps || [];
  const own = steps.map(s => (s.place ? findPlace(s.place)?.bairro : s.bairro) || "").map(b => b.trim());
  const legacy = steps.some(s => !s.place && !(s.bairro || "").trim()) ? String(r?.bairros || "").split(/[·,]/).map(b => b.trim()) : [];
  return [...new Set([...own, ...legacy].filter(Boolean))];
}

// Vibes sugeridas pelas paradas: as dos lugares, sem repetir, da mais presente para a menos presente
// (empate: ordem em que aparecem no roteiro)
export function vibesFromPlaces(places) {
  const count = new Map();
  places.filter(Boolean).forEach(p => (p.affs || []).forEach(a => count.set(a, (count.get(a) || 0) + 1)));
  const order = [...count.keys()];
  const active = new Set(AFFINITIES.map(a => a.id));
  return order.filter(a => active.size === 0 || active.has(a)).sort((x, y) => count.get(y) - count.get(x) || order.indexOf(x) - order.indexOf(y));
}
