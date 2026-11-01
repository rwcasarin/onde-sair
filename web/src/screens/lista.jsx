import { useState } from "react";
import {
  PLACES, VIBE_ORDER, VIBE_PAGE, vibeImg,
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
import { WhenFilter, whenChips, whenCount, usePagedFilters, useListing, listItems, labelOf, Pagination, FilterPanel, FilterBlock, SearchBlock, CheckList, ResultsBar, ActiveChips } from "../filters.jsx";

const SORTS = ["relevancia", "az", "recentes"];
export { CheckRow, toggleIn } from "../filters.jsx";

export function Lista({ aff = null, q = "", tipo = "" }) {
  const nav = useNav();
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const [vibe, setVibe] = useState(aff);
  const [view, setView] = useState("lista");
  const [activePin, setActivePin] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // filtros no link: /lugares?busca=…&cidade=…&bairro=centro,vila-nova&tipo=bares&pagina=2
  const { f, set, toggle, reset, page: pageN, setPage } = usePagedFilters({
    busca: ["busca", "one", q], cidade: ["cidade", "one", globalCity || "todas"], bairro: ["bairro", "set"], tipo: ["tipo", "set", tipo ? [tipo] : []],
    aberto: ["aberto", "bool"], dia: ["dia", "one"], periodo: ["periodo", "one"], ordem: ["ordem", "one", "relevancia"],
  });
  const when = { agora: f.aberto, dia: f.dia, periodo: f.periodo };
  const setWhen = (k, v) => set(k === "agora" ? "aberto" : k, v);
  const query = f.busca, cityF = f.cidade === "todas" ? "" : f.cidade;

  const a = vibe ? affById(vibe) : null;
  const page = vibe ? VIBE_PAGE[vibe] : null;

  // o servidor filtra, conta e devolve só a página atual (no modo mapa, todos como pins)
  const { data, loading } = useListing("lugares", { ...f, vibe: vibe || "" }, { page: pageN, map: view === "mapa" });
  const L = data?.list || { total: 0, page: 1, pages: 1, facets: {}, cityCounts: {}, when: null };
  const results = listItems(data, { places: PLACES }).map(x => x.item);
  const total = L.total, cityCounts = L.cityCounts;
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }

  const facet = (key) => L.facets[key] || [];
  const chips = [
    ...(a ? [{ key: "vibe", label: a.label, onRemove: () => { setVibe(null); setPage(1); } }] : []),
    ...(query ? [{ key: "q", label: `“${query}”`, onRemove: () => set("busca", "") }] : []),
    ...[...f.tipo].map(v => ({ key: "t" + v, label: labelOf(facet("tipo"), v), onRemove: () => toggle("tipo", v) })),
    ...[...f.bairro].map(v => ({ key: "b" + v, label: labelOf(facet("bairro"), v), onRemove: () => toggle("bairro", v) })),
    ...whenChips(when, setWhen),
  ];
  const filterCount = chips.length - (a ? 1 : 0);
  function clearAll() { reset(["busca", "bairro", "tipo", "aberto", "dia", "periodo"]); }
  const typeTitle = f.tipo.size === 1 ? labelOf(facet("tipo"), [...f.tipo][0]) : "";

  const title = a ? a.label : query ? "Resultados da busca" : typeTitle || "Lugares";
  const lede = page ? page.lede : query
    ? <>Tudo o que encontramos para “{query}”. Refine pelos filtros ao lado.</>
    : "Todos os endereços que passaram pelo crivo. Escolha uma vibe ou use os filtros.";

  return (
    <main className="home2">
      <section className="hero2 hero2-page hero2-list">
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
        <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} active={filterCount} onClear={clearAll} total={total} noun={total === 1 ? "lugar" : "lugares"}>
          <SearchBlock value={query} onChange={(v) => set("busca", v)} placeholder="Nome, bairro ou tag" />
          <FilterBlock title="Cidade"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>
          <FilterBlock title="Bairro / Região">
            <CheckList options={facet("bairro")} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" />
          </FilterBlock>
          <FilterBlock title="Tipo de lugar">
            <CheckList options={facet("tipo")} selected={f.tipo} onToggle={(v) => toggle("tipo", v)} />
          </FilterBlock>
          <WhenFilter value={when} onChange={setWhen} count={whenCount(L.when)} />
        </FilterPanel>

        {/* ---------- Resultados ---------- */}
        <section className={"results" + (loading ? " is-loading" : "")} id="resultados" aria-busy={loading}>
          <ResultsBar title={`${total} ${total === 1 ? "lugar encontrado" : "lugares encontrados"} ${cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}`}
            active={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={f.ordem} sorts={SORTS} onSort={(v) => set("ordem", v)}>
            <div className="view-toggle" role="group" aria-label="Modo de visualização">
              <button className={view === "lista" ? "on" : ""} onClick={() => setView("lista")}><Icon name="list" size={18} /> Lista</button>
              <button className={view === "mapa" ? "on" : ""} onClick={() => setView("mapa")}><Icon name="pin" size={18} /> Mapa</button>
            </div>
          </ResultsBar>
          <ActiveChips chips={chips} onClear={() => { clearAll(); setVibe(null); }} />

          {!data ? <div className="listing-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="card-skeleton" />)}</div> : total === 0 ? (
            <div className="empty-state">
              <h3>Nada bateu com esses filtros.</h3>
              <p>Tente afrouxar um filtro — a cidade tem mais do que parece.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); setVibe(null); }}>Limpar filtros</button>
                {cityF && Object.keys(cityCounts).some(c => c !== cityF) && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : view === "lista" ? (
            <>
              <div className="listing-grid">
                {results.map(p => <ListingCard key={p.id} p={p} />)}
              </div>
              <Pagination page={L.page} pages={L.pages} onPage={setPage} loading={loading} />
            </>
          ) : (
            <PlaceMap className="listing-map" activeId={activePin} onSelect={setActivePin}
              items={(L.pins || []).map(p => ({ id: p.id, place: p }))} />
          )}

        </section>
      </div>

      <Footer />
    </main>
  );
}
