import { useState } from "react";
import { ROTEIROS, roteiroImg, placeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import {
  HeroMedia, Crumbs, VibePill, Tag, MapArt, RoteiroMini, SectionHead, PageHead, FaveButton, Footer, placeById, affById,
} from "../components/site.jsx";
import { useNav, useCity, useFaves, useAccount } from "../nav.js";
import { findMyRoteiro, myRoteiros, deleteMyRoteiro } from "../account.js";
import { INVEST_LABELS } from "../../shared/myroteiros.js";
import { NotFound } from "./notfound.jsx";
import { PlaceMap } from "../components/placemap.jsx";

const STEP_COLORS = ["var(--c-magenta)", "var(--primary)", "#F58220", "var(--c-teal)", "var(--c-yellow)"];
const INVEST = ["Grátis", "$", "$$", "$$$"];

export function Roteiro({ id }) {
  const r = ROTEIROS.find(x => x.id === id);
  return r ? <RoteiroView r={r} /> : <NotFound />;
}

// Roteiro criado pelo usuário (visível só para ele)
export function MeuRoteiro({ id }) {
  const r = findMyRoteiro(id);
  return r ? <RoteiroView r={r} mine /> : <NotFound />;
}

function RoteiroView({ r, mine = false }) {
  const nav = useNav();
  const { name: city } = useCity();
  const { faves, toggle } = useFaves();
  const { ask, user } = useAccount();
  const [confirmDel, setConfirmDel] = useState(false);
  const [mapSel, setMapSel] = useState(null);
  const saved = faves.has(r.id);
  const others = ROTEIROS.filter(x => x.id !== r.id).slice(0, 5);
  const firstPlace = r.steps.find(s => s.place)?.place;
  const heroImg = mine ? (firstPlace ? placeImg(firstPlace) : undefined) : roteiroImg(r.id);
  const stepImg = (s, i) => mine ? (s.place ? placeImg(s.place) : undefined) : roteiroImg(r.id, i + 1);
  const vibes = [...new Set([r.aff, ...(r.vibes || [])].filter(Boolean))];
  const investLabel = r.stats.investLabel || INVEST_LABELS[r.stats.invest] || "";
  const vibeWords = r.stats.vibe || affById(r.aff)?.label || "";
  const copy = () => user ? nav("meuRoteiroEditar", { id: "novo", copiar: r.id }) : ask({ type: "copiar", id: r.id });
  const tips = r.tips || {};

  // posição dos pontos no mapa ilustrado: usa as coordenadas dos lugares
  const pins = r.steps.map((s, i) => {
    const pl = s.place && placeById(s.place);
    const base = pl ? pl.map : { x: 20 + i * 18, y: 50 };
    return { x: Math.min(88, Math.max(12, base.x)), y: Math.min(85, Math.max(12, base.y)), num: i + 1, color: STEP_COLORS[i % STEP_COLORS.length], title: s.title };
  });
  const mapItems = r.steps.map((s, i) => ({ id: "s" + i, place: s.place ? placeById(s.place) : null, title: s.title, num: i + 1, art: pins[i] }));

  return (
    <main className="home2">
      {/* ================= HERO ================= */}
      <section className="hero2 hero2-page hero2-roteiro">
        <HeroMedia img={heroImg} note={r.note} words={["Cultura", "Natureza", "Pessoas", "Boas saídas"]} hint={mine ? "Foto da primeira parada" : "Foto do roteiro · ~1400×800"} />
        <div className="hero2-copy">
          <Crumbs items={mine ? [["Início", "home"], ["Meus roteiros", "perfil", { tab: "meus" }], [r.title]] : [["Início", "home"], ["Roteiros", "roteiros"], [r.title]]} />
          {mine && <span className="mine-badge"><Icon name="bookmark" size={14} fill /> Meu roteiro{r.from ? ` · baseado em “${r.from.title}”` : ""}</span>}
          <h1 className={"page-title " + (r.title.length > 30 ? "page-title-sm" : "page-title-md")}>{r.title}</h1>
          <p className="hero2-lede">{r.desc}</p>

          <ul className="rot-stats">
            {r.stats.tempo && <li><Icon name="clock" size={24} /><div><span>Tempo total</span>{r.stats.tempo}</div></li>}
            <li><Icon name="coins" size={24} /><div><span>Investimento</span><b>{INVEST[r.stats.invest]}</b> {investLabel}</div></li>
            {r.stats.ideal && <li><Icon name="users" size={24} fill /><div><span>Ideal para</span>{r.stats.ideal}</div></li>}
            {vibeWords && <li><Icon name="leaf" size={24} /><div><span>Vibe principal</span>{vibeWords}</div></li>}
          </ul>

          <div className="hero2-vibes">
            {vibes.map(a => <VibePill key={a} aff={a} onClick={() => nav("lista", { aff: a })} />)}
          </div>

          <div className="place-actions">
            {mine ? <>
              <button className="btn-pill btn-lg" onClick={() => nav("meuRoteiroEditar", { id: r.id })}><Icon name="list" size={18} /> Editar roteiro</button>
              <button className="btn-outline btn-lg" onClick={() => nav("meuRoteiroEditar", { id: "novo", copiar: r.id })}><Icon name="share" size={18} /> Duplicar</button>
              {confirmDel
                ? <span className="inline-confirm">Excluir este roteiro?
                    <button className="btn-danger" onClick={async () => { await deleteMyRoteiro(r.id); nav("perfil", { tab: "meus" }); }}>Excluir</button>
                    <button className="btn-outline" onClick={() => setConfirmDel(false)}>Cancelar</button></span>
                : <button className="btn-outline btn-lg" onClick={() => setConfirmDel(true)}><Icon name="x" size={18} /> Excluir</button>}
            </> : <>
              <button className={"btn-outline btn-lg" + (saved ? " on" : "")} onClick={() => toggle(r.id)} aria-pressed={saved}><Icon name="heart" size={18} fill={saved} /> {saved ? "Salvo" : "Salvar"}</button>
              <button className="btn-pill btn-lg" onClick={copy}><Icon name="list" size={18} /> Copiar e adaptar</button>
            </>}
          </div>
        </div>
      </section>

      <div className="shell place-body">
        {/* Sobre · citação · mapa */}
        <section className="place-row row-rot-about">
          <div className="about-text">
            <h2 className="h2t">Sobre este roteiro</h2>
            <p>{r.about || r.desc || (mine ? "Escreva um texto sobre o roteiro em “Editar roteiro”." : "")}</p>
            {mine
              ? <div className="author">
                  <div className="profile-avatar author-avatar" aria-hidden="true">{(user?.name || "?").charAt(0).toUpperCase()}</div>
                  <div><span>Roteiro criado por</span><strong>Você</strong>
                    {r.from && <em>Baseado em {r.from.mine ? "outro roteiro seu" : <a href="#" onClick={(e) => { e.preventDefault(); nav("roteiro", { id: r.from.id }); }}>“{r.from.title}”</a>}</em>}</div>
                </div>
              : <div className="author">
                  <ImageSlot className="avatar-slot lg" src="images/pessoas/time-onde-sair.jpg" compact />
                  <div><span>Roteiro criado por</span><strong>Time Onde Sair</strong><em>Curadoria de experiências reais em {city}.</em></div>
                </div>}
          </div>
          {r.quote
            ? <blockquote className="big-quote big-quote-lg">
                <span className="big-quote-mark">“</span>
                <p>{r.quote}</p>
                <span className="rule" />
              </blockquote>
            : <div className="mine-summary"><strong>{r.steps.length}</strong><span>parada{r.steps.length === 1 ? "" : "s"}</span>
                <strong>{r.steps.filter(s => s.place).length}</strong><span>lugar{r.steps.filter(s => s.place).length === 1 ? "" : "es"} da curadoria</span></div>}
          <div className="rot-map-box">
            <div className="h2-head">
              <h2>Veja o roteiro no mapa</h2>
              <a href="#" className="h2-link" onClick={(e) => { e.preventDefault(); nav("mapa"); }}>Ver mapa completo <Icon name="arrow" size={16} /></a>
            </div>
            <div className="rot-map-inner">
              <PlaceMap className="rot-map" route activeId={mapSel} onSelect={setMapSel} items={mapItems} />
              <ol className="rot-map-list">
                <li className="rot-map-list-title">Neste roteiro</li>
                {r.steps.map((s, i) => (
                  <li key={i}><span className="step-num" style={{ "--pin": STEP_COLORS[i % STEP_COLORS.length] }}>{i + 1}</span>{s.title}{s.optional && " (opcional)"}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Passo a passo */}
        <section className="h2-section">
          <SectionHead title="O roteiro passo a passo" sub={mine ? "Do seu jeito. Toque em “Editar roteiro” para mudar a ordem ou as paradas." : "Uma sugestão de dia para inspirar o seu. Sinta-se livre para adaptar!"} />
          <div className="steps-grid">
            {r.steps.map((s, i) => (
              <article key={i} className="step-card">
                <ImageSlot className="step-img" src={stepImg(s, i)} alt={s.title} hint={mine && !s.place ? "Parada livre" : "16:9"}>
                  <span className="step-time"><span className="step-num" style={{ "--pin": STEP_COLORS[i % STEP_COLORS.length] }}>{i + 1}</span>{s.time}</span>
                  {s.optional && <span className="step-optional">Opcional</span>}
                  {s.place && <FaveButton id={s.place} className="fave fave-float" />}
                </ImageSlot>
                <div className="step-body">
                  <h3>{s.title}</h3>
                  <span className="step-sub">{s.sub}</span>
                  {s.tags?.length > 0 && <div className="step-tags">{s.tags.map(([l, c]) => <Tag key={l} cls={c}>{l}</Tag>)}</div>}
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
              {mine ? <>
                <h3>Quer mudar alguma coisa?</h3>
                <p>Troque a ordem, inclua paradas dos seus favoritos ou anote dicas para quem vai junto.</p>
                <button className="btn-white" onClick={() => nav("meuRoteiroEditar", { id: r.id })}><Icon name="list" size={16} /> Editar roteiro</button>
              </> : <>
                <h3>Gostou deste roteiro?</h3>
                <p>Salve na sua conta ou faça uma cópia para adaptar do seu jeito.</p>
                <div className="row gap-12 wrap">
                  <button className={"btn-white" + (saved ? " on" : "")} onClick={() => toggle(r.id)} aria-pressed={saved}>
                    <Icon name="heart" size={16} fill={saved} /> {saved ? "Roteiro salvo" : "Salvar roteiro"}
                  </button>
                  <button className="btn-white" onClick={copy}><Icon name="list" size={16} /> Copiar e adaptar</button>
                </div>
              </>}
            </div>
            <svg className="save-geo" viewBox="0 0 100 120" aria-hidden="true">
              <polygon points="30,0 100,0 100,50" fill="var(--c-magenta)" />
              <path d="M100,50 A50,50 0 0 0 50,100 L100,100 Z" fill="var(--c-teal)" />
              <path d="M0,120 A60,60 0 0 1 60,60 L100,60 L100,120 Z" fill="var(--c-yellow)" opacity=".95" />
            </svg>
          </div>
          {tips.dica && (
            <div className="team-tip">
              <h3><Icon name="bulb" size={22} /> {mine ? "Minhas anotações" : "Dica do time"}</h3>
              <p>{tips.dica}</p>
            </div>
          )}
          {(tips.horario || tips.epoca || tips.comoChegar) && (
            <ul className="rot-facts">
              {tips.horario && <li><Icon name="sun" size={24} /><div><span>Melhor horário</span>{tips.horario}</div></li>}
              {tips.epoca && <li><Icon name="calendar" size={24} /><div><span>Melhor época</span>{tips.epoca}</div></li>}
              {tips.comoChegar && <li><Icon name="shoe" size={24} /><div><span>Como chegar</span>{tips.comoChegar}</div></li>}
            </ul>
          )}
          {tips.lembrete && (
            <div className="dont-forget">
              <div>
                <h3><Icon name="camera" size={22} /> Não esqueça</h3>
                <p>{tips.lembrete}</p>
              </div>
              {!mine && <ImageSlot className="dont-forget-img" src={roteiroImg(r.id, "lembrete")} compact />}
            </div>
          )}
        </section>

        {/* Continue explorando */}
        <section className="h2-section">
          {mine && myRoteiros().length > 1 && (
            <>
              <SectionHead title="Seus outros roteiros" link="Ver todos" onLink={() => nav("perfil", { tab: "meus" })} />
              <div className="my-rot-grid">{myRoteiros().filter(x => x.id !== r.id).slice(0, 3).map(x => <MyRoteiroCard key={x.id} r={x} />)}</div>
            </>
          )}
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

// Card de um roteiro meu (perfil e página do roteiro)
export function MyRoteiroCard({ r, actions }) {
  const nav = useNav();
  const places = r.steps.filter(s => s.place);
  const thumb = places[0]?.place;
  return (
    <article className="my-rot-card" onClick={() => nav("meuRoteiro", { id: r.id })}>
      <ImageSlot className="my-rot-img" src={thumb ? placeImg(thumb) : undefined} hint={thumb ? "16:10" : "Sem foto"} compact />
      <div className="my-rot-body">
        {r.aff && <VibePill aff={r.aff} size="sm" />}
        <h3>{r.title || "Sem nome"}</h3>
        <p className="my-rot-meta">{r.steps.length} parada{r.steps.length === 1 ? "" : "s"}{r.stats.tempo ? " · " + r.stats.tempo : ""}</p>
        <p className="my-rot-stops">{r.steps.map(s => s.title).filter(Boolean).join(" → ") || "Sem paradas ainda"}</p>
        {r.from && <span className="my-rot-from">Baseado em “{r.from.title}”</span>}
        {actions && <div className="my-rot-actions" onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </div>
    </article>
  );
}
