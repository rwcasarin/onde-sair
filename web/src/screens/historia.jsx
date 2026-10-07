// Histórias — lista (/historias) e artigo (/historias/{slug})
import { ALL_STORIES, PLACES } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, MiniPlaceCard, SectionHead, Footer } from "../components/site.jsx";
import { useNav } from "../nav.js";
import { href, storyPath } from "../router.js";

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
  return (
    <main className="home2">
      <div className="shell">
        <PageHead crumbs={[["Início", "home"], ["Histórias"]]} title="Histórias"
          lede="Dicas de quem já foi: roteiros, listas e recomendações reais para inspirar a sua próxima saída." />
        <div className="stories-grid stories-all">
          {ALL_STORIES.map(s => <StoryCard key={s.id} s={s} />)}
        </div>
      </div>
      <Footer />
    </main>
  );
}

const fmt = (iso) => { try { return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } };

export function Historia({ id }) {
  const nav = useNav();
  const s = ALL_STORIES.find(x => x.id === id);
  if (!s) return null;
  const paragraphs = (s.body || s.desc || "").split(/\n{2,}/).map(t => t.trim()).filter(Boolean);
  const places = (s.places || []).map(pid => PLACES.find(p => p.id === pid)).filter(Boolean);
  const more = ALL_STORIES.filter(x => x.id !== s.id).slice(0, 3);
  const when = s.publishAt || s.updatedAt;
  return (
    <main className="home2">
      <article className="shell story-article">
        <PageHead crumbs={[["Início", "home"], ["Histórias", "historias"], [s.title]]} title={s.title} lede={s.desc}>
          <span className={"story-tag tone-" + s.tone}>{s.tag}</span>
        </PageHead>
        {(s.author || when) && <p className="story-byline">{s.author && <>Por <strong>{s.author}</strong></>}{s.author && when && " · "}{when && fmt(when)}</p>}
        <ImageSlot className="story-hero" src={s.img} alt="" hint="Foto de capa · 16:9" />
        <div className="story-text">
          {paragraphs.map((t, i) => <p key={i}>{t}</p>)}
        </div>
        {places.length > 0 && (
          <section className="h2-section">
            <SectionHead title="Lugares citados" />
            <div className="tips-grid">{places.map(p => <MiniPlaceCard key={p.id} p={p} />)}</div>
          </section>
        )}
        {more.length > 0 && (
          <section className="h2-section">
            <SectionHead title="Mais histórias" link="Ver todas" onLink={() => nav("historias")} />
            <div className="stories-grid">{more.map(x => <StoryCard key={x.id} s={x} />)}</div>
          </section>
        )}
      </article>
      <Footer />
    </main>
  );
}
