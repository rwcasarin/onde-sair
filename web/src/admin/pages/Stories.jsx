import { useMemo } from "react";
import { ImageSlot } from "../../components/image-slot.jsx";
import {
  AIcon, Card, Input, Textarea, Select, Segmented, Field, PillPicker, ImageField, PageHeader, Toggle, useAdmin, useDraft, Btn,
} from "../kit.jsx";
import { RichEditor } from "../richeditor.jsx";
import { htmlToText, asHtml } from "../../richtext.js";
import { slugify } from "../store.js";
import { ContentList, PublishPanel, useEditorSave, Checklist, EditorLayout, NotFoundItem } from "./content.jsx";

const TONES = [["purple", "Roxo"], ["green", "Verde"], ["orange", "Laranja"]];
const SHAPES = [["teal", "Teal"], ["purple", "Roxo"], ["lavender", "Lavanda"]];
const CATEGORIES = ["Novidades", "Listas", "Comer bem", "Vida noturna", "Ao ar livre", "Agenda", "Cultura", "Guia do bairro"];

export function StoriesList() {
  const { db } = useAdmin();
  return (
    <ContentList
      coll="stories" title="Radar" newLabel="Novo post"
      subtitle="O blog do Onde Sair: novidades, atualizações e listas de lugares (seção “Radar” da home e /radar)."
      searchText={(s) => `${s.title} ${s.tag} ${s.author}`}
      filters={[{ key: "tag", label: "Categoria", options: [...new Set(db.stories.map(s => s.tag))], test: (s, v) => s.tag === v }]}
      columns={[
        { key: "title", label: "Post", render: (s) => (
          <span className="a-cell-main">
            <ImageSlot className="a-thumb" src={s.img} compact />
            <span><strong>{s.title}</strong><em>{s.desc}</em></span>
          </span>
        ) },
        { key: "tag", label: "Categoria", width: 140, render: (s) => <span className={"a-tag-tone tone-" + s.tone}>{s.tag}</span> },
        { key: "author", label: "Autor", width: 120 },
        { key: "home", label: "Na home", width: 90, align: "center", sortable: false, render: (s) => db.home.storyIds.includes(s.id) ? <AIcon name="check" size={16} /> : <span className="a-muted-cell">—</span> },
      ]}
    />
  );
}

const BLANK = { title: "", slug: "", tag: "Novidades", tone: "orange", shape: "teal", desc: "", body: "", author: "", img: "", places: [], numbered: false, seo: { title: "", desc: "" }, status: "rascunho" };
const RULES = [
  ["title", (d) => d.title.trim().length >= 6, "Dê um título ao post."],
  ["desc", (d) => d.desc.trim().length >= 30, "Escreva um resumo com pelo menos 30 caracteres.", true],
  ["body", (d) => htmlToText(asHtml(d.body)).length >= 80 || inlinePlaces(d.body).length > 0, "O texto precisa de pelo menos 80 caracteres (ou lugares inseridos).", true],
];
// lugares inseridos no texto (cards no meio do post)
export const inlinePlaces = (body = "") => [...String(body).matchAll(/<figure class="place" data-place="([\w-]+)"/g)].map(m => m[1]);

export function StoryEditor({ id }) {
  const { db, user } = useAdmin();
  const isNew = id === "novo";
  const found = db.stories.find(s => s.id === id);
  if (!isNew && !found) return <NotFoundItem what="Post" path="radar" />;
  return <StoryForm initial={isNew ? { ...BLANK, author: user.name } : { ...BLANK, ...found, seo: { ...BLANK.seo, ...(found.seo || {}) } }} isNew={isNew} />;
}

function StoryForm({ initial, isNew }) {
  const { db, go } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(initial);
  const { errors, validate, save } = useEditorSave({
    coll: "stories", draft, dirty, rules: RULES,
    commit: (saved) => commit(saved),
  });
  const img = draft.img || `images/historias/${draft.id || "nova"}.jpg`;
  const live = useMemo(() => db.places.filter(p => p.status === "publicado").map(p => ({
    id: p.id, name: p.name, sub: p.sub, bairro: p.bairro, type: p.type, cityName: db.cities.find(c => c.id === p.city)?.name,
  })), [db.places, db.cities]);
  const inline = inlinePlaces(draft.body);
  const text = htmlToText(asHtml(draft.body));
  const slug = draft.slug || slugify(draft.title) || "…";
  const setSeo = (patch) => set({ seo: { ...draft.seo, ...patch } });

  return (
    <EditorLayout
      header={<PageHeader title={isNew ? "Novo post" : draft.title || "Sem título"} crumbs={[["Painel", "/"], ["Radar", "radar"], [isNew ? "Novo" : draft.title]]}
        subtitle={`/radar/${slug}`} />}
      main={<>
        <Card>
          <Input label="Título" required value={draft.title} onChange={(v) => set({ title: v })} error={errors.title} maxCount={90}
            hint="Para listas, algo como “5 lugares pra tomar café da manhã com estilo em Sorocaba”." />
          <Textarea label="Resumo" required value={draft.desc} onChange={(v) => set({ desc: v })} error={errors.desc} rows={2} maxCount={160} hint="Aparece no card da home e embaixo do título." />
          <RichEditor value={draft.body} onChange={(body) => set({ body })} error={errors.body} places={live}
            placeholder="Escreva o post. Para listas, use o botão “Lugar” para inserir cada lugar como card."
            hint="Use “Lugar” na barra para inserir lugares cadastrados como cards" />
          <Toggle label="Numerar os lugares (post de lista)" hint="Os cards de lugar ganham 1, 2, 3… na ordem do texto."
            checked={!!draft.numbered} onChange={(numbered) => set({ numbered })} />
        </Card>
        <Card title="Lugares relacionados" subtitle="Opcional: aparecem em cards no fim do post (os que já estão no texto não se repetem).">
          <PillPicker value={draft.places} onChange={(places) => set({ places })} options={db.places.filter(p => p.status === "publicado").map(p => [p.id, p.name])} />
        </Card>
        <Card title="SEO" subtitle="Como o post aparece no Google e quando é compartilhado.">
          <Input label="Endereço (URL)" prefix="ondesair.com.br/radar/" value={draft.slug} placeholder={slugify(draft.title)}
            onChange={(v) => set({ slug: v.toLowerCase().replace(/\s+/g, "-") })} onBlur={() => draft.slug && set({ slug: slugify(draft.slug) })}
            hint="Mudar o endereço de um post publicado quebra links antigos." />
          <Input label="Título para buscadores" value={draft.seo.title} placeholder={`${draft.title || "Título do post"} · Radar Onde Sair`} onChange={(title) => setSeo({ title })} maxCount={60} />
          <Textarea label="Meta descrição" value={draft.seo.desc} placeholder={draft.desc || "Resumo do post."} rows={3} onChange={(desc) => setSeo({ desc })} maxCount={160}
            hint="Sem preencher, usamos o resumo." />
          <div className="a-serp" aria-label="Prévia no Google">
            <span className="a-serp-url">ondesair.com.br › radar › {slug}</span>
            <strong>{draft.seo.title || `${draft.title || "Título do post"} · Radar Onde Sair`}</strong>
            <p>{(draft.seo.desc || draft.desc || "A descrição aparece aqui.").slice(0, 160)}</p>
          </div>
        </Card>
      </>}
      side={<>
        <PublishPanel coll="stories" draft={draft} set={set} dirty={dirty} isNew={isNew} onSave={save} validate={validate} />
        <Card title="Apresentação">
          <Select label="Categoria" value={draft.tag} onChange={(tag) => set({ tag })} options={[...new Set([...CATEGORIES, draft.tag])]} />
          <Field label="Cor da etiqueta"><Segmented label="Cor da etiqueta" value={draft.tone} onChange={(tone) => set({ tone })} options={TONES} /></Field>
          <Field label="Forma sobre a foto"><Segmented label="Forma" value={draft.shape} onChange={(shape) => set({ shape })} options={SHAPES} /></Field>
          <Input label="Autor" value={draft.author} onChange={(author) => set({ author })} />
          <ImageField label="Capa" path={img} hint="3:4" ratio="3 / 4" />
        </Card>
        <Card title="Prévia do card">
          <article className="story-card a-story-prev" aria-hidden="true">
            <ImageSlot className="story-img" src={img} compact><span className={"story-shape shape-" + draft.shape} /></ImageSlot>
            <div className="story-body"><span className={"story-tag tone-" + draft.tone}>{draft.tag}</span><h3>{draft.title || "Título"}</h3><p>{draft.desc || "Resumo"}</p></div>
          </article>
        </Card>
        <Checklist items={[["Título", !!draft.title], ["Resumo", draft.desc.length >= 30], ["Texto com 80+ caracteres", text.length >= 80],
          ["Lugares no post", inline.length + draft.places.length > 0], ["Meta descrição", (draft.seo.desc || "").trim().length >= 50]]} />
        {isNew && <p className="a-hint">Para mostrar na home, publique e marque em Conteúdo › Home.</p>}
        {!isNew && <Btn kind="ghost" size="sm" icon="layout" onClick={() => go("home")}>Destaques da home</Btn>}
      </>}
    />
  );
}
