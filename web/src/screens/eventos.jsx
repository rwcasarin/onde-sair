// Eventos — agenda (/eventos) no modelo da lista de lugares, e página do evento (/eventos/{slug})
import { htmlToText } from "../richtext.js";
import { RichText } from "../components/richblock.jsx";
import { useEffect, useMemo, useState } from "react";
import { EVENTS, EVENT_CATEGORIES, VIBE_ORDER, CITIES, PLACES, eventImg, eventGallery } from "../data.js";
import { ImageSlot } from "../components/image-slot.jsx";
import { Icon } from "../components/icons.jsx";
import { HeroMedia, Crumbs, VibePill, EventCard, PlaceCard, CategoryPill, TypePill, FaveButton, Footer, affById, PageTabs } from "../components/site.jsx";
import { useNav, useCity, useFaves, useAccount } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { PlaceMap } from "../components/placemap.jsx";
import { instaProfile } from "../insta.js";
import { whatsappLink } from "./detalhe.jsx";
import { NotFound } from "./notfound.jsx";
import { Lightbox } from "../components/lightbox.jsx";
import { slugify, hasMedia } from "../admin/store.js";
import { eventPath } from "../router.js";
import { usePagedFilters, useListing, listItems, labelOf, Pagination, FilterPanel, FilterBlock, SearchBlock, CheckList, CheckRow, ResultsBar, ActiveChips } from "../filters.jsx";
import { vibeFromSlug, vibeSlug } from "./roteiroslista.jsx";
import {
  WHEN, inRange, isPast, byDate, whenLabel, priceLabel, cardWhen, venueType, eventCatIds,
  eventVenue, venueName, googleCalendarUrl, googleCoversAll, icsHref, eventDays, periodLines, dayLabel, hoursLabel, defaultDay, todayYmd, sameHoursAllDays,
} from "../events.js";

const SORTS = ["data", "az", "preco", "recentes"];
const plain = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const AGE = { livre: "Livre para todos os públicos" };
const ageLabel = (a) => AGE[a] || (a ? `Proibido para menores de ${a} anos` : "");

// endereço completo do local, sem repetir o que já está na linha do endereço
function fullAddress(e) {
  const c = CITIES.find(x => x.id === e.city);
  const parts = [e.end];
  if (e.bairro && !plain(e.end).includes(plain(e.bairro))) parts.push(e.bairro);
  if (c && !plain(e.end).includes(plain(c.name))) parts.push(c.name + (c.sub ? " - " + c.sub : ""));
  return parts.filter(Boolean).join(" · ");
}
const directions = (e) => e.geo
  ? `https://www.google.com/maps/dir/?api=1&destination=${e.geo.lat},${e.geo.lng}${e.placeId ? "&destination_place_id=" + e.placeId : ""}`
  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(e))}`;

// ---------------------------------------------------------------------
// Lista
// ---------------------------------------------------------------------
export function EventosLista() {
  const nav = useNav();
  const { user, ask, paused, eventsPaused } = useAccount();
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { f, set, toggle, reset, page: pageN, setPage } = usePagedFilters({
    vibe: ["vibe", "one"], busca: ["busca", "one"], quando: ["quando", "one"], categoria: ["categoria", "set"],
    cidade: ["cidade", "one", globalCity || "todas"],
    bairro: ["bairro", "set"], preco: ["preco", "set"], encerrados: ["encerrados", "bool"], ordem: ["ordem", "one", "data"],
  });
  const vibe = vibeFromSlug(f.vibe), query = f.busca, cityF = f.cidade === "todas" ? "" : f.cidade, when = f.quando, showPast = f.encerrados;
  const pickVibe = (id) => set("vibe", id === vibe ? "" : vibeSlug(id));

  const { data, loading } = useListing("eventos", f, { page: pageN });
  const L = data?.list || { total: 0, page: 1, pages: 1, facets: {}, cityCounts: {}, extra: {} };
  // a cidade do site não tem eventos: mostra todas
  useEffect(() => { if (data && cityF && L.extra.anyInCity && !L.extra.anyInCity[cityF]) set("cidade", "todas"); }, [data]); // eslint-disable-line
  const results = listItems(data, { events: EVENTS }).map(x => x.item);
  const cityCounts = L.cityCounts;
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }

  const a = vibe ? affById(vibe) : null;
  const facet = (key) => L.facets[key] || [];
  const chipsOf = (key) => [...f[key]].map(v => ({ key: key + v, label: labelOf(facet(key), v), onRemove: () => toggle(key, v) }));
  const chips = [
    ...(a ? [{ key: "vibe", label: a.label, onRemove: () => set("vibe", "") }] : []),
    ...(query ? [{ key: "q", label: `“${query}”`, onRemove: () => set("busca", "") }] : []),
    ...(when ? [{ key: "w", label: WHEN.find(w => w[0] === when)?.[1] || when, onRemove: () => set("quando", "") }] : []),
    ...chipsOf("categoria"), ...chipsOf("bairro"), ...chipsOf("preco"),
    ...(showPast ? [{ key: "past", label: "Com encerrados", onRemove: () => set("encerrados", false) }] : []),
  ];
  const filterCount = chips.length - (a ? 1 : 0);
  function clearAll() { reset(["busca", "quando", "categoria", "bairro", "preco", "encerrados"]); }

  return (
    <main className="home2">
      <section className="hero2 hero2-page hero2-list">
        <HeroMedia img={eventImg("capa")} note="a cidade tem programa todo dia da semana."
          words={["Shows,", "feiras,", "festas", "e", "encontros."]} hint="Foto da agenda · ~1400×800" />
        <div className="hero2-copy">
          <Crumbs items={[["Início", "home"], ["Eventos"]]} />
          <h1 className="page-title">Eventos</h1>
          <p className="hero2-lede">A agenda de {city} escolhida a dedo: shows, feiras, festas e experiências pra encaixar no seu rolê.</p>
          <nav className="hero2-vibes vibes-menu" aria-label="Filtrar por vibe">
            {VIBE_ORDER.map(id => <VibePill key={id} aff={id} active={vibe === id} onClick={() => pickVibe(id)} />)}
          </nav>
        </div>
      </section>

      <div className="shell listing-layout">
        <FilterPanel sort={f.ordem} sorts={SORTS} onSort={(v) => set("ordem", v)} open={filtersOpen} onClose={() => setFiltersOpen(false)} active={filterCount} onClear={clearAll} total={L.total} noun={L.total === 1 ? "evento" : "eventos"}>
          <SearchBlock value={query} onChange={(v) => set("busca", v)} placeholder="Evento, local ou assunto" />
          <FilterBlock title="Quando">
            {(facet("quando").length ? facet("quando") : WHEN.map(([value, label]) => ({ value, label, count: null }))).map(({ value: k, label: l, count: n }) => (
              <CheckRow key={k} checked={when === k} onChange={() => set("quando", when === k ? "" : k)} count={n}>{l}</CheckRow>
            ))}
          </FilterBlock>
          <FilterBlock title="Cidade"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>
          <FilterBlock title="Bairro / Região">
            <CheckList options={facet("bairro")} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" />
          </FilterBlock>
          <FilterBlock title="Categoria">
            <CheckList options={facet("categoria")} selected={f.categoria} onToggle={(v) => toggle("categoria", v)} />
          </FilterBlock>
          <FilterBlock title="Preço" note="(a partir de, por pessoa)">
            <CheckList boxed options={facet("preco")} selected={f.preco} onToggle={(v) => toggle("preco", v)} />
          </FilterBlock>
          <FilterBlock title="Encerrados">
            <CheckRow checked={showPast} onChange={() => set("encerrados", !showPast)}>Mostrar eventos encerrados</CheckRow>
          </FilterBlock>
        </FilterPanel>

        <section className={"results" + (loading ? " is-loading" : "")} id="resultados" aria-busy={loading}>
          <ResultsBar title={`${L.total} ${L.total === 1 ? "evento" : "eventos"} ${cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}`}
            active={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={f.ordem} sorts={SORTS} onSort={(v) => set("ordem", v)} />
          <ActiveChips chips={chips} onClear={() => { clearAll(); set("vibe", ""); }} />

          {!data ? <div className="listing-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="card-skeleton" />)}</div> : L.total === 0 ? (
            <div className="empty-state">
              <h3>Nenhum evento com esses filtros.</h3>
              <p>Tente outra data ou afrouxe um filtro — a agenda muda toda semana.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); set("vibe", ""); }}>Limpar filtros</button>
                {cityF && Object.keys(cityCounts).some(c => c !== cityF) && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : (
            <>
              <div className="listing-grid">{results.map(e => <EventCard key={e.id} e={e} />)}</div>
              <Pagination page={L.page} pages={L.pages} onPage={setPage} loading={loading} />
            </>
          )}
          {!paused && !eventsPaused && (
            <div className="ev-submit-cta">
              <div><strong>Tem um evento com a cara da cidade?</strong><span>Envie para a agenda: a equipe revisa e publica.</span></div>
              <button className="btn-outline" onClick={() => user ? nav("enviarEvento") : ask({ type: "enviarEvento" })}><Icon name="calendar" size={16} /> Enviar evento</button>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
}

// ---------------------------------------------------------------------
// Página do evento
// ---------------------------------------------------------------------
export function Evento({ id }) {
  const nav = useNav();
  const { faves, toggle } = useFaves();
  const { paused } = useAccount();
  const e = EVENTS.find(x => x.id === id);
  const [tab, setTab] = useState("visao");
  const mobile = useMobileTabs();
  const [shared, setShared] = useState(false);
  const [lb, setLb] = useState(null);           // galeria em tela cheia
  if (!e) return <NotFound />;
  // horário: o do dia de hoje (se o evento acontece hoje); dá para escolher outro dia
  const days = eventDays(e);
  const day = defaultDay(days);
  const sameHours = sameHoursAllDays(days);
  const venue = eventVenue(e);
  const where = venueName(e);
  const address = fullAddress(e);
  const past = isPast(e);
  // data e situação iguais às do selo dos cards (AGORA / HOJE / dia / encerrado)
  const tag = cardWhen(e);
  const live = tag?.kind === "live";
  const saved = faves.has(e.id);
  const insta = instaProfile(e.insta);
  const whats = whatsappLink(e.whatsapp);
  const ticketUrl = e.ticket?.url && /^https?:\/\//.test(e.ticket.url) ? e.ticket.url : null;
  const ticketLabel = e.ticket?.label || (e.price?.free ? "Garantir ingresso" : "Comprar ingresso");
  const reasons = (e.reasons || []).filter(r => r[1]);
  // fotos do evento (a seção pode ser escondida no painel)
  // só as fotos que foram enviadas; sem nenhuma, a seção some
  const gallery = eventGallery(e.id).filter(hasMedia);
  const showFotos = e.showGallery !== false && gallery.length > 0;
  const slides = gallery.map(path => ({ path }));   // a imagem principal não entra na galeria
  const coverOffset = 0;
  // celular (menu fixo embaixo): só Sobre, Informações (caixa branca de data, valor e ingressos) e Onde fica
  const tabs = mobile ? [["visao", "Sobre"], ["info", "Informações"], ["chegar", "Onde fica"]] : [["visao", "Sobre"], ...(reasons.length ? [["porque", "Por que ir"]] : []), ...(showFotos ? [["fotos", "Fotos"]] : []), ["chegar", "Onde fica"], ["confira", "Confira também"]];
  const calWhere = [where, address].filter(Boolean).join(", ");
  const pageUrl = typeof location !== "undefined" ? location.origin + eventPath(e) : "";
  const gcalUrl = googleCalendarUrl(e, calWhere, pageUrl);
  // selo de situação (mesmas cores do bloco de data dos cards): acontecendo agora ou encerrado
  const whenText = !tag ? "Data a confirmar" : live ? tag.text.replace(/^Acontecendo /, "") : tag.text;
  const status = live ? <span className="event-status is-live"><i aria-hidden="true" />Agora</span>
    : past ? <span className="event-status is-past">Encerrado</span> : null;

  // outros eventos: mesma categoria ou vibes em comum, os próximos primeiro
  const more = EVENTS.filter(x => x.id !== e.id && !isPast(x))
    .map(x => ({ x, score: (eventCatIds(x).some(c => eventCatIds(e).includes(c)) ? 2 : 0) + (x.affs || []).filter(a => (e.affs || []).includes(a)).length + (x.venue && x.venue === e.venue ? 1 : 0) }))
    .sort((m, n) => n.score - m.score || byDate(m.x, n.x)).slice(0, 4).map(m => m.x);

  function goTab(t) { setTab(t); document.getElementById("sec-" + t)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: e.title, text: `${e.title} · ${whenLabel(e)}` });
      else await navigator.clipboard?.writeText(`${e.title} · ${whenLabel(e)} — ${location.href}`);
      setShared(true); setTimeout(() => setShared(false), 1800);
    } catch { /* cancelado */ }
  }
  // o mapa usa o local do evento (cadastro do lugar ou endereço digitado)
  const pin = { ...(venue || {}), id: venue?.id || e.id, name: where || e.title, end: e.end, bairro: e.bairro, city: e.city, geo: e.geo, placeId: e.placeId, map: e.map || venue?.map || { x: 50, y: 50, label: "" } };

  return (
    <main className="home2">
      <section className="hero2 hero2-page hero2-place hero2-event">
        <HeroMedia img={eventImg(e.id)} note={e.note} shape="diagonal" hint="Foto do evento · ~1400×800" />
        <div className="hero2-copy">
          <Crumbs items={[["Início", "home"], ["Eventos", "eventos"], [e.title]]} />
          <div className="place-vibes place-vibes-sm">
            {venueType(e) && <TypePill type={venueType(e)} />}
            {eventCatIds(e).map(id => <CategoryPill key={id} id={id} />)}
            {(e.affs || []).map(a => <VibePill key={a} aff={a} size="sm" />)}
          </div>
          <h1 className="page-title">{e.title}</h1>
          {e.tagline && <p className="hero2-lede">{e.tagline}</p>}
          <ul className="place-meta">
            <li className="event-meta-when">{status || <Icon name="calendar" size={18} />} {whenText}</li>
            {where && <li><Icon name="pin" size={18} fill /> {where}{e.bairro ? ` · ${e.bairro}` : ""}</li>}
          </ul>
          <div className="place-actions">
            {/* ingresso: a ação principal do evento, com texto */}
            {ticketUrl && !past && <a className="act-cta" href={ticketUrl} target="_blank" rel="noreferrer"><Icon name="star" size={18} /> {ticketLabel}</a>}
            {/* demais ações: todas do mesmo tamanho, só com ícone */}
            <div className="act-row act-icons">
              {insta && <a className="act-btn act-round act-insta" href={insta} target="_blank" rel="noreferrer" aria-label={"Instagram " + e.insta} title={"Instagram " + e.insta}><Icon name="instagram" size={19} /></a>}
              {whats && <a className="act-btn act-round act-whats" href={whats} target="_blank" rel="noreferrer" aria-label="Conversar no WhatsApp" title="WhatsApp"><Icon name="whatsapp" size={19} /></a>}
              {!paused && <button className={"act-btn act-round" + (saved ? " on" : "")} onClick={() => toggle(e.id)} aria-pressed={saved} aria-label={saved ? "Favoritado" : "Favoritar"} title={saved ? "Favoritado" : "Favoritar"}>
                <Icon name="heart" size={19} fill={saved} />
              </button>}
              <button className="act-btn act-round" onClick={() => goTab("chegar")} aria-label="Como chegar" title="Como chegar"><Icon name="send" size={19} /></button>
              <button className={"act-btn act-round" + (shared ? " on" : "")} onClick={share} aria-label={shared ? "Link copiado" : "Compartilhar"} title={shared ? "Link copiado" : "Compartilhar"}><Icon name={shared ? "check" : "share"} size={19} /></button>
              {!past && <a className="act-btn act-round" href={gcalUrl} target="_blank" rel="noreferrer" aria-label="Adicionar à agenda" title="Adicionar à agenda"><Icon name="calendar" size={19} /></a>}
            </div>
          </div>
        </div>
      </section>

      <PageTabs tabs={tabs} tab={tab} onTab={goTab} />

      <div className="shell place-body">
        {/* 1 · Sobre o evento (60%) + caixa de data, valor e ingressos (30%) */}
        <section className="place-row split-60-30" id="sec-visao">
          <div className="about-text">
            <h2 className="h2t">Sobre o evento</h2>
            <RichText value={e.desc} />
            {e.tags?.length > 0 && <ul className="place-tags" aria-label="Assuntos">{e.tags.map(t => <li key={t}>{t}</li>)}</ul>}
          </div>
          <aside className="event-box" id="sec-info" aria-label="Data, valor e ingressos">
            <div className="event-box-row">
              <Icon name="calendar" size={20} />
              <div>
                <span className="event-box-label">Quando</span>
                {periodLines(e).map(l => <strong key={l} className="event-when-line">{l}</strong>)}
              </div>
            </div>
            {day && (
              <div className="event-box-row">
                <Icon name="clock" size={20} />
                <div>
                  <span className="event-box-label">Horário</span>
                  {/* horários diferentes por dia: lista com todos os dias (hoje em destaque); senão, só o horário */}
                  {sameHours
                    ? <strong className="event-day-hours">{hoursLabel(day)}</strong>
                    : (
                      <ul className="event-hours-list">
                        {days.map(d => (
                          <li key={d.date} className={d.date === todayYmd() ? "is-today" : ""}>
                            <span>{d.date === todayYmd() ? "Hoje" : dayLabel(d.date)}</span>
                            <strong>{hoursLabel(d)}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
              </div>
            )}
            {e.doors && (
              <div className="event-box-row"><Icon name="clock" size={20} /><div><span className="event-box-label">Abertura da casa</span><strong>{e.doors}</strong></div></div>
            )}
            {(where || address) && (
              <div className="event-box-row">
                <Icon name="pin" size={20} />
                <div><span className="event-box-label">Local</span>{where && <strong>{where}</strong>}{address && <span>{address}</span>}</div>
              </div>
            )}
            <div className="event-box-row">
              <Icon name="coins" size={20} />
              <div><span className="event-box-label">Valor</span><strong>{priceLabel(e)}</strong>{e.price?.note && <span>{e.price.note}</span>}</div>
            </div>
            {past
              ? <p className="event-box-note">As vendas deste evento já foram encerradas.</p>
              : ticketUrl
                ? <a className="btn-pill btn-block event-box-cta" href={ticketUrl} target="_blank" rel="noreferrer">{ticketLabel} <Icon name="arrow" size={16} /></a>
                : <p className="event-box-note">{e.ticket?.required ? "Ingressos na bilheteria do local." : e.price?.free ? "Entrada livre, sem necessidade de ingresso." : "Pagamento no local."}</p>}
            <dl className="event-box-facts">
              {e.age && <div><dt>Classificação</dt><dd>{ageLabel(e.age)}</dd></div>}
            </dl>
            {!past && (
              <p className="event-box-cal"><Icon name="calendar" size={14} /> Adicionar à agenda:{" "}
                <a href={gcalUrl} target="_blank" rel="noreferrer">Google</a> ·{" "}
                <a href={icsHref(e, calWhere, pageUrl)} download={`${e.slug || e.id}.ics`}>Apple/Outlook</a>
                {!googleCoversAll(e) && <span className="event-box-cal-note">No Google entra {day?.date === todayYmd() ? "o dia de hoje" : `o dia ${dayLabel(day.date)}`}, com os horários de todos os dias na descrição. O arquivo Apple/Outlook traz cada dia com o seu horário.</span>}</p>
            )}
          </aside>
        </section>

        {reasons.length > 0 && (
          <section className="place-row" id="sec-porque">
            <div className="why-box why-row">
              <h2 className="h2t">Por que ir?</h2>
              <ul>{reasons.map(([icon, txt]) => <li key={txt}><span className="why-icon"><Icon name={icon} size={18} fill={icon === "star" || icon === "heart"} /></span>{txt}</li>)}</ul>
            </div>
          </section>
        )}

        {/* Fotos do evento */}
        {showFotos && (
          <section className="place-row" id="sec-fotos">
            <div>
              <div className="h2-head"><h2>Fotos do evento</h2>{slides.length > 1 && <button type="button" className="h2-link" onClick={() => setLb(0)}>Ver todas as fotos ({slides.length}) <Icon name="arrow" size={16} /></button>}</div>
              <div className={"photo-mosaic n-" + Math.min(gallery.length, 5)}>
                {gallery.slice(0, 5).map((src, k) => (
                  <button key={src} type="button" className="photo-tile" onClick={() => setLb(k + coverOffset)} aria-label={`${e.title} — foto ${k + 1}`}>
                    <ImageSlot src={src} alt={`${e.title} — foto ${k + 1}`} />
                    {k === 4 && gallery.length > 5 && <span className="photo-tile-more">+{gallery.length - 5} fotos</span>}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
        {lb != null && <Lightbox photos={slides} index={lb} title={e.title} onClose={() => setLb(null)} />}

        {/* Onde fica (70%) + card do lugar (30%) */}
        <section className="place-row split-70-30" id="sec-chegar">
          <div className="where-box">
            <div className="h2-head">
              <h2>Onde fica</h2>
              <a href={directions(e)} className="h2-link" target="_blank" rel="noreferrer">Como chegar <Icon name="arrow" size={16} /></a>
            </div>
            <PlaceMap className="where-map where-map-lg" card={false} mainId={pin.id} items={[{ id: pin.id, place: pin }]} />
            <p className="where-address"><Icon name="pin" size={16} /> {[where, address].filter(Boolean).join(" · ")}{e.cep && ` · CEP ${e.cep}`}
              <a className="where-route" href={directions(e)} target="_blank" rel="noreferrer">Como chegar <Icon name="arrow" size={14} /></a></p>
          </div>
          {venue ? (
            <div className="event-venue">
              <h2 className="h2t">O lugar</h2>
              <PlaceCard p={venue} />
            </div>
          ) : (
            <div className="info-box">
              <h2 className="h2t">O local</h2>
              <dl>
                {where && <div><Icon name="landmark" size={20} /><dt>Local</dt><dd>{where}</dd></div>}
                <div><Icon name="pin" size={20} /><dt>Endereço</dt><dd>{address}{e.cep && <><br />CEP {e.cep}</>}</dd></div>
              </dl>
            </div>
          )}
        </section>

        <section className="place-row" id="sec-confira">
          <div>
            <div className="h2-head">
              <h2>Confira também</h2>
              <p>Outros eventos com a mesma vibe.</p>
              <a href="#" className="h2-link" onClick={(ev) => { ev.preventDefault(); nav("eventos"); }}>Ver a agenda <Icon name="arrow" size={16} /></a>
            </div>
            {more.length > 0
              ? <div className="related-grid">{more.map(x => <div key={x.id} className="related-item"><EventCard e={x} /></div>)}</div>
              : <p className="a-muted">Nenhum outro evento na agenda por enquanto.</p>}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

// menu da página no celular (mesma largura do menu fixo embaixo, em pages.css)
function useMobileTabs() {
  const q = "(max-width: 760px)";
  const [m, setM] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(q);
    if (!mq) return;
    const on = () => setM(mq.matches);
    on(); mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return m;
}
