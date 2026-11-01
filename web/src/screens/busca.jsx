// Busca (/busca?q=…): resultados de todo o site em abas (Tudo, Lugares, Eventos, Roteiros, Radar, Páginas),
// com filtros próprios de cada tipo, ordenação e tudo guardado no link.
import { useState } from "react";
import { CITIES, VIBE_ORDER, PLACES, ROTEIROS, ALL_STORIES, EVENTS } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { Crumbs, VibePill, PlaceCard, EventCard, RoteiroCard, Footer, affById } from "../components/site.jsx";
import { StoryCard } from "./historia.jsx";
import { SearchBox, searchPath } from "../components/searchbox.jsx";
import { useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { go, href, vibePath, goTop } from "../router.js";
import { WHEN } from "../events.js";
import { kindsOn, recentSearches, saveRecent } from "../search.js";
import { usePagedFilters, useListing, listItems, labelOf, Pagination, whenCount, FilterPanel, FilterBlock, CheckList, CheckRow, ResultsBar, ActiveChips, WhenFilter, whenChips } from "../filters.jsx";
import { BUSCA_SORTS, TUDO_MAX } from "../listings.js";

const nounOf = (k, n) => `${n} ${n === 1 ? k.one : k.many}`;
const goPath = (path) => (e) => { if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return; e?.preventDefault(); goTop(path); };

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
  const { f, set, toggle, reset, page: pageN, setPage } = usePagedFilters({
    q: ["q", "one"], tipo: ["tipo", "one", "tudo"], ordem: ["ordem", "one", "relevancia"],
    cidade: ["cidade", "one", "todas"], bairro: ["bairro", "set"], vibe: ["vibe", "set"],
    tipoLugar: ["tipo-de-lugar", "set"], aberto: ["aberto", "bool"], dia: ["dia", "one"], periodo: ["periodo", "one"],
    quando: ["quando", "one"], categoria: ["categoria", "set"], encerrados: ["encerrados", "bool"],
    tamanho: ["paradas", "set"], radar: ["assunto", "set"],
  });
  const query = f.q.trim();
  const when = { agora: f.aberto, dia: f.dia, periodo: f.periodo };
  const setWhen = (k, v) => set(k === "agora" ? "aberto" : k, v);
  const tab = kinds.some(k => k.id === f.tipo) ? f.tipo : "tudo";
  const K = kinds.find(k => k.id === tab);
  const cityF = f.cidade === "todas" ? "" : f.cidade;

  // o servidor busca, filtra, conta e devolve só a página atual
  const { data, loading } = useListing("busca", f, { page: pageN });
  const L = data?.list || { total: 0, page: 1, pages: 1, facets: {}, cityCounts: {}, when: null, extra: {} };
  const X = L.extra || {};
  const lists = { places: PLACES, roteiros: ROTEIROS, stories: ALL_STORIES, events: EVENTS };
  const asDoc = (x) => ({ kind: x.kind, id: x.id, item: x.item, title: x.item.title || x.item.name, path: x.item.path });
  const results = listItems(data, lists).map(asDoc);
  const groupDocs = (g) => listItems({ list: { refs: g.refs }, db: data?.db }, lists).map(asDoc);
  const totalAll = X.total || 0, tabCount = (id) => X.tabCounts?.[id] || 0;
  const KEYS = X.keys || [];
  const facet = (key) => L.facets[key] || [];
  const cityCounts = L.cityCounts;
  const setChips = (key) => [...f[key]].map(v => ({ key: key + v, label: labelOf(facet(key), v), onRemove: () => toggle(key, v) }));
  const chips = !K ? [] : [
    ...(KEYS.includes("cidade") && cityF ? [{ key: "c", label: CITIES.find(c => c.id === cityF)?.name || cityF, onRemove: () => set("cidade", "todas") }] : []),
    ...(KEYS.includes("quando") && f.quando ? [{ key: "w", label: WHEN.find(w => w[0] === f.quando)?.[1] || f.quando, onRemove: () => set("quando", "") }] : []),
    ...(KEYS.includes("bairro") ? setChips("bairro") : []),
    ...(KEYS.includes("tipoLugar") ? setChips("tipoLugar") : []),
    ...(KEYS.includes("categoria") ? setChips("categoria") : []),
    ...(KEYS.includes("vibe") ? setChips("vibe") : []),
    ...(KEYS.includes("tamanho") ? setChips("tamanho") : []),
    ...(KEYS.includes("radar") ? setChips("radar") : []),
    ...(KEYS.includes("when") ? whenChips(when, setWhen) : []),
    ...(tab === "eventos" && f.encerrados ? [{ key: "past", label: "Com encerrados", onRemove: () => set("encerrados", false) }] : []),
  ];
  function clearAll() { reset(["bairro", "vibe", "tipoLugar", "aberto", "dia", "periodo", "quando", "categoria", "encerrados", "tamanho", "radar"]); set("cidade", "todas"); }
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }
  function pickTab(id) { set("tipo", id); if (!(BUSCA_SORTS[id] || []).includes(f.ordem)) set("ordem", "relevancia"); window.scrollTo({ top: 0 }); }

  const sc = X.shortcuts || [];
  const suggestion = X.suggestion || "";
  const recent = recentSearches();
  const runSearch = (v) => { set("q", v); if (v) saveRecent(v); };
  const ready = !query || (data && X.query === query);

  const heading = query ? <>Resultados para “{query}”</> : "Buscar no Onde Sair";
  const lede = !query ? "Lugares, eventos, roteiros, posts do Radar e páginas, tudo num lugar só."
    : !ready ? "Buscando…"
    : totalAll ? `${totalAll} resultado${totalAll === 1 ? "" : "s"}${X.partial ? " (sem todas as palavras)" : ""}`
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
              <button type="button" className={tab === "tudo" ? "on" : ""} aria-current={tab === "tudo" ? "page" : undefined} onClick={() => pickTab("tudo")}>Tudo <em>{totalAll}</em></button>
              {kinds.map(k => {
                const n = tabCount(k.id);
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
            <div className="hero2-vibes">{VIBE_ORDER.map(id => <VibePill key={id} aff={id} onClick={() => { goTop(vibePath(id)); }} />)}</div>
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
      {query && ready && !totalAll && (
        <div className="shell">
          <div className="empty-state search-empty">
            <h3>Nada encontrado para “{query}”.</h3>
            {suggestion && <p>Você quis dizer <a href={href(searchPath(suggestion))} onClick={(e) => { e.preventDefault(); runSearch(suggestion); }}><strong>{suggestion}</strong></a>?</p>}
            {!X.anyFound ? <p>Confira a grafia, use menos palavras ou tente algo mais geral, como “bar”, “café” ou o nome do bairro.</p>
              : <p>Há eventos encerrados com essa busca. <button type="button" className="link-btn strong" onClick={() => { set("encerrados", true); pickTab("eventos"); }}>Ver encerrados</button></p>}
            <div className="hero2-vibes search-empty-vibes">{VIBE_ORDER.slice(0, 6).map(id => <VibePill key={id} aff={id} onClick={() => { goTop(vibePath(id)); }} />)}</div>
          </div>
        </div>
      )}

      {/* aba Tudo: atalhos e uma seção por tipo */}
      {query && ready && totalAll > 0 && tab === "tudo" && (
        <div className={"shell search-all" + (loading ? " is-loading" : "")}>
          {X.partial && <p className="search-partial"><Icon name="info" size={16} /> Nenhum resultado tem todas as palavras de “{query}”. Mostrando os que têm parte delas.</p>}
          {sc.length > 0 && (
            <section className="search-block">
              <h2>Atalhos</h2>
              <div className="search-chips">
                {sc.map(s => <a key={s.kind + s.label} href={href(s.path)} onClick={goPath(s.path)} className="search-shortcut"><Icon name={s.icon} size={15} /> <span>{s.label}</span> <em>{s.kind}</em></a>)}
              </div>
            </section>
          )}
          {kinds.map(k => {
            const g = (X.groups || []).find(x => x.id === k.id);
            if (!g?.total) return null;
            return (
              <section className="search-block" key={k.id}>
                <div className="h2-head">
                  <h2>{k.label} <small>{g.total}</small></h2>
                  {g.total > TUDO_MAX[k.kind] && <button type="button" className="h2-link" onClick={() => pickTab(k.id)}>Ver todos os {nounOf(k, g.total)} <Icon name="arrow" size={16} /></button>}
                </div>
                <Grid kind={k.kind} list={groupDocs(g)} />
              </section>
            );
          })}
        </div>
      )}

      {/* abas de um tipo: filtros + resultados */}
      {query && ready && totalAll > 0 && K && (
        <div className="shell listing-layout">
          <FilterPanel sort={(BUSCA_SORTS[tab] || []).includes(f.ordem) ? f.ordem : "relevancia"} sorts={BUSCA_SORTS[tab] || ["relevancia"]} onSort={(v) => set("ordem", v)} open={filtersOpen} onClose={() => setFiltersOpen(false)} active={chips.length} onClear={clearAll} total={L.total} noun={L.total === 1 ? K.one : K.many}>
            {KEYS.includes("quando") && (
              <FilterBlock title="Quando">
                {facet("quando").map(({ value: k, label: l, count: n }) => <CheckRow key={k} checked={f.quando === k} onChange={() => set("quando", f.quando === k ? "" : k)} count={n}>{l}</CheckRow>)}
              </FilterBlock>
            )}
            {KEYS.includes("cidade") && <FilterBlock title="Cidade"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>}
            {KEYS.includes("bairro") && facet("bairro").length > 0 && (
              <FilterBlock title="Bairro / Região"><CheckList options={facet("bairro")} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" /></FilterBlock>
            )}
            {KEYS.includes("tipoLugar") && <FilterBlock title="Tipo de lugar"><CheckList options={facet("tipoLugar")} selected={f.tipoLugar} onToggle={(v) => toggle("tipoLugar", v)} /></FilterBlock>}
            {KEYS.includes("when") && <WhenFilter value={when} onChange={setWhen} count={whenCount(L.when)} />}
            {KEYS.includes("categoria") && <FilterBlock title="Categoria"><CheckList options={facet("categoria")} selected={f.categoria} onToggle={(v) => toggle("categoria", v)} /></FilterBlock>}
            {KEYS.includes("vibe") && <FilterBlock title="Vibe"><CheckList options={facet("vibe")} selected={f.vibe} onToggle={(v) => toggle("vibe", v)} /></FilterBlock>}
            {KEYS.includes("tamanho") && <FilterBlock title="Tamanho"><CheckList options={facet("tamanho")} selected={f.tamanho} onToggle={(v) => toggle("tamanho", v)} /></FilterBlock>}
            {KEYS.includes("radar") && <FilterBlock title="Assunto"><CheckList options={facet("radar")} selected={f.radar} onToggle={(v) => toggle("radar", v)} /></FilterBlock>}
            {tab === "eventos" && <FilterBlock title="Encerrados"><CheckRow checked={f.encerrados} onChange={() => set("encerrados", !f.encerrados)}>Incluir eventos encerrados</CheckRow></FilterBlock>}
            {!KEYS.length && tab !== "eventos" && <p className="filter-empty">Sem filtros para páginas.</p>}
          </FilterPanel>

          <section className={"results" + (loading ? " is-loading" : "")} id="resultados" aria-busy={loading}>
            <ResultsBar title={`${nounOf(K, L.total)} para “${query}”`} active={chips.length} onOpenFilters={() => setFiltersOpen(true)}
              sort={(BUSCA_SORTS[tab] || []).includes(f.ordem) ? f.ordem : "relevancia"} sorts={BUSCA_SORTS[tab] || ["relevancia"]} onSort={(v) => set("ordem", v)} />
            <ActiveChips chips={chips} onClear={clearAll} />
            {L.total === 0 ? (
              <div className="empty-state">
                <h3>{X.base ? "Nada bateu com esses filtros." : `Nenhum ${K.one} para “${query}”.`}</h3>
                <p>{X.base ? "Tente afrouxar um filtro." : "Veja os outros tipos de resultado nas abas acima."}</p>
                {X.base > 0 && <button className="btn-outline" onClick={clearAll}>Limpar filtros</button>}
              </div>
            ) : <><Grid kind={K.kind} list={results} /><Pagination page={L.page} pages={L.pages} onPage={setPage} loading={loading} /></>}
          </section>
        </div>
      )}

      <Footer />
    </main>
  );
}
