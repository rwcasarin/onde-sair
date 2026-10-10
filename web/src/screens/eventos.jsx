// Eventos — agenda (/eventos) no modelo da lista de lugares, e página do evento (/eventos/{slug})
import { useMemo, useState } from "react";
import { EVENTS, EVENT_CATEGORIES, VIBE_ORDER, CITIES, PLACES, eventImg, eventGallery } from "../data.js";
import { ImageSlot } from "../components/image-slot.jsx";
import { Icon } from "../components/icons.jsx";
import { HeroMedia, Crumbs, VibePill, EventCard, PlaceCard, CategoryPill, FaveButton, Footer, affById } from "../components/site.jsx";
import { useNav, useCity, useFaves, useAccount } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { PlaceMap } from "../components/placemap.jsx";
import { instaProfile } from "../insta.js";
import { whatsappLink } from "./detalhe.jsx";
import { slugify } from "../admin/store.js";
import { currentPath, HASH_MODE } from "../router.js";
import { CheckRow, toggleIn } from "./lista.jsx";
import {
  WHEN, inRange, isPast, isHappening, byDate, whenLabel, priceLabel,
  eventVenue, venueName, googleCalendarUrl, icsHref, eventDays, periodLines, dayLabel, hoursLabel, defaultDay, todayYmd, sameHoursAllDays,
} from "../events.js";

const SORTS = [["data", "Data (mais próximos)"], ["az", "A–Z"]];
const PRICES = [["gratis", "Gratuito", (e) => !!e.price?.free], ["pago", "Pago", (e) => !e.price?.free]];
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
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const all = EVENTS;
  const [vibe, setVibe] = useState(() => {
    const s = new URLSearchParams(currentPath().split("?")[1] || "").get("vibe");
    return VIBE_ORDER.find(id => slugify(affById(id)?.label || "") === s || id === s) || null;
  });
  const [cityF, setCityF] = useState(() => (globalCity && all.some(e => e.city === globalCity) ? globalCity : ""));
  const [when, setWhen] = useState("");
  const [cats, setCats] = useState(() => {
    const s = new URLSearchParams(currentPath().split("?")[1] || "").get("categoria");
    const c = EVENT_CATEGORIES.find(x => x.slug === s);
    return new Set(c ? [c.id] : []);
  });
  const [bairros, setBairros] = useState(new Set());
  const [prices, setPrices] = useState(new Set());
  const [showPast, setShowPast] = useState(false);
  const [sort, setSort] = useState("data");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const now = new Date();

  function pickVibe(id) {
    const next = id === vibe ? null : id;
    setVibe(next);
    const url = "/eventos" + (next ? "?vibe=" + slugify(affById(next)?.label || next) : "");
    history.replaceState(null, "", HASH_MODE ? "#" + url : url);
  }

  const text = (e) => plain([e.title, e.tagline, e.desc, venueName(e), e.bairro, ...(e.tags || [])].join(" "));
  const anyCity = useMemo(() => all.filter(e => (showPast || !isPast(e, now)) && (!vibe || (e.affs || []).includes(vibe)) && (!query || text(e).includes(plain(query)))), [all, vibe, query, showPast]); // eslint-disable-line
  const cityCounts = useMemo(() => anyCity.reduce((m, e) => (e.city ? { ...m, [e.city]: (m[e.city] || 0) + 1 } : m), {}), [anyCity]);
  const base = useMemo(() => anyCity.filter(e => !cityF || e.city === cityF), [anyCity, cityF]);
  const BAIRROS = useMemo(() => [...new Set(base.map(e => e.bairro).filter(Boolean))].sort((x, y) => x.localeCompare(y, "pt-BR")), [base]);
  function changeCity(v) { setCityF(v); setBairros(new Set()); if (v) setGlobalCity(v); }

  const range = when && WHEN.find(w => w[0] === when)[2](now);
  let results = base.filter(e =>
    (!range || inRange(e, range)) && (!cats.size || cats.has(e.category)) &&
    (!bairros.size || bairros.has(e.bairro)) && (!prices.size || PRICES.some(([k, , fn]) => prices.has(k) && fn(e))));
  results = sort === "az" ? [...results].sort((x, y) => x.title.localeCompare(y.title, "pt-BR")) : [...results].sort(byDate);

  const count = (fn) => base.filter(fn).length;
  const filterCount = (when ? 1 : 0) + cats.size + bairros.size + prices.size + (showPast ? 1 : 0);
  function clearAll() { setWhen(""); setCats(new Set()); setBairros(new Set()); setPrices(new Set()); setShowPast(false); }
  const a = vibe ? affById(vibe) : null;

  return (
    <main className="home2">
      <section className="hero2 hero2-page">
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
        <aside className={"filters" + (filtersOpen ? " open" : "")}>
          <div className="filters-head">
            <h2>Filtrar por</h2>
            {filterCount > 0 && <button className="link-btn" onClick={clearAll}>Limpar tudo</button>}
          </div>
          <div className="filter-block">
            <h3>Buscar</h3>
            <input className="filter-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Evento, local ou assunto" aria-label="Buscar eventos" />
          </div>
          <div className="filter-block">
            <h3>Quando</h3>
            {WHEN.map(([k, l, fn]) => (
              <CheckRow key={k} checked={when === k} onChange={() => setWhen(when === k ? "" : k)} count={count(e => inRange(e, fn(now)))}>{l}</CheckRow>
            ))}
          </div>
          <div className="filter-block">
            <h3>Categoria</h3>
            {EVENT_CATEGORIES.filter(c => base.some(e => e.category === c.id)).map(c => (
              <CheckRow key={c.id} checked={cats.has(c.id)} onChange={() => setCats(toggleIn(cats, c.id))} count={count(e => e.category === c.id)}>{c.label}</CheckRow>
            ))}
          </div>
          <div className="filter-block">
            <h3>Cidade</h3>
            <CityField value={cityF} onChange={changeCity} counts={cityCounts} />
          </div>
          {BAIRROS.length > 0 && (
            <div className="filter-block">
              <h3>Bairro / Região</h3>
              {BAIRROS.map(b => <CheckRow key={b} checked={bairros.has(b)} onChange={() => setBairros(toggleIn(bairros, b))} count={count(e => e.bairro === b)}>{b}</CheckRow>)}
            </div>
          )}
          <div className="filter-block">
            <h3>Preço</h3>
            {PRICES.map(([k, l, fn]) => <CheckRow key={k} boxed checked={prices.has(k)} onChange={() => setPrices(toggleIn(prices, k))} count={count(fn)}>{l}</CheckRow>)}
          </div>
          <div className="filter-block">
            <CheckRow checked={showPast} onChange={() => setShowPast(!showPast)}>Mostrar eventos encerrados</CheckRow>
          </div>
          <button className="btn-pill btn-block" onClick={() => { setFiltersOpen(false); document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth" }); }}>Aplicar filtros</button>
        </aside>

        <section className="results" id="resultados">
          <div className="results-bar">
            <h2>{results.length} {results.length === 1 ? "evento" : "eventos"} {cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}</h2>
            <button className="btn-outline filters-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
              <Icon name="list" size={16} /> Filtros{filterCount ? ` · ${filterCount}` : ""}
            </button>
            <label className="sort">
              <span>Ordenar por</span>
              <span className="select-wrap">
                <select value={sort} onChange={(e) => setSort(e.target.value)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                <Icon name="chevron" size={16} />
              </span>
            </label>
          </div>

          {(a || query || when) && (
            <div className="active-chips">
              {a && <button className="soft-tag removable" onClick={() => pickVibe(vibe)}>{a.label} <Icon name="x" size={12} /></button>}
              {when && <button className="soft-tag removable" onClick={() => setWhen("")}>{WHEN.find(w => w[0] === when)[1]} <Icon name="x" size={12} /></button>}
              {query && <button className="soft-tag removable" onClick={() => setQuery("")}>“{query}” <Icon name="x" size={12} /></button>}
            </div>
          )}

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>Nenhum evento com esses filtros.</h3>
              <p>Tente outra data ou afrouxe um filtro — a agenda muda toda semana.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); setQuery(""); if (vibe) pickVibe(vibe); }}>Limpar filtros</button>
                {cityF && Object.keys(cityCounts).some(c => c !== cityF) && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : (
            <div className="listing-grid">{results.map(e => <EventCard key={e.id} e={e} />)}</div>
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
  const e = EVENTS.find(x => x.id === id) || EVENTS[0];
  const [tab, setTab] = useState("visao");
  const [shared, setShared] = useState(false);
  const [shift, setShift] = useState(0);
  const [pickedDay, setPickedDay] = useState(null);
  if (!e) return null;
  // horário: o do dia de hoje (se o evento acontece hoje); dá para escolher outro dia
  const days = eventDays(e);
  const day = days.find(d => d.date === pickedDay) || defaultDay(days);
  const sameHours = sameHoursAllDays(days);
  const venue = eventVenue(e);
  const where = venueName(e);
  const address = fullAddress(e);
  const past = isPast(e), live = isHappening(e);
  const saved = faves.has(e.id);
  const insta = instaProfile(e.insta);
  const whats = whatsappLink(e.whatsapp);
  const ticketUrl = e.ticket?.url && /^https?:\/\//.test(e.ticket.url) ? e.ticket.url : null;
  const ticketLabel = e.ticket?.label || (e.price?.free ? "Garantir ingresso" : "Comprar ingresso");
  const reasons = (e.reasons || []).filter(r => r[1]);
  // fotos do evento (a seção pode ser escondida no painel)
  const showFotos = e.showGallery !== false;
  const gallery = eventGallery(e.id);
  const shown = gallery.map((_, i) => gallery[(i + shift) % gallery.length]);
  const tabs = [["visao", "Visão geral"], ...(reasons.length ? [["porque", "Por que ir"]] : []), ...(showFotos ? [["fotos", "Fotos"]] : []), ["chegar", "Onde fica"], ["confira", "Confira também"]];
  const calWhere = [where, address].filter(Boolean).join(", ");

  // outros eventos: mesma categoria ou vibes em comum, os próximos primeiro
  const more = EVENTS.filter(x => x.id !== e.id && !isPast(x))
    .map(x => ({ x, score: (x.category === e.category ? 2 : 0) + (x.affs || []).filter(a => (e.affs || []).includes(a)).length + (x.venue && x.venue === e.venue ? 1 : 0) }))
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
            {e.category && <CategoryPill id={e.category} />}
            {(e.affs || []).map(a => <VibePill key={a} aff={a} size="sm" />)}
          </div>
          <h1 className="page-title">{e.title}</h1>
          {e.tagline && <p className="hero2-lede">{e.tagline}</p>}
          {(past || live) && <p className={"event-status" + (live ? " is-live" : "")}>{live ? "Acontecendo agora" : "Este evento já aconteceu"}</p>}
          <ul className="place-meta">
            <li><Icon name="calendar" size={18} /> {whenLabel(e)}</li>
            {where && <li><Icon name="pin" size={18} fill /> {where}{e.bairro ? ` · ${e.bairro}` : ""}</li>}
          </ul>
          <div className="place-actions">
            <div className="act-row act-main">
              {ticketUrl && !past
                ? <a className="act-cta" href={ticketUrl} target="_blank" rel="noreferrer"><Icon name="star" size={18} /> {ticketLabel}</a>
                : <button className="act-cta" onClick={() => goTab("chegar")}><Icon name="send" size={18} /> Como chegar</button>}
              {insta && <a className="act-btn act-round act-insta" href={insta} target="_blank" rel="noreferrer" aria-label={"Instagram " + e.insta} title={"Instagram " + e.insta}><Icon name="instagram" size={19} /></a>}
              {whats && <a className="act-btn act-round act-whats" href={whats} target="_blank" rel="noreferrer" aria-label="Conversar no WhatsApp" title="WhatsApp"><Icon name="whatsapp" size={19} /></a>}
            </div>
            <div className="act-row act-sub">
              {!paused && <button className={"act-btn act-sm" + (saved ? " on" : "")} onClick={() => toggle(e.id)} aria-pressed={saved} aria-label={saved ? "Salvo" : "Salvar"}>
                <Icon name="heart" size={17} fill={saved} /><span className="act-label">{saved ? "Salvo" : "Salvar"}</span>
              </button>}
              {!past && <a className="act-btn act-sm" href={googleCalendarUrl(e, calWhere)} target="_blank" rel="noreferrer" aria-label="Adicionar à agenda"><Icon name="calendar" size={17} /><span className="act-label">Adicionar à agenda</span></a>}
              <button className={"act-btn act-sm" + (shared ? " show" : "")} onClick={share} aria-label="Compartilhar"><Icon name="share" size={17} /><span className="act-label">{shared ? "Copiado!" : "Compartilhar"}</span></button>
            </div>
          </div>
        </div>
      </section>

      <nav className="page-tabs" aria-label="Seções">
        <div className="shell">
          {tabs.map(([t, label]) => <button key={t} className={tab === t ? "on" : ""} onClick={() => goTab(t)}>{label}</button>)}
        </div>
      </nav>

      <div className="shell place-body">
        {/* 1 · Sobre o evento (60%) + caixa de data, valor e ingressos (30%) */}
        <section className="place-row split-60-30" id="sec-visao">
          <div className="about-text">
            <h2 className="h2t">Sobre o evento</h2>
            {String(e.desc || "").split(/\n{2,}/).map((t, i) => <p key={i}>{t}</p>)}
            {e.tags?.length > 0 && <ul className="place-tags" aria-label="Assuntos">{e.tags.map(t => <li key={t}>{t}</li>)}</ul>}
          </div>
          <aside className="event-box" aria-label="Data, valor e ingressos">
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
                  {/* o seletor de dia só aparece quando os horários mudam de um dia para outro: seletor > horário */}
                  <div className="event-hours-line">
                    {!sameHours && (
                      <label className="event-day-pick">
                        <select value={day.date} onChange={(ev) => setPickedDay(ev.target.value)} aria-label="Ver o horário de outro dia">
                          {days.map(d => <option key={d.date} value={d.date}>{d.date === todayYmd() ? "Hoje, " + dayLabel(d.date).toLowerCase() : dayLabel(d.date)}</option>)}
                        </select>
                        <Icon name="chevron" size={14} />
                      </label>
                    )}
                    <strong className="event-day-hours">{hoursLabel(day)}</strong>
                  </div>
                  {!sameHours && <span className="event-hours-note">Os horários mudam conforme o dia.</span>}
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
                <a href={googleCalendarUrl(e, calWhere)} target="_blank" rel="noreferrer">Google</a> ·{" "}
                <a href={icsHref(e, calWhere)} download={`${e.slug || e.id}.ics`}>Apple/Outlook</a></p>
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
              <div className="h2-head"><h2>Fotos do evento</h2></div>
              <div className="gallery gallery-wide">
                {shown.map((src, i) => (
                  <ImageSlot key={src} className="gallery-img" src={src} alt={`${e.title} — foto ${i + 1}`} hint="3:4">
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
          </section>
        )}

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
