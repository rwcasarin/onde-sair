import { useRef, useState } from "react";
import { ImageSlot } from "../../components/image-slot.jsx";
import {
  AIcon, Card, Input, Textarea, Select, Segmented, Field, PillPicker, ImageField, PageHeader, useAdmin, useDraft, Btn,
} from "../kit.jsx";
import { slugify } from "../store.js";
import { ContentList, PublishPanel, useEditorSave, Checklist, EditorLayout, NotFoundItem } from "./content.jsx";

const TONES = [["purple", "Roxo"], ["green", "Verde"], ["orange", "Laranja"]];
const SHAPES = [["teal", "Teal"], ["purple", "Roxo"], ["lavender", "Lavanda"]];
const CATEGORIES = ["Vida noturna", "Ao ar livre", "Comer bem", "Agenda", "Cultura", "Guia do bairro"];

export function StoriesList() {
  const { db } = useAdmin();
  return (
    <ContentList
      coll="stories" title="Histórias" newLabel="Nova história"
      subtitle="Conteúdos editoriais da seção “Dicas de quem já foi”."
      searchText={(s) => `${s.title} ${s.tag} ${s.author}`}
      filters={[{ key: "tag", label: "Categoria", options: [...new Set(db.stories.map(s => s.tag))], test: (s, v) => s.tag === v }]}
      columns={[
        { key: "title", label: "História", render: (s) => (
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

const BLANK = { title: "", slug: "", tag: "Comer bem", tone: "orange", shape: "teal", desc: "", body: "", author: "", img: "", places: [], status: "rascunho" };
const RULES = [
  ["title", (d) => d.title.trim().length >= 6, "Dê um título à história."],
  ["desc", (d) => d.desc.trim().length >= 30, "Escreva um resumo com pelo menos 30 caracteres.", true],
  ["body", (d) => d.body.trim().length >= 80, "O texto precisa de pelo menos 80 caracteres.", true],
];

export function StoryEditor({ id }) {
  const { db, user } = useAdmin();
  const isNew = id === "novo";
  const found = db.stories.find(s => s.id === id);
  if (!isNew && !found) return <NotFoundItem what="História" path="historias" />;
  return <StoryForm initial={isNew ? { ...BLANK, author: user.name } : { ...BLANK, ...found }} isNew={isNew} />;
}

function StoryForm({ initial, isNew }) {
  const { db, go } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(initial);
  const { errors, validate, save } = useEditorSave({
    coll: "stories", draft, dirty, rules: RULES,
    commit: (saved) => commit(saved),
  });
  const [preview, setPreview] = useState(false);
  const area = useRef(null);
  const img = draft.img || `images/historias/${draft.id || "nova"}.jpg`;
  const words = draft.body.trim().split(/\s+/).filter(Boolean).length;

  // ferramentas de formatação (Markdown simples)
  function wrap(before, after = before, placeholder = "texto") {
    const el = area.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b) || placeholder;
    const body = value.slice(0, a) + before + sel + after + value.slice(b);
    set({ body });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + sel.length); });
  }
  function linePrefix(prefix) {
    const el = area.current; if (!el) return;
    const { selectionStart: a, value } = el;
    const start = value.lastIndexOf("\n", a - 1) + 1;
    set({ body: value.slice(0, start) + prefix + value.slice(start) });
    requestAnimationFrame(() => el.focus());
  }

  return (
    <EditorLayout
      header={<PageHeader title={isNew ? "Nova história" : draft.title || "Sem título"} crumbs={[["Painel", "/"], ["Histórias", "historias"], [isNew ? "Nova" : draft.title]]}
        subtitle={`/historias/${draft.slug || slugify(draft.title) || "…"}`} />}
      main={<>
        <Card>
          <Input label="Título" required value={draft.title} onChange={(v) => set({ title: v })} error={errors.title} maxCount={80} />
          <Textarea label="Resumo" required value={draft.desc} onChange={(v) => set({ desc: v })} error={errors.desc} rows={2} maxCount={160} hint="Aparece no card da home." />
          <Field label="Texto" error={errors.body} hint={`${words} palavra(s) · ~${Math.max(1, Math.round(words / 200))} min de leitura · Markdown: **negrito**, *itálico*, ## título, - lista, [link](url)`}>
            <div className="a-md">
              <div className="a-md-bar" role="toolbar" aria-label="Formatação">
                <button type="button" onClick={() => wrap("**")} aria-label="Negrito"><b>B</b></button>
                <button type="button" onClick={() => wrap("*")} aria-label="Itálico"><i>I</i></button>
                <button type="button" onClick={() => linePrefix("## ")} aria-label="Título">H</button>
                <button type="button" onClick={() => linePrefix("- ")} aria-label="Lista"><AIcon name="list" size={15} /></button>
                <button type="button" onClick={() => wrap("[", "](https://)", "link")} aria-label="Link"><AIcon name="link" size={15} /></button>
                <span className="a-md-sep" />
                <button type="button" className={preview ? "on" : ""} onClick={() => setPreview(!preview)}><AIcon name="eye" size={15} /> {preview ? "Editar" : "Pré-visualizar"}</button>
              </div>
              {preview
                ? <div className="a-md-preview">{renderMarkdown(draft.body)}</div>
                : <textarea ref={area} className="a-input a-textarea a-md-area" rows={14} value={draft.body} onChange={(e) => set({ body: e.target.value })} aria-label="Texto da história" />}
            </div>
          </Field>
        </Card>
        <Card title="Lugares citados" subtitle="Viram cards no fim da história.">
          <PillPicker value={draft.places} onChange={(places) => set({ places })} options={db.places.filter(p => p.status === "publicado").map(p => [p.id, p.name])} />
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
        <Checklist items={[["Título", !!draft.title], ["Resumo", draft.desc.length >= 30], ["Texto com 80+ caracteres", draft.body.length >= 80], ["Ao menos um lugar citado", draft.places.length > 0]]} />
        {isNew && <p className="a-hint">Para mostrar na home, publique e marque em Conteúdo › Home.</p>}
        {!isNew && <Btn kind="ghost" size="sm" icon="layout" onClick={() => go("home")}>Destaques da home</Btn>}
      </>}
    />
  );
}

// Renderizador mínimo e seguro (gera elementos React; nunca HTML bruto)
function inline(text, key) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={key + i++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("*")) parts.push(<em key={key + i++}>{t.slice(1, -1)}</em>);
    else {
      const [, label, href] = t.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const safe = /^(https?:|mailto:|\/)/.test(href) ? href : "#";
      parts.push(<a key={key + i++} href={safe} target="_blank" rel="noreferrer">{label}</a>);
    }
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
export function renderMarkdown(src) {
  const blocks = src.split(/\n{2,}/).filter(b => b.trim());
  if (!blocks.length) return <p className="a-hint">Nada para mostrar ainda.</p>;
  return blocks.map((b, i) => {
    if (b.startsWith("## ")) return <h3 key={i}>{inline(b.slice(3), i)}</h3>;
    const lines = b.split("\n");
    if (lines.every(l => l.startsWith("- "))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2), `${i}-${j}`)}</li>)}</ul>;
    return <p key={i}>{lines.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l, `${i}-${j}`)}</span>)}</p>;
  });
}
