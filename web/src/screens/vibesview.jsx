// Vibes (/vibes e /vibes/{slug}): lugares e roteiros juntos, no modelo da lista de lugares.
// O menu de vibes fica no topo, com a vibe da página marcada.
import { useMemo, useState } from "react";
import { PLACES, ROTEIROS, VIBE_ORDER, VIBE_PAGE, CITIES, TYPES, vibeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { htmlToText } from "../richtext.js";
import { HeroMedia, Crumbs, VibePill, PlaceCard, RoteiroCard, Footer, affById, placeById } from "../components/site.jsx";
import { useNav, useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { roteiroVibes, roteiroBairros } from "../vibes.js";
import { SITE } from "../admin/store.js";
import { useFilters, FilterPanel, FilterBlock, SearchBlock, CheckList, ResultsBar, ActiveChips, sortBy, fslug, WhenFilter, whenChips } from "../filters.jsx";
import { matchesWhen } from "../hours.js";

const SORTS = ["relevancia", "az", "recentes"];
const STOPS = [["curto", "Até 3 paradas", (n) => n <= 3], ["longo", "4 paradas ou mais", (n) => n >= 4]];

// item da listagem: lugar ou roteiro com os campos usados nos filtros
function asItems() {
  const places = PLACES.map(p => ({ kind: "lugar", id: p.id, name: p.name, vibes: p.affs || [], city: p.city, bairros: [p.bairro].filter(Boolean), p,
    text: fslug([p.name, p.bairro, p.type, htmlToText(p.desc || ""), p.sub, ...(p.tags || [])].join(" ")) }));
  const rots = SITE.roteirosHidden ? [] : ROTEIROS.map(r => {
    const stops = r.steps.map(s => s.place && placeById(s.place)).filter(Boolean);
    const bairros = roteiroBairros(r, placeById);
    return { kind: "roteiro", id: r.id, name: r.title, vibes: roteiroVibes(r), city: stops[0]?.city || "", bairros, r,
      stops: r.steps.length, text: fslug([r.title, r.desc, ...bairros, ...(r.tags || []).map(t => t[0] || t), ...stops.map(p => p.name)].join(" ")) };
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { f, set, toggle, reset } = useFilters({
    busca: ["busca", "one", q], mostrar: ["mostrar", "set"], cidade: ["cidade", "one", globalCity || "todas"], bairro: ["bairro", "set"],
    tipo: ["tipo", "set"], tamanho: ["tamanho", "set"], aberto: ["aberto", "bool"], dia: ["dia", "one"], periodo: ["periodo", "one"], ordem: ["ordem", "one", "relevancia"],
  });
  const when = { agora: f.aberto, dia: f.dia, periodo: f.periodo };
  const setWhen = (k, v) => set(k === "agora" ? "aberto" : k, v);
  const query = f.busca, cityF = f.cidade === "todas" ? "" : f.cidade, kinds = f.mostrar;

  const a = aff ? affById(aff) : null;
  const page = aff ? VIBE_PAGE[aff] : null;
  const all = useMemo(asItems, []);
  const hasRoteiros = all.some(x => x.kind === "roteiro");

  // vibe + busca (sem cidade): base das contagens por cidade
  const anyCity = useMemo(() => all.filter(x => (!aff || x.vibes.includes(aff)) && (!query || x.text.includes(fslug(query)))), [all, aff, query]);
  const cityCounts = useMemo(() => anyCity.reduce((m, x) => (x.city ? { ...m, [x.city]: (m[x.city] || 0) + 1 } : m), {}), [anyCity]);
  const base = useMemo(() => anyCity.filter(x => !cityF || x.city === cityF), [anyCity, cityF]);
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }

  // filtros de lugar valem só para lugares; os de roteiro, só para roteiros
  const shown = (kind) => !kinds.size || kinds.has(kind);
  const tests = {
    mostrar: (x) => shown(x.kind),
    bairro: (x) => !f.bairro.size || x.bairros.some(b => f.bairro.has(fslug(b))),
    tipo: (x) => x.kind !== "lugar" || !f.tipo.size || f.tipo.has(fslug(x.p.type)),
    when: (x) => x.kind !== "lugar" || matchesWhen(x.p, when),
    tamanho: (x) => x.kind !== "roteiro" || !f.tamanho.size || STOPS.some(([k, , fn]) => f.tamanho.has(k) && fn(x.stops)),
  };
  const pass = (x, skip) => Object.entries(tests).every(([k, t]) => k === skip || t(x));
  const count = (key, fn) => base.filter(x => pass(x, key) && fn(x)).length;

  let results = base.filter(x => pass(x));
  const rank = (x) => (aff ? x.vibes.indexOf(aff) : 0);
  results = f.ordem === "relevancia" ? interleave([...results].sort((x, y) => rank(x) - rank(y)))
    : sortBy(results, f.ordem, { name: (x) => x.name });

  const nPlaces = results.filter(x => x.kind === "lugar").length, nRots = results.length - nPlaces;
  const BAIRROS = [...new Set(base.flatMap(x => x.bairros))].sort((x, y) => x.localeCompare(y, "pt-BR")).map(b => [fslug(b), b]);
  const TIPOS = TYPES.map(t => [fslug(t.label), t.label]);
  const KINDS = [["lugar", "Lugares"], ["roteiro", "Roteiros"]];
  const label = (list, v) => list.find(([k]) => k === v)?.[1] || v;
  const chipsOf = (key, list) => [...f[key]].map(v => ({ key: key + v, label: label(list, v), onRemove: () => toggle(key, v) }));
  const chips = [
    ...(query ? [{ key: "q", label: `“${query}”`, onRemove: () => set("busca", "") }] : []),
    ...chipsOf("mostrar", KINDS), ...chipsOf("bairro", BAIRROS),
    ...chipsOf("tipo", TIPOS), ...chipsOf("tamanho", STOPS),
    ...whenChips(when, setWhen),
  ];
  const filterCount = chips.length;
  function clearAll() { reset(["busca", "mostrar", "bairro", "tipo", "tamanho", "aberto", "dia", "periodo"]); }

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
          {/* menu de vibes, como na lista de lugares: a vibe da página fica marcada; tocar nela de novo volta para todas */}
          <nav className="hero2-vibes vibes-menu" aria-label="Vibes">
            {VIBE_ORDER.map(id => (
              <VibePill key={id} aff={id} active={aff === id} onClick={() => nav("vibes", aff === id ? {} : { aff: id })} />
            ))}
          </nav>
        </div>
      </section>

      <div className="shell listing-layout">
        <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} active={filterCount} onClear={clearAll} total={results.length} noun="resultados">
          <SearchBlock value={query} onChange={(v) => set("busca", v)} placeholder="Nome, bairro ou tag" />
          {hasRoteiros && (
            <FilterBlock title="Mostrar">
              <CheckList options={KINDS.map(([value, l]) => ({ value, label: l, count: count("mostrar", x => x.kind === value) }))} selected={kinds} onToggle={(v) => toggle("mostrar", v)} />
            </FilterBlock>
          )}
          <FilterBlock title="Cidade"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>
          <FilterBlock title="Bairro / Região">
            <CheckList options={BAIRROS.map(([value, l]) => ({ value, label: l, count: count("bairro", x => x.bairros.some(b => fslug(b) === value)) }))} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" />
          </FilterBlock>
          {shown("lugar") && <>
            <p className="filters-group">Só para lugares</p>
            <FilterBlock title="Tipo de lugar">
              <CheckList options={TIPOS.map(([value, l]) => ({ value, label: l, count: count("tipo", x => x.kind === "lugar" && fslug(x.p.type) === value) }))} selected={f.tipo} onToggle={(v) => toggle("tipo", v)} />
            </FilterBlock>
            <WhenFilter value={when} onChange={setWhen} count={(patch) => count("when", x => x.kind === "lugar" && matchesWhen(x.p, { ...when, ...patch }))} />
          </>}
          {hasRoteiros && shown("roteiro") && <>
            <p className="filters-group">Só para roteiros</p>
            <FilterBlock title="Tamanho">
              <CheckList options={STOPS.map(([value, l, fn]) => ({ value, label: l, count: count("tamanho", x => x.kind === "roteiro" && fn(x.stops)) }))} selected={f.tamanho} onToggle={(v) => toggle("tamanho", v)} />
            </FilterBlock>
          </>}
        </FilterPanel>

        <section className="results" id="resultados">
          <ResultsBar title={`${summary} ${cityF ? `em ${CITIES.find(c => c.id === cityF)?.name || city}` : "em todas as cidades"}`}
            active={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={f.ordem} sorts={SORTS} onSort={(v) => set("ordem", v)} />
          <ActiveChips chips={chips} onClear={clearAll} />

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>Nada bateu com esses filtros.</h3>
              <p>Tente afrouxar um filtro ou escolher outra vibe.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={clearAll}>Limpar filtros</button>
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
