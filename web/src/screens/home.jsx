import { useState } from "react";
import { PAGES,
  PLACES, VIBE_ORDER, HERO, TIPS_TODAY, STORIES,
  VIBE_ROTEIROS, VIBE_TO_ROTEIRO, BRAND_VALUES,
} from "../data.js";
import { OSLogo } from "../components/brand.jsx";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { HeroMedia, VibePill, SectionHead, MiniPlaceCard, GeoCard, Footer } from "../components/site.jsx";
import { href, storyPath } from "../router.js";
import { useNav, useCity } from "../nav.js";
import { CitySelect } from "../components/cityselect.jsx";

export function Home() {
  const nav = useNav();
  const { id: cityId, name, set: setCity } = useCity();
  const [q, setQ] = useState("");

  return (
    <main className="home2">
      {/* ================= HERO ================= */}
      <section className="hero2">
        <HeroMedia img={HERO.img} note={HERO.note} words={HERO.geoWords} hint="Foto principal · ~1400×800, pessoas em clima de rolê" />

        <div className="hero2-copy">
          <h1>{(HERO.title || "Qual é\na vibe hoje?").split("\n").map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</h1>
          <p className="hero2-lede">{HERO.lede}</p>

          <form className="hero2-search" onSubmit={(e) => { e.preventDefault(); nav("lista", { q }); }}>
            <Icon name="search" size={22} />
            <input
              type="text" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Busque por lugares, bairros, experiências…" aria-label="Buscar"
            />
            <CitySelect value={cityId} onChange={setCity} className="hero2-search-city" align="right" label="Trocar cidade da busca">
              <Icon name="pin" size={18} /> {name} <Icon name="chevron" size={14} />
            </CitySelect>
            <button type="submit" className="btn-pill">Buscar</button>
          </form>

          <div className="hero2-vibes" id="vibes">
            {VIBE_ORDER.map(id => (
              <VibePill key={id} aff={id} onClick={() => nav("lista", { aff: id })} />
            ))}
          </div>
        </div>
      </section>

      <div className="shell">
        {/* ================= DICAS PARA HOJE ================= */}
        <section className="h2-section">
          <SectionHead
            title={`Dicas para hoje em ${name}`}
            sub="Lugares reais, experiências incríveis. Selecionados por quem vive a cidade."
            link="Ver todos" onLink={() => nav("lista")}
          />
          <div className="tips-grid">
            {TIPS_TODAY.map(({ place }) => (
              <MiniPlaceCard key={place} p={PLACES.find(x => x.id === place)} />
            ))}
          </div>
        </section>

        {/* ================= RADAR (blog) ================= */}
        <section className="h2-section" id="radar">
          <SectionHead
            title="Radar"
            sub="Novidades, listas e achados da cidade — o que está no radar de quem vive ela."
            link="Ver todos os posts"
            to="/radar"
          />
          <div className="stories-grid">
            {STORIES.map(s => (
              <article key={s.id} className="story-card" onClick={() => nav("historia", { id: s.id })} style={{ cursor: "pointer" }}>
                <ImageSlot className="story-img" src={s.img} alt="" hint="3:4">
                  <span className={"story-shape shape-" + s.shape} aria-hidden="true"></span>
                </ImageSlot>
                <div className="story-body">
                  <span className={"story-tag tone-" + s.tone}>{s.tag}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <a href={href(storyPath(s))} className="h2-link" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav("historia", { id: s.id }); }}>Ler mais <Icon name="arrow" size={16} /></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ================= ROTEIROS POR VIBE ================= */}
        <section className="h2-section" id="roteiros">
          <SectionHead
            title="Roteiros por vibe"
            sub="Curadorias prontas para te levar mais longe."
            link="Ver todos os roteiros" onLink={() => nav("roteiros")}
          />
          <div className="vibes-grid">
            {VIBE_ROTEIROS.map(v => (
              <article key={v.id} className={"vibe-card " + v.cls} onClick={() => nav("roteiro", { id: VIBE_TO_ROTEIRO[v.id] })}>
                <div className="vibe-card-copy">
                  <Icon name={v.icon} size={30} />
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                  <span className="vibe-card-go"><Icon name="arrow" size={16} /></span>
                </div>
                <ImageSlot className="vibe-card-img" src={v.img} alt="" hint="3:4" />
              </article>
            ))}
            <GeoCard />
          </div>
        </section>

        {/* ================= FAIXA DA MARCA ================= */}
        <section className="brand-strip" id="parceiros">
          <div className="brand-strip-logo"><OSLogo /></div>
          <p className="brand-strip-motto">Lugares reais.<br />Pessoas reais.<br />Dicas de verdade.</p>
          <ul className="brand-strip-values">
            {BRAND_VALUES.map(v => (
              <li key={v.text}><Icon name={v.icon} size={26} fill={v.icon !== "users"} /><span>{v.text}</span></li>
            ))}
          </ul>
          <div className="brand-strip-cta">
            {PAGES.some(pg => pg.id === "pg-parceiros") && <button className="btn-pill" onClick={() => nav("pagina", { id: "pg-parceiros" })}>Seja um parceiro</button>}
            <p>Vamos juntos por<br />uma cidade mais viva.</p>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
