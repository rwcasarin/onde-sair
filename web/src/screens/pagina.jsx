// Página de conteúdo criada no painel (Sobre, Termos, Privacidade…): /{slug}
import { useMemo } from "react";
import { PAGES } from "../data.js";
import { PageHead, Footer } from "../components/site.jsx";
import { sanitizeHtml } from "../richtext.js";
import { href } from "../router.js";
import { NotFound } from "./notfound.jsx";

export function Pagina({ id }) {
  const pg = PAGES.find(p => p.id === id);
  // links internos navegam sem recarregar (App trata data-route)
  const html = useMemo(() => pg ? sanitizeHtml(pg.body, { internal: (path) => ({ href: href(path), route: path }) }) : "", [pg]);
  if (!pg) return <NotFound />;
  return (
    <main className="home2 page-content">
      <div className="shell">
        <PageHead crumbs={[["Início", "home"], [pg.title]]} title={pg.title} lede={pg.excerpt} />
        <article className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <Footer />
    </main>
  );
}
