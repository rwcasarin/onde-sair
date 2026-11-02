import { useEffect, useMemo, useRef, useState } from "react";
import { CITIES, VIBE_ORDER, placeImg } from "../data.js";
import { useCityPins } from "../pins.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, VibePill, Footer, typeOf } from "../components/site.jsx";
import { PlaceMap } from "../components/placemap.jsx";
import { useNav, useCity } from "../nav.js";

const PAGE = 20;

// "Guia da cidade" — mapa com a curadoria
export function Mapa({ id }) {
  const nav = useNav();
  const { id: cityId, name: city } = useCity();
  const [aff, setAff] = useState(null);
  const [active, setActive] = useState(id || null);   // pin selecionado (abre o card)
  const [type, setType] = useState("");                // filtro por tipo (topo da lista)
  const [shown, setShown] = useState(PAGE);            // a lista mostra de 20 em 20 (rolagem infinita)
  const listRef = useRef(null), endRef = useRef(null);

  // só os pins da cidade (nome, tipo, bairro e posição), não os lugares completos
  const pins = useCityPins(cityId);
  const inCity = pins || [];
  const byAff = aff ? inCity.filter(p => (p.affs || []).includes(aff)) : inCity;
  // tipos que existem na cidade (com a vibe escolhida), com quantos lugares cada um tem
  const types = useMemo(() => {
    const n = new Map();
    byAff.forEach(p => p.type && n.set(p.type, (n.get(p.type) || 0) + 1));
    return [...n].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [byAff]);
  const list = type ? byAff.filter(p => p.type === type) : byAff;
  const cur = list.find(p => p.id === active);

  // filtro mudou: volta para os primeiros 20 e para o topo da lista
  useEffect(() => { setShown(PAGE); listRef.current?.scrollTo?.({ top: 0 }); }, [aff, type, cityId]);
  // tipo escolhido que sumiu com a troca de vibe ou cidade: limpa o filtro
  useEffect(() => { if (type && pins && !types.some(([t]) => t === type)) setType(""); }, [types, type, pins]);
  // chegou perto do fim da lista: mostra mais 20
  useEffect(() => {
    const end = endRef.current, root = listRef.current;
    if (!end || !root || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => { if (es.some(x => x.isIntersecting)) setShown(n => n + PAGE); }, { root, rootMargin: "200px" });
    io.observe(end);
    return () => io.disconnect();
  }, [shown, list.length]);
  // lugar escolhido no mapa que ainda não apareceu na lista: mostra até ele e rola a lista até ele
  const pending = useRef(null);
  useEffect(() => {
    if (!cur) return;
    pending.current = cur.id;
    const i = list.indexOf(cur);
    if (i >= shown) setShown(Math.ceil((i + 1) / PAGE) * PAGE);
  }, [cur?.id]); // eslint-disable-line
  useEffect(() => {
    const id = pending.current, box = listRef.current;
    const el = id && box?.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!el) return;
    pending.current = null;
    const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (r.top < b.top || r.bottom > b.bottom) box.scrollTo({ top: box.scrollTop + r.top - b.top - 8, behavior: "smooth" });
  }, [cur?.id, shown]);

  return (
    <main className="home2">
      <div className="shell">
        <PageHead
          crumbs={[["Início", "home"], ["Guia da cidade"]]}
          title="Guia da cidade"
          lede={pins ? `${list.length} lugares que passaram pelo crivo em ${city}. Escolha uma vibe e explore pelo mapa.` : `Carregando os lugares de ${city}…`}
        >
          <div className="hero2-vibes">
            {VIBE_ORDER.map(a => <VibePill key={a} aff={a} active={aff === a} onClick={() => setAff(aff === a ? null : a)} />)}
          </div>
        </PageHead>

        <section className="guide">
          <div className="guide-side">
          <div className="guide-filter">
            <label className="guide-select">
              <span className="sr-only">Filtrar por tipo</span>
              {type && typeOf({ type }) && <span className={"guide-type " + typeOf({ type }).cls} aria-hidden="true"><Icon name={typeOf({ type }).icon} size={13} /></span>}
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Todos os tipos ({byAff.length})</option>
                {types.map(([t, n]) => <option key={t} value={t}>{t} ({n})</option>)}
              </select>
              <Icon name="chevron" size={16} />
            </label>
          </div>
          <ul className="guide-list" ref={listRef}>
            {list.slice(0, shown).map(p => (
              <li key={p.id} data-id={p.id}>
                <button className={"guide-item" + (cur?.id === p.id ? " on" : "")} onClick={() => setActive(p.id)} onDoubleClick={() => nav("detalhe", { id: p.id })}>
                  <ImageSlot className="guide-thumb" src={placeImg(p.id)} compact />
                  <span className="guide-item-text">
                    <strong>{p.name}</strong>
                    <span>{p.sub} • {p.bairro}</span>
                  </span>
                  {/* tipo do lugar: mesmo ícone do pino no mapa, à direita */}
                  {typeOf(p) && <span className={"guide-type " + typeOf(p).cls} title={p.type} aria-label={p.type}><Icon name={typeOf(p).icon} size={15} /></span>}
                </button>
              </li>
            ))}
            {shown < list.length && <li ref={endRef} className="guide-more" aria-hidden="true">Carregando mais lugares…</li>}
            {pins && !list.length && <li className="guide-empty">Nenhum lugar com esse filtro.</li>}
          </ul>
          </div>

          {/* com um lugar escolhido, o mapa mostra só o pino dele e o botão "Mostrar todos" */}
          <div className="guide-map-wrap">
            <PlaceMap className={"guide-map" + (cur ? " is-focus" : "")} typed city={CITIES.find(c => c.id === cityId)} activeId={cur?.id} onSelect={setActive}
              items={list.map(p => ({ id: p.id, place: p }))} />
            {cur && <button type="button" className="guide-showall" onClick={() => setActive(null)}><Icon name="map" size={16} /> Mostrar todos</button>}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
