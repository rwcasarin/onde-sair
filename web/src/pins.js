// Pins do mapa (Guia da cidade e mapa do detalhe do lugar): só o que o mapa e o card dele mostram,
// pedidos ao servidor quando o mapa vai aparecer (GET /api/content?pins=cidade). Com o banco todo
// na memória (modo local, painel), usa os lugares que já estão aqui.
import { useEffect, useState } from "react";
import { PLACES } from "./data.js";
import { REMOTE, isPartial } from "./admin/store.js";
import { syncClock } from "./clock.js";

const cache = new Map();             // cidade → pins (até recarregar a página)
const localPins = (city) => PLACES.filter(p => p.city === city);

// null enquanto carrega
export function useCityPins(city, enabled = true) {
  const local = !REMOTE || !isPartial();
  const [pins, setPins] = useState(() => !city ? [] : local ? localPins(city) : cache.get(city) || null);
  useEffect(() => {
    if (!enabled || !city) return;
    if (local) { setPins(localPins(city)); return; }
    if (cache.has(city)) { setPins(cache.get(city)); return; }
    setPins(null);
    let alive = true;
    const t0 = Date.now();
    fetch(`/api/content?pins=${encodeURIComponent(city)}`, { headers: { accept: "application/json" } })
      .then(r => { syncClock(r, t0); return r.json(); }).then(d => { cache.set(city, d.pins || []); if (alive) setPins(d.pins || []); })
      .catch(() => { if (alive) setPins([]); });
    return () => { alive = false; };
  }, [city, enabled, local]);
  return pins;
}

// o elemento chegou perto da tela? (uma vez só)
export function useNearScreen(ref, margin = "400px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near]); // eslint-disable-line react-hooks/exhaustive-deps
  return near;
}
