import { useState } from "react";
import { PLACES, VIBE_ORDER, placeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, VibePill, MapArt, Rating, PriceDots, FaveButton, Footer } from "../components/site.jsx";
import { useNav, useCity } from "../nav.js";

// "Guia da cidade" — mapa com a curadoria
export function Mapa({ id }) {
  const nav = useNav();
  const { name: city } = useCity();
  const [aff, setAff] = useState(null);
  const [active, setActive] = useState(id || PLACES[0].id);

  const list = aff ? PLACES.filter(p => p.affs.includes(aff)) : PLACES;
  const cur = list.find(p => p.id === active) || list[0];

  return (
    <main className="home2">
      <div className="shell">
        <PageHead
          crumbs={[["Início", "home"], ["Guia da cidade"]]}
          title="Guia da cidade"
          lede={`${list.length} lugares que passaram pelo crivo em ${city}. Escolha uma vibe e explore pelo mapa.`}
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
                  <PriceDots level={p.priceLevel} />
                </button>
              </li>
            ))}
          </ul>

          <MapArt
            className="guide-map"
            pins={list.map(p => ({ x: p.map.x, y: p.map.y, title: p.name, active: cur?.id === p.id, color: cur?.id === p.id ? "var(--c-magenta)" : undefined, onClick: () => setActive(p.id) }))}
          >
            {cur && (
              <div className="map-pop">
                <ImageSlot className="map-pop-img" src={placeImg(cur.id)} compact />
                <div>
                  <h3>{cur.name}</h3>
                  <span className="listing-sub">{cur.sub} • {cur.bairro}</span>
                  <Rating p={cur} />
                </div>
                <FaveButton id={cur.id} />
                <button className="btn-pill" onClick={() => nav("detalhe", { id: cur.id })}>Ver lugar <Icon name="arrow" size={14} /></button>
              </div>
            )}
          </MapArt>
        </section>
      </div>
      <Footer />
    </main>
  );
}
