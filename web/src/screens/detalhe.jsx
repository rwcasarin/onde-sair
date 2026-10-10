import { useState } from "react";
import { CITIES, PLACES, ROTEIROS, TYPES, VIBE_STYLE, placeImg, placeGallery, roteiroImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import {
  HeroMedia, Crumbs, VibePill, PriceDots, Tag, MapArt, MiniPlaceCard, RoteiroCard, FaveButton, Footer, affById,
} from "../components/site.jsx";
import { useNav, useCity, useFaves, useAccount } from "../nav.js";
import { AddToRoteiro } from "../components/addtoroteiro.jsx";
import { SITE } from "../admin/store.js";
import { PlaceMap } from "../components/placemap.jsx";
import { instaProfile } from "../insta.js";
import { roteiroVibes } from "../vibes.js";

// "Rua X, 123 · Bairro · Cidade - UF" sem repetir o que já está no endereço
const plain = (s = "") => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function fullAddress(p) {
  const c = CITIES.find(x => x.id === p.city);
  const parts = [p.end];
  if (p.bairro && !plain(p.end).includes(plain(p.bairro))) parts.push(p.bairro);
  if (c && !plain(p.end).includes(plain(c.name))) parts.push(c.name + (c.sub ? " - " + c.sub : ""));
  return parts.filter(Boolean).join(" · ");
}
const directions = (p) => p.geo
  ? `https://www.google.com/maps/dir/?api=1&destination=${p.geo.lat},${p.geo.lng}${p.placeId ? "&destination_place_id=" + p.placeId : ""}`
  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(p))}`;
// O lugar no Google Maps (busca pelo nome + endereço; com placeId abre a ficha exata)
const googleMapsUrl = (p) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name}, ${fullAddress(p).replaceAll(" · ", ", ")}`)}${p.placeId ? "&query_place_id=" + p.placeId : ""}`;

const TABS = [["visao", "Visão geral"], ["porque", "Por que ir"], ["fotos", "Fotos"], ["chegar", "Onde fica"], ["confira", "Confira também"]];

// WhatsApp do lugar (campo próprio no painel): número com DDD, celular ou fixo (WhatsApp Business)
export function whatsappLink(phone = "") {
  let d = String(phone).replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  return /^\d{10,11}$/.test(d) ? `https://wa.me/55${d}` : null;
}

export function Detalhe({ id }) {
  const nav = useNav();
  const { name: city } = useCity();
  const { faves, toggle } = useFaves();
  const { paused } = useAccount();
  const p = PLACES.find(x => x.id === id) || PLACES[0];
  // seção de fotos pode ser escondida no admin
  const showFotos = p.showGallery !== false;
  const tabs = TABS.filter(([t]) => t !== "fotos" || showFotos);
  const [tab, setTab] = useState("visao");
  const [shift, setShift] = useState(0);
  const [shared, setShared] = useState(false);
  const [mapSel, setMapSel] = useState(null);       // pin selecionado no mapa "Onde fica"
  const saved = faves.has(p.id);
  const insta = instaProfile(p.insta);
  const whats = whatsappLink(p.whatsapp);

  const gallery = placeGallery(p.id);
  const shown = gallery.map((_, i) => gallery[(i + shift) % gallery.length]);

  const similar = PLACES
    .filter(x => x.id !== p.id)
    .map(x => ({ x, score: x.affs.filter(a => p.affs.includes(a)).length + (x.type === p.type ? 0.5 : 0) }))
    .sort((m, n) => n.score - m.score)
    .slice(0, 2).map(s => s.x);

  const rots = SITE.roteirosHidden ? [] : ROTEIROS
    .map(r => ({ r, score: (r.steps.some(st => st.place === p.id) ? 10 : 0) + roteiroVibes(r).filter(a => p.affs.includes(a)).length }))
    .sort((m, n) => n.score - m.score)
    .slice(0, 2).map(s => s.r);

  function goTab(id) {
    setTab(id);
    document.getElementById("sec-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: p.tagline });
      else await navigator.clipboard?.writeText(`${p.name} — ${p.tagline}`);
      setShared(true); setTimeout(() => setShared(false), 1800);
    } catch { /* cancelado */ }
  }

  return (
    <main className="home2">
      {/* ================= HERO ================= */}
      <section className="hero2 hero2-page hero2-place">
        <HeroMedia img={placeImg(p.id)} note={p.note} shape="diagonal" hint="Foto do lugar · ~1400×800" />
        <div className="hero2-copy">
          <Crumbs items={[["Início", "home"], ["Lugares", "lista"], [p.bairro, "lista", { q: p.bairro }], [p.name]]} />
          {/* vibes (pequenas) → nome → descrição → informações → ações */}
          <div className="place-vibes place-vibes-sm">
            {p.affs.map(a => <VibePill key={a} aff={a} size="sm" />)}
          </div>
          <h1 className="page-title">{p.name}</h1>
          <p className="hero2-lede">{p.tagline}</p>

          <ul className="place-meta">
            <li><Icon name="pin" size={18} fill /> {p.bairro}</li>
            <li><PriceDots level={p.priceLevel} /></li>
            <li><Icon name="utensils" size={18} /> {p.cuisine}</li>
          </ul>

          {/* ações: 1ª linha — chegar e falar com o lugar; 2ª linha — ações do visitante (só ícone, texto no hover) */}
          <div className="place-actions">
            <div className="act-row act-main">
              <button className="act-cta" onClick={() => goTab("chegar")}><Icon name="send" size={18} /> Como chegar</button>
              {insta && <a className="act-btn act-round act-insta" href={insta} target="_blank" rel="noreferrer" aria-label={"Instagram " + p.insta} title={"Instagram " + p.insta}><Icon name="instagram" size={19} /></a>}
              {whats && <a className="act-btn act-round act-whats" href={whats} target="_blank" rel="noreferrer" aria-label="Conversar no WhatsApp" title="WhatsApp"><Icon name="whatsapp" size={19} /></a>}
            </div>
            <div className="act-row act-sub">
              {!paused && <button className={"act-btn act-sm" + (saved ? " on" : "")} onClick={() => toggle(p.id)} aria-pressed={saved} aria-label={saved ? "Salvo" : "Salvar"}>
                <Icon name="heart" size={17} fill={saved} /><span className="act-label">{saved ? "Salvo" : "Salvar"}</span>
              </button>}
              <AddToRoteiro place={p} className="act-btn act-sm" iconSize={17} compact />
              <button className={"act-btn act-sm" + (shared ? " show" : "")} onClick={share} aria-label="Compartilhar"><Icon name="share" size={17} /><span className="act-label">{shared ? "Copiado!" : "Compartilhar"}</span></button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ABAS ================= */}
      <nav className="page-tabs" aria-label="Seções">
        <div className="shell">
          {tabs.map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => goTab(id)}>{label}</button>
          ))}
        </div>
      </nav>

      <div className="shell place-body">
        {/* 1 · Sobre o lugar (60%) + depoimento da equipe (30%) */}
        <section className="place-row split-60-30" id="sec-visao">
          <div className="about-text">
            <h2 className="h2t">Sobre o lugar</h2>
            <p>{p.desc}</p>
            <p>
              É o tipo de lugar que faz você querer ficar mais um pouco: a gente indica
              pra {p.affs.map(a => affById(a).label.toLowerCase().replace(/^(para|pra) /, "")).join(", ")}.
            </p>
            {p.tags?.length > 0 && (
              <ul className="place-tags" aria-label="Tags">
                {p.tags.map(t => <li key={t}>{t}</li>)}
              </ul>
            )}
          </div>
          <blockquote className="big-quote">
            <span className="big-quote-mark">“</span>
            <p>{p.dica}</p>
            <footer>Equipe Onde Sair</footer>
          </blockquote>
        </section>

        {/* 2 · Por que ir? (horizontal) */}
        <section className="place-row" id="sec-porque">
          <div className="why-box why-row">
            <h2 className="h2t">Por que ir?</h2>
            <ul>
              {p.reasons.map(([icon, text]) => (
                <li key={text}><span className="why-icon"><Icon name={icon} size={18} fill={icon === "star" || icon === "heart"} /></span>{text}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3 · Fotos do lugar */}
        {showFotos && <section className="place-row" id="sec-fotos">
          <div>
            <div className="h2-head">
              <h2>Fotos do lugar</h2>
              <a href="#" className="h2-link" onClick={(e) => e.preventDefault()}>Ver todas as fotos <Icon name="arrow" size={16} /></a>
            </div>
            <div className="gallery gallery-wide">
              {shown.map((src, i) => (
                <ImageSlot key={src} className="gallery-img" src={src} alt={`${p.name} — foto ${i + 1}`} hint="3:4">
                  {i === 0 && (
                    <div className="gallery-nav">
                      <button aria-label="Foto anterior" onClick={() => setShift((shift + gallery.length - 1) % gallery.length)}><Icon name="left" size={16} /></button>
                      <button aria-label="Próxima foto" onClick={() => setShift((shift + 1) % gallery.length)}><Icon name="right" size={16} /></button>
                    </div>
                  )}
                </ImageSlot>
              ))}
            </div>
          </div>
        </section>}

        {/* 4 · Onde fica (70%) + Informações úteis (30%) */}
        <section className="place-row split-70-30" id="sec-chegar">
          <div className="where-box">
            <div className="h2-head">
              <h2>Onde fica</h2>
              <a href={googleMapsUrl(p)} className="h2-link" target="_blank" rel="noreferrer">Ver no Google Maps <Icon name="arrow" size={16} /></a>
            </div>
            <PlaceMap className="where-map where-map-lg" mainId={p.id} activeId={mapSel} onSelect={setMapSel}
              items={[{ id: p.id, place: p }, ...PLACES.filter(x => x.id !== p.id && x.city === p.city).map(x => ({ id: x.id, place: x }))]} />
            <p className="where-address"><Icon name="pin" size={16} /> {fullAddress(p)}
              <a className="where-route" href={directions(p)} target="_blank" rel="noreferrer">Como chegar <Icon name="arrow" size={14} /></a></p>
          </div>
          <div className="info-box">
            <h2 className="h2t">Informações úteis</h2>
            <dl>
              <div><Icon name="clock" size={20} /><dt>Funcionamento</dt><dd>{p.open}</dd></div>
              <div><Icon name="dollar" size={20} /><dt>Faixa de preço</dt><dd><PriceDots level={p.priceLevel} /></dd></div>
              <div><Icon name="pin" size={20} /><dt>Endereço</dt><dd>{fullAddress(p)}{p.cep && <><br />CEP {p.cep}</>}</dd></div>
              <div><Icon name="phone" size={20} /><dt>Contato</dt><dd>{p.phone}</dd></div>
              <div><Icon name="link" size={20} /><dt>Site</dt><dd><a href="#" onClick={(e) => e.preventDefault()}>{p.site}</a></dd></div>
              <div><Icon name="instagram" size={20} /><dt>Instagram</dt><dd>{instaProfile(p.insta) ? <a href={instaProfile(p.insta)} target="_blank" rel="noreferrer">{p.insta}</a> : p.insta}</dd></div>
            </dl>
          </div>
        </section>

        {/* 5 · Confira também — 2 lugares + 2 roteiros */}
        <section className="place-row" id="sec-confira">
          <div>
            <div className="h2-head">
              <h2>Confira também</h2>
              <p>{rots.length ? "Lugares e roteiros" : "Lugares"} com a mesma vibe em {city}.</p>
              <a href="#" className="h2-link" onClick={(e) => { e.preventDefault(); nav("lista", { tipo: TYPES.find(t => t.label === p.type)?.slug }); }}>Ver mais <Icon name="arrow" size={16} /></a>
            </div>
            <div className="related-grid">
              {similar.map(x => (
                <div key={x.id} className="related-item">
                  <MiniPlaceCard p={x} />
                </div>
              ))}
              {rots.map(r => (
                <div key={r.id} className="related-item">
                  <RoteiroCard r={r} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

