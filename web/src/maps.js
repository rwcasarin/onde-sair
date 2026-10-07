// Google Maps no site e no painel: carregamento único, coordenadas dos lugares e distância.
import { CITIES } from "./data.js";

let loading = null;
// Carrega o Maps JavaScript API uma vez (a chave vem de Configurações › Integrações)
// Com loading=async as classes vêm de importLibrary: garante mapa, núcleo e geocodificação.
const withLibs = (g) => Promise.all(["core", "maps", "geocoding"].map(l => g.importLibrary(l).catch(() => null))).then(() => g);
export function loadGoogle(key) {
  if (window.google?.maps?.importLibrary) return withLibs(window.google.maps);
  if (!key) return Promise.reject(new Error("sem-chave"));
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      window.__osMapsReady = () => resolve(withLibs(window.google.maps));
      window.gm_authFailure = () => { loading = null; reject(new Error("chave-recusada")); window.dispatchEvent(new Event("os-maps-auth-failure")); };
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&language=pt-BR&region=BR&callback=__osMapsReady`;
      s.async = true;
      s.onerror = () => { loading = null; reject(new Error("falha-ao-carregar")); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

// ---------- coordenadas ----------
const CACHE_KEY = "os-geo-v1";
let cache = null;
const readCache = () => { if (!cache) { try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { cache = {}; } } return cache; };
const writeCache = () => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* sem storage */ } };

export function addressOf(p) {
  const c = CITIES.find(x => x.id === p.city);
  const street = (p.end || "").split(" · ")[0];
  return [street, p.bairro, c ? `${c.name} - ${c.sub || ""}` : "", p.cep, "Brasil"].filter(Boolean).join(", ");
}
const cacheKey = (p) => p.id + "|" + addressOf(p);

// Coordenadas já conhecidas (cadastro ou cache), sem chamar o Google
export function knownCoords(p) {
  if (!p) return null;
  if (p.geo && Number.isFinite(p.geo.lat) && Number.isFinite(p.geo.lng)) return p.geo;
  const c = readCache()[cacheKey(p)];
  return c && c !== "x" ? c : null;
}

// Busca pelo endereço (Geocoding). Uma fila por vez, resultado guardado no navegador.
let queue = Promise.resolve();
let geocodeOff = false;
export function geocodePlace(g, p) {
  const known = knownCoords(p);
  if (known) return Promise.resolve(known);
  const key = cacheKey(p);
  if (readCache()[key] === "x" || geocodeOff || !p.end) return Promise.resolve(null);
  queue = queue.then(() => new Promise((resolve) => {
    new g.Geocoder().geocode({ address: addressOf(p), region: "br" }, (res, status) => {
      if (status === "OK" && res?.[0]) {
        const l = res[0].geometry.location;
        cache[key] = { lat: +l.lat().toFixed(6), lng: +l.lng().toFixed(6) };
      } else if (status === "ZERO_RESULTS") cache[key] = "x";
      else if (status === "REQUEST_DENIED") geocodeOff = true;   // Geocoding API não liberada para a chave
      writeCache();
      resolve(cache[key] && cache[key] !== "x" ? cache[key] : null);
    });
  }));
  return queue;
}

// Centro da cidade (Geocoding), guardado no navegador: { lat, lng }
export function cityCenter(g, city) {
  if (!city) return Promise.resolve(null);
  const key = "center|" + city.id + "|" + city.name;
  const c = readCache()[key];
  if (c) return Promise.resolve(c === "x" ? null : c);
  if (geocodeOff) return Promise.resolve(null);
  queue = queue.then(() => new Promise((resolve) => {
    new g.Geocoder().geocode({ address: [city.name, city.sub, "Brasil"].filter(Boolean).join(", "), region: "br" }, (res, status) => {
      const l = status === "OK" && res?.[0]?.geometry?.location;
      if (l) cache[key] = { lat: +l.lat().toFixed(6), lng: +l.lng().toFixed(6) };
      else if (status === "ZERO_RESULTS") cache[key] = "x";
      else if (status === "REQUEST_DENIED") geocodeOff = true;
      writeCache();
      resolve(cache[key] && cache[key] !== "x" ? cache[key] : null);
    });
  }));
  return queue;
}

// Retângulo que contém um raio de `km` em volta de um ponto
export function radiusArea(c, km) {
  const dLat = km / 111.32, dLng = km / (111.32 * Math.cos(c.lat * Math.PI / 180));
  return { n: c.lat + dLat, s: c.lat - dLat, e: c.lng + dLng, w: c.lng - dLng };
}

// Distância em km entre duas coordenadas
export function distanceKm(a, b) {
  const r = (d) => d * Math.PI / 180, R = 6371;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Estilo do mapa alinhado à marca (tons claros, sem poluição de pontos comerciais)
export const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#F3F0E8" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5B5480" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F7F4EC" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#D3ECDC" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#E9E3F5" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#C9E3F0" }] },
];
