import { useMemo, useState } from "react";
import {
  PLACES, VIBE_ORDER, VIBE_PAGE, MOMENTOS, AMBIENTES, vibeImg,
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
import { useFilters, FilterPanel, FilterBlock, SearchBlock, CheckList, ResultsBar, ActiveChips, PRICE_LEVELS, sortBy, fslug } from "../filters.jsx";

const SORTS = ["relevancia", "az", "preco", "recentes"];
export { CheckRow, toggleIn } from "../filters.jsx";

export function Lista({ aff = null, q = "", tipo = "" }) {
  const nav = useNav();
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const [vibe, setVibe] = useState(aff);
  const [view, setView] = useState("lista");
  const [activePin, setActivePin] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // filtros no link: /lugares?busca=…&cidade=…&bairro=centro,vila-nova&tipo=bares&preco=1,2
  const { f, set, toggle, reset } = useFilters({
    busca: ["busca", "one", q], cidade: ["cidade", "one", globalCity || "todas"], bairro: ["bairro", "set"], tipo: ["tipo", "set", tipo ? [tipo] : []],
    preco: ["preco", "set"], momento: ["momento", "set"], ambiente: ["ambiente", "set"], ordem: ["ordem", "one", "relevancia"],
  });
  const query = f.busca, cityF = f.cidade === "todas" ? "" : f.cidade;

  const a = vibe ? affById(vibe) : null;
  const page = vibe ? VIBE_PAGE[vibe] : null;

  // vibe + busca (sem cidade): base das contagens por cidade
  const anyCity = useMemo(() => PLACES.filter(p => {
    if (vibe && !p.affs.includes(vibe)) return false;
    if (query) {
      const hay = fslug([p.name, p.bairro, p.type, p.desc, p.sub, ...(p.tags || [])].join(" "));
      if (!hay.includes(fslug(query))) return false;
    }
    return true;
  }), [vibe, query]);
  const cityCounts = useMemo(() => anyCity.reduce((m, p) => ({ ...m, [p.city]: (m[p.city] || 0) + 1 }), {}), [anyCity]);
  // base: vibe + busca + cidade (as contagens dos outros filtros partem daqui)
  const base = useMemo(() => anyCity.filter(p => !cityF || p.city === cityF), [anyCity, cityF]);
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }

  // cada filtro conta sobre os demais (a opção mostra quantos resultados daria)
  const tests = {
    bairro: (p) => !f.bairro.size || f.bairro.has(fslug(p.bairro)),
    tipo: (p) => !f.tipo.size || f.tipo.has(fslug(p.type)),
    preco: (p) => !f.preco.size || f.preco.has(String(p.priceLevel)),
    momento: (p) => !f.momento.size || (p.momento || []).some(m => f.momento.has(fslug(m))),
    ambiente: (p) => !f.ambiente.size || (p.ambiente || []).some(m => f.ambiente.has(fslug(m))),
  };
  const pass = (p, skip) => Object.entries(tests).every(([k, t]) => k === skip || t(p));
  const count = (key, fn) => base.filter(p => pass(p, key) && fn(p)).length;
  const opts = (key, list, get) => list.map(([value, label]) => ({ value, label, count: count(key, p => get(p).includes(value)) }));

  let results = base.filter(p => pass(p));
  results = f.ordem === "relevancia" ? results : sortBy(results, f.ordem, { name: (p) => p.name, price: (p) => p.priceLevel });

  const BAIRROS = [...new Set(base.map(p => p.bairro).filter(Boolean))].sort((x, y) => x.localeCompare(y, "pt-BR")).map(b => [fslug(b), b]);
  const TIPOS = TYPES.map(t => [fslug(t.label), t.label]);
  const label = (list, v) => list.find(([k]) => k === v)?.[1] || v;
  const chips = [
    ...(a ? [{ key: "vibe", label: a.label, onRemove: () => setVibe(null) }] : []),
    ...(query ? [{ key: "q", label: `“${query}”`, onRemove: () => set("busca", "") }] : []),
    ...[...f.tipo].map(v => ({ key: "t" + v, label: label(TIPOS, v), onRemove: () => toggle("tipo", v) })),
    ...[...f.bairro].map(v => ({ key: "b" + v, label: label(BAIRROS, v), onRemove: () => toggle("bairro", v) })),
    ...[...f.preco].map(v => ({ key: "p" + v, label: PRICE_LEVELS.find(x => x.value === v)?.label || v, onRemove: () => toggle("preco", v) })),
    ...[...f.momento].map(v => ({ key: "m" + v, label: label(MOMENTOS.map(m => [fslug(m), m]), v), onRemove: () => toggle("momento", v) })),
    ...[...f.ambiente].map(v => ({ key: "a" + v, label: label(AMBIENTES.map(m => [fslug(m), m]), v), onRemove: () => toggle("ambiente", v) })),
  ];
  const filterCount = chips.length - (a ? 1 : 0);
  function clearAll() { reset(["busca", "bairro", "tipo", "preco", "momento", "ambiente"]); }
  const typeTitle = f.tipo.size === 1 ? label(TIPOS, [...f.tipo][0]) : "";

  const title = a ? a.label : query ? "Resultados da busca" : typeTitle || "Lugares";
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
          <p className="hero2-lede">{lede}</p>
          {page ? (
            <ul className="feature-row">
              {page.features.map(([icon, label]) => <li key={label}><Icon name={icon} size={26} /> {label}</li>)}
            </ul>
          ) : (
            <div className="hero2-vibes">
              {VIBE_ORDER.map(id => <VibePill key={id} aff={id} onClick={() => nav("vibes", { aff: id })} />)}
            </div>
          )}
        </div>
      </section>

      <div className="shell listing-layout">
        {/* ---------- Filtros ---------- */}
        <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} active={filterCount} onClear={clearAll} total={results.length} noun={results.length === 1 ? "lugar" : "lugares"}>
          <SearchBlock value={query} onChange={(v) => set("busca", v)} placeholder="Nome, bairro ou tag" />
          <FilterBlock title="Cidade"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>
          <FilterBlock title="Bairro / Região">
            <CheckList options={opts("bairro", BAIRROS, p => [fslug(p.bairro)])} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" />
          </FilterBlock>
          <FilterBlock title="Tipo de lugar">
            <CheckList options={opts("tipo", TIPOS, p => [fslug(p.type)])} selected={f.tipo} onToggle={(v) => toggle("tipo", v)} />
          </FilterBlock>
          <FilterBlock title="Preço" note="(por pessoa)">
            <CheckList boxed options={PRICE_LEVELS.map(o => ({ ...o, count: count("preco", p => String(p.priceLevel) === o.value) }))} selected={f.preco} onToggle={(v) => toggle("preco", v)} />
          </FilterBlock>
          <FilterBlock title="Momento">
            <CheckList options={opts("momento", MOMENTOS.map(m => [fslug(m), m]), p => (p.momento || []).map(fslug))} selected={f.momento} onToggle={(v) => toggle("momento", v)} />
          </FilterBlock>
          <FilterBlock title="Ambiente">
            <CheckList options={opts("ambiente", AMBIENTES.map(m => [fslug(m), m]), p => (p.ambiente || []).map(fslug))} selected={f.ambiente} onToggle={(v) => toggle("ambiente", v)} />
          </FilterBlock>
        </FilterPanel>

        {/* ---------- Resultados ---------- */}
        <section className="results" id="resultados">
          <ResultsBar title={`${results.length} ${results.length === 1 ? "lugar encontrado" : "lugares encontrados"} ${cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}`}
            active={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={f.ordem} sorts={SORTS} onSort={(v) => set("ordem", v)}>
            <div className="view-toggle" role="group" aria-label="Modo de visualização">
              <button className={view === "lista" ? "on" : ""} onClick={() => setView("lista")}><Icon name="list" size={18} /> Lista</button>
              <button className={view === "mapa" ? "on" : ""} onClick={() => setView("mapa")}><Icon name="pin" size={18} /> Mapa</button>
            </div>
          </ResultsBar>
          <ActiveChips chips={chips} onClear={() => { clearAll(); setVibe(null); }} />

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>Nada bateu com esses filtros.</h3>
              <p>Tente afrouxar um filtro — a cidade tem mais do que parece.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); setVibe(null); }}>Limpar filtros</button>
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

        </section>
      </div>

      <Footer />
    </main>
  );
}
