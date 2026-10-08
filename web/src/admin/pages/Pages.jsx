// Páginas de conteúdo (Sobre, Termos, Privacidade…): texto rico + SEO, publicadas em /{slug}
import { AIcon, Card, Input, Textarea, Toggle, PageHeader, useAdmin, useDraft, Btn } from "../kit.jsx";
import { slugify, RESERVED_SLUGS } from "../store.js";
import { ContentList, PublishPanel, useEditorSave, Checklist, EditorLayout, NotFoundItem } from "./content.jsx";
import { RichEditor } from "../richeditor.jsx";
import { htmlToText } from "../../richtext.js";

// menus em que a página aparece
const menusWith = (db, id) => [["header", "Menu superior"], ["footer", "Rodapé"], ["legal", "Rodapé (legal)"]]
  .filter(([k]) => (db.menus?.[k] || []).some(it => it.type === "page" && it.page === id)).map(([, l]) => l);

export function PagesList() {
  const { db } = useAdmin();
  return (
    <ContentList
      coll="pages" title="Páginas" newLabel="Nova página"
      subtitle="Páginas institucionais e de conteúdo (Sobre, Termos, Privacidade…). Ligue-as aos menus em Conteúdo › Menus."
      searchText={(p) => `${p.title} ${p.slug} ${htmlToText(p.body)}`}
      columns={[
        { key: "title", label: "Página", render: (p) => (
          <span className="a-cell-main"><span><strong>{p.title}</strong><em>/{p.slug}</em></span></span>
        ) },
        { key: "menus", label: "Nos menus", width: 200, sortable: false, render: (p) => { const m = menusWith(db, p.id); return m.length ? m.join(", ") : <span className="a-muted-cell">—</span>; } },
        { key: "seo", label: "SEO", width: 80, align: "center", sortable: false, render: (p) => p.seo?.title && p.seo?.desc ? <AIcon name="check" size={16} /> : <span className="a-muted-cell">—</span> },
      ]}
    />
  );
}

const BLANK = { title: "", slug: "", excerpt: "", body: "", seo: { title: "", desc: "", noindex: false }, status: "rascunho" };
const RULES = [
  ["title", (d) => d.title.trim().length >= 2, "Dê um título à página."],
  ["slug", (d) => !RESERVED_SLUGS.includes(slugify(d.slug || d.title)), "Esse endereço já é usado pelo site. Escolha outro."],
  ["body", (d) => htmlToText(d.body).length >= 20, "Escreva o conteúdo da página (pelo menos 20 caracteres).", true],
];

export function PageEditor({ id }) {
  const { db } = useAdmin();
  const isNew = id === "novo";
  const found = (db.pages || []).find(p => p.id === id);
  if (!isNew && !found) return <NotFoundItem what="Página" path="paginas" />;
  return <PageForm initial={isNew ? { ...BLANK } : { ...BLANK, ...found, seo: { ...BLANK.seo, ...(found.seo || {}) } }} isNew={isNew} />;
}

function PageForm({ initial, isNew }) {
  const { db, go } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(initial);
  const { errors, validate, save } = useEditorSave({ coll: "pages", draft, dirty, rules: RULES, commit: (saved) => commit(saved) });
  const slug = slugify(draft.slug || draft.title) || "…";
  const text = htmlToText(draft.body);
  const seoTitle = draft.seo.title || `${draft.title || "Título da página"} · Onde Sair`;
  const seoDesc = draft.seo.desc || draft.excerpt || text.slice(0, 160);
  const inMenus = !isNew ? menusWith(db, draft.id) : [];
  const setSeo = (patch) => set({ seo: { ...draft.seo, ...patch } });

  return (
    <EditorLayout
      header={<PageHeader title={isNew ? "Nova página" : draft.title || "Sem título"} crumbs={[["Painel", "/"], ["Páginas", "paginas"], [isNew ? "Nova" : draft.title]]}
        subtitle={`/${slug}`} />}
      main={<>
        <Card>
          <Input label="Título" required value={draft.title} onChange={(title) => set({ title })} error={errors.title} maxCount={80} />
          <Textarea label="Linha de apoio" value={draft.excerpt} onChange={(excerpt) => set({ excerpt })} rows={2} maxCount={200}
            hint="Aparece abaixo do título. Opcional." />
          <RichEditor value={draft.body} onChange={(body) => set({ body })} error={errors.body} />
        </Card>
        <Card title="SEO" subtitle="Como a página aparece no Google e quando é compartilhada.">
          <Input label="Endereço (URL)" prefix="ondesair.com.br/" value={draft.slug} placeholder={slugify(draft.title)}
            onChange={(v) => set({ slug: v.toLowerCase().replace(/\s+/g, "-") })} onBlur={() => draft.slug && set({ slug: slugify(draft.slug) })}
            error={errors.slug} hint="Use palavras curtas separadas por hífen. Mudar o endereço quebra links antigos." />
          <Input label="Título para buscadores" value={draft.seo.title} placeholder={seoTitle} onChange={(title) => setSeo({ title })} maxCount={60} />
          <Textarea label="Meta descrição" value={draft.seo.desc} placeholder={seoDesc || "Resumo da página em uma ou duas frases."} rows={3}
            onChange={(desc) => setSeo({ desc })} maxCount={160} hint="Sem preencher, usamos a linha de apoio ou o começo do texto." />
          <Toggle label="Esconder dos buscadores (noindex)" hint="A página continua no ar para quem tem o link, mas o Google não a lista."
            checked={!!draft.seo.noindex} onChange={(noindex) => setSeo({ noindex })} />
          <div className="a-serp" aria-label="Prévia no Google">
            <span className="a-serp-url">ondesair.com.br › {slug}</span>
            <strong>{seoTitle}</strong>
            <p>{(seoDesc || "A descrição aparece aqui.").slice(0, 160)}</p>
          </div>
        </Card>
      </>}
      side={<>
        <PublishPanel coll="pages" draft={draft} set={set} dirty={dirty} isNew={isNew} onSave={save} validate={validate} />
        <Card title="Menus">
          {inMenus.length ? <p className="a-hint">Aparece em: <strong>{inMenus.join(", ")}</strong>.</p>
            : <p className="a-hint">Ainda não está em nenhum menu. A página fica acessível pelo endereço.</p>}
          <Btn kind="ghost" size="sm" icon="menu" onClick={() => go("menus")}>Gerenciar menus</Btn>
        </Card>
        <Checklist items={[
          ["Título", !!draft.title.trim()], ["Texto com 20+ caracteres", text.length >= 20],
          ["Título para buscadores", !!draft.seo.title.trim()], ["Meta descrição", (draft.seo.desc || "").trim().length >= 50],
        ]} />
      </>}
    />
  );
}
