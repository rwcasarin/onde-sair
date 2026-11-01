// Vibes (/vibes e /vibes/{slug}): lugares e roteiros juntos, no modelo da lista de lugares.
// O menu de vibes fica no topo, com a vibe da página marcada.
import { useState } from "react";
import { PLACES, ROTEIROS, VIBE_ORDER, VIBE_PAGE, CITIES, vibeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { HeroMedia, Crumbs, VibePill, PlaceCard, RoteiroCard, Footer, affById } from "../components/site.jsx";
import { useNav, useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { usePagedFilters, useListing, listItems, labelOf, Pagination, whenCount, FilterPanel, FilterBlock, SearchBlock, CheckList, ResultsBar, ActiveChips, WhenFilter, whenChips } from "../filters.jsx";

const SORTS = ["relevancia", "az", "recentes"];

export function VibesView({ aff = null, q = "" }) {
  const nav = useNav();
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { f, set, toggle, reset, page: pageN, setPage } = usePagedFilters({
    busca: ["busca", "one", q], mostrar: ["mostrar", "set"], cidade: ["cidade", "one", globalCity || "todas"], bairro: ["bairro", "set"],
    tipo: ["tipo", "set"], tamanho: ["tamanho", "set"], aberto: ["aberto", "bool"], dia: ["dia", "one"], periodo: ["periodo", "one"], ordem: ["ordem", "one", "relevancia"],
  });
  const when = { agora: f.aberto, dia: f.dia, periodo: f.periodo };
  const setWhen = (k, v) => set(k === "agora" ? "aberto" : k, v);
  const query = f.busca, cityF = f.cidade === "todas" ? "" : f.cidade, kinds = f.mostrar;

  const a = aff ? affById(aff) : null;
  const page = aff ? VIBE_PAGE[aff] : null;
  // o servidor filtra, conta e devolve só a página atual
  const { data, loading } = useListing("vibes", { ...f, vibe: aff || "" }, { page: pageN });
  const L = data?.list || { total: 0, page: 1, pages: 1, facets: {}, cityCounts: {}, when: null, extra: {} };
  const results = listItems(data, { places: PLACES, roteiros: ROTEIROS });
  const cityCounts = L.cityCounts, hasRoteiros = !!L.extra.hasRoteiros;
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }

  // filtros de lugar valem só para lugares; os de roteiro, só para roteiros
  const shown = (kind) => !kinds.size || kinds.has(kind);
  const facet = (key) => L.facets[key] || [];
  const nPlaces = L.extra.nPlaces || 0, nRots = L.extra.nRots || 0;
  const chipsOf = (key) => [...f[key]].map(v => ({ key: key + v, label: labelOf(facet(key), v), onRemove: () => toggle(key, v) }));
  const chips = [
    ...(query ? [{ key: "q", label: `“${query}”`, onRemove: () => set("busca", "") }] : []),
    ...chipsOf("mostrar"), ...chipsOf("bairro"), ...chipsOf("tipo"), ...chipsOf("tamanho"),
    ...whenChips(when, setWhen),
  ];
  const filterCount = chips.length;
  function clearAll() { reset(["busca", "mostrar", "bairro", "tipo", "tamanho", "aberto", "dia", "periodo"]); }

  const title = a ? a.label : "Vibes";
  const lede = page ? page.lede : "Lugares e roteiros reunidos pelo clima do rolê. Escolha uma vibe ou use os filtros.";
  const summary = [nPlaces && `${nPlaces} ${nPlaces === 1 ? "lugar" : "lugares"}`, nRots && `${nRots} ${nRots === 1 ? "roteiro" : "roteiros"}`].filter(Boolean).join(" e ") || "Nada encontrado";

  return (
    <main className="home2">
      <section className="hero2 hero2-page hero2-list vibes-hero">
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
          {/* menu de vibes, como na lista de lugares: a vibe da página fica marcada; tocar nela de novo volta para todas */}
          <nav className="hero2-vibes vibes-menu" aria-label="Vibes">
            {VIBE_ORDER.map(id => (
              <VibePill key={id} aff={id} active={aff === id} onClick={() => nav("vibes", aff === id ? {} : { aff: id })} />
            ))}
          </nav>
        </div>
      </section>

      <div className="shell listing-layout">
        <FilterPanel sort={f.ordem} sorts={SORTS} onSort={(v) => set("ordem", v)} open={filtersOpen} onClose={() => setFiltersOpen(false)} active={filterCount} onClear={clearAll} total={L.total} noun="resultados">
          <SearchBlock value={query} onChange={(v) => set("busca", v)} placeholder="Nome, bairro ou tag" />
          {hasRoteiros && (
            <FilterBlock title="Mostrar">
              <CheckList options={facet("mostrar")} selected={kinds} onToggle={(v) => toggle("mostrar", v)} />
            </FilterBlock>
          )}
          <FilterBlock title="Cidade"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>
          <FilterBlock title="Bairro / Região">
            <CheckList options={facet("bairro")} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" />
          </FilterBlock>
          {shown("lugar") && <>
            <p className="filters-group">Só para lugares</p>
            <FilterBlock title="Tipo de lugar">
              <CheckList options={facet("tipo")} selected={f.tipo} onToggle={(v) => toggle("tipo", v)} />
            </FilterBlock>
            <WhenFilter value={when} onChange={setWhen} count={whenCount(L.when)} />
          </>}
          {hasRoteiros && shown("roteiro") && <>
            <p className="filters-group">Só para roteiros</p>
            <FilterBlock title="Tamanho">
              <CheckList options={facet("tamanho")} selected={f.tamanho} onToggle={(v) => toggle("tamanho", v)} />
            </FilterBlock>
          </>}
        </FilterPanel>

        <section className={"results" + (loading ? " is-loading" : "")} id="resultados" aria-busy={loading}>
          <ResultsBar title={`${summary} ${cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}`}
            active={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={f.ordem} sorts={SORTS} onSort={(v) => set("ordem", v)} />
          <ActiveChips chips={chips} onClear={clearAll} />

          {!data ? <div className="listing-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="card-skeleton" />)}</div> : L.total === 0 ? (
            <div className="empty-state">
              <h3>Nada bateu com esses filtros.</h3>
              <p>Tente afrouxar um filtro ou escolher outra vibe.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={clearAll}>Limpar filtros</button>
                {cityF && Object.keys(cityCounts).some(c => c !== cityF) && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : (
            <>
              <div className="listing-grid">
                {results.map(x => x.kind === "place" ? <PlaceCard key={"l" + x.id} p={x.item} /> : <RoteiroCard key={"r" + x.id} r={x.item} />)}
              </div>
              <Pagination page={L.page} pages={L.pages} onPage={setPage} loading={loading} />
            </>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
}
