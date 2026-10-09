// Radar (blog) — lista (/radar) e post (/radar/{slug}).
// Posts de lista trazem lugares cadastrados como cards no meio do texto.
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ALL_STORIES, PLACES, PRICE_RANGE, RADAR_CATEGORIES, placeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, MiniPlaceCard, SectionHead, Footer, VibePill, PriceDots, FaveButton } from "../components/site.jsx";
import { useNav } from "../nav.js";
import { href, storyPath, placePath, currentPath, HASH_MODE } from "../router.js";
import { slugify } from "../admin/store.js";
import { sanitizeHtml, asHtml } from "../richtext.js";
import { resolveMedia } from "../admin/store.js";
import { mountEmbeds } from "../embeds.js";

function StoryCard({ s }) {
  const nav = useNav();
  return (
    <article className="story-card" onClick={() => nav("historia", { id: s.id })} style={{ cursor: "pointer" }}>
      <ImageSlot className="story-img" src={s.img} alt="" hint="3:4">
        <span className={"story-shape shape-" + s.shape} aria-hidden="true"></span>
      </ImageSlot>
      <div className="story-body">
        <span className={"story-tag tone-" + s.tone}>{s.tag}</span>
        <h3>{s.title}</h3>
        <p>{s.desc}</p>
        <a href={href(storyPath(s))} className="h2-link" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav("historia", { id: s.id }); }}>Ler mais <Icon name="arrow" size={16} /></a>
      </div>
    </article>
  );
}

export function Historias() {
  // categorias com posts publicados, na ordem do painel (as que não estão no painel vêm no fim)
  const cats = useMemo(() => {
    const used = [...new Set(ALL_STORIES.map(s => s.tag).filter(Boolean))];
    const ordered = RADAR_CATEGORIES.filter(c => used.includes(c.label));
    return [...ordered, ...used.filter(t => !ordered.some(c => c.label === t)).map(t => ({ label: t, tone: ALL_STORIES.find(s => s.tag === t)?.tone }))];
  }, []);
  const initial = new URLSearchParams(currentPath().split("?")[1] || "").get("categoria");
  const [cat, setCat] = useState(() => cats.find(c => slugify(c.label) === initial)?.label || null);
  function pick(label) {
    const next = label === cat ? null : label;
    setCat(next);
    const url = "/radar" + (next ? "?categoria=" + slugify(next) : "");
    history.replaceState(null, "", HASH_MODE ? "#" + url : url);
  }
  const list = cat ? ALL_STORIES.filter(s => s.tag === cat) : ALL_STORIES;
  return (
    <main className="home2">
      <div className="shell">
        <PageHead crumbs={[["Início", "home"], ["Radar"]]} title="Radar"
          lede="Novidades, atualizações e listas de lugares: o que está no radar de quem vive a cidade.">
          {cats.length > 1 && (
            <div className="radar-filters" role="group" aria-label="Filtrar por categoria">
              <button type="button" className={"radar-chip" + (!cat ? " on" : "")} aria-pressed={!cat} onClick={() => pick(null)}>Todos</button>
              {cats.map(c => (
                <button key={c.label} type="button" className={"radar-chip" + (cat === c.label ? " on" : "")} aria-pressed={cat === c.label} onClick={() => pick(c.label)}>{c.label}</button>
              ))}
            </div>
          )}
        </PageHead>
        <div className="stories-grid stories-all">
          {list.map(s => <StoryCard key={s.id} s={s} />)}
        </div>
      </div>
      <Footer />
    </main>
  );
}

// Card de lugar dentro do post: foto, informações principais e link para a página do lugar
export function PostPlaceCard({ p, n }) {
  const nav = useNav();
  const go = (e) => { e.preventDefault(); nav("detalhe", { id: p.id }); };
  const price = PRICE_RANGE?.[p.priceLevel];
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
          <span title={price || ""}><PriceDots level={p.priceLevel} /></span>
          {p.open && <span className="post-place-open"><Icon name="clock" size={13} /> {p.open.split(" · ").slice(0, 2).join(" · ")}</span>}
        </div>
        <a className="btn-pill post-place-cta" href={href(placePath(p))} onClick={go}>Ver lugar <Icon name="arrow" size={14} /></a>
      </div>
    </article>
  );
}

const fmt = (iso) => { try { return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } };
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
  const s = ALL_STORIES.find(x => x.id === id);
  if (!s) return null;
  const inline = [...String(s.body || "").matchAll(/data-place="([\w-]+)"/g)].map(m => m[1]);
  const places = (s.places || []).filter(pid => !inline.includes(pid)).map(pid => PLACES.find(p => p.id === pid)).filter(Boolean);
  const more = ALL_STORIES.filter(x => x.id !== s.id).slice(0, 3);
  const when = s.publishAt || s.updatedAt;
  return (
    <main className="home2">
      <article className="shell story-article">
        <PageHead crumbs={[["Início", "home"], ["Radar", "historias"], [s.title]]} title={s.title} lede={s.desc}>
          <span className={"story-tag tone-" + s.tone}>{s.tag}</span>
        </PageHead>
        {(s.author || when) && <p className="story-byline">{s.author && <>Por <strong>{s.author}</strong></>}{s.author && when && " · "}{when && fmt(when)}</p>}
        <ImageSlot className="story-hero" src={s.img} alt="" hint="Foto de capa · 16:9" />
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
            <div className="stories-grid">{more.map(x => <StoryCard key={x.id} s={x} />)}</div>
          </section>
        )}
      </article>
      <Footer />
    </main>
  );
}
