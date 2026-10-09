// Vibes de roteiros: não há mais "vibe principal" — a lista é ordenada.
import { AFFINITIES } from "./data.js";

// Vibes de um roteiro, na ordem (roteiros antigos tinham aff = vibe principal)
export const roteiroVibes = (r) => [...new Set([r?.aff, ...(r?.vibes || [])].filter(Boolean))];

// Vibes sugeridas pelas paradas: as dos lugares, sem repetir, da mais presente para a menos presente
// (empate: ordem em que aparecem no roteiro)
export function vibesFromPlaces(places) {
  const count = new Map();
  places.filter(Boolean).forEach(p => (p.affs || []).forEach(a => count.set(a, (count.get(a) || 0) + 1)));
  const order = [...count.keys()];
  const active = new Set(AFFINITIES.map(a => a.id));
  return order.filter(a => active.size === 0 || active.has(a)).sort((x, y) => count.get(y) - count.get(x) || order.indexOf(x) - order.indexOf(y));
}
