import { useEffect, useState } from "react";
import { roteiroVibes, vibesFromPlaces } from "../../vibes.js";
import { roteiroImg, placeImg } from "../../data.js";
import { PlaceMap } from "../../components/placemap.jsx";
import { ImageSlot } from "../../components/image-slot.jsx";
import {
  Card, Input, Textarea, Select, ChipInput, PillPicker, OrderedPicker, Repeater, ImageField, Segmented, Tabs, Field, Toggle, PageHeader, useAdmin, useDraft,
} from "../kit.jsx";
import { slugify } from "../store.js";
import { ContentList, PublishPanel, useEditorSave, Checklist, EditorLayout, NotFoundItem } from "./content.jsx";

const TAG_COLORS = ["vibe-pink", "vibe-yellow", "vibe-mint", "vibe-lavender", "vibe-orange", "vibe-sky"];
const tagColor = (label) => TAG_COLORS[[...label].reduce((a, c) => a + c.charCodeAt(0), 0) % TAG_COLORS.length];
const toTags = (labels) => labels.map(l => [l, tagColor(l)]);
const STEP_COLORS = ["var(--c-magenta)", "var(--primary)", "#F58220", "var(--c-teal)", "var(--c-yellow)", "var(--primary)"];

export function RoteirosList() {
  const { db } = useAdmin();
  return (
    <ContentList
      coll="roteiros" title="Roteiros" newLabel="Novo roteiro"
      subtitle="Sequências de paradas com propósito e ordem."
      searchText={(r) => `${r.title} ${r.desc} ${r.bairros}`}
      filters={[{ key: "vibe", label: "Vibe", options: db.vibes.map(v => [v.id, v.label]), test: (r, v) => roteiroVibes(r).includes(v) || (r.vibes || []).includes(v) }]}
      columns={[
        { key: "title", label: "Roteiro", render: (r) => (
          <span className="a-cell-main">
            <ImageSlot className="a-thumb" src={roteiroImg(r.id)} compact />
            <span><strong>{r.title}</strong><em>{r.bairros}</em></span>
          </span>
        ) },
        { key: "vibes", label: "Vibes", width: 190, sortable: false, render: (r) => { const vs = roteiroVibes(r).map(a => db.vibes.find(x => x.id === a)).filter(Boolean); return vs.length ? <span className="a-vibe-list">{vs.slice(0, 2).map(v => <span key={v.id} className={"a-vibe-dot " + v.cls}>{v.label}</span>)}{vs.length > 2 && <em>+{vs.length - 2}</em>}</span> : "—"; } },
        { key: "steps", label: "Paradas", width: 90, align: "center", render: (r) => r.steps.length, sortValue: (r) => r.steps.length },
        { key: "tempo", label: "Duração", width: 120, render: (r) => r.stats?.tempo, sortable: false },
      ]}
    />
  );
}

const BLANK = {
  title: "", slug: "", vibes: [], vibesAuto: true, desc: "", about: "", quote: "", note: "", bairros: "", tint: "tint-relax",
  stats: { tempo: "", invest: 1, investLabel: "Econômico", ideal: "", vibe: "" },
  steps: [{ time: "", title: "", sub: "", place: "", optional: false, desc: "" }],
  tips: { dica: "", horario: "", epoca: "", comoChegar: "", lembrete: "" }, tags: [], status: "rascunho",
};
const RULES = [
  ["title", (d) => d.title.trim().length >= 4, "Dê um título ao roteiro."],
  ["vibes", (d) => d.vibes.length > 0, "Escolha pelo menos uma vibe.", true],
  ["desc", (d) => d.desc.trim().length >= 30, "Escreva um resumo com pelo menos 30 caracteres.", true],
  ["steps", (d) => d.steps.length >= 2 && d.steps.every(s => s.title.trim()), "Inclua ao menos 2 paradas, todas com título.", true],
];

export function RoteiroEditor({ id }) {
  const { db } = useAdmin();
  const isNew = id === "novo";
  const found = db.roteiros.find(r => r.id === id);
  if (!isNew && !found) return <NotFoundItem what="Roteiro" path="roteiros" />;
  if (isNew) return <RoteiroForm initial={BLANK} isNew />;
  // sem "vibe principal": a antiga (aff) vira a primeira da lista
  const { aff, ...rest } = found;
  return <RoteiroForm initial={{ ...BLANK, ...rest, vibes: roteiroVibes(found), vibesAuto: found.vibesAuto === true, tips: { ...BLANK.tips, ...found.tips }, stats: { ...BLANK.stats, ...found.stats } }} isNew={false} />;
}

function RoteiroForm({ initial, isNew }) {
  const { db } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(initial);
  const { errors, validate, save } = useEditorSave({ coll: "roteiros", draft, commit, dirty, rules: RULES });
  const [tab, setTab] = useState("conteudo");
  const pid = draft.id || "novo";
  const setStat = (k, v) => set({ stats: { ...draft.stats, [k]: v } });
  const setTip = (k, v) => set({ tips: { ...draft.tips, [k]: v } });
  // vibes automáticas pelas paradas (mais presentes primeiro) até alguém editar a lista
  const suggested = vibesFromPlaces(draft.steps.map(s => s.place && db.places.find(p => p.id === s.place)));
  const sugKey = suggested.join(",");
  useEffect(() => { if (draft.vibesAuto && draft.vibes.join(",") !== sugKey) set({ vibes: suggested }); }, [sugKey, draft.vibesAuto]); // eslint-disable-line

  const pins = draft.steps.map((s, i) => {
    const pl = s.place && db.places.find(p => p.id === s.place);
    const b = pl ? pl.map : { x: 20 + i * 16, y: 50 };
    return { x: Math.min(88, Math.max(12, b.x)), y: Math.min(85, Math.max(12, b.y)), num: i + 1, color: STEP_COLORS[i % STEP_COLORS.length], title: s.title };
  });

  return (
    <EditorLayout
      header={<PageHeader title={isNew ? "Novo roteiro" : draft.title || "Sem título"} crumbs={[["Painel", "/"], ["Roteiros", "roteiros"], [isNew ? "Novo" : draft.title]]}
        subtitle={`/roteiros/${draft.slug || slugify(draft.title) || "…"}`} />}
      main={<>
        <Tabs value={tab} onChange={setTab} tabs={[
          ["conteudo", "Conteúdo", ["title", "vibes", "desc"].some(k => errors[k]) ? "!" : null],
          ["paradas", `Paradas (${draft.steps.length})`, errors.steps ? "!" : null],
          ["dicas", "Dicas e resumo"],
          ["imagens", "Imagens"],
        ]} />

        {tab === "conteudo" && (
          <Card>
            <Input label="Título" required value={draft.title} onChange={(v) => set({ title: v })} error={errors.title} maxCount={80} />
            <div className="a-form-grid">
              <Input label="Slug" value={draft.slug} placeholder={slugify(draft.title)} onChange={(v) => set({ slug: slugify(v) })} prefix="/roteiros/" />
              <Input label="Bairros" value={draft.bairros} onChange={(v) => set({ bairros: v })} placeholder="Centro · Boa Vista" />
            </div>
            <Textarea label="Resumo" required value={draft.desc} onChange={(v) => set({ desc: v })} error={errors.desc} rows={2} maxCount={180} hint="Linha fina do topo e texto dos cards." />
            <Textarea label="Sobre este roteiro" value={draft.about} onChange={(v) => set({ about: v })} rows={5} />
            <div className="a-form-grid">
              <Input label="Citação em destaque" value={draft.quote} onChange={(v) => set({ quote: v })} maxCount={90} />
              <Input label="Frase manuscrita da foto" value={draft.note} onChange={(v) => set({ note: v })} maxCount={60} />
            </div>
            <OrderedPicker label="Vibes" error={errors.vibes} hint="A ordem aqui é a ordem em que as vibes aparecem no roteiro e nos cards."
              value={draft.vibes} onChange={(vibes) => set({ vibes, vibesAuto: false })} options={db.vibes.map(v => [v.id, v.label, v.cls])}
              auto={{ on: draft.vibesAuto, label: "Automáticas: vibes dos lugares das paradas, da mais presente para a menos presente.",
                onReset: suggested.length ? () => set({ vibes: suggested, vibesAuto: true }) : null, resetLabel: "Usar as vibes das paradas" }} />
            <ChipInput label="Tags dos cards" value={draft.tags.map(t => t[0])} onChange={(l) => set({ tags: toTags(l) })} hint="Aparecem em “Continue explorando”." />
            <div className="a-form-grid a-form-grid-3">
              <Input label="Tempo total" value={draft.stats.tempo} onChange={(v) => setStat("tempo", v)} placeholder="6 a 8 horas" />
              <Input label="Ideal para" value={draft.stats.ideal} onChange={(v) => setStat("ideal", v)} placeholder="Casais, amigos" />
              <Input label="Vibe em palavras" value={draft.stats.vibe} onChange={(v) => setStat("vibe", v)} placeholder="Natureza e bem-estar" />
            </div>
            <Field label="Investimento">
              <Segmented label="Investimento" value={draft.stats.invest} onChange={(v) => set({ stats: { ...draft.stats, invest: v, investLabel: ["Grátis", "Econômico", "Moderado", "Especial"][v] } })}
                options={[[0, "Grátis"], [1, "$ Econômico"], [2, "$$ Moderado"], [3, "$$$ Especial"]]} />
            </Field>
          </Card>
        )}

        {tab === "paradas" && (
          <Card subtitle="Arraste a ordem com as setas. Vincular um lugar usa a posição dele no mapa e o botão “Ver mais”.">
            {errors.steps && <p className="a-error" role="alert">{errors.steps}</p>}
            <Repeater
              items={draft.steps} min={1} addLabel="Adicionar parada"
              newItem={() => ({ time: "", title: "", sub: "", place: "", optional: false, desc: "" })}
              onChange={(steps) => set({ steps })}
              render={(s, upd) => (
                <div className="a-step-edit">
                  <div className="a-form-grid a-form-grid-3">
                    <Input label="Horário" value={s.time} onChange={(time) => upd({ time })} placeholder="09h – 11h" />
                    <Select label="Lugar vinculado" value={s.place} placeholder="Nenhum (parada livre)"
                      onChange={(place) => { const p = db.places.find(x => x.id === place); upd({ place, title: s.title || p?.name || "" }); }}
                      options={db.places.map(p => [p.id, `${p.name} · ${p.bairro}`])} />
                    <Toggle label="Opcional" checked={s.optional} onChange={(optional) => upd({ optional })} />
                  </div>
                  <div className="a-form-grid">
                    <Input label="Título da parada" value={s.title} onChange={(title) => upd({ title })} />
                    <Input label="Subtítulo" value={s.sub} onChange={(sub) => upd({ sub })} placeholder="Café da manhã sem pressa" />
                  </div>
                  <Textarea label="Descrição" value={s.desc} onChange={(desc) => upd({ desc })} rows={2} maxCount={200} />
                </div>
              )}
            />
            <span className="a-label">Prévia do trajeto</span>
            <PlaceMap className="a-map-art a-map-art-sm" route card={false}
              items={draft.steps.map((s, i) => ({ id: "s" + i, place: s.place ? db.places.find(p => p.id === s.place) : null, title: s.title, num: i + 1, art: pins[i] }))} />
          </Card>
        )}

        {tab === "dicas" && (
          <Card subtitle="Cards de apoio no fim da página do roteiro.">
            <Textarea label="Dica do time" value={draft.tips.dica} onChange={(v) => setTip("dica", v)} rows={3} maxCount={200} />
            <div className="a-form-grid a-form-grid-3">
              <Input label="Melhor horário" value={draft.tips.horario} onChange={(v) => setTip("horario", v)} />
              <Input label="Melhor época" value={draft.tips.epoca} onChange={(v) => setTip("epoca", v)} />
              <Input label="Como chegar" value={draft.tips.comoChegar} onChange={(v) => setTip("comoChegar", v)} />
            </div>
            <Textarea label="Não esqueça" value={draft.tips.lembrete} onChange={(v) => setTip("lembrete", v)} rows={2} maxCount={160} />
          </Card>
        )}

        {tab === "imagens" && (
          <Card>
            <ImageField label="Foto do topo e dos cards" path={roteiroImg(pid)} hint="16:10 · mín. 1400 px" />
            {isNew ? <p className="a-hint">Salve o roteiro para enviar as fotos das paradas.</p> : (
              <>
                <span className="a-label">Fotos das paradas</span>
                <div className="a-gallery-grid">
                  {draft.steps.map((s, i) => <ImageField key={i} path={roteiroImg(pid, i + 1)} hint={`${i + 1}. ${s.title || "Parada"}`} ratio="2 / 1" compact />)}
                  <ImageField path={roteiroImg(pid, "lembrete")} hint="Card “Não esqueça”" ratio="2 / 1" compact />
                </div>
              </>
            )}
          </Card>
        )}
      </>}
      side={<>
        <PublishPanel coll="roteiros" draft={draft} set={set} dirty={dirty} isNew={isNew} onSave={save} validate={validate} />
        <Card title="Resumo">
          <ol className="a-steps-mini">
            {draft.steps.map((s, i) => {
              const pl = db.places.find(p => p.id === s.place);
              return (
                <li key={i}>
                  <span className="a-step-num" style={{ background: STEP_COLORS[i % STEP_COLORS.length] }}>{i + 1}</span>
                  {pl ? <ImageSlot className="a-thumb sm" src={placeImg(pl.id)} compact /> : null}
                  <span><strong>{s.title || "Sem título"}</strong><em>{s.time || "horário"}{s.optional ? " · opcional" : ""}</em></span>
                </li>
              );
            })}
          </ol>
        </Card>
        <Checklist items={[
          ["Título e resumo", !!draft.title && draft.desc.length >= 30],
          ["Vibes", draft.vibes.length > 0],
          ["2 ou mais paradas", draft.steps.length >= 2],
          ["Todas as paradas com descrição", draft.steps.every(s => s.desc)],
          ["Tempo e investimento", !!draft.stats.tempo],
          ["Dica do time", !!draft.tips.dica],
        ]} />
      </>}
    />
  );
}
