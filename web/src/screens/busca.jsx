// Busca (/busca?q=…): resultados de todo o site em abas (Tudo, Lugares, Eventos, Roteiros, Radar, Páginas),
// com filtros próprios de cada tipo, ordenação e tudo guardado no link.
import { useMemo, useState } from "react";
import { CITIES, TYPES, VIBE_ORDER, EVENT_CATEGORIES, RADAR_CATEGORIES } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { Crumbs, VibePill, PlaceCard, EventCard, RoteiroCard, Footer, affById } from "../components/site.jsx";
import { StoryCard } from "./historia.jsx";
import { SearchBox, searchPath } from "../components/searchbox.jsx";
import { useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { go, href, vibePath } from "../router.js";
import { WHEN, inRange, byDate } from "../events.js";
import { roteiroVibes } from "../vibes.js";
import { search, shortcuts, didYouMean, kindsOn, recentSearches, saveRecent } from "../search.js";
import { useFilters, FilterPanel, FilterBlock, CheckList, CheckRow, ResultsBar, ActiveChips, sortBy, fslug, recentOf } from "../filters.jsx";

const TAB_SORTS = { lugares: ["relevancia", "az", "recentes"], eventos: ["relevancia", "data", "az"], roteiros: ["relevancia", "az", "recentes", "paradas"], radar: ["relevancia", "recentes", "az"], paginas: ["relevancia", "az"] };
const STOPS = [["curto", "Até 3 paradas", (n) => n <= 3], ["longo", "4 paradas ou mais", (n) => n >= 4]];
const TUDO_MAX = { place: 6, event: 3, roteiro: 3, story: 3, page: 4 };
const nounOf = (k, n) => `${n} ${n === 1 ? k.one : k.many}`;
const goPath = (path) => (e) => { if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return; e?.preventDefault(); go(path); window.scrollTo(0, 0); };

function PageResult({ d }) {
  return (
    <a className="search-page-card" href={href(d.path)} onClick={goPath(d.path)}>
      <span className="search-page-ico"><Icon name="list" size={18} /></span>
      <span><strong>{d.title}</strong>{d.item.excerpt && <em>{d.item.excerpt}</em>}</span>
      <Icon name="arrow" size={16} />
    </a>
  );
}
function ResultCard({ d }) {
  if (d.kind === "place") return <PlaceCard p={d.item} />;
  if (d.kind === "event") return <EventCard e={d.item} />;
  if (d.kind === "roteiro") return <RoteiroCard r={d.item} />;
  if (d.kind === "story") return <StoryCard s={d.item} />;
  return <PageResult d={d} />;
}
function Grid({ kind, list }) {
  if (kind === "story") return <div className="stories-grid stories-2 stories-all search-stories">{list.map(d => <ResultCard key={d.id} d={d} />)}</div>;
  if (kind === "page") return <div className="search-pages">{list.map(d => <ResultCard key={d.id} d={d} />)}</div>;
  return <div className="listing-grid">{list.map(d => <ResultCard key={d.id} d={d} />)}</div>;
}

export function Busca({ q: q0 = "", tab: tab0 = "" }) {
  const { set: setGlobalCity } = useCity();
  const kinds = kindsOn();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { f, set, toggle, reset } = useFilters({
    q: ["q", "one"], tipo: ["tipo", "one", "tudo"], ordem: ["ordem", "one", "relevancia"],
    cidade: ["cidade", "one", "todas"], bairro: ["bairro", "set"], vibe: ["vibe", "set"],
    tipoLugar: ["tipo-de-lugar", "set"],
    quando: ["quando", "one"], categoria: ["categoria", "set"], encerrados: ["encerrados", "bool"],
    tamanho: ["paradas", "set"], radar: ["assunto", "set"],
  });
  const query = f.q.trim();
  const tab = kinds.some(k => k.id === f.tipo) ? f.tipo : "tudo";
  const K = kinds.find(k => k.id === tab);
  const cityF = f.cidade === "todas" ? "" : f.cidade;
  const now = new Date();

  const found = useMemo(() => search(query, { kinds: kinds.map(k => k.kind) }), [query, kinds.map(k => k.kind).join()]); // eslint-disable-line
  // eventos encerrados só entram com o filtro ligado
  const all = useMemo(() => found.results.filter(d => d.kind !== "event" || !d.past || f.encerrados), [found, f.encerrados]);
  const byKind = (kind) => all.filter(d => d.kind === kind);

  // ---------- filtros da aba ----------
  const catOf = (e) => EVENT_CATEGORIES.find(c => c.id === e.category);
  const catSlug = (c) => c.slug || fslug(c.label);
  const vibesOf = (d) => d.kind === "roteiro" ? roteiroVibes(d.item) : d.item.affs || [];
  const tests = {
    cidade: (d) => !cityF || d.city === cityF,
    bairro: (d) => !f.bairro.size || d.bairros.some(b => f.bairro.has(fslug(b))),
    vibe: (d) => !f.vibe.size || vibesOf(d).some(a => f.vibe.has(a)),
    tipoLugar: (d) => !f.tipoLugar.size || f.tipoLugar.has(fslug(d.item.type)),
    quando: (d) => !f.quando || inRange(d.item, (WHEN.find(w => w[0] === f.quando) || WHEN[0])[2](now)),
    categoria: (d) => !f.categoria.size || (catOf(d.item) && f.categoria.has(catSlug(catOf(d.item)))),
    tamanho: (d) => !f.tamanho.size || STOPS.some(([k, , fn]) => f.tamanho.has(k) && fn(d.item.steps?.length || 0)),
    radar: (d) => !f.radar.size || f.radar.has(fslug(d.item.tag)),
  };
  const KEYS = { lugares: ["cidade", "bairro", "tipoLugar", "vibe"], eventos: ["quando", "cidade", "bairro", "categoria", "vibe"], roteiros: ["cidade", "bairro", "vibe", "tamanho"], radar: ["radar"], paginas: [] }[tab] || [];
  const base = K ? byKind(K.kind) : [];
  const pass = (d, skip) => KEYS.every(k => k === skip || tests[k](d));
  const count = (key, fn) => base.filter(d => pass(d, key) && fn(d)).length;
  let results = base.filter(d => pass(d));
  if (f.ordem === "data") results = [...results].sort((a, b) => byDate(a.item, b.item));
  else if (f.ordem === "paradas") results = [...results].sort((a, b) => (a.item.steps?.length || 0) - (b.item.steps?.length || 0));
  else if (f.ordem === "recentes") results = [...results].sort((a, b) => recentOf(b.item).localeCompare(recentOf(a.item)));
  else if (f.ordem !== "relevancia") results = sortBy(results, f.ordem, { name: (d) => d.title });

  const opt = (key, list, get) => list.map(([value, label]) => ({ value, label, count: count(key, d => get(d).includes(value)) }));
  const BAIRROS = [...new Set(base.flatMap(d => d.bairros))].sort((x, y) => x.localeCompare(y, "pt-BR")).map(b => [fslug(b), b]);
  const TIPOS = TYPES.map(t => [fslug(t.label), t.label]);
  const VIBES = VIBE_ORDER.map(id => [id, affById(id)?.label || id]);
  const CATS = EVENT_CATEGORIES.map(c => [catSlug(c), c.label]);
  const RCATS = [...new Set([...RADAR_CATEGORIES.map(c => c.label), ...base.map(d => d.item.tag)].filter(Boolean))].map(l => [fslug(l), l]);
  const cityCounts = base.filter(d => pass(d, "cidade")).reduce((m, d) => (d.city ? { ...m, [d.city]: (m[d.city] || 0) + 1 } : m), {});
  const lab = (list, v) => list.find(([k]) => k === v)?.[1] || v;
  const setChips = (key, list) => [...f[key]].map(v => ({ key: key + v, label: lab(list, v), onRemove: () => toggle(key, v) }));
  const chips = !K ? [] : [
    ...(KEYS.includes("cidade") && cityF ? [{ key: "c", label: CITIES.find(c => c.id === cityF)?.name || cityF, onRemove: () => set("cidade", "todas") }] : []),
    ...(KEYS.includes("quando") && f.quando ? [{ key: "w", label: WHEN.find(w => w[0] === f.quando)?.[1] || f.quando, onRemove: () => set("quando", "") }] : []),
    ...(KEYS.includes("bairro") ? setChips("bairro", BAIRROS) : []),
    ...(KEYS.includes("tipoLugar") ? setChips("tipoLugar", TIPOS) : []),
    ...(KEYS.includes("categoria") ? setChips("categoria", CATS) : []),
    ...(KEYS.includes("vibe") ? setChips("vibe", VIBES) : []),
    ...(KEYS.includes("tamanho") ? setChips("tamanho", STOPS.map(([k, l]) => [k, l])) : []),
    ...(KEYS.includes("radar") ? setChips("radar", RCATS) : []),
    ...(tab === "eventos" && f.encerrados ? [{ key: "past", label: "Com encerrados", onRemove: () => set("encerrados", false) }] : []),
  ];
  function clearAll() { reset(["bairro", "vibe", "tipoLugar", "quando", "categoria", "encerrados", "tamanho", "radar"]); set("cidade", "todas"); }
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }
  function pickTab(id) { set("tipo", id); if (!(TAB_SORTS[id] || []).includes(f.ordem)) set("ordem", "relevancia"); window.scrollTo({ top: 0 }); }

  const sc = useMemo(() => shortcuts(query, 8), [query]);
  const suggestion = !all.length && query ? didYouMean(query) : "";
  const recent = recentSearches();
  const runSearch = (v) => { set("q", v); if (v) saveRecent(v); };

  const heading = query ? <>Resultados para “{query}”</> : "Buscar no Onde Sair";
  const lede = !query ? "Lugares, eventos, roteiros, posts do Radar e páginas, tudo num lugar só."
    : all.length ? `${all.length} resultado${all.length === 1 ? "" : "s"}${found.partial ? " (sem todas as palavras)" : ""}`
    : "Nenhum resultado.";

  return (
    <main className="home2 search-page">
      <div className="shell">
        <header className="search-head">
          <Crumbs items={[["Início", "home"], ["Busca"]]} />
          <h1 className="page-title">{heading}</h1>
          <p className="search-lede">{lede}</p>
          <SearchBox variant="page" value={query} onSubmit={runSearch} />
          {query && (
            <nav className="search-tabs" aria-label="Tipos de resultado">
              <button type="button" className={tab === "tudo" ? "on" : ""} aria-current={tab === "tudo" ? "page" : undefined} onClick={() => pickTab("tudo")}>Tudo <em>{all.length}</em></button>
              {kinds.map(k => {
                const n = byKind(k.kind).length;
                return <button key={k.id} type="button" className={(tab === k.id ? "on" : "") + (n ? "" : " is-empty")} aria-current={tab === k.id ? "page" : undefined} onClick={() => pickTab(k.id)}><Icon name={k.icon} size={15} /> {k.label} <em>{n}</em></button>;
              })}
            </nav>
          )}
        </header>
      </div>

      {/* sem busca: recentes e atalhos para explorar */}
      {!query && (
        <div className="shell search-explore">
          {recent.length > 0 && (
            <section className="search-block">
              <h2>Buscas recentes</h2>
              <div className="search-chips">{recent.map(r => <button key={r} type="button" className="soft-tag" onClick={() => runSearch(r)}><Icon name="clock" size={14} /> {r}</button>)}</div>
            </section>
          )}
          <section className="search-block">
            <h2>Explore por vibe</h2>
            <div className="hero2-vibes">{VIBE_ORDER.map(id => <VibePill key={id} aff={id} onClick={() => { go(vibePath(id)); window.scrollTo(0, 0); }} />)}</div>
          </section>
          <section className="search-block">
            <h2>Ou navegue pelas seções</h2>
            <div className="search-sections">
              {[["/lugares", "Lugares", "pin"], ...kinds.filter(k => k.kind === "event").map(() => ["/eventos", "Eventos", "calendar"]), ...kinds.filter(k => k.kind === "roteiro").map(() => ["/roteiros", "Roteiros", "map"]), ["/radar", "Radar", "sparkle"]].map(([p, l, i]) => (
                <a key={p} href={href(p)} onClick={goPath(p)} className="search-section-link"><Icon name={i} size={20} /> {l} <Icon name="arrow" size={16} /></a>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* com busca e nada encontrado */}
      {query && !all.length && (
        <div className="shell">
          <div className="empty-state search-empty">
            <h3>Nada encontrado para “{query}”.</h3>
            {suggestion && <p>Você quis dizer <a href={href(searchPath(suggestion))} onClick={(e) => { e.preventDefault(); runSearch(suggestion); }}><strong>{suggestion}</strong></a>?</p>}
            {!found.results.length ? <p>Confira a grafia, use menos palavras ou tente algo mais geral, como “bar”, “café” ou o nome do bairro.</p>
              : <p>Há eventos encerrados com essa busca. <button type="button" className="link-btn strong" onClick={() => { set("encerrados", true); pickTab("eventos"); }}>Ver encerrados</button></p>}
            <div className="hero2-vibes search-empty-vibes">{VIBE_ORDER.slice(0, 6).map(id => <VibePill key={id} aff={id} onClick={() => { go(vibePath(id)); window.scrollTo(0, 0); }} />)}</div>
          </div>
        </div>
      )}

      {/* aba Tudo: atalhos e uma seção por tipo */}
      {query && all.length > 0 && tab === "tudo" && (
        <div className="shell search-all">
          {found.partial && <p className="search-partial"><Icon name="info" size={16} /> Nenhum resultado tem todas as palavras de “{query}”. Mostrando os que têm parte delas.</p>}
          {sc.length > 0 && (
            <section className="search-block">
              <h2>Atalhos</h2>
              <div className="search-chips">
                {sc.map(s => <a key={s.kind + s.label} href={href(s.path)} onClick={goPath(s.path)} className="search-shortcut"><Icon name={s.icon} size={15} /> <span>{s.label}</span> <em>{s.kind}</em></a>)}
              </div>
            </section>
          )}
          {kinds.map(k => {
            const list = byKind(k.kind);
            if (!list.length) return null;
            return (
              <section className="search-block" key={k.id}>
                <div className="h2-head">
                  <h2>{k.label} <small>{list.length}</small></h2>
                  {list.length > TUDO_MAX[k.kind] && <button type="button" className="h2-link" onClick={() => pickTab(k.id)}>Ver todos os {nounOf(k, list.length)} <Icon name="arrow" size={16} /></button>}
                </div>
                <Grid kind={k.kind} list={list.slice(0, TUDO_MAX[k.kind])} />
              </section>
            );
          })}
        </div>
      )}

      {/* abas de um tipo: filtros + resultados */}
      {query && all.length > 0 && K && (
        <div className="shell listing-layout">
          <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} active={chips.length} onClear={clearAll} total={results.length} noun={results.length === 1 ? K.one : K.many}>
            {KEYS.includes("quando") && (
              <FilterBlock title="Quando">
                {WHEN.map(([k, l, fn]) => <CheckRow key={k} checked={f.quando === k} onChange={() => set("quando", f.quando === k ? "" : k)} count={count("quando", d => inRange(d.item, fn(now)))}>{l}</CheckRow>)}
              </FilterBlock>
            )}
            {KEYS.includes("cidade") && <FilterBlock title="Cidade"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>}
            {KEYS.includes("bairro") && BAIRROS.length > 0 && (
              <FilterBlock title="Bairro / Região"><CheckList options={opt("bairro", BAIRROS, d => d.bairros.map(fslug))} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" /></FilterBlock>
            )}
            {KEYS.includes("tipoLugar") && <FilterBlock title="Tipo de lugar"><CheckList options={opt("tipoLugar", TIPOS, d => [fslug(d.item.type)])} selected={f.tipoLugar} onToggle={(v) => toggle("tipoLugar", v)} /></FilterBlock>}
            {KEYS.includes("categoria") && <FilterBlock title="Categoria"><CheckList options={opt("categoria", CATS, d => catOf(d.item) ? [catSlug(catOf(d.item))] : [])} selected={f.categoria} onToggle={(v) => toggle("categoria", v)} /></FilterBlock>}
            {KEYS.includes("vibe") && <FilterBlock title="Vibe"><CheckList options={opt("vibe", VIBES, vibesOf)} selected={f.vibe} onToggle={(v) => toggle("vibe", v)} /></FilterBlock>}
            {KEYS.includes("tamanho") && <FilterBlock title="Tamanho"><CheckList options={STOPS.map(([k, l, fn]) => ({ value: k, label: l, count: count("tamanho", d => fn(d.item.steps?.length || 0)) }))} selected={f.tamanho} onToggle={(v) => toggle("tamanho", v)} /></FilterBlock>}
            {KEYS.includes("radar") && <FilterBlock title="Assunto"><CheckList options={opt("radar", RCATS, d => [fslug(d.item.tag)])} selected={f.radar} onToggle={(v) => toggle("radar", v)} /></FilterBlock>}
            {tab === "eventos" && <FilterBlock title="Encerrados"><CheckRow checked={f.encerrados} onChange={() => set("encerrados", !f.encerrados)}>Incluir eventos encerrados</CheckRow></FilterBlock>}
            {!KEYS.length && tab !== "eventos" && <p className="filter-empty">Sem filtros para páginas.</p>}
          </FilterPanel>

          <section className="results" id="resultados">
            <ResultsBar title={`${nounOf(K, results.length)} para “${query}”`} active={chips.length} onOpenFilters={() => setFiltersOpen(true)}
              sort={(TAB_SORTS[tab] || []).includes(f.ordem) ? f.ordem : "relevancia"} sorts={TAB_SORTS[tab] || ["relevancia"]} onSort={(v) => set("ordem", v)} />
            <ActiveChips chips={chips} onClear={clearAll} />
            {results.length === 0 ? (
              <div className="empty-state">
                <h3>{base.length ? "Nada bateu com esses filtros." : `Nenhum ${K.one} para “${query}”.`}</h3>
                <p>{base.length ? "Tente afrouxar um filtro." : "Veja os outros tipos de resultado nas abas acima."}</p>
                {base.length > 0 && <button className="btn-outline" onClick={clearAll}>Limpar filtros</button>}
              </div>
            ) : <Grid kind={K.kind} list={results} />}
          </section>
        </div>
      )}

      <Footer />
    </main>
  );
}
