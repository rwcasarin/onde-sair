// Roteiros (/roteiros): no modelo da lista de lugares — topo com foto e vibes, filtros ao lado e cards
import { useEffect, useState } from "react";
import { ROTEIROS, VIBE_ORDER, CITIES, roteiroImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { HeroMedia, Crumbs, VibePill, RoteiroCard, Footer, affById } from "../components/site.jsx";
import { useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { usePagedFilters, useListing, listItems, labelOf, Pagination, FilterPanel, FilterBlock, SearchBlock, CheckList, ResultsBar, ActiveChips } from "../filters.jsx";

const SORTS = ["relevancia", "az", "recentes", "paradas"];

export { vibeFromSlug, vibeSlug } from "../listutil.js";
import { vibeFromSlug, vibeSlug } from "../listutil.js";

export function RoteirosLista() {
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const [filtersOpen, setFiltersOpen] = useState(false);
  // cidade padrão: a do site (se não tiver roteiros nela, o servidor avisa e a lista abre em todas)
  const { f, set, toggle, reset, page: pageN, setPage } = usePagedFilters({
    vibe: ["vibe", "one"], busca: ["busca", "one"], cidade: ["cidade", "one", globalCity || "todas"],
    bairro: ["bairro", "set"], tamanho: ["tamanho", "set"], ordem: ["ordem", "one", "relevancia"],
  });
  const vibe = vibeFromSlug(f.vibe), query = f.busca, cityF = f.cidade === "todas" ? "" : f.cidade;
  const pickVibe = (id) => set("vibe", id === vibe ? "" : vibeSlug(id));

  const { data, loading } = useListing("roteiros", f, { page: pageN });
  const L = data?.list || { total: 0, page: 1, pages: 1, facets: {}, cityCounts: {}, extra: {} };
  // a cidade do site não tem roteiros: mostra todas
  useEffect(() => { if (data && cityF && L.extra.anyInCity && !L.extra.anyInCity[cityF]) set("cidade", "todas"); }, [data]); // eslint-disable-line
  const results = listItems(data, { roteiros: ROTEIROS }).map(x => x.item);
  const cityCounts = L.cityCounts;
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }

  const a = vibe ? affById(vibe) : null;
  const facet = (key) => L.facets[key] || [];
  const chipsOf = (key) => [...f[key]].map(v => ({ key: key + v, label: labelOf(facet(key), v), onRemove: () => toggle(key, v) }));
  const chips = [
    ...(a ? [{ key: "vibe", label: a.label, onRemove: () => set("vibe", "") }] : []),
    ...(query ? [{ key: "q", label: `“${query}”`, onRemove: () => set("busca", "") }] : []),
    ...chipsOf("bairro"), ...chipsOf("tamanho"),
  ];
  const filterCount = chips.length - (a ? 1 : 0);
  function clearAll() { reset(["busca", "bairro", "tamanho"]); }

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
        <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} active={filterCount} onClear={clearAll} total={L.total} noun={L.total === 1 ? "roteiro" : "roteiros"}>
          <SearchBlock value={query} onChange={(v) => set("busca", v)} placeholder="Nome, lugar ou bairro" />
          <FilterBlock title="Cidade"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>
          <FilterBlock title="Bairro / Região">
            <CheckList options={facet("bairro")} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" />
          </FilterBlock>
          <FilterBlock title="Tamanho">
            <CheckList options={facet("tamanho")} selected={f.tamanho} onToggle={(v) => toggle("tamanho", v)} />
          </FilterBlock>
        </FilterPanel>

        <section className={"results" + (loading ? " is-loading" : "")} id="resultados" aria-busy={loading}>
          <ResultsBar title={`${L.total} ${L.total === 1 ? "roteiro" : "roteiros"} ${cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}`}
            active={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={f.ordem} sorts={SORTS} onSort={(v) => set("ordem", v)} />
          <ActiveChips chips={chips} onClear={() => { clearAll(); set("vibe", ""); }} />

          {!data ? <div className="listing-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="card-skeleton" />)}</div> : L.total === 0 ? (
            <div className="empty-state">
              <h3>Nenhum roteiro com esses filtros.</h3>
              <p>Tente outra vibe ou afrouxe um filtro.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); set("vibe", ""); }}>Limpar filtros</button>
                {cityF && Object.keys(cityCounts).some(c => c !== cityF) && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : (
            <>
              <div className="listing-grid">{results.map(r => <RoteiroCard key={r.id} r={r} />)}</div>
              <Pagination page={L.page} pages={L.pages} onPage={setPage} loading={loading} />
            </>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
}
