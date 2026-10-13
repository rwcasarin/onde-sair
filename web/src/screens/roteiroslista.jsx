// Roteiros (/roteiros): no modelo da lista de lugares — topo com foto e vibes, filtros ao lado e cards
import { useMemo, useState } from "react";
import { ROTEIROS, VIBE_ORDER, CITIES, roteiroImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { HeroMedia, Crumbs, VibePill, RoteiroCard, Footer, affById, placeById } from "../components/site.jsx";
import { useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { roteiroVibes, roteiroBairros } from "../vibes.js";
import { slugify } from "../admin/store.js";
import { useFilters, FilterPanel, FilterBlock, SearchBlock, CheckList, ResultsBar, ActiveChips, sortBy, fslug } from "../filters.jsx";

const SORTS = ["relevancia", "az", "recentes", "paradas"];
const STOPS = [["curto", "Até 3 paradas", (n) => n <= 3], ["longo", "4 paradas ou mais", (n) => n >= 4]];

// campos usados nos filtros: cidade e bairros vêm das paradas com lugar
function facts(r) {
  const stops = r.steps.map(s => s.place && placeById(s.place)).filter(Boolean);
  const bairros = roteiroBairros(r, placeById);
  return { r, vibes: roteiroVibes(r), city: stops[0]?.city || "", bairros, stops: r.steps.length,
    text: fslug([r.title, r.desc, ...bairros, ...(r.tags || []).map(t => t[0] || t), ...stops.map(p => p.name)].join(" ")) };
}

// vibe no link: ?vibe=para-dates (links antigos ?vibe=pra-relaxar também funcionam)
export function vibeFromSlug(s) {
  if (!s) return "";
  const core = (x) => x.replace(/^(para|pra)-(a-)?/, "");
  return VIBE_ORDER.find(id => slugify(affById(id)?.label || "") === s || id === s) || VIBE_ORDER.find(id => core(slugify(affById(id)?.label || "")) === core(s)) || "";
}
export const vibeSlug = (id) => (id ? slugify(affById(id)?.label || id) : "");

export function RoteirosLista() {
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const all = useMemo(() => ROTEIROS.map(facts), []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // cidade padrão: a do site, se tiver roteiros nela
  const { f, set, toggle, reset } = useFilters({
    vibe: ["vibe", "one"], busca: ["busca", "one"], cidade: ["cidade", "one", globalCity && all.some(x => x.city === globalCity) ? globalCity : "todas"],
    bairro: ["bairro", "set"], tamanho: ["tamanho", "set"], ordem: ["ordem", "one", "relevancia"],
  });
  const vibe = vibeFromSlug(f.vibe), query = f.busca, cityF = f.cidade === "todas" ? "" : f.cidade;
  const pickVibe = (id) => set("vibe", id === vibe ? "" : vibeSlug(id));

  const anyCity = useMemo(() => all.filter(x => (!vibe || x.vibes.includes(vibe)) && (!query || x.text.includes(fslug(query)))), [all, vibe, query]);
  const cityCounts = useMemo(() => anyCity.reduce((m, x) => (x.city ? { ...m, [x.city]: (m[x.city] || 0) + 1 } : m), {}), [anyCity]);
  const base = useMemo(() => anyCity.filter(x => !cityF || x.city === cityF), [anyCity, cityF]);
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }

  const tests = {
    bairro: (x) => !f.bairro.size || x.bairros.some(b => f.bairro.has(fslug(b))),
    tamanho: (x) => !f.tamanho.size || STOPS.some(([k, , fn]) => f.tamanho.has(k) && fn(x.stops)),
  };
  const pass = (x, skip) => Object.entries(tests).every(([k, t]) => k === skip || t(x));
  const count = (key, fn) => base.filter(x => pass(x, key) && fn(x)).length;

  let results = base.filter(x => pass(x));
  if (f.ordem === "paradas") results = [...results].sort((x, y) => x.stops - y.stops);
  else if (f.ordem !== "relevancia") results = sortBy(results, f.ordem, { name: (x) => x.r.title });
  else if (vibe) results = [...results].sort((x, y) => x.vibes.indexOf(vibe) - y.vibes.indexOf(vibe));

  const a = vibe ? affById(vibe) : null;
  const BAIRROS = [...new Set(base.flatMap(x => x.bairros))].sort((x, y) => x.localeCompare(y, "pt-BR")).map(b => [fslug(b), b]);
  const label = (list, v) => list.find(([k]) => k === v)?.[1] || v;
  const chipsOf = (key, list) => [...f[key]].map(v => ({ key: key + v, label: label(list, v), onRemove: () => toggle(key, v) }));
  const chips = [
    ...(a ? [{ key: "vibe", label: a.label, onRemove: () => set("vibe", "") }] : []),
    ...(query ? [{ key: "q", label: `“${query}”`, onRemove: () => set("busca", "") }] : []),
    ...chipsOf("bairro", BAIRROS), ...chipsOf("tamanho", STOPS),
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
        <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} active={filterCount} onClear={clearAll} total={results.length} noun={results.length === 1 ? "roteiro" : "roteiros"}>
          <SearchBlock value={query} onChange={(v) => set("busca", v)} placeholder="Nome, lugar ou bairro" />
          <FilterBlock title="Cidade"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>
          <FilterBlock title="Bairro / Região">
            <CheckList options={BAIRROS.map(([value, l]) => ({ value, label: l, count: count("bairro", x => x.bairros.some(b => fslug(b) === value)) }))} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" />
          </FilterBlock>
          <FilterBlock title="Tamanho">
            <CheckList options={STOPS.map(([value, l, fn]) => ({ value, label: l, count: count("tamanho", x => fn(x.stops)) }))} selected={f.tamanho} onToggle={(v) => toggle("tamanho", v)} />
          </FilterBlock>
        </FilterPanel>

        <section className="results" id="resultados">
          <ResultsBar title={`${results.length} ${results.length === 1 ? "roteiro" : "roteiros"} ${cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}`}
            active={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={f.ordem} sorts={SORTS} onSort={(v) => set("ordem", v)} />
          <ActiveChips chips={chips} onClear={() => { clearAll(); set("vibe", ""); }} />

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>Nenhum roteiro com esses filtros.</h3>
              <p>Tente outra vibe ou afrouxe um filtro.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); set("vibe", ""); }}>Limpar filtros</button>
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
