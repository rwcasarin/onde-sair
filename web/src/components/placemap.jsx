// Mapa padrão do site (lugar, Guia da cidade, lista, roteiros e prévias do painel).
// Google Maps com pins da marca; sem chave ou sem coordenadas, cai no mapa ilustrado.
// Clique num pin → card do lugar, sempre no mesmo canto do mapa (padrão do Guia da cidade).
import { useEffect, useRef, useState } from "react";
import { placeImg } from "../data.js";
import { SITE } from "../admin/store.js";
import { loadGoogle, knownCoords, geocodePlace, cityArea, radiusArea, MAP_STYLE } from "../maps.js";
import { Icon } from "./icons.jsx";
import { ImageSlot } from "./image-slot.jsx";
import { MapArt, Rating, FaveButton } from "./site.jsx";
import { useNav } from "../nav.js";

const ASTERISK = '<svg viewBox="0 0 398.34 398.97" aria-hidden="true"><polygon fill="currentColor" points="398.34 221.13 398.29 175.29 228.4 186.22 358.1 72.65 325.35 40.16 210.85 171.11 222.71 0 176.23 .05 187.15 170.21 73.33 40.75 40.89 72.87 170.75 186.63 0 175.14 .23 221.3 171.38 209.75 40.3 324.3 72.95 356.87 187.73 225.39 176.07 398.97 222.75 398.9 211.36 226.95 325.73 356.56 358.06 323.92 227.39 209.64 398.34 221.13"/></svg>';
const STEP_COLORS = ["#EE2A6E", "#3B2A7C", "#F58220", "#20C4B4", "#FFD02E"];

// Card do lugar (o mesmo em todos os mapas)
export function MapCard({ place, isMain, onClose }) {
  const nav = useNav();
  const dest = place.geo ? `${place.geo.lat},${place.geo.lng}` : encodeURIComponent(`${place.name}, ${place.end || place.bairro || ""}`);
  return (
    <div className="map-pop" role="dialog" aria-label={place.name}>
      <ImageSlot className="map-pop-img" src={placeImg(place.id)} compact />
      <div>
        <h3>{place.name}</h3>
        <span className="listing-sub">{place.sub} • {place.bairro}</span>
        <Rating p={place} />
      </div>
      <FaveButton id={place.id} />
      {isMain
        ? <a className="btn-pill" href={`https://www.google.com/maps/dir/?api=1&destination=${dest}`} target="_blank" rel="noreferrer">Como chegar <Icon name="arrow" size={14} /></a>
        : <button className="btn-pill" onClick={() => nav("detalhe", { id: place.id })}>Ver lugar <Icon name="arrow" size={14} /></button>}
      {onClose && <button className="map-pop-close" aria-label="Fechar" onClick={onClose}><Icon name="x" size={16} /></button>}
    </div>
  );
}

/**
 * items: [{ id, place?, title?, num?, art? }] — place traz geo/endereço; num = pin numerado (roteiro);
 *        art = posição {x,y} no mapa ilustrado para paradas sem lugar
 * mainId: pin principal (maior, sempre em destaque). activeId/onSelect: pin selecionado (abre o card).
 * frame: enquadramento padrão — com mainId, raio de `radiusKm` em volta do pin principal (página do lugar);
 *        com `city`, a área da cidade (Guia da cidade); sem nenhum dos dois, todos os pins (lista, roteiros).
 * route: liga os pins na ordem. card: mostra o card ao selecionar. onPick: clique no mapa devolve {lat,lng} (painel).
 */
export function PlaceMap({ items, mainId = null, activeId = null, onSelect, route = false, card = true, onPick, className = "", fallbackLabel = true, radiusKm = 2, city = null }) {
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
  const key = SITE.mapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [mode, setMode] = useState(key ? "loading" : "art");     // loading | google | art
  const [coords, setCoords] = useState({});
  const [area, setArea] = useState(null);   // área da cidade (Guia)
  const el = useRef(null), gref = useRef(null), mapRef = useRef(null), pins = useRef(new Map()), line = useRef(null), fitted = useRef("");
  const sig = items.map(i => i.id + (i.place ? ":" + (i.place.geo ? i.place.geo.lat + "," + i.place.geo.lng : i.place.end) : "")).join("|");

  // carrega o Google e resolve as coordenadas (cadastro → cache → endereço)
  useEffect(() => {
    if (!key) { setMode("art"); return; }
    let alive = true;
    const known = {};
    items.forEach(i => { const c = knownCoords(i.place); if (c) known[i.id] = c; });
    setCoords(known);
    loadGoogle(key).then(async (g) => {
      if (!alive) return;
      if (!g.Map || !g.OverlayView) { setMode("art"); return; }
      gref.current = g; setMode("google");
      if (city) cityArea(g, city).then(a => alive && setArea(a));
      for (const i of items) {
        if (!i.place || known[i.id]) continue;
        const c = await geocodePlace(g, i.place);
        if (!alive) return;
        if (c) setCoords(prev => ({ ...prev, [i.id]: c }));
      }
    }).catch(() => alive && setMode("art"));
    const fail = () => alive && setMode("art");
    window.addEventListener("os-maps-auth-failure", fail);
    return () => { alive = false; window.removeEventListener("os-maps-auth-failure", fail); };
  }, [key, sig, city?.id]); // eslint-disable-line

  // cria o mapa uma vez
  useEffect(() => {
    if (mode !== "google" || !el.current || mapRef.current) return;
    const g = gref.current;
    mapRef.current = new g.Map(el.current, {
      center: { lat: -23.5, lng: -47.46 }, zoom: 13, styles: MAP_STYLE,
      disableDefaultUI: true, zoomControl: true, fullscreenControl: true, clickableIcons: false, gestureHandling: "cooperative",
    });
    if (onPick) mapRef.current.addListener("click", (e) => onPick({ lat: +e.latLng.lat().toFixed(6), lng: +e.latLng.lng().toFixed(6) }));
  }, [mode]); // eslint-disable-line

  // pins, trajeto e enquadramento
  useEffect(() => {
    const g = gref.current, map = mapRef.current;
    if (mode !== "google" || !g || !map) return;
    const Pin = pinClass(g);
    const seen = new Set();
    items.forEach((i, idx) => {
      const pos = coords[i.id]; if (!pos) return;
      seen.add(i.id);
      let pin = pins.current.get(i.id);
      if (!pin) {
        const node = document.createElement("button");
        node.type = "button";
        node.addEventListener("click", (e) => { e.stopPropagation(); onSelectRef.current?.(i.id); });
        g.OverlayView.preventMapHitsAndGesturesFrom(node);
        pin = new Pin(pos, node); pin.setMap(map); pins.current.set(i.id, pin);
      } else pin.setPosition(pos);
      const kind = i.num ? "step" : i.id === mainId ? "main" : "other";
      const on = i.id === activeId;
      pin.node.className = `gpin gpin-${kind}${on ? " on" : ""}${onSelectRef.current ? "" : " static"}`;
      pin.node.setAttribute("aria-label", (i.num ? i.num + ". " : "") + (i.title || i.place?.name || ""));
      pin.node.title = i.title || i.place?.name || "";
      pin.node.style.setProperty("--pin", i.num ? STEP_COLORS[(i.num - 1) % STEP_COLORS.length] : "");
      pin.node.style.zIndex = kind === "main" ? 30 : on ? 20 : 10 - (idx % 5);
      pin.node.innerHTML = `<span class="gpin-head">${i.num ? `<b>${i.num}</b>` : ASTERISK}</span>`;
    });
    [...pins.current.keys()].forEach(id => { if (!seen.has(id)) { pins.current.get(id).setMap(null); pins.current.delete(id); } });

    // trajeto do roteiro
    line.current?.setMap(null); line.current = null;
    if (route) {
      const path = items.map(i => coords[i.id]).filter(Boolean);
      if (path.length > 1) line.current = new g.Polyline({ map, path, strokeOpacity: 0, icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: .9, strokeColor: "#3B2A7C", scale: 2.5 }, offset: "0", repeat: "12px" }] });
    }

    // enquadramento padrão (não muda a cada seleção)
    const main = mainId && coords[mainId];
    const pts = items.map(i => coords[i.id]).filter(Boolean);
    const box = main ? radiusArea(main, radiusKm) : city ? area : null;
    const fitSig = box ? JSON.stringify(box) : pts.map(p => p.lat + "," + p.lng).join(";");
    // no painel (onPick) só enquadra a primeira vez, para o clique de ajuste não mexer no zoom
    if ((box || pts.length) && fitSig !== fitted.current && !(onPick && fitted.current)) {
      fitted.current = fitSig;
      const b = new g.LatLngBounds();
      if (box) { b.extend({ lat: box.s, lng: box.w }); b.extend({ lat: box.n, lng: box.e }); map.fitBounds(b, 0); }
      else if (pts.length === 1) { map.setCenter(pts[0]); map.setZoom(15); }
      else {
        pts.forEach(p => b.extend(p));
        map.fitBounds(b, 56);
        g.event.addListenerOnce(map, "idle", () => { if (map.getZoom() > 16) map.setZoom(16); });
      }
    }
  }, [mode, coords, activeId, mainId, route, sig, area, radiusKm]); // eslint-disable-line

  // ao escolher um pin pela lista, traz o pin para a vista
  useEffect(() => {
    const map = mapRef.current, pos = activeId && coords[activeId];
    if (map && pos && !map.getBounds()?.contains(pos)) map.panTo(pos);
  }, [activeId]); // eslint-disable-line

  const active = items.find(i => i.id === activeId && i.place);
  const cardNode = card && active ? <MapCard place={active.place} isMain={active.id === mainId} onClose={onSelect ? () => onSelect(null) : null} /> : null;
  const anyCoords = Object.keys(coords).length > 0;

  if (mode === "art") {
    // mapa ilustrado: mesmos pins e mesmo card
    const artPins = items.filter(i => i.art || i.place?.map).map(i => ({
      x: (i.art || i.place.map).x, y: (i.art || i.place.map).y, num: i.num, title: i.title || i.place?.name,
      label: fallbackLabel && i.id === mainId ? i.place?.name : undefined,
      active: i.id === activeId || i.id === mainId,
      color: i.num ? STEP_COLORS[(i.num - 1) % STEP_COLORS.length] : i.id === mainId || i.id === activeId ? "var(--c-magenta)" : "#B9B2D3",
      onClick: onSelect ? () => onSelect(i.id) : undefined,
    }));
    return <MapArt className={className} pins={artPins} route={route}>{cardNode}</MapArt>;
  }
  return (
    <div className={"gmap " + className}>
      <div className="gmap-canvas" ref={el} />
      {mode === "loading" || (mode === "google" && !anyCoords && items.some(i => i.place))
        ? <div className="gmap-loading" aria-live="polite"><span />Carregando mapa…</div> : null}
      {cardNode}
    </div>
  );
}

// Pin em HTML posicionado no mapa (sem precisar de Map ID)
const pinCache = new WeakMap();
function pinClass(g) {
  if (pinCache.has(g)) return pinCache.get(g);
  class Pin extends g.OverlayView {
    constructor(pos, node) { super(); this.pos = pos; this.node = node; }
    onAdd() { this.getPanes().overlayMouseTarget.appendChild(this.node); }
    draw() {
      const p = this.getProjection()?.fromLatLngToDivPixel(new g.LatLng(this.pos.lat, this.pos.lng));
      if (p) { this.node.style.left = p.x + "px"; this.node.style.top = p.y + "px"; }
    }
    onRemove() { this.node.remove(); }
    setPosition(pos) { this.pos = pos; this.draw(); }
  }
  pinCache.set(g, Pin);
  return Pin;
}
