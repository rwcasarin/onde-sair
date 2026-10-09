// Página de conteúdo criada no painel (Sobre, Termos, Privacidade…): /{slug}
import { useEffect, useMemo, useRef } from "react";
import { PAGES } from "../data.js";
import { PageHead, Footer } from "../components/site.jsx";
import { sanitizeHtml } from "../richtext.js";
import { href } from "../router.js";
import { resolveMedia } from "../admin/store.js";
import { mountEmbeds } from "../embeds.js";
import { NotFound } from "./notfound.jsx";

export function Pagina({ id }) {
  const pg = PAGES.find(p => p.id === id);
  // links internos navegam sem recarregar (App trata data-route)
  const html = useMemo(() => pg ? sanitizeHtml(pg.body, { internal: (path) => ({ href: href(path), route: path }), resolveImg: resolveMedia }) : "", [pg]);
  const body = useRef(null);
  useEffect(() => mountEmbeds(body.current), [html]);   // vídeos, mapas, posts e códigos incorporados
  if (!pg) return <NotFound />;
  return (
    <main className="home2 page-content">
      <div className="shell narrow">
        <PageHead crumbs={[["Início", "home"], [pg.title]]} title={pg.title} lede={pg.excerpt} />
        <article ref={body} className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <Footer />
    </main>
  );
}
