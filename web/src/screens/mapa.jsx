import { useState } from "react";
import { CITIES, VIBE_ORDER, placeImg } from "../data.js";
import { useCityPins } from "../pins.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, VibePill, Footer, typeOf } from "../components/site.jsx";
import { PlaceMap } from "../components/placemap.jsx";
import { useNav, useCity } from "../nav.js";

// "Guia da cidade" — mapa com a curadoria
export function Mapa({ id }) {
  const nav = useNav();
  const { id: cityId, name: city } = useCity();
  const [aff, setAff] = useState(null);
  const [active, setActive] = useState(id || null);   // pin selecionado (abre o card)

  // só os pins da cidade (nome, tipo, bairro e posição), não os lugares completos
  const pins = useCityPins(cityId);
  const inCity = pins || [];
  const list = aff ? inCity.filter(p => (p.affs || []).includes(aff)) : inCity;
  const cur = list.find(p => p.id === active);

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
          <ul className="guide-list">
            {list.map(p => (
              <li key={p.id}>
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
          </ul>

          <PlaceMap className="guide-map" typed city={CITIES.find(c => c.id === cityId)} activeId={cur?.id} onSelect={setActive}
            items={list.map(p => ({ id: p.id, place: p }))} />
        </section>
      </div>
      <Footer />
    </main>
  );
}
