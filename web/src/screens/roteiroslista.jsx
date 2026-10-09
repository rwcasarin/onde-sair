// Roteiros (/roteiros): no modelo da lista de lugares — topo com foto e vibes, filtros ao lado e cards
import { useMemo, useState } from "react";
import { ROTEIROS, VIBE_ORDER, CITIES, roteiroImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { HeroMedia, Crumbs, VibePill, RoteiroCard, Footer, affById, placeById } from "../components/site.jsx";
import { useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { roteiroVibes } from "../vibes.js";
import { slugify } from "../admin/store.js";
import { currentPath, HASH_MODE } from "../router.js";
import { INVEST_LABELS } from "../../shared/myroteiros.js";
import { CheckRow, toggleIn } from "./lista.jsx";

const SORTS = [["relevancia", "Mais relevantes"], ["preco", "Menor investimento"], ["paradas", "Menos paradas"], ["az", "A–Z"]];
const STOPS = [["curto", "Até 3 paradas", (n) => n <= 3], ["longo", "4 paradas ou mais", (n) => n >= 4]];

// campos usados nos filtros: cidade e bairros vêm das paradas com lugar
function facts(r) {
  const stops = r.steps.map(s => s.place && placeById(s.place)).filter(Boolean);
  const bairros = [...new Set([...(r.bairros || "").split(/[·,]/).map(s => s.trim()), ...stops.map(p => p.bairro)].filter(Boolean))];
  return { r, vibes: roteiroVibes(r), city: stops[0]?.city || "", bairros, invest: r.stats?.invest ?? null, stops: r.steps.length,
    text: [r.title, r.desc, r.bairros, ...(r.tags || []).map(t => t[0] || t), ...stops.map(p => p.name)].join(" ").toLowerCase() };
}

export function RoteirosLista() {
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const all = useMemo(() => ROTEIROS.map(facts), []);
  // vibe pela URL (/roteiros?vibe=para-dates); cidade: a do site, se tiver roteiros nela
  const [vibe, setVibe] = useState(() => {
    const s = new URLSearchParams(currentPath().split("?")[1] || "").get("vibe");
    return VIBE_ORDER.find(id => slugify(affById(id)?.label || "") === s || id === s) || null;
  });
  const [cityF, setCityF] = useState(() => (globalCity && all.some(x => x.city === globalCity) ? globalCity : ""));
  const [bairros, setBairros] = useState(new Set());
  const [showAllBairros, setShowAllBairros] = useState(false);
  const [invest, setInvest] = useState(new Set());
  const [stops, setStops] = useState(new Set());
  const [sort, setSort] = useState("relevancia");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  function pickVibe(id) {
    const next = id === vibe ? null : id;
    setVibe(next);
    const url = "/roteiros" + (next ? "?vibe=" + slugify(affById(next)?.label || next) : "");
    history.replaceState(null, "", HASH_MODE ? "#" + url : url);
  }

  const anyCity = useMemo(() => all.filter(x => (!vibe || x.vibes.includes(vibe)) && (!query || x.text.includes(query.toLowerCase()))), [all, vibe, query]);
  const cityCounts = useMemo(() => anyCity.reduce((m, x) => (x.city ? { ...m, [x.city]: (m[x.city] || 0) + 1 } : m), {}), [anyCity]);
  const base = useMemo(() => anyCity.filter(x => !cityF || x.city === cityF), [anyCity, cityF]);
  const BAIRROS = useMemo(() => [...new Set(base.flatMap(x => x.bairros))].sort((x, y) => x.localeCompare(y, "pt-BR")), [base]);
  function changeCity(v) { setCityF(v); setBairros(new Set()); setShowAllBairros(false); if (v) setGlobalCity(v); }

  let results = base.filter(x =>
    (!bairros.size || x.bairros.some(b => bairros.has(b))) &&
    (!invest.size || invest.has(x.invest)) &&
    (!stops.size || STOPS.some(([k, , fn]) => stops.has(k) && fn(x.stops))));
  if (sort === "preco") results = [...results].sort((x, y) => (x.invest ?? 9) - (y.invest ?? 9));
  else if (sort === "paradas") results = [...results].sort((x, y) => x.stops - y.stops);
  else if (sort === "az") results = [...results].sort((x, y) => x.r.title.localeCompare(y.r.title, "pt-BR"));
  else if (vibe) results = [...results].sort((x, y) => x.vibes.indexOf(vibe) - y.vibes.indexOf(vibe));

  const count = (fn) => base.filter(fn).length;
  const filterCount = bairros.size + invest.size + stops.size;
  function clearAll() { setBairros(new Set()); setInvest(new Set()); setStops(new Set()); }
  const a = vibe ? affById(vibe) : null;

  return (
    <main className="home2">
      <section className="hero2 hero2-page">
        <HeroMedia img={roteiroImg("capa")} note="o melhor rolê é o que tem começo, meio e fim."
          words={["Roteiros", "prontos,", "do", "seu", "jeito."]} hint="Foto dos roteiros · ~1400×800" />
        <div className="hero2-copy">
          <Crumbs items={[["Início", "home"], ["Roteiros"]]} />
          <h1 className="page-title">Roteiros</h1>
          <p className="hero2-lede">Curadorias prontas para viver {city} do seu jeito. Cada roteiro tem propósito, ordem e dicas de quem já foi.</p>
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
            <input className="filter-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, lugar ou bairro" aria-label="Buscar roteiros" />
          </div>
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
            <h3>Investimento</h3>
            {INVEST_LABELS.map((l, i) => (
              <CheckRow key={i} boxed checked={invest.has(i)} onChange={() => setInvest(toggleIn(invest, i))} count={count(x => x.invest === i)}>{i ? `${"$".repeat(i)} · ${l}` : l}</CheckRow>
            ))}
          </div>
          <div className="filter-block">
            <h3>Tamanho</h3>
            {STOPS.map(([k, l, fn]) => <CheckRow key={k} checked={stops.has(k)} onChange={() => setStops(toggleIn(stops, k))} count={count(x => fn(x.stops))}>{l}</CheckRow>)}
          </div>
          <button className="btn-pill btn-block" onClick={() => { setFiltersOpen(false); document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth" }); }}>Aplicar filtros</button>
        </aside>

        <section className="results" id="resultados">
          <div className="results-bar">
            <h2>{results.length} {results.length === 1 ? "roteiro" : "roteiros"} {cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}</h2>
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

          {(a || query) && (
            <div className="active-chips">
              {a && <button className="soft-tag removable" onClick={() => pickVibe(vibe)}>{a.label} <Icon name="x" size={12} /></button>}
              {query && <button className="soft-tag removable" onClick={() => setQuery("")}>“{query}” <Icon name="x" size={12} /></button>}
            </div>
          )}

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>Nenhum roteiro com esses filtros.</h3>
              <p>Tente outra vibe ou afrouxe um filtro.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); setQuery(""); if (vibe) pickVibe(vibe); }}>Limpar filtros</button>
                {cityF && Object.keys(cityCounts).some(c => c !== cityF) && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : (
            <div className="listing-grid">{results.map(x => <RoteiroCard key={x.r.id} r={x.r} />)}</div>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
}
