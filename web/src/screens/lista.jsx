import { useMemo, useState } from "react";
import {
  PLACES, VIBE_ORDER, VIBE_PAGE, PRICE_BUCKETS, MOMENTOS, AMBIENTES, TESTIMONIALS, vibeImg,
} from "../data.js";
import { CITIES, TYPES } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import {
  HeroMedia, Crumbs, VibePill, ListingCard, GeoCard, Footer, affById,
} from "../components/site.jsx";
import { useNav, useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { PlaceMap } from "../components/placemap.jsx";

const SORTS = [["relevancia", "Mais relevantes"], ["preco", "Menor preço"]];

function toggleIn(set, v) { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); return n; }

function CheckRow({ checked, onChange, children, count, boxed }) {
  return (
    <label className={"check-row" + (boxed ? " boxed" : "")}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{children}{count != null && <em> ({count})</em>}</span>
    </label>
  );
}

export function Lista({ aff = null, q = "", tipo = "" }) {
  const nav = useNav();
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const [vibe, setVibe] = useState(aff);
  // cidade do filtro: começa na cidade escolhida no site; "" = todas
  const [cityF, setCityF] = useState(globalCity || "");
  const [bairroSel, setBairroSel] = useState("");
  const [bairros, setBairros] = useState(new Set());
  const [showAllBairros, setShowAllBairros] = useState(false);
  const [prices, setPrices] = useState(new Set());
  const [momentos, setMomentos] = useState(new Set());
  const [ambientes, setAmbientes] = useState(new Set());
  const [reserva, setReserva] = useState(new Set());
  const [sort, setSort] = useState("relevancia");
  const [view, setView] = useState("lista");
  const [activePin, setActivePin] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState(q);
  const [typeF, setTypeF] = useState(() => TYPES.find(t => t.slug === tipo)?.label || "");   // /lugares?tipo=bares

  const a = vibe ? affById(vibe) : null;
  const page = vibe ? VIBE_PAGE[vibe] : null;

  // vibe + busca (sem cidade): base das contagens por cidade
  const anyCity = useMemo(() => PLACES.filter(p => {
    if (vibe && !p.affs.includes(vibe)) return false;
    if (typeF && p.type !== typeF) return false;
    if (query) {
      const hay = [p.name, p.bairro, p.type, p.desc, p.sub, ...(p.tags || [])].join(" ").toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  }), [vibe, query, typeF]);
  const cityCounts = useMemo(() => anyCity.reduce((m, p) => ({ ...m, [p.city]: (m[p.city] || 0) + 1 }), {}), [anyCity]);
  // base: vibe + busca + cidade (as contagens dos outros filtros partem daqui)
  const base = useMemo(() => anyCity.filter(p => !cityF || p.city === cityF), [anyCity, cityF]);
  const BAIRROS = useMemo(() => [...new Set(base.map(p => p.bairro).filter(Boolean))].sort((x, y) => x.localeCompare(y, "pt-BR")), [base]);
  function changeCity(v) {
    setCityF(v); setBairroSel(""); setBairros(new Set()); setShowAllBairros(false);
    if (v) setGlobalCity(v);
  }

  let results = base.filter(p => {
    if (bairroSel && p.bairro !== bairroSel) return false;
    if (bairros.size && !bairros.has(p.bairro)) return false;
    if (prices.size && !prices.has(p.priceLevel)) return false;
    if (momentos.size && !p.momento.some(m => momentos.has(m))) return false;
    if (ambientes.size && !p.ambiente.some(m => ambientes.has(m))) return false;
    if (reserva.size && !reserva.has(p.reserva ? "sim" : "nao")) return false;
    return true;
  });
  if (sort === "preco") results = [...results].sort((x, y) => x.priceLevel - y.priceLevel);

  const count = (fn) => base.filter(fn).length;
  const filterCount = (bairroSel ? 1 : 0) + bairros.size + prices.size + momentos.size + ambientes.size + reserva.size;
  function clearAll() {
    setBairroSel(""); setBairros(new Set()); setPrices(new Set());
    setMomentos(new Set()); setAmbientes(new Set()); setReserva(new Set());
  }

  const title = a ? a.label : query ? "Resultados da busca" : typeF || "Lugares";
  const lede = page ? page.lede : query
    ? <>Tudo o que encontramos para “{query}”. Refine pelos filtros ao lado.</>
    : "Todos os endereços que passaram pelo crivo. Escolha uma vibe ou use os filtros.";
  const cur = results.find(p => p.id === activePin);

  return (
    <main className="home2">
      <section className="hero2 hero2-page">
        <HeroMedia
          img={vibe ? vibeImg(vibe) : "images/vibes/lugares.jpg"}
          note={page ? page.note : "a cidade tem mais do que você imagina."}
          words={["Mais", "que", "lugares,", "momentos", "incríveis."]}
          hint="Foto da vibe · ~1400×800"
        />
        <div className="hero2-copy">
          <Crumbs items={[["Início", "home"], ...(a ? [["Vibes", "home", { anchor: "vibes" }], [a.label]] : [["Lugares"]])]} />
          <h1 className="page-title">{title}</h1>
          {typeF && <button type="button" className="type-chip" onClick={() => { setTypeF(""); history.replaceState(null, "", location.pathname); }} aria-label={"Remover filtro " + typeF}>Tipo: {typeF} <Icon name="x" size={14} /></button>}
          <p className="hero2-lede">{lede}</p>
          {page ? (
            <ul className="feature-row">
              {page.features.map(([icon, label]) => <li key={label}><Icon name={icon} size={26} /> {label}</li>)}
            </ul>
          ) : (
            <div className="hero2-vibes">
              {VIBE_ORDER.map(id => <VibePill key={id} aff={id} onClick={() => setVibe(id)} />)}
            </div>
          )}
        </div>
      </section>

      <div className="shell listing-layout">
        {/* ---------- Filtros ---------- */}
        <aside className={"filters" + (filtersOpen ? " open" : "")}>
          <div className="filters-head">
            <h2>Filtrar por</h2>
            {filterCount > 0 && <button className="link-btn" onClick={clearAll}>Limpar tudo</button>}
          </div>

          <div className="filter-block">
            <h3>Cidade</h3>
            <CityField value={cityF} onChange={changeCity} counts={cityCounts} />
          </div>

          <div className="filter-block">
            <h3>Bairro / Região</h3>
            <div className="select-wrap">
              <select value={bairroSel} onChange={(e) => setBairroSel(e.target.value)} aria-label="Bairro">
                <option value="">Todos os bairros</option>
                {BAIRROS.map(b => <option key={b}>{b}</option>)}
              </select>
              <Icon name="chevron" size={16} />
            </div>
            {(showAllBairros ? BAIRROS : BAIRROS.slice(0, 5)).map(b => (
              <CheckRow key={b} checked={bairros.has(b)} onChange={() => setBairros(toggleIn(bairros, b))} count={count(p => p.bairro === b)}>{b}</CheckRow>
            ))}
            {BAIRROS.length > 5 && (
              <button className="link-btn strong" onClick={() => setShowAllBairros(!showAllBairros)}>
                {showAllBairros ? "Ver menos −" : "Ver mais +"}
              </button>
            )}
          </div>

          <div className="filter-block">
            <h3>Faixa de preço <small>(por pessoa)</small></h3>
            {PRICE_BUCKETS.map(b => (
              <CheckRow key={b.level} boxed checked={prices.has(b.level)} onChange={() => setPrices(toggleIn(prices, b.level))} count={count(p => p.priceLevel === b.level)}>{b.label}</CheckRow>
            ))}
          </div>

          <div className="filter-block">
            <h3>Momento</h3>
            {MOMENTOS.map(m => (
              <CheckRow key={m} checked={momentos.has(m)} onChange={() => setMomentos(toggleIn(momentos, m))} count={count(p => p.momento.includes(m))}>{m}</CheckRow>
            ))}
          </div>

          <div className="filter-block">
            <h3>Ambiente</h3>
            {AMBIENTES.map(m => (
              <CheckRow key={m} checked={ambientes.has(m)} onChange={() => setAmbientes(toggleIn(ambientes, m))} count={count(p => p.ambiente.includes(m))}>{m}</CheckRow>
            ))}
          </div>

          <div className="filter-block">
            <h3>Reserva</h3>
            <CheckRow checked={reserva.has("sim")} onChange={() => setReserva(toggleIn(reserva, "sim"))} count={count(p => p.reserva)}>Aceita reserva</CheckRow>
            <CheckRow checked={reserva.has("nao")} onChange={() => setReserva(toggleIn(reserva, "nao"))} count={count(p => !p.reserva)}>Sem necessidade</CheckRow>
          </div>

          <button
            className="btn-pill btn-block"
            onClick={() => { setFiltersOpen(false); document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth" }); }}
          >Aplicar filtros</button>
        </aside>

        {/* ---------- Resultados ---------- */}
        <section className="results" id="resultados">
          <div className="results-bar">
            <h2>{results.length} {results.length === 1 ? "lugar encontrado" : "lugares encontrados"} {cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}</h2>
            <button className="btn-outline filters-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
              <Icon name="list" size={16} /> Filtros{filterCount ? ` · ${filterCount}` : ""}
            </button>
            <label className="sort">
              <span>Ordenar por</span>
              <span className="select-wrap">
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <Icon name="chevron" size={16} />
              </span>
            </label>
            <div className="view-toggle" role="group" aria-label="Modo de visualização">
              <button className={view === "lista" ? "on" : ""} onClick={() => setView("lista")}><Icon name="list" size={18} /> Lista</button>
              <button className={view === "mapa" ? "on" : ""} onClick={() => setView("mapa")}><Icon name="pin" size={18} /> Mapa</button>
            </div>
          </div>

          {(query || vibe) && (
            <div className="active-chips">
              {vibe && <button className="soft-tag removable" onClick={() => setVibe(null)}>{a.label} <Icon name="x" size={12} /></button>}
              {query && <button className="soft-tag removable" onClick={() => setQuery("")}>“{query}” <Icon name="x" size={12} /></button>}
            </div>
          )}

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>Nada bateu com esses filtros.</h3>
              <p>Tente afrouxar um filtro — a cidade tem mais do que parece.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); setQuery(""); }}>Limpar filtros</button>
                {cityF && Object.keys(cityCounts).some(c => c !== cityF) && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : view === "lista" ? (
            <div className="listing-grid">
              {results.map(p => <ListingCard key={p.id} p={p} />)}
            </div>
          ) : (
            <PlaceMap className="listing-map" activeId={cur?.id} onSelect={setActivePin}
              items={results.map(p => ({ id: p.id, place: p }))} />
          )}

          {/* Seleção de quem já foi */}
          <div className="selection-strip">
            <div className="selection-intro">
              <h2>Seleção de quem já foi</h2>
              <span className="rule" />
              <p>Lugares que realmente impressionam, segundo a nossa comunidade.</p>
            </div>
            {TESTIMONIALS.map(t => (
              <figure key={t.name} className="testimonial">
                <ImageSlot className="avatar-slot" src={`images/pessoas/${t.name.split(" ")[0].toLowerCase()}.jpg`} compact />
                <div>
                  <blockquote>“{t.text}”</blockquote>
                  <figcaption><strong>{t.name}</strong><span>{t.when}</span></figcaption>
                </div>
              </figure>
            ))}
            <GeoCard className="selection-geo" />
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
