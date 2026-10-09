// Vibes (/vibes e /vibes/{slug}): lugares e roteiros juntos, no modelo da lista de lugares.
// O menu de vibes fica no topo, com a vibe da página marcada.
import { useMemo, useState } from "react";
import { PLACES, ROTEIROS, VIBE_ORDER, VIBE_PAGE, PRICE_BUCKETS, MOMENTOS, AMBIENTES, CITIES, TYPES, vibeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { HeroMedia, Crumbs, VibePill, PlaceCard, RoteiroCard, Footer, affById, placeById } from "../components/site.jsx";
import { useNav, useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { roteiroVibes } from "../vibes.js";
import { SITE } from "../admin/store.js";
import { CheckRow, toggleIn } from "./lista.jsx";

const SORTS = [["relevancia", "Mais relevantes"], ["preco", "Menor preço"], ["az", "A–Z"]];
const STOPS = [["curto", "Até 3 paradas", (n) => n <= 3], ["longo", "4 paradas ou mais", (n) => n >= 4]];

// item da listagem: lugar ou roteiro com os campos usados nos filtros
function asItems() {
  const places = PLACES.map(p => ({ kind: "lugar", id: p.id, name: p.name, vibes: p.affs || [], city: p.city, bairros: [p.bairro].filter(Boolean), price: p.priceLevel, p,
    text: [p.name, p.bairro, p.type, p.desc, p.sub, ...(p.tags || [])].join(" ") }));
  const rots = SITE.roteirosHidden ? [] : ROTEIROS.map(r => {
    const stops = r.steps.map(s => s.place && placeById(s.place)).filter(Boolean);
    const bairros = [...new Set([...(r.bairros || "").split(/[·,]/).map(s => s.trim()), ...stops.map(p => p.bairro)].filter(Boolean))];
    return { kind: "roteiro", id: r.id, name: r.title, vibes: roteiroVibes(r), city: stops[0]?.city || "", bairros, price: r.stats?.invest ?? null, r,
      stops: r.steps.length, text: [r.title, r.desc, r.bairros, ...(r.tags || []).map(t => t[0] || t)].join(" ") };
  });
  return [...places, ...rots];
}
// junta lugares e roteiros alternando, para a listagem não ficar em blocos
function interleave(list) {
  const a = list.filter(x => x.kind === "lugar"), b = list.filter(x => x.kind === "roteiro");
  const out = []; const step = Math.max(1, Math.round(a.length / Math.max(1, b.length)));
  let j = 0;
  a.forEach((x, i) => { out.push(x); if ((i + 1) % step === 0 && j < b.length) out.push(b[j++]); });
  return [...out, ...b.slice(j)];
}

export function VibesView({ aff = null, q = "" }) {
  const nav = useNav();
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const [cityF, setCityF] = useState(globalCity || "");
  const [kinds, setKinds] = useState(new Set());              // vazio = lugares e roteiros
  const [bairros, setBairros] = useState(new Set());
  const [showAllBairros, setShowAllBairros] = useState(false);
  const [prices, setPrices] = useState(new Set());
  const [types, setTypes] = useState(new Set());
  const [momentos, setMomentos] = useState(new Set());
  const [ambientes, setAmbientes] = useState(new Set());
  const [stops, setStops] = useState(new Set());
  const [sort, setSort] = useState("relevancia");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState(q);

  const a = aff ? affById(aff) : null;
  const page = aff ? VIBE_PAGE[aff] : null;
  const all = useMemo(asItems, []);
  const hasRoteiros = all.some(x => x.kind === "roteiro");

  // vibe + busca (sem cidade): base das contagens por cidade
  const anyCity = useMemo(() => all.filter(x => {
    if (aff && !x.vibes.includes(aff)) return false;
    if (query && !x.text.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [all, aff, query]);
  const cityCounts = useMemo(() => anyCity.reduce((m, x) => (x.city ? { ...m, [x.city]: (m[x.city] || 0) + 1 } : m), {}), [anyCity]);
  const base = useMemo(() => anyCity.filter(x => !cityF || x.city === cityF), [anyCity, cityF]);
  const BAIRROS = useMemo(() => [...new Set(base.flatMap(x => x.bairros))].sort((x, y) => x.localeCompare(y, "pt-BR")), [base]);
  function changeCity(v) { setCityF(v); setBairros(new Set()); setShowAllBairros(false); if (v) setGlobalCity(v); }

  // filtros de lugar valem só para lugares; os de roteiro, só para roteiros
  const placeFilters = types.size + momentos.size + ambientes.size;
  const passPlace = (x) => (!types.size || types.has(x.p.type)) && (!momentos.size || x.p.momento.some(m => momentos.has(m))) && (!ambientes.size || x.p.ambiente.some(m => ambientes.has(m)));
  const passRot = (x) => !stops.size || STOPS.some(([k, , fn]) => stops.has(k) && fn(x.stops));
  const common = (x) => (!bairros.size || x.bairros.some(b => bairros.has(b))) && (!prices.size || prices.has(x.price));
  const shown = (kind) => !kinds.size || kinds.has(kind);
  let results = base.filter(x => shown(x.kind) && common(x) && (x.kind === "lugar" ? passPlace(x) : passRot(x)));
  const rank = (x) => (aff ? x.vibes.indexOf(aff) : 0);
  if (sort === "preco") results = [...results].sort((x, y) => (x.price ?? 9) - (y.price ?? 9));
  else if (sort === "az") results = [...results].sort((x, y) => x.name.localeCompare(y.name, "pt-BR"));
  else results = interleave([...results].sort((x, y) => rank(x) - rank(y)));

  const count = (fn) => base.filter(fn).length;
  const nPlaces = results.filter(x => x.kind === "lugar").length, nRots = results.length - nPlaces;
  const filterCount = kinds.size + bairros.size + prices.size + placeFilters + stops.size;
  function clearAll() { setKinds(new Set()); setBairros(new Set()); setPrices(new Set()); setTypes(new Set()); setMomentos(new Set()); setAmbientes(new Set()); setStops(new Set()); }

  const title = a ? a.label : "Vibes";
  const lede = page ? page.lede : "Lugares e roteiros reunidos pelo clima do rolê. Escolha uma vibe ou use os filtros.";
  const summary = [nPlaces && `${nPlaces} ${nPlaces === 1 ? "lugar" : "lugares"}`, nRots && `${nRots} ${nRots === 1 ? "roteiro" : "roteiros"}`].filter(Boolean).join(" e ") || "Nada encontrado";

  return (
    <main className="home2">
      <section className="hero2 hero2-page vibes-hero">
        <HeroMedia
          img={aff ? vibeImg(aff) : "images/vibes/lugares.jpg"}
          note={page ? page.note : "cada rolê tem a sua vibe."}
          words={["Escolha", "a", "vibe,", "a", "gente", "mostra", "o", "rolê."]}
          hint="Foto da vibe · ~1400×800"
        />
        <div className="hero2-copy">
          <Crumbs items={[["Início", "home"], ...(a ? [["Vibes", "vibes"], [a.label]] : [["Vibes"]])]} />
          <h1 className="page-title">{title}</h1>
          <p className="hero2-lede">{lede}</p>
          {page && (
            <ul className="feature-row">
              {page.features.map(([icon, label]) => <li key={label}><Icon name={icon} size={26} /> {label}</li>)}
            </ul>
          )}
        </div>
      </section>

      {/* menu de vibes: a vibe da página fica marcada; tocar nela de novo volta para todas */}
      <nav className="shell vibes-menu" aria-label="Vibes">
        <button type="button" className={"vibe-all" + (!aff ? " active" : "")} aria-current={!aff ? "page" : undefined} onClick={() => nav("vibes")}>Todas</button>
        {VIBE_ORDER.map(id => (
          <span key={id} aria-current={aff === id ? "page" : undefined}>
            <VibePill aff={id} active={aff === id} onClick={() => nav("vibes", aff === id ? {} : { aff: id })} />
          </span>
        ))}
      </nav>

      <div className="shell listing-layout">
        <aside className={"filters" + (filtersOpen ? " open" : "")}>
          <div className="filters-head">
            <h2>Filtrar por</h2>
            {filterCount > 0 && <button className="link-btn" onClick={clearAll}>Limpar tudo</button>}
          </div>

          {hasRoteiros && (
            <div className="filter-block">
              <h3>Mostrar</h3>
              <CheckRow checked={kinds.has("lugar")} onChange={() => setKinds(toggleIn(kinds, "lugar"))} count={count(x => x.kind === "lugar")}>Lugares</CheckRow>
              <CheckRow checked={kinds.has("roteiro")} onChange={() => setKinds(toggleIn(kinds, "roteiro"))} count={count(x => x.kind === "roteiro")}>Roteiros</CheckRow>
            </div>
          )}

          <div className="filter-block">
            <h3>Cidade</h3>
            <CityField value={cityF} onChange={changeCity} counts={cityCounts} />
          </div>

          <div className="filter-block">
            <h3>Bairro / Região</h3>
            {(showAllBairros ? BAIRROS : BAIRROS.slice(0, 5)).map(b => (
              <CheckRow key={b} checked={bairros.has(b)} onChange={() => setBairros(toggleIn(bairros, b))} count={count(x => x.bairros.includes(b))}>{b}</CheckRow>
            ))}
            {BAIRROS.length > 5 && <button className="link-btn strong" onClick={() => setShowAllBairros(!showAllBairros)}>{showAllBairros ? "Ver menos −" : "Ver mais +"}</button>}
          </div>

          <div className="filter-block">
            <h3>Faixa de preço <small>(lugares e roteiros)</small></h3>
            {PRICE_BUCKETS.map(b => (
              <CheckRow key={b.level} boxed checked={prices.has(b.level)} onChange={() => setPrices(toggleIn(prices, b.level))} count={count(x => x.price === b.level)}>{b.label}</CheckRow>
            ))}
          </div>

          {shown("lugar") && <>
            <p className="filters-group">Só para lugares</p>
            <div className="filter-block">
              <h3>Tipo de lugar</h3>
              {TYPES.filter(t => base.some(x => x.kind === "lugar" && x.p.type === t.label)).map(t => (
                <CheckRow key={t.id} checked={types.has(t.label)} onChange={() => setTypes(toggleIn(types, t.label))} count={count(x => x.kind === "lugar" && x.p.type === t.label)}>{t.label}</CheckRow>
              ))}
            </div>
            <div className="filter-block">
              <h3>Momento</h3>
              {MOMENTOS.map(m => <CheckRow key={m} checked={momentos.has(m)} onChange={() => setMomentos(toggleIn(momentos, m))} count={count(x => x.kind === "lugar" && x.p.momento.includes(m))}>{m}</CheckRow>)}
            </div>
            <div className="filter-block">
              <h3>Ambiente</h3>
              {AMBIENTES.map(m => <CheckRow key={m} checked={ambientes.has(m)} onChange={() => setAmbientes(toggleIn(ambientes, m))} count={count(x => x.kind === "lugar" && x.p.ambiente.includes(m))}>{m}</CheckRow>)}
            </div>
          </>}

          {hasRoteiros && shown("roteiro") && <>
            <p className="filters-group">Só para roteiros</p>
            <div className="filter-block">
              <h3>Tamanho</h3>
              {STOPS.map(([k, l, fn]) => <CheckRow key={k} checked={stops.has(k)} onChange={() => setStops(toggleIn(stops, k))} count={count(x => x.kind === "roteiro" && fn(x.stops))}>{l}</CheckRow>)}
            </div>
          </>}

          <button className="btn-pill btn-block" onClick={() => { setFiltersOpen(false); document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth" }); }}>Aplicar filtros</button>
        </aside>

        <section className="results" id="resultados">
          <div className="results-bar">
            <h2>{summary} {cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}</h2>
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

          {(query || kinds.size > 0) && (
            <div className="active-chips">
              {[...kinds].map(k => <button key={k} className="soft-tag removable" onClick={() => setKinds(toggleIn(kinds, k))}>{k === "lugar" ? "Lugares" : "Roteiros"} <Icon name="x" size={12} /></button>)}
              {query && <button className="soft-tag removable" onClick={() => setQuery("")}>“{query}” <Icon name="x" size={12} /></button>}
            </div>
          )}

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>Nada bateu com esses filtros.</h3>
              <p>Tente afrouxar um filtro ou escolher outra vibe.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); setQuery(""); }}>Limpar filtros</button>
                {cityF && Object.keys(cityCounts).some(c => c !== cityF) && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : (
            <div className="listing-grid">
              {results.map(x => x.kind === "lugar" ? <PlaceCard key={"l" + x.id} p={x.p} /> : <RoteiroCard key={"r" + x.id} r={x.r} />)}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
}
