import { useState } from "react";
import { ROTEIROS, roteiroImg, placeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import {
  HeroMedia, Crumbs, VibePill, Tag, MapArt, RoteiroCard, SectionHead, PageHead, FaveButton, Footer, placeById, TypePill,
} from "../components/site.jsx";
import { roteiroVibes } from "../vibes.js";
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
  const [tab, setTab] = useState("visao");
  const [shared, setShared] = useState(false);
  const saved = faves.has(r.id);
  const others = ROTEIROS.filter(x => x.id !== r.id).slice(0, 5);
  const firstPlace = r.steps.find(s => s.place)?.place;
  const heroImg = mine ? (firstPlace ? placeImg(firstPlace) : undefined) : roteiroImg(r.id);
  // a foto da parada é a do lugar vinculado; parada livre fica sem foto
  const stepImg = (s) => s.place ? placeImg(s.place) : undefined;
  const vibes = roteiroVibes(r);
  const investLabel = r.stats.investLabel || INVEST_LABELS[r.stats.invest] || "";
  const copy = () => user ? nav("meuRoteiroEditar", { id: "novo", copiar: r.id }) : ask({ type: "copiar", id: r.id });
  const tips = r.tips || {};

  // posição dos pontos no mapa ilustrado: usa as coordenadas dos lugares
  const pins = r.steps.map((s, i) => {
    const pl = s.place && placeById(s.place);
    const base = pl ? pl.map : { x: 20 + i * 18, y: 50 };
    return { x: Math.min(88, Math.max(12, base.x)), y: Math.min(85, Math.max(12, base.y)), num: i + 1, color: STEP_COLORS[i % STEP_COLORS.length], title: s.title };
  });
  const mapItems = r.steps.map((s, i) => ({ id: "s" + i, place: s.place ? placeById(s.place) : null, title: s.title, num: i + 1, art: pins[i] }));

  const tags = (r.tags || []).map(t => Array.isArray(t) ? t[0] : t).filter(Boolean);
  const hasTips = tips.dica || tips.horario || tips.epoca || tips.comoChegar || tips.lembrete;
  const TABS = [["visao", "Visão geral"], ["paradas", "Paradas"], ["mapa", "Mapa"], ...(hasTips ? [["dicas", "Dicas"]] : []), ["confira", "Confira também"]];
  function goTab(t) { setTab(t); document.getElementById("sec-" + t)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: r.title, text: r.desc });
      else await navigator.clipboard?.writeText(`${r.title} — ${location.href}`);
      setShared(true); setTimeout(() => setShared(false), 1800);
    } catch { /* cancelado */ }
  }

  return (
    <main className="home2">
      {/* ================= HERO (mesma estrutura da página do lugar) ================= */}
      <section className="hero2 hero2-page hero2-place hero2-roteiro">
        <HeroMedia img={heroImg} note={r.note} words={["Cultura", "Natureza", "Pessoas", "Boas saídas"]} hint={mine ? "Foto da primeira parada" : "Foto do roteiro · ~1400×800"} />
        <div className="hero2-copy">
          <Crumbs items={mine ? [["Início", "home"], ["Meus roteiros", "perfil", { tab: "meus" }], [r.title]] : [["Início", "home"], ["Roteiros", "roteiros"], [r.title]]} />
          <div className="place-vibes place-vibes-sm">
            {mine && <span className="mine-badge"><Icon name="bookmark" size={13} fill /> Meu roteiro{r.from ? ` · baseado em “${r.from.title}”` : ""}</span>}
            {vibes.map(a => <VibePill key={a} aff={a} size="sm" onClick={() => nav("lista", { aff: a })} />)}
          </div>
          <h1 className={"page-title " + (r.title.length > 30 ? "page-title-sm" : "page-title-md")}>{r.title}</h1>
          <p className="hero2-lede">{r.desc}</p>

          <ul className="place-meta">
            {r.stats.tempo && <li><Icon name="clock" size={18} /> {r.stats.tempo}</li>}
            <li><Icon name="pin" size={18} fill /> {r.steps.length} parada{r.steps.length === 1 ? "" : "s"}</li>
            <li><Icon name="coins" size={18} /> {INVEST[r.stats.invest]}{investLabel ? " · " + investLabel : ""}</li>
            {r.stats.ideal && <li><Icon name="users" size={18} fill /> {r.stats.ideal}</li>}
          </ul>

          {/* ações: 1ª linha — ação principal; 2ª linha — ações do visitante (só ícone, texto no hover) */}
          <div className="place-actions">
            {mine ? <>
              <div className="act-row act-main">
                <button className="act-cta" onClick={() => nav("meuRoteiroEditar", { id: r.id })}><Icon name="list" size={18} /> Editar roteiro</button>
              </div>
              <div className="act-row act-sub">
                <button className="act-btn act-sm" onClick={() => nav("meuRoteiroEditar", { id: "novo", copiar: r.id })} aria-label="Duplicar"><Icon name="copy" size={17} /><span className="act-label">Duplicar</span></button>
                <button className={"act-btn act-sm" + (shared ? " show" : "")} onClick={share} aria-label="Compartilhar"><Icon name="share" size={17} /><span className="act-label">{shared ? "Copiado!" : "Compartilhar"}</span></button>
                {confirmDel
                  ? <span className="inline-confirm">Excluir este roteiro?
                      <button className="btn-danger" onClick={async () => { await deleteMyRoteiro(r.id); nav("perfil", { tab: "meus" }); }}>Excluir</button>
                      <button className="btn-outline" onClick={() => setConfirmDel(false)}>Cancelar</button></span>
                  : <button className="act-btn act-sm" onClick={() => setConfirmDel(true)} aria-label="Excluir"><Icon name="x" size={17} /><span className="act-label">Excluir</span></button>}
              </div>
            </> : (
              // favoritar, copiar e adaptar, compartilhar: mesmo estilo (só ícone, texto no hover)
              <div className="act-row act-sub">
                <button className={"act-btn act-sm" + (saved ? " on" : "")} onClick={() => toggle(r.id)} aria-pressed={saved} aria-label={saved ? "Salvo" : "Salvar"}>
                  <Icon name="heart" size={17} fill={saved} /><span className="act-label">{saved ? "Salvo" : "Salvar"}</span>
                </button>
                <button className="act-btn act-sm" onClick={copy} aria-label="Copiar e adaptar"><Icon name="copy" size={17} /><span className="act-label">Copiar e adaptar</span></button>
                <button className={"act-btn act-sm" + (shared ? " show" : "")} onClick={share} aria-label="Compartilhar"><Icon name="share" size={17} /><span className="act-label">{shared ? "Copiado!" : "Compartilhar"}</span></button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= ABAS ================= */}
      <nav className="page-tabs" aria-label="Seções">
        <div className="shell">
          {TABS.map(([t, label]) => <button key={t} className={tab === t ? "on" : ""} onClick={() => goTab(t)}>{label}</button>)}
        </div>
      </nav>

      <div className="shell place-body">
        {/* 1 · Sobre este roteiro (60%) + citação (30%) */}
        <section className="place-row split-60-30" id="sec-visao">
          <div className="about-text">
            <h2 className="h2t">Sobre este roteiro</h2>
            <p>{r.about || r.desc || (mine ? "Escreva um texto sobre o roteiro em “Editar roteiro”." : "")}</p>
            {tags.length > 0 && (
              <ul className="place-tags" aria-label="Tags">
                {tags.map(t => <li key={t}>{t}</li>)}
              </ul>
            )}
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
            ? <blockquote className="big-quote">
                <span className="big-quote-mark">“</span>
                <p>{r.quote}</p>
                <footer>Equipe Onde Sair</footer>
              </blockquote>
            : <div className="mine-summary"><strong>{r.steps.length}</strong><span>parada{r.steps.length === 1 ? "" : "s"}</span>
                <strong>{r.steps.filter(s => s.place).length}</strong><span>lugar{r.steps.filter(s => s.place).length === 1 ? "" : "es"} da curadoria</span></div>}
        </section>

        {/* 2 · Passo a passo */}
        <section className="place-row" id="sec-paradas">
          <div>
            <div className="h2-head">
              <h2>O roteiro passo a passo</h2>
              <span className="h2-sub">{mine ? "Do seu jeito. Use “Editar roteiro” para mudar a ordem ou as paradas." : "Uma sugestão de dia para inspirar o seu. Sinta-se livre para adaptar!"}</span>
            </div>
            <div className="steps-grid">
              {r.steps.map((s, i) => {
                const p = s.place && placeById(s.place);
                const open = p ? () => nav("detalhe", { id: p.id }) : undefined;
                return (
                  <article key={i} className={"rot-index-card step-card" + (p ? "" : " is-free")} onClick={open}>
                    <ImageSlot className="rot-index-img" src={stepImg(s)} alt={s.title} hint={p ? "16:10" : "Parada livre"}>
                      <span className="step-time"><span className="step-num" style={{ "--pin": STEP_COLORS[i % STEP_COLORS.length] }}>{i + 1}</span>{s.time}</span>
                      {s.optional && <span className="step-optional">Opcional</span>}
                      {p && <FaveButton id={p.id} className="fave fave-float" />}
                    </ImageSlot>
                    <div className="rot-index-body">
                      {p?.type && <div className="rot-index-vibes"><TypePill type={p.type} /></div>}
                      <h3>{s.title}</h3>
                      {s.desc && <p>{s.desc}</p>}
                      <ul className="rot-index-meta">
                        {p ? <li><Icon name="pin" size={14} /> {p.bairro}</li> : <li className="step-free">Parada livre</li>}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3 · Mapa (70%) + Informações úteis (30%) */}
        <section className="place-row split-70-30" id="sec-mapa">
          <div className="where-box">
            <div className="h2-head">
              <h2>Veja o roteiro no mapa</h2>
              <a href="#" className="h2-link" onClick={(e) => { e.preventDefault(); nav("mapa"); }}>Ver mapa completo <Icon name="arrow" size={16} /></a>
            </div>
            <PlaceMap className="where-map where-map-lg rot-map" route activeId={mapSel} onSelect={setMapSel} items={mapItems} />
          </div>
          <div className="info-box">
            <h2 className="h2t">Informações úteis</h2>
            <dl>
              {r.stats.tempo && <div><Icon name="clock" size={20} /><dt>Tempo total</dt><dd>{r.stats.tempo}</dd></div>}
              <div><Icon name="dollar" size={20} /><dt>Investimento</dt><dd><b>{INVEST[r.stats.invest]}</b> {investLabel}</dd></div>
              {r.stats.ideal && <div><Icon name="users" size={20} /><dt>Ideal para</dt><dd>{r.stats.ideal}</dd></div>}
              {tips.horario && <div><Icon name="sun" size={20} /><dt>Melhor horário</dt><dd>{tips.horario}</dd></div>}
              {tips.epoca && <div><Icon name="calendar" size={20} /><dt>Melhor época</dt><dd>{tips.epoca}</dd></div>}
              {tips.comoChegar && <div><Icon name="shoe" size={20} /><dt>Como chegar</dt><dd>{tips.comoChegar}</dd></div>}
            </dl>
            <ol className="rot-map-list">
              <li className="rot-map-list-title">Neste roteiro</li>
              {r.steps.map((s, i) => (
                <li key={i}><span className="step-num" style={{ "--pin": STEP_COLORS[i % STEP_COLORS.length] }}>{i + 1}</span>{s.title}{s.optional && " (opcional)"}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4 · Dicas */}
        {hasTips && (
          <section className="place-row rot-extras" id="sec-dicas">
            {tips.dica && (
              <div className="team-tip">
                <h3><Icon name="bulb" size={22} /> {mine ? "Minhas anotações" : "Dica do time"}</h3>
                <p>{tips.dica}</p>
              </div>
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
        )}

        {/* 5 · Confira também */}
        <section className="place-row" id="sec-confira">
          <div>
            {mine && myRoteiros().length > 1 && (
              <>
                <SectionHead title="Seus outros roteiros" link="Ver todos" onLink={() => nav("perfil", { tab: "meus" })} />
                <div className="rot-index">{myRoteiros().filter(x => x.id !== r.id).slice(0, 3).map(x => <MyRoteiroCard key={x.id} r={x} />)}</div>
              </>
            )}
            <SectionHead
              title="Continue explorando"
              sub={`Mais roteiros para viver ${city} por outras perspectivas.`}
              link="Ver todos os roteiros" onLink={() => nav("roteiros")}
            />
            <div className="rot-index">
              {others.map(o => <RoteiroCard key={o.id} r={o} />)}
            </div>
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
          {ROTEIROS.map(r => <RoteiroCard key={r.id} r={r} />)}
        </div>
      </div>
      <Footer />
    </main>
  );
}

// Card de um roteiro meu (perfil e página do roteiro): mesmo card dos roteiros do site
export const MyRoteiroCard = ({ r, actions }) => <RoteiroCard r={r} mine actions={actions} />;
