// Radar (blog) — lista (/radar) e post (/radar/{slug}).
// Posts de lista trazem lugares cadastrados como cards no meio do texto.
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ALL_STORIES, PLACES, RADAR_CATEGORIES, VIBE_ORDER, placeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, MiniPlaceCard, SectionHead, Footer, VibePill, FaveButton, affById } from "../components/site.jsx";
import { useNav, useCity } from "../nav.js";
import { CityField } from "../components/cityselect.jsx";
import { useFilters, FilterPanel, FilterBlock, SearchBlock, CheckList, ResultsBar, ActiveChips, fslug } from "../filters.jsx";
import { href, storyPath, placePath, canGoBack } from "../router.js";
import { slugify } from "../admin/store.js";
import { sanitizeHtml, asHtml, htmlToText } from "../richtext.js";
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

// campos de cada post usados nos filtros: lugares citados (no texto e na lista), cidade, bairros e vibes deles
const PERIODS = [["semana", "Últimos 7 dias", 7], ["mes", "Últimos 30 dias", 30], ["trimestre", "Últimos 3 meses", 90], ["ano", "Último ano", 365]];
const FORMATS = [["lista", "Listas de lugares", (x) => x.places.length >= 2], ["novidade", "Novidades e notícias", (x) => x.places.length < 2]];
const RADAR_SORTS = ["recentes", "az"];
function storyFacts(s) {
  const ids = [...new Set([...String(s.body || "").matchAll(/data-place="([\w-]+)"/g)].map(m => m[1]).concat(s.places || []))];
  const places = ids.map(id => PLACES.find(p => p.id === id)).filter(Boolean);
  const date = publishedDate(s) || "";
  return { s, cat: s.tag || "", places, date, author: (s.author || "").trim(),
    cities: [...new Set(places.map(p => p.city).filter(Boolean))],
    bairros: [...new Set(places.map(p => p.bairro).filter(Boolean))],
    vibes: [...new Set(places.flatMap(p => p.affs || []))],
    text: fslug([s.title, s.desc, s.tag, s.author, htmlToText(s.body || ""), ...places.flatMap(p => [p.name, p.bairro])].join(" ")) };
}
const ageDays = (iso) => { const t = Date.parse(iso); return Number.isNaN(t) ? Infinity : (Date.now() - t) / 864e5; };

export function Historias() {
  const { id: globalCity, name: city, set: setGlobalCity } = useCity();
  const all = useMemo(() => ALL_STORIES.map(storyFacts), []);
  // categorias com posts publicados, na ordem do painel (as que não estão no painel vêm no fim)
  const cats = useMemo(() => {
    const used = [...new Set(all.map(x => x.cat).filter(Boolean))];
    const ordered = RADAR_CATEGORIES.filter(c => used.includes(c.label));
    return [...ordered, ...used.filter(t => !ordered.some(c => c.label === t)).map(t => ({ label: t, tone: ALL_STORIES.find(s => s.tag === t)?.tone }))]
      .map(c => ({ ...c, slug: slugify(c.label) }));
  }, [all]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { f, set, toggle, reset } = useFilters({
    categoria: ["categoria", "one"], busca: ["busca", "one"], publicado: ["publicado", "set"], formato: ["formato", "set"],
    cidade: ["cidade", "one", globalCity && all.some(x => x.cities.includes(globalCity)) ? globalCity : "todas"],
    bairro: ["bairro", "set"], vibe: ["vibe", "set"], autor: ["autor", "set"], ordem: ["ordem", "one", "recentes"],
  });
  const cat = cats.find(c => c.slug === f.categoria) || null;
  const query = f.busca, cityF = f.cidade === "todas" ? "" : f.cidade;
  const pickCat = (c) => set("categoria", !c || c.slug === f.categoria ? "" : c.slug);

  // busca + cidade valem para tudo; posts sem lugar citado não têm cidade e aparecem em qualquer uma
  const anyCity = useMemo(() => all.filter(x => !query || x.text.includes(fslug(query))), [all, query]);
  const cityCounts = useMemo(() => anyCity.reduce((m, x) => { x.cities.forEach(c => { m[c] = (m[c] || 0) + 1; }); return m; }, {}), [anyCity]);
  const base = useMemo(() => anyCity.filter(x => !cityF || !x.cities.length || x.cities.includes(cityF)), [anyCity, cityF]);
  function changeCity(v) { set("cidade", v || "todas"); reset(["bairro"]); if (v) setGlobalCity(v); }

  const tests = {
    categoria: (x) => !cat || x.cat === cat.label,
    publicado: (x) => !f.publicado.size || PERIODS.some(([k, , d]) => f.publicado.has(k) && ageDays(x.date) <= d),
    formato: (x) => !f.formato.size || FORMATS.some(([k, , fn]) => f.formato.has(k) && fn(x)),
    bairro: (x) => !f.bairro.size || x.bairros.some(b => f.bairro.has(fslug(b))),
    vibe: (x) => !f.vibe.size || x.vibes.some(v => f.vibe.has(v)),
    autor: (x) => !f.autor.size || f.autor.has(fslug(x.author)),
  };
  const pass = (x, skip) => Object.entries(tests).every(([k, t]) => k === skip || t(x));
  const count = (key, fn) => base.filter(x => pass(x, key) && fn(x)).length;

  let results = base.filter(x => pass(x));
  results = f.ordem === "az" ? [...results].sort((a, b) => a.s.title.localeCompare(b.s.title, "pt-BR"))
    : [...results].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const BAIRROS = [...new Set(base.flatMap(x => x.bairros))].sort((a, b) => a.localeCompare(b, "pt-BR")).map(b => [fslug(b), b]);
  const VIBES = VIBE_ORDER.filter(v => base.some(x => x.vibes.includes(v))).map(v => [v, affById(v)?.label || v]);
  const AUTHORS = [...new Set(base.map(x => x.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")).map(a => [fslug(a), a]);
  const label = (list, v) => list.find(([k]) => k === v)?.[1] || v;
  const chipsOf = (key, list) => [...f[key]].map(v => ({ key: key + v, label: label(list, v), onRemove: () => toggle(key, v) }));
  const chips = [
    ...(cat ? [{ key: "cat", label: cat.label, onRemove: () => set("categoria", "") }] : []),
    ...(query ? [{ key: "q", label: `“${query}”`, onRemove: () => set("busca", "") }] : []),
    ...chipsOf("publicado", PERIODS), ...chipsOf("formato", FORMATS), ...chipsOf("bairro", BAIRROS),
    ...chipsOf("vibe", VIBES), ...chipsOf("autor", AUTHORS),
  ];
  const filterCount = chips.length - (cat ? 1 : 0);
  function clearAll() { reset(["busca", "publicado", "formato", "bairro", "vibe", "autor"]); }
  const noun = (n) => (n === 1 ? "post" : "posts");
  const total = count("categoria", () => true);

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
                const n = count("categoria", x => x.cat === c.label), on = cat?.slug === c.slug;
                return (
                  <button key={c.slug} type="button" className={"radar-chip tone-" + (c.tone || "purple") + (on ? " on" : "") + (!n && !on ? " is-empty" : "")} aria-pressed={on} onClick={() => pickCat(c)}>
                    <i className="radar-chip-dot" aria-hidden="true" />{c.label} <span className="radar-chip-n">{n}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </PageHead>
      </div>

      <div className="shell listing-layout radar-layout">
        <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} active={filterCount} onClear={clearAll} total={results.length} noun={noun(results.length)}>
          <SearchBlock value={query} onChange={(v) => set("busca", v)} placeholder="Assunto, lugar ou bairro" />
          <FilterBlock title="Publicado">
            <CheckList options={PERIODS.map(([value, l, d]) => ({ value, label: l, count: count("publicado", x => ageDays(x.date) <= d) }))} selected={f.publicado} onToggle={(v) => toggle("publicado", v)} />
          </FilterBlock>
          <FilterBlock title="Formato">
            <CheckList options={FORMATS.map(([value, l, fn]) => ({ value, label: l, count: count("formato", fn) }))} selected={f.formato} onToggle={(v) => toggle("formato", v)} />
          </FilterBlock>
          <FilterBlock title="Cidade" note="(dos lugares citados)"><CityField value={cityF} onChange={changeCity} counts={cityCounts} /></FilterBlock>
          {BAIRROS.length > 0 && (
            <FilterBlock title="Bairro / Região">
              <CheckList options={BAIRROS.map(([value, l]) => ({ value, label: l, count: count("bairro", x => x.bairros.some(b => fslug(b) === value)) }))} selected={f.bairro} onToggle={(v) => toggle("bairro", v)} searchLabel="Buscar bairro" />
            </FilterBlock>
          )}
          {VIBES.length > 0 && (
            <FilterBlock title="Vibe dos lugares">
              <CheckList options={VIBES.map(([value, l]) => ({ value, label: l, count: count("vibe", x => x.vibes.includes(value)) }))} selected={f.vibe} onToggle={(v) => toggle("vibe", v)} />
            </FilterBlock>
          )}
          {AUTHORS.length > 1 && (
            <FilterBlock title="Autor">
              <CheckList options={AUTHORS.map(([value, l]) => ({ value, label: l, count: count("autor", x => fslug(x.author) === value) }))} selected={f.autor} onToggle={(v) => toggle("autor", v)} />
            </FilterBlock>
          )}
        </FilterPanel>

        <section className="results" id="resultados">
          <ResultsBar title={`${results.length} ${noun(results.length)}${cat ? ` em ${cat.label}` : ""}`}
            active={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={f.ordem} sorts={RADAR_SORTS} onSort={(v) => set("ordem", v)} />
          <ActiveChips chips={chips} onClear={() => { clearAll(); set("categoria", ""); }} />
          {results.length === 0 ? (
            <div className="empty-state">
              <h3>Nenhum post com esses filtros.</h3>
              <p>Tente outra categoria ou afrouxe um filtro.</p>
              <div className="row gap-12 wrap" style={{ justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => { clearAll(); set("categoria", ""); }}>Limpar filtros</button>
                {cityF && <button className="btn-outline" onClick={() => changeCity("")}>Ver em todas as cidades</button>}
              </div>
            </div>
          ) : (
            <div className="listing-grid radar-grid">{results.map(x => <StoryCard key={x.s.id} s={x.s} />)}</div>
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
