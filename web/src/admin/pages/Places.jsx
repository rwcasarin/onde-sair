import { useState } from "react";
import { TYPES, PRICE_RANGE, MOMENTOS, AMBIENTES, placeImg, placeGallery } from "../../data.js";
import { ListingCard, MapArt } from "../../components/site.jsx";
import { ImageSlot } from "../../components/image-slot.jsx";
import {
  AIcon, Btn, Card, Input, Textarea, Select, Toggle, ChipInput, PillPicker, Repeater, ImageField, Segmented, Tabs, Field, Check,
  PageHeader, useAdmin, useDraft,
} from "../kit.jsx";
import { slugify } from "../store.js";
import { ContentList, PublishPanel, useEditorSave, Checklist, EditorLayout, NotFoundItem } from "./content.jsx";

export const REASON_ICONS = ["eye", "star", "heart", "users", "music", "leaf", "sun", "coins", "clock", "sparkle", "image", "camera", "wine", "smile", "pin"];
const EXTRAS = ["Vista linda", "Boa música", "Para ir com amigos", "Experiência única", "Boa luz", "Sem pressa", "Para ir com crianças", "Programa a dois"];

// ---------------------------------------------------------------------
// Lista
// ---------------------------------------------------------------------
export function PlacesList() {
  const { db } = useAdmin();
  const vibes = db.vibes;
  const bairros = [...new Set(db.places.map(p => p.bairro))].sort();
  return (
    <ContentList
      coll="places" title="Lugares" newLabel="Novo lugar"
      subtitle="Todos os endereços da curadoria. Só os publicados aparecem no site."
      searchText={(p) => `${p.name} ${p.bairro} ${p.type} ${p.sub} ${(p.tags || []).join(" ")}`}
      filters={[
        { key: "type", label: "Tipo", options: TYPES.map(t => t.label), test: (p, v) => p.type === v },
        { key: "vibe", label: "Vibe", options: vibes.map(v => [v.id, v.label]), test: (p, v) => p.affs.includes(v) },
        { key: "bairro", label: "Bairro", options: bairros, test: (p, v) => p.bairro === v },
      ]}
      columns={[
        { key: "name", label: "Lugar", render: (p) => (
          <span className="a-cell-main">
            <ImageSlot className="a-thumb" src={placeImg(p.id)} compact />
            <span><strong>{p.name}</strong><em>{p.sub}</em></span>
          </span>
        ) },
        { key: "type", label: "Tipo", width: 140 },
        { key: "bairro", label: "Bairro", width: 130 },
        { key: "affs", label: "Vibes", sortable: false, render: (p) => (
          <span className="a-vibe-dots">{p.affs.map(a => { const v = vibes.find(x => x.id === a); return v ? <span key={a} className={"a-vibe-dot " + v.cls}>{v.label.replace(/^(Para|Pra) /, "")}</span> : null; })}</span>
        ) },
      ]}
    />
  );
}

// ---------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------
const BLANK = {
  name: "", slug: "", type: "Restaurantes", bairro: "", city: "sp", sub: "", cuisine: "", tagline: "", desc: "", dica: "", by: "",
  affs: [], tags: [], extras: [], reasons: [["star", ""], ["heart", ""], ["users", ""]], momento: [], ambiente: [],
  priceLevel: 2, open: "", end: "", phone: "", site: "", insta: "", reserva: false, note: "",
  rating: 0, reviews: 0, map: { x: 50, y: 50, label: "" }, tint: "tint-impress", seo: { title: "", desc: "" }, status: "rascunho",
};

const RULES = [
  ["name", (d) => d.name.trim().length >= 2, "Dê um nome ao lugar."],
  ["type", (d) => !!d.type, "Escolha o tipo.", true],
  ["bairro", (d) => !!d.bairro, "Escolha o bairro.", true],
  ["desc", (d) => d.desc.trim().length >= 40, "Escreva pelo menos 40 caracteres.", true],
  ["affs", (d) => d.affs.length > 0, "Marque ao menos uma vibe.", true],
  ["end", (d) => !!d.end.trim(), "Informe o endereço.", true],
];

export function PlaceEditor({ id }) {
  const { db, user } = useAdmin();
  const isNew = id === "novo";
  const found = db.places.find(p => p.id === id);
  if (!isNew && !found) return <NotFoundItem what="Lugar" path="lugares" />;
  return <PlaceForm initial={isNew ? { ...BLANK, by: `Curadoria · ${user.name.split(" ")[0]}` } : found} isNew={isNew} />;
}

function PlaceForm({ initial, isNew }) {
  const { db } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(initial);
  const { errors, validate, save } = useEditorSave({ coll: "places", draft, commit, dirty, rules: RULES });
  const [tab, setTab] = useState("conteudo");
  const city = db.cities.find(c => c.id === draft.city) || db.cities[0];
  const previewId = draft.id || "novo";

  const tabErr = (keys) => keys.some(k => errors[k]) ? "!" : null;
  const checklist = [
    ["Nome e subtítulo", !!draft.name && !!draft.sub],
    ["Descrição com 40+ caracteres", draft.desc.length >= 40],
    ["Dica da curadoria", !!draft.dica],
    ["3 ou mais motivos para ir", draft.reasons.filter(r => r[1]).length >= 3],
    ["Ao menos uma vibe", draft.affs.length > 0],
    ["Endereço e horário", !!draft.end && !!draft.open],
    ["Título e descrição SEO", !!draft.seo.title && !!draft.seo.desc],
  ];

  return (
    <EditorLayout
      header={<PageHeader
        title={isNew ? "Novo lugar" : draft.name || "Sem nome"}
        crumbs={[["Painel", "/"], ["Lugares", "lugares"], [isNew ? "Novo" : draft.name]]}
        subtitle={isNew ? "Preencha o essencial e salve como rascunho. Dá pra completar depois." : `/lugares/${draft.slug || slugify(draft.name)}`}
      />}
      main={<>
        <Tabs value={tab} onChange={setTab} tabs={[
          ["conteudo", "Conteúdo", tabErr(["name", "desc"])],
          ["detalhes", "Detalhes práticos", tabErr(["type", "bairro", "end"])],
          ["vibes", "Vibes e tags", tabErr(["affs"])],
          ["imagens", "Imagens"],
          ["mapa", "Localização"],
          ["seo", "SEO"],
        ]} />

        {tab === "conteudo" && (
          <Card>
            <div className="a-form-grid">
              <Input label="Nome" required value={draft.name} onChange={(v) => set({ name: v })} error={errors.name} maxCount={60} />
              <Input label="Endereço na URL (slug)" value={draft.slug} placeholder={slugify(draft.name)} onChange={(v) => set({ slug: slugify(v) })} prefix="/lugares/" hint="Deixe em branco para gerar a partir do nome." />
              <Input label="Subtítulo" value={draft.sub} onChange={(v) => set({ sub: v })} hint="Aparece sob o nome nos cards. Ex.: Rooftop, Boteco de raiz." maxCount={40} />
              <Input label="Tipo de cozinha / programa" value={draft.cuisine} onChange={(v) => set({ cuisine: v })} hint="Ex.: Contemporânea, Café e brunch." />
            </div>
            <Input label="Frase de destaque" value={draft.tagline} onChange={(v) => set({ tagline: v })} maxCount={110} hint="Linha fina abaixo do nome na página do lugar." />
            <Textarea label="Descrição" required value={draft.desc} onChange={(v) => set({ desc: v })} error={errors.desc} rows={5} maxCount={400}
              hint="A primeira frase vira o resumo dos cards. Tom de amigo, não de guia." />
            <div className="a-form-grid">
              <Textarea label="A dica que importa" value={draft.dica} onChange={(v) => set({ dica: v })} rows={3} maxCount={220} hint="Aparece como citação da equipe." />
              <div>
                <Input label="Assinatura da dica" value={draft.by} onChange={(v) => set({ by: v })} />
                <Input label="Frase manuscrita da foto" value={draft.note} onChange={(v) => set({ note: v })} maxCount={60} hint="Texto à mão sobre a foto do topo." />
              </div>
            </div>
            <Field label="Por que ir?" hint="De 3 a 5 motivos curtos. Escolha um ícone para cada.">
              <Repeater
                items={draft.reasons} max={5} addLabel="Adicionar motivo"
                newItem={() => ["star", ""]}
                onChange={(reasons) => set({ reasons })}
                render={(r, upd) => (
                  <div className="a-reason">
                    <IconPicker value={r[0]} onChange={(icon) => upd(() => [icon, r[1]])} />
                    <input className="a-input" value={r[1]} placeholder="Ex.: Uma das melhores vistas da cidade" onChange={(e) => upd(() => [r[0], e.target.value])} aria-label="Motivo" />
                  </div>
                )}
              />
            </Field>
          </Card>
        )}

        {tab === "detalhes" && (
          <Card>
            <div className="a-form-grid">
              <Select label="Tipo" required value={draft.type} onChange={(v) => set({ type: v })} options={TYPES.map(t => t.label)} error={errors.type} />
              <Select label="Cidade" value={draft.city} onChange={(v) => set({ city: v, bairro: "" })} options={db.cities.map(c => [c.id, c.name + (c.active ? "" : " (inativa)")])} />
              <Select label="Bairro" required value={draft.bairro} onChange={(v) => set({ bairro: v })} options={city?.bairros || []} placeholder="Escolha o bairro" error={errors.bairro}
                hint={!city?.bairros?.length ? "Cadastre bairros em Configurações › Cidades e bairros." : null} />
              <Input label="Endereço" required value={draft.end} onChange={(v) => set({ end: v })} error={errors.end} placeholder="Rua, número · Bairro" />
              <Input label="Funcionamento" value={draft.open} onChange={(v) => set({ open: v })} placeholder="Ter–Dom · 12h – 23h" />
              <Input label="Telefone" value={draft.phone} onChange={(v) => set({ phone: v })} type="tel" placeholder="(00) 0000-0000" />
              <Input label="Site" value={draft.site} onChange={(v) => set({ site: v.replace(/^https?:\/\//, "") })} prefix="https://" />
              <Input label="Instagram" value={draft.insta} onChange={(v) => set({ insta: v.startsWith("@") || !v ? v : "@" + v })} />
            </div>
            <Field label="Faixa de preço por pessoa">
              <Segmented label="Faixa de preço" value={draft.priceLevel} onChange={(v) => set({ priceLevel: v })}
                options={[0, 1, 2, 3].map(l => [l, l === 0 ? "Grátis" : "$".repeat(l) + " · " + PRICE_RANGE[l]])} />
            </Field>
            <div className="a-form-grid">
              <PillPicker label="Momento" value={draft.momento} onChange={(momento) => set({ momento })} options={MOMENTOS.map(m => [m, m])} />
              <PillPicker label="Ambiente" value={draft.ambiente} onChange={(ambiente) => set({ ambiente })} options={AMBIENTES.map(m => [m, m])} />
            </div>
            <div className="a-toggles">
              <Toggle label="Aceita reserva" checked={draft.reserva} onChange={(reserva) => set({ reserva })} />
            </div>
          </Card>
        )}

        {tab === "vibes" && (
          <Card>
            <PillPicker label="Vibes" error={errors.affs} hint="A primeira marcada é a vibe principal (aparece na etiqueta do topo)."
              value={draft.affs} onChange={(affs) => set({ affs })} options={db.vibes.map(v => [v.id, v.label, v.cls])} />
            <ChipInput label="Tags" value={draft.tags} onChange={(tags) => set({ tags })} hint="Aparecem nos cards da listagem. Até 3 funcionam melhor."
              suggestions={[...new Set(db.places.flatMap(p => p.tags || []))]} />
            <PillPicker label="Destaques do topo" hint="Pílulas extras exibidas no topo da página do lugar."
              value={draft.extras} onChange={(extras) => set({ extras })} options={EXTRAS.map(e => [e, e])} />
          </Card>
        )}

        {tab === "imagens" && (
          <Card subtitle="Envie fotos horizontais com boa luz. Elas são comprimidas automaticamente.">
            <ImageField label="Foto principal (capa e cards)" path={placeImg(previewId)} hint="16:10 · mín. 1400 px" />
            {isNew && <p className="a-hint">Salve o lugar para liberar o envio da galeria.</p>}
            {!isNew && (
              <>
                <span className="a-label">Galeria (4 fotos)</span>
                <div className="a-gallery-grid">
                  {placeGallery(previewId).map((p, i) => <ImageField key={p} path={p} hint={`Foto ${i + 1} · 3:4`} ratio="3 / 4" compact />)}
                </div>
              </>
            )}
          </Card>
        )}

        {tab === "mapa" && (
          <Card subtitle="Clique no mapa para posicionar o pino. (Protótipo com mapa ilustrado; em produção, use latitude e longitude.)">
            <div className="a-map-pick" onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              set({ map: { ...draft.map, x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) } });
            }}>
              <MapArt className="a-map-art" pins={[...db.places.filter(p => p.id !== draft.id).map(p => ({ x: p.map.x, y: p.map.y, color: "#C9C3DB", title: p.name })), { x: draft.map.x, y: draft.map.y, label: draft.name || "Novo lugar", color: "var(--c-magenta)" }]} />
            </div>
            <div className="a-form-grid a-form-grid-3">
              <Input label="Posição X (%)" type="number" min={0} max={100} value={draft.map.x} onChange={(v) => set({ map: { ...draft.map, x: +v } })} />
              <Input label="Posição Y (%)" type="number" min={0} max={100} value={draft.map.y} onChange={(v) => set({ map: { ...draft.map, y: +v } })} />
              <Input label="Sigla no pino" value={draft.map.label} onChange={(v) => set({ map: { ...draft.map, label: v.toUpperCase().slice(0, 4) } })} />
            </div>
          </Card>
        )}

        {tab === "seo" && (
          <Card subtitle="Como o lugar aparece no Google e nas redes.">
            <Input label="Título da página" value={draft.seo.title} placeholder={`${draft.name} · ${draft.sub} em ${draft.bairro} | Onde Sair`}
              onChange={(v) => set({ seo: { ...draft.seo, title: v } })} maxCount={60} />
            <Textarea label="Meta descrição" value={draft.seo.desc} placeholder={draft.desc} rows={3}
              onChange={(v) => set({ seo: { ...draft.seo, desc: v } })} maxCount={160} />
            <div className="a-serp" aria-label="Prévia no Google">
              <span className="a-serp-url">ondesair.com.br › lugares › {draft.slug || slugify(draft.name) || "lugar"}</span>
              <strong>{draft.seo.title || `${draft.name || "Nome do lugar"} · ${draft.sub || "Subtítulo"} | Onde Sair`}</strong>
              <p>{(draft.seo.desc || draft.desc || "A descrição aparece aqui.").slice(0, 160)}</p>
            </div>
          </Card>
        )}
      </>}
      side={<>
        <PublishPanel coll="places" draft={draft} set={set} dirty={dirty} isNew={isNew} onSave={save} validate={validate} />
        <Card title="Prévia do card">
          <div className="a-preview" aria-hidden="true">
            <ListingCard p={{ ...draft, id: previewId, name: draft.name || "Nome do lugar", sub: draft.sub || "Subtítulo", desc: draft.desc || "Descrição.", tags: draft.tags, rating: draft.rating || 0, reviews: draft.reviews || 0 }} />
          </div>
        </Card>
        <Checklist items={checklist} />
        {!isNew && (
          <Card title="Na comunidade">
            <dl className="a-meta">
              <div><dt>Nota média</dt><dd>{draft.rating ? "★ " + draft.rating.toFixed(1) : "—"}</dd></div>
              <div><dt>Avaliações</dt><dd>{draft.reviews}</dd></div>
              <div><dt>Na fila</dt><dd>{db.reviews.filter(r => r.place === draft.id && r.status === "pendente").length} pendente(s)</dd></div>
            </dl>
          </Card>
        )}
      </>}
    />
  );
}

export function IconPicker({ value, onChange, icons = REASON_ICONS }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="a-iconpick">
      <button type="button" className="a-iconpick-btn" aria-label={`Ícone: ${value}`} aria-expanded={open} onClick={() => setOpen(!open)}><AIcon name={value} size={18} /><AIcon name="chevron" size={12} /></button>
      {open && (
        <div className="a-iconpick-pop" role="listbox" onMouseLeave={() => setOpen(false)}>
          {icons.map(i => <button key={i} type="button" role="option" aria-selected={i === value} aria-label={i} className={i === value ? "on" : ""} onClick={() => { onChange(i); setOpen(false); }}><AIcon name={i} size={18} /></button>)}
        </div>
      )}
    </div>
  );
}

export { Check };
