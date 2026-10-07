import { ROTEIROS, roteiroImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import {
  HeroMedia, Crumbs, VibePill, Tag, MapArt, RoteiroMini, SectionHead, PageHead, FaveButton, Footer, placeById,
} from "../components/site.jsx";
import { useNav, useCity, useFaves } from "../nav.js";

const STEP_COLORS = ["var(--c-magenta)", "var(--primary)", "#F58220", "var(--c-teal)", "var(--c-yellow)"];
const INVEST = ["Grátis", "$", "$$", "$$$"];

export function Roteiro({ id }) {
  const nav = useNav();
  const { name: city } = useCity();
  const { faves, toggle } = useFaves();
  const r = ROTEIROS.find(x => x.id === id) || ROTEIROS[0];
  const saved = faves.has(r.id);
  const others = ROTEIROS.filter(x => x.id !== r.id).slice(0, 5);

  // posição dos pontos no mapa ilustrado: usa as coordenadas dos lugares
  const pins = r.steps.map((s, i) => {
    const pl = s.place && placeById(s.place);
    const base = pl ? pl.map : { x: 20 + i * 18, y: 50 };
    return { x: Math.min(88, Math.max(12, base.x)), y: Math.min(85, Math.max(12, base.y)), num: i + 1, color: STEP_COLORS[i], title: s.title };
  });

  return (
    <main className="home2">
      {/* ================= HERO ================= */}
      <section className="hero2 hero2-page hero2-roteiro">
        <HeroMedia img={roteiroImg(r.id)} note={r.note} words={["Cultura", "Natureza", "Pessoas", "Boas saídas"]} hint="Foto do roteiro · ~1400×800" />
        <div className="hero2-copy">
          <Crumbs items={[["Início", "home"], ["Roteiros", "roteiros"], [r.title]]} />
          <h1 className={"page-title " + (r.title.length > 30 ? "page-title-sm" : "page-title-md")}>{r.title}</h1>
          <p className="hero2-lede">{r.desc}</p>

          <ul className="rot-stats">
            <li><Icon name="clock" size={24} /><div><span>Tempo total</span>{r.stats.tempo}</div></li>
            <li><Icon name="coins" size={24} /><div><span>Investimento</span><b>{INVEST[r.stats.invest]}</b> {r.stats.investLabel}</div></li>
            <li><Icon name="users" size={24} fill /><div><span>Ideal para</span>{r.stats.ideal}</div></li>
            <li><Icon name="leaf" size={24} /><div><span>Vibe principal</span>{r.stats.vibe}</div></li>
          </ul>

          <div className="hero2-vibes">
            {r.vibes.map(a => <VibePill key={a} aff={a} onClick={() => nav("lista", { aff: a })} />)}
          </div>
        </div>
      </section>

      <div className="shell place-body">
        {/* Sobre · citação · mapa */}
        <section className="place-row row-rot-about">
          <div className="about-text">
            <h2 className="h2t">Sobre este roteiro</h2>
            <p>{r.about}</p>
            <div className="author">
              <ImageSlot className="avatar-slot lg" src="images/pessoas/time-onde-sair.jpg" compact />
              <div><span>Roteiro criado por</span><strong>Time Onde Sair</strong><em>Curadoria de experiências reais em {city}.</em></div>
            </div>
          </div>
          <blockquote className="big-quote big-quote-lg">
            <span className="big-quote-mark">“</span>
            <p>{r.quote}</p>
            <span className="rule" />
          </blockquote>
          <div className="rot-map-box">
            <div className="h2-head">
              <h2>Veja o roteiro no mapa</h2>
              <a href="#" className="h2-link" onClick={(e) => { e.preventDefault(); nav("mapa"); }}>Ver mapa completo <Icon name="arrow" size={16} /></a>
            </div>
            <div className="rot-map-inner">
              <MapArt className="rot-map" pins={pins} route />
              <ol className="rot-map-list">
                <li className="rot-map-list-title">Neste roteiro</li>
                {r.steps.map((s, i) => (
                  <li key={i}><span className="step-num" style={{ "--pin": STEP_COLORS[i] }}>{i + 1}</span>{s.title}{s.optional && " (opcional)"}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Passo a passo */}
        <section className="h2-section">
          <SectionHead title="O roteiro passo a passo" sub="Uma sugestão de dia para inspirar o seu. Sinta-se livre para adaptar!" />
          <div className="steps-grid">
            {r.steps.map((s, i) => (
              <article key={i} className="step-card">
                <ImageSlot className="step-img" src={roteiroImg(r.id, i + 1)} alt={s.title} hint="16:9">
                  <span className="step-time"><span className="step-num" style={{ "--pin": STEP_COLORS[i] }}>{i + 1}</span>{s.time}</span>
                  {s.optional && <span className="step-optional">Opcional</span>}
                  {s.place && <FaveButton id={s.place} className="fave fave-float" />}
                </ImageSlot>
                <div className="step-body">
                  <h3>{s.title}</h3>
                  <span className="step-sub">{s.sub}</span>
                  <div className="step-tags">{s.tags.map(([l, c]) => <Tag key={l} cls={c}>{l}</Tag>)}</div>
                  <p>{s.desc}</p>
                  {s.place
                    ? <a href="#" className="h2-link" onClick={(e) => { e.preventDefault(); nav("detalhe", { id: s.place }); }}>Ver mais <Icon name="arrow" size={16} /></a>
                    : <span className="step-free">Parada livre</span>}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Faixa de dicas */}
        <section className="rot-extras">
          <div className="save-card">
            <Icon name="bookmark" size={30} fill />
            <div>
              <h3>Gostou deste roteiro?</h3>
              <p>Salve na sua conta e tenha sempre à mão quando quiser viver essa experiência.</p>
              <button className={"btn-white" + (saved ? " on" : "")} onClick={() => toggle(r.id)} aria-pressed={saved}>
                <Icon name="heart" size={16} fill={saved} /> {saved ? "Roteiro salvo" : "Salvar roteiro"}
              </button>
            </div>
            <svg className="save-geo" viewBox="0 0 100 120" aria-hidden="true">
              <polygon points="30,0 100,0 100,50" fill="var(--c-magenta)" />
              <path d="M100,50 A50,50 0 0 0 50,100 L100,100 Z" fill="var(--c-teal)" />
              <path d="M0,120 A60,60 0 0 1 60,60 L100,60 L100,120 Z" fill="var(--c-yellow)" opacity=".95" />
            </svg>
          </div>
          <div className="team-tip">
            <h3><Icon name="bulb" size={22} /> Dica do time</h3>
            <p>{r.tips.dica}</p>
          </div>
          <ul className="rot-facts">
            <li><Icon name="sun" size={24} /><div><span>Melhor horário</span>{r.tips.horario}</div></li>
            <li><Icon name="calendar" size={24} /><div><span>Melhor época</span>{r.tips.epoca}</div></li>
            <li><Icon name="shoe" size={24} /><div><span>Como chegar</span>{r.tips.comoChegar}</div></li>
          </ul>
          <div className="dont-forget">
            <div>
              <h3><Icon name="camera" size={22} /> Não esqueça</h3>
              <p>{r.tips.lembrete}</p>
            </div>
            <ImageSlot className="dont-forget-img" src={roteiroImg(r.id, "lembrete")} compact />
          </div>
        </section>

        {/* Continue explorando */}
        <section className="h2-section">
          <SectionHead
            title="Continue explorando"
            sub={`Mais roteiros para viver ${city} por outras perspectivas.`}
            link="Ver todos os roteiros" onLink={() => nav("roteiros")}
          />
          <div className="rot-mini-grid">
            {others.map(o => <RoteiroMini key={o.id} r={o} />)}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

// Índice de roteiros (menu "Roteiros")
export function Roteiros() {
  const nav = useNav();
  const { name: city } = useCity();
  return (
    <main className="home2">
      <div className="shell">
        <PageHead
          crumbs={[["Início", "home"], ["Roteiros"]]}
          title="Roteiros"
          lede={`Curadorias prontas para viver ${city} do seu jeito. Cada roteiro tem propósito, ordem e dicas de quem já foi.`}
        />
        <div className="rot-index">
          {ROTEIROS.map(r => (
            <article key={r.id} className="rot-index-card" onClick={() => nav("roteiro", { id: r.id })}>
              <ImageSlot className="rot-index-img" src={roteiroImg(r.id)} alt="" hint="16:10">
                <FaveButton id={r.id} className="fave fave-float" />
              </ImageSlot>
              <div className="rot-index-body">
                <VibePill aff={r.aff} size="sm" />
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
                <ul className="rot-index-meta">
                  <li><Icon name="clock" size={14} /> {r.stats.tempo}</li>
                  <li><Icon name="pin" size={14} /> {r.paradas} paradas</li>
                  <li><Icon name="coins" size={14} /> {r.stats.investLabel}</li>
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
