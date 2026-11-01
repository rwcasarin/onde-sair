// Radar (blog) — lista (/radar) e post (/radar/{slug}).
// Posts de lista trazem lugares cadastrados como cards no meio do texto.
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ALL_STORIES, PLACES, placeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, MiniPlaceCard, SectionHead, Footer, VibePill, FaveButton } from "../components/site.jsx";
import { useNav, useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { usePagedFilters, useListing, listItems, labelOf, Pagination, FilterPanel, FilterBlock, SearchBlock, CheckList, ResultsBar, ActiveChips } from "../filters.jsx";
import { href, storyPath, placePath, canGoBack } from "../router.js";
import { sanitizeHtml, asHtml } from "../richtext.js";
import { resolveMedia, publishedDate } from "../admin/store.js";
import { mountEmbeds } from "../embeds.js";
import { NotFound } from "./notfound.jsx";

const fmt = (iso) => { try { return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } };

export function StoryCard({ s }) {
  const nav = useNav();
  const when = publishedDate(s);
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: s.title, text: s.desc, url: location.href });
      else await navigator.clipboard?.writeText(location.href);
      setShared(true); setTimeout(() => setShared(false), 1800);
    } catch { /* cancelado */ }
  }
  return (
    <article className="story-card" onClick={() => nav("historia", { id: s.id })} style={{ cursor: "pointer" }}>
      <ImageSlot className="story-img" src={s.img} alt="" hint="3:4">
        <span className={"story-shape shape-" + s.shape} aria-hidden="true"></span>
      </ImageSlot>
      <div className="story-body">
        <span className={"story-tag tone-" + s.tone}>{s.tag}</span>
        <h3>{s.title}</h3>
        <p>{s.desc}</p>
        <div className="story-foot">
          {when && <span className="story-date">{fmt(when)}</span>}
          <a href={href(storyPath(s))} className="h2-link" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav("historia", { id: s.id }); }}>Ler mais <Icon name="arrow" size={16} /></a>
        </div>
      </div>
    </article>
  );
}

const RADAR_SORTS = ["recentes", "az"];

export function Historias() {
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { f, set, toggle, reset, page: pageN, setPage } = usePagedFilters({
    categoria: ["categoria", "one"], busca: ["busca", "one"], publicado: ["publicado", "set"], formato: ["formato", "set"],
    cidade: ["cidade", "one", globalCity || "todas"],
    bairro: ["bairro", "set"], vibe: ["vibe", "set"], autor: ["autor", "set"], ordem: ["ordem", "one", "recentes"],
  });
  const query = f.busca, cityF = f.cidade === "todas" ? "" : f.cidade;
  const { data, loading } = useListing("radar", f, { page: pageN });
  const L = data?.list || { total: 0, page: 1, pages: 1, facets: {}, cityCounts: {}, extra: {} };
  // a cidade do site não tem posts com lugares dela: mostra todas
  useEffect(() => { if (data && cityF && L.extra.anyInCity && !L.extra.anyInCity[cityF]) set("cidade", "todas"); }, [data]); // eslint-disable-line
  const cats = L.extra.cats || [];
  const cat = cats.find(c => c.slug === f.categoria) || null;
  const pickCat = (c) => set("categoria", !c || c.slug === f.categoria ? "" : c.slug);
  const results = listItems(data, { stories: ALL_STORIES }).map(x => x.item);
  const cityCounts = L.cityCounts;
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }

  const facet = (key) => L.facets[key] || [];
  const chipsOf = (key) => [...f[key]].map(v => ({ key: key + v, label: labelOf(facet(key), v), onRemove: () => toggle(key, v) }));
  const chips = [
    ...(cat ? [{ key: "cat", label: cat.label, onRemove: () => set("categoria", "") }] : []),
    ...(query ? [{ key: "q", label: `“${query}”`, onRemove: () => set("busca", "") }] : []),
    ...chipsOf("publicado"), ...chipsOf("formato"), ...chipsOf("bairro"), ...chipsOf("vibe"), ...chipsOf("autor"),
  ];
  const filterCount = chips.length - (cat ? 1 : 0);
  function clearAll() { reset(["busca", "publicado", "formato", "bairro", "vibe", "autor"]); }
  const noun = (n) => (n === 1 ? "post" : "posts");
  const total = L.extra.all ?? 0;

  return (
    <main className="home2">
      <div className="shell">
        <PageHead crumbs={[["Início", "home"], ["Radar"]]} title="Radar"
          lede={`Novidades, atualizações e listas de lugares: o radar de quem vive ${city || "a cidade"}.`}>
          {cats.length > 0 && (
            <nav className="radar-cats" aria-label="Categorias do Radar">
              <button type="button" className={"radar-chip radar-chip-all" + (!cat ? " on" : "")} aria-pressed={!cat} onClick={() => pickCat(null)}>
                Todos <span className="radar-chip-n">{total}</span>
              </button>
              {cats.map(c => {
                const n = c.count, on = cat?.slug === c.slug;
                return (
                  <button key={c.slug} type="button" className={"radar-chip tone-" + (c.tone || "purple") + (on ? " on" : "") + (!n && !on ? " is-empty" : "")} aria-pressed={on} onClick={() => pickCat(c)}>
                    {c.label} <span className="radar-chip-n">{n}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </PageHead>
      </div>

      <div className="shell listing-layout radar-layout">
        <FilterPanel sort={f.ordem} sorts={RADAR_SORTS} onSort={(v) => set("ordem", v)} open={filtersOpen} onClose={() => setFiltersOpen(false)} active={filterCount} onClear={clearAll} total={L.total} noun={noun(L.total)}>
          <SearchBlock value={query} onChange={(v) => set("busca", v)} placeholder="Assunto, lugar ou bairro" />
          <FilterBlock title="Publicado">
            <CheckList options={facet("publicado")} selected={f.publicado} onToggle={(v) => toggle("publicado", v)} />
          </FilterBlock>
          <FilterBlock title="Formato">
            <CheckList options={facet("formato")} selected={f.formato} onToggle={(v) => toggle("formato", v)} />
          </FilterBlock>
          <FilterBlock title="Cidade" note="(dos lugares citados)"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>
          {facet("bairro").length > 0 && (
            <FilterBlock title="Bairro / Região">
              <CheckList options={facet("bairro")} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" />
            </FilterBlock>
          )}
          {facet("vibe").length > 0 && (
            <FilterBlock title="Vibe dos lugares">
              <CheckList options={facet("vibe")} selected={f.vibe} onToggle={(v) => toggle("vibe", v)} />
            </FilterBlock>
          )}
          {facet("autor").length > 1 && (
            <FilterBlock title="Autor">
              <CheckList options={facet("autor")} selected={f.autor} onToggle={(v) => toggle("autor", v)} />
            </FilterBlock>
          )}
        </FilterPanel>

        <section className={"results" + (loading ? " is-loading" : "")} id="resultados" aria-busy={loading}>
          <ResultsBar title={`${L.total} ${noun(L.total)}${cat ? ` em ${cat.label}` : ""}`}
            active={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={f.ordem} sorts={RADAR_SORTS} onSort={(v) => set("ordem", v)} />
          <ActiveChips chips={chips} onClear={() => { clearAll(); set("categoria", ""); }} />
          {!data ? <div className="listing-grid radar-grid">{Array.from({ length: 4 }, (_, i) => <div key={i} className="card-skeleton" />)}</div> : L.total === 0 ? (
            <div className="empty-state">
              <h3>Nenhum post com esses filtros.</h3>
              <p>Tente outra categoria ou afrouxe um filtro.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); set("categoria", ""); }}>Limpar filtros</button>
                {cityF && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : (
            <>
              <div className="listing-grid radar-grid">{results.map(s => <StoryCard key={s.id} s={s} />)}</div>
              <Pagination page={L.page} pages={L.pages} onPage={setPage} loading={loading} />
            </>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
}

// Card de lugar dentro do post: foto, informações principais e link para a página do lugar
export function PostPlaceCard({ p, n }) {
  const nav = useNav();
  const go = (e) => { e.preventDefault(); nav("detalhe", { id: p.id }); };
  return (
    <article className="post-place">
      <a className="post-place-img" href={href(placePath(p))} onClick={go} tabIndex={-1} aria-hidden="true">
        <ImageSlot className="post-place-photo" src={placeImg(p.id)} alt="" hint="4:3" compact />
        {n ? <span className="post-place-n">{n}</span> : null}
      </a>
      <div className="post-place-body">
        <div className="post-place-head">
          <h3><a href={href(placePath(p))} onClick={go}>{n ? <span className="sr-only">{n}. </span> : null}{p.name}</a></h3>
          <FaveButton id={p.id} />
        </div>
        <p className="post-place-sub">{p.sub}{p.bairro ? <> • <Icon name="pin" size={13} /> {p.bairro}</> : null}</p>
        <div className="post-place-vibes">{p.affs.slice(0, 2).map(a => <VibePill key={a} aff={a} size="sm" />)}</div>
        {p.tagline && <p className="post-place-tagline">{p.tagline}</p>}
        <div className="post-place-meta">
          {p.open && <span className="post-place-open"><Icon name="clock" size={13} /> {p.open.split(" · ").slice(0, 2).join(" · ")}</span>}
        </div>
        <a className="btn-pill post-place-cta" href={href(placePath(p))} onClick={go}>Saiba mais <Icon name="arrow" size={14} /></a>
      </div>
    </article>
  );
}

const PLACE_RE = /<figure class="place" data-place="([\w-]+)"><\/figure>/g;

// Texto do post: trechos de HTML intercalados com os cards de lugar
function PostBody({ s }) {
  const ref = useRef(null);
  const parts = useMemo(() => {
    const html = sanitizeHtml(asHtml(s.body || s.desc || ""), { internal: (path) => ({ href: href(path), route: path }), resolveImg: resolveMedia });
    const out = []; let last = 0, n = 0, m;
    PLACE_RE.lastIndex = 0;
    while ((m = PLACE_RE.exec(html))) {
      if (m.index > last) out.push({ html: html.slice(last, m.index) });
      const p = PLACES.find(x => x.id === m[1]);
      if (p) out.push({ place: p, n: s.numbered ? ++n : null });     // lugar despublicado: some do post
      last = m.index + m[0].length;
    }
    if (last < html.length) out.push({ html: html.slice(last) });
    return out;
  }, [s]);
  useEffect(() => mountEmbeds(ref.current), [parts]);
  return (
    <div className="story-text rich-text" ref={ref}>
      {parts.map((x, i) => x.place ? <PostPlaceCard key={i} p={x.place} n={x.n} /> : <Fragment key={i}><div className="post-chunk" dangerouslySetInnerHTML={{ __html: x.html }} /></Fragment>)}
    </div>
  );
}

export function Historia({ id }) {
  const nav = useNav();
  const [shared, setShared] = useState(false);
  const s = ALL_STORIES.find(x => x.id === id);
  if (!s) return <NotFound />;
  const inline = [...String(s.body || "").matchAll(/data-place="([\w-]+)"/g)].map(m => m[1]);
  const places = (s.places || []).filter(pid => !inline.includes(pid)).map(pid => PLACES.find(p => p.id === pid)).filter(Boolean).slice(0, 4);   // no máximo 4
  // "Mais no Radar": mesma categoria primeiro, depois os mais recentes
  const more = ALL_STORIES.filter(x => x.id !== s.id)
    .sort((a, b) => (b.tag === s.tag) - (a.tag === s.tag) || String(publishedDate(b)).localeCompare(String(publishedDate(a))))
    .slice(0, 2);
  const when = publishedDate(s);
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: s.title, text: s.desc, url: location.href });
      else await navigator.clipboard?.writeText(location.href);
      setShared(true); setTimeout(() => setShared(false), 1800);
    } catch { /* cancelado */ }
  }
  return (
    <main className="home2">
      <article className="shell narrow story-article">
        <PageHead crumbs={[["Início", "home"], ["Radar", "historias"], [s.title]]}
          back={<a href={href("/radar")} className="back-link" onClick={(e) => { e.preventDefault(); canGoBack() ? history.back() : nav("historias"); }}><Icon name="left" size={16} /> Voltar</a>} title={s.title} lede={s.desc}
          eyebrow={s.tag && <span className={"story-tag tone-" + s.tone}>{s.tag}</span>} />
        <div className="story-meta-row">
          {(s.author || when) && <p className="story-byline">{s.author && <>Por <strong>{s.author}</strong></>}{s.author && when && " · "}{when && fmt(when)}</p>}
          <div className="place-actions story-actions">
            <div className="act-row act-sub">
              <button className={"act-btn act-sm" + (shared ? " show" : "")} onClick={share} aria-label="Compartilhar"><Icon name="share" size={17} /><span className="act-label">{shared ? "Copiado!" : "Compartilhar"}</span></button>
            </div>
          </div>
        </div>
        {/* capa enviada em 3:4: aparece inteira, com a própria foto desfocada preenchendo as laterais */}
        <ImageSlot className="story-hero" src={s.img} alt={s.title} hint="Foto de capa · 3:4">
          <img className="story-hero-bg" src={resolveMedia(s.img)} alt="" aria-hidden="true" />
        </ImageSlot>
        <PostBody s={s} />
        {places.length > 0 && (
          <section className="h2-section">
            <SectionHead title={inline.length ? "Mais lugares relacionados" : "Lugares do post"} />
            <div className="tips-grid">{places.map(p => <MiniPlaceCard key={p.id} p={p} />)}</div>
          </section>
        )}
        {more.length > 0 && (
          <section className="h2-section">
            <SectionHead title="Mais no Radar" link="Ver todos os posts" onLink={() => nav("historias")} />
            <div className="stories-grid stories-2">{more.map(x => <StoryCard key={x.id} s={x} />)}</div>
          </section>
        )}
      </article>
      <Footer />
    </main>
  );
}
