// Eventos no painel: lista (Eventos | Categorias) e editor no modelo do cadastro de lugar
import { useState } from "react";
import { SEED_EVENT_CATEGORIES, AGE_RATINGS, eventImg, eventGallery } from "../../data.js";
import { EventCard } from "../../components/site.jsx";
import { ImageSlot } from "../../components/image-slot.jsx";
import {
  Btn, Card, Input, Textarea, Select, Toggle, ChipInput, OrderedPicker, Repeater, ImageField, Segmented, Tabs, Field, PageHeader, useAdmin, useDraft,
} from "../kit.jsx";
import { slugify } from "../store.js";
import { ContentList, PublishPanel, useEditorSave, Checklist, EditorLayout, NotFoundItem } from "./content.jsx";
import { LocationTab, IconPicker, REASON_ICONS } from "./Places.jsx";
import { eventsNav } from "./Types.jsx";
import { parseLocal, toLocal, whenLabel, priceLabel, isPast } from "../../events.js";

const catsOf = (db) => db.eventCategories?.length ? db.eventCategories : SEED_EVENT_CATEGORIES;

// ---------------------------------------------------------------------
// Lista
// ---------------------------------------------------------------------
export function EventsList() {
  const { db } = useAdmin();
  const cats = catsOf(db);
  return (
    <ContentList
      coll="events" title="Eventos" newLabel="Novo evento" nav={eventsNav(db)}
      subtitle="A agenda da cidade. Só os publicados aparecem no site; eventos encerrados saem da agenda sozinhos."
      searchText={(e) => `${e.title} ${e.venueName || ""} ${e.bairro} ${(e.tags || []).join(" ")}`}
      filters={[
        { key: "when", label: "Quando", options: [["proximos", "Próximos"], ["encerrados", "Encerrados"]], test: (e, v) => v === "encerrados" ? isPast(e) : !isPast(e) },
        { key: "cat", label: "Categoria", options: cats.map(c => [c.id, c.label]), test: (e, v) => e.category === v },
        { key: "vibe", label: "Vibe", options: db.vibes.map(v => [v.id, v.label]), test: (e, v) => (e.affs || []).includes(v) },
      ]}
      columns={[
        { key: "title", label: "Evento", render: (e) => (
          <span className="a-cell-main">
            <ImageSlot className="a-thumb" src={eventImg(e.id)} compact />
            <span><strong>{e.title}</strong><em>{cats.find(c => c.id === e.category)?.label || "Sem categoria"}</em></span>
          </span>
        ) },
        { key: "startAt", label: "Quando", width: 210, render: (e) => <span className={isPast(e) ? "a-muted" : ""}>{whenLabel(e)}{isPast(e) ? " · encerrado" : ""}</span> },
        { key: "venueName", label: "Local", width: 180, render: (e) => db.places.find(p => p.id === e.venue)?.name || e.venueName || e.bairro || "—" },
      ]}
    />
  );
}

// ---------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------
function nextSaturday() {
  const d = new Date(); d.setHours(20, 0, 0, 0); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d;
}
const blank = () => {
  const s = nextSaturday(), f = new Date(s.getTime() + 3 * 36e5);
  return {
    title: "", slug: "", tagline: "", desc: "", note: "", category: "", affs: [], tags: [],
    startAt: toLocal(s), endAt: toLocal(f), doors: "",
    price: { free: false, from: "", to: "", note: "" }, ticket: { required: false, url: "", label: "" },
    insta: "", whatsapp: "", site: "", age: "livre", reasons: [], showGallery: true,
    venue: "", venueName: "", end: "", bairro: "", city: "sorocaba", cep: "", geo: null, placeId: "", map: { x: 50, y: 50, label: "" },
    tint: "tint-eco", seo: { title: "", desc: "" }, status: "rascunho",
  };
};

const RULES = [
  ["title", (d) => d.title.trim().length >= 3, "Dê um nome ao evento."],
  ["startAt", (d) => !!parseLocal(d.startAt), "Informe a data e a hora de início."],
  ["endAt", (d) => !!parseLocal(d.endAt) && parseLocal(d.endAt) > parseLocal(d.startAt), "O término precisa ser depois do início."],
  ["whatsapp", (d) => !d.whatsapp || /^(55)?\d{10,11}$/.test(d.whatsapp.replace(/\D/g, "")), "Use o número com DDD, como (15) 99999-9999 ou (15) 3333-4444."],
  ["ticketUrl", (d) => !d.ticket?.url || /^https?:\/\/\S+\.\S+/.test(d.ticket.url), "Use o link completo da venda (https://…)."],
  ["category", (d) => !!d.category, "Escolha a categoria.", true],
  ["desc", (d) => d.desc.trim().length >= 40, "Escreva pelo menos 40 caracteres.", true],
  ["affs", (d) => d.affs.length > 0, "Marque ao menos uma vibe.", true],
  ["end", (d) => !!d.end.trim(), "Informe o endereço do evento.", true],
  ["city", (d) => !!d.city, "Escolha a cidade.", true],
];

export function EventEditor({ id }) {
  const { db } = useAdmin();
  const isNew = id === "novo";
  const found = (db.events || []).find(e => e.id === id);
  if (!isNew && !found) return <NotFoundItem what="Evento" path="eventos" />;
  const base = blank();
  return <EventForm initial={isNew ? { ...base, city: db.settings.defaultCity || base.city } : { ...base, ...found, price: { ...base.price, ...found.price }, ticket: { ...base.ticket, ...found.ticket }, seo: { ...base.seo, ...found.seo } }} isNew={isNew} />;
}

function EventForm({ initial, isNew }) {
  const { db } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(initial);
  const { errors, validate, save } = useEditorSave({ coll: "events", draft, commit, dirty, rules: RULES });
  const [tab, setTab] = useState("conteudo");
  const previewId = draft.id || "novo";
  const cats = catsOf(db);
  const tabErr = (keys) => keys.some(k => errors[k]) ? "!" : null;
  const setPrice = (patch) => set({ price: { ...draft.price, ...patch } });
  const setTicket = (patch) => set({ ticket: { ...draft.ticket, ...patch } });

  // escolher o lugar do catálogo preenche o local; o endereço continua editável
  function pickVenue(id) {
    const p = db.places.find(x => x.id === id);
    if (!p) return set({ venue: "" });
    set({ venue: p.id, venueName: "", end: p.end || "", bairro: p.bairro || "", city: p.city || draft.city, cep: p.cep || "", geo: p.geo || null, placeId: p.placeId || "",
      map: p.map || draft.map, insta: draft.insta || p.insta || "", whatsapp: p.whatsapp || "" });
  }
  const venue = db.places.find(p => p.id === draft.venue);
  const changedAddress = venue && (draft.end !== (venue.end || "") || draft.bairro !== (venue.bairro || "") || (draft.whatsapp || "") !== (venue.whatsapp || ""));

  const checklist = [
    ["Nome e frase de destaque", !!draft.title && !!draft.tagline],
    ["Descrição com 40+ caracteres", draft.desc.length >= 40],
    ["Início e término", !!parseLocal(draft.startAt) && !!parseLocal(draft.endAt)],
    ["Valor ou entrada gratuita", draft.price.free || !!draft.price.from],
    ["Categoria e vibes", !!draft.category && draft.affs.length > 0],
    ["Local com endereço", !!draft.end],
    ["Título e descrição SEO", !!draft.seo.title && !!draft.seo.desc],
  ];

  return (
    <EditorLayout
      header={<PageHeader
        title={isNew ? "Novo evento" : draft.title || "Sem nome"}
        crumbs={[["Painel", "/"], ["Eventos", "eventos"], [isNew ? "Novo" : draft.title]]}
        subtitle={isNew ? "Preencha o essencial e salve como rascunho. Dá pra completar depois." : `/eventos/${draft.slug || slugify(draft.title)}`}
      />}
      main={<>
        <Tabs value={tab} onChange={setTab} tabs={[
          ["conteudo", "Conteúdo", tabErr(["title", "desc"])],
          ["data", "Data e ingressos", tabErr(["startAt", "endAt", "ticketUrl"])],
          ["classificacao", "Classificação", tabErr(["category", "affs"])],
          ["local", "Local", tabErr(["end", "city", "whatsapp"])],
          ["imagens", "Fotos"],
          ["seo", "SEO"],
        ]} />

        {tab === "conteudo" && (
          <Card>
            <div className="a-form-grid">
              <Input label="Nome do evento" required value={draft.title} onChange={(title) => set({ title })} error={errors.title} maxCount={70} />
              <Input label="Endereço na URL (slug)" value={draft.slug} placeholder={slugify(draft.title)} onChange={(v) => set({ slug: slugify(v) })} prefix="/eventos/" hint="Deixe em branco para gerar a partir do nome." />
            </div>
            <Input label="Frase de destaque" value={draft.tagline} onChange={(tagline) => set({ tagline })} maxCount={120} hint="Linha fina abaixo do nome e resumo dos cards." />
            <Textarea label="Sobre o evento" required value={draft.desc} onChange={(desc) => set({ desc })} error={errors.desc} rows={6} maxCount={900}
              hint="Atrações, programação, o que esperar e o que levar. Separe parágrafos com uma linha em branco." />
            <Input label="Frase manuscrita da foto" value={draft.note} onChange={(note) => set({ note })} maxCount={60} hint="Texto à mão sobre a foto do topo." />
            <Field label="Por que ir?" hint="Opcional. Até 5 motivos curtos, com ícone.">
              <Repeater items={draft.reasons} max={5} addLabel="Adicionar motivo" newItem={() => ["star", ""]} onChange={(reasons) => set({ reasons })}
                render={(r, upd) => (
                  <div className="a-reason">
                    <IconPicker value={r[0]} icons={REASON_ICONS} onChange={(icon) => upd(() => [icon, r[1]])} />
                    <input className="a-input" value={r[1]} placeholder="Ex.: Line-up só com artistas da cidade" onChange={(e) => upd(() => [r[0], e.target.value])} aria-label="Motivo" />
                  </div>
                )} />
            </Field>
          </Card>
        )}

        {tab === "data" && (<>
          <Card title="Data e horário">
            <div className="a-form-grid">
              <Input label="Início" required type="datetime-local" value={draft.startAt} error={errors.startAt}
                onChange={(startAt) => {
                  // mantém a duração ao mudar o início
                  const s0 = parseLocal(draft.startAt), f0 = parseLocal(draft.endAt), s1 = parseLocal(startAt);
                  set(s0 && f0 && s1 && f0 > s0 ? { startAt, endAt: toLocal(new Date(s1.getTime() + (f0 - s0))) } : { startAt });
                }} />
              <Input label="Término" required type="datetime-local" value={draft.endAt} min={draft.startAt} error={errors.endAt} onChange={(endAt) => set({ endAt })} />
              <Input label="Abertura da casa" value={draft.doors} onChange={(doors) => set({ doors })} placeholder="19h30" hint="Opcional. Quando os portões abrem, se for diferente do início." />
            </div>
            {parseLocal(draft.startAt) && parseLocal(draft.endAt) > parseLocal(draft.startAt) && <p className="a-hint">No site: {whenLabel(draft)}</p>}
          </Card>
          <Card title="Valor">
            <Toggle label="Evento gratuito" checked={!!draft.price.free} onChange={(free) => setPrice({ free })} />
            {!draft.price.free && (
              <div className="a-form-grid a-form-grid-3">
                <Input label="A partir de (R$)" type="number" min={0} step="0.01" value={draft.price.from ?? ""} onChange={(from) => setPrice({ from: from === "" ? "" : +from })} placeholder="30" />
                <Input label="Até (R$)" type="number" min={0} step="0.01" value={draft.price.to ?? ""} onChange={(to) => setPrice({ to: to === "" ? "" : +to })} placeholder="Opcional" hint="Para faixas de preço (lotes, setores)." />
              </div>
            )}
            <Input label="Observação sobre o valor" value={draft.price.note} onChange={(note) => setPrice({ note })} placeholder="Ex.: Meia-entrada para estudantes; bebidas à parte" maxCount={90} />
            <p className="a-hint">No site: {priceLabel(draft)}</p>
          </Card>
          <Card title="Ingressos" subtitle="O botão aparece no topo da página e na caixa de data e valor.">
            <Toggle label="Precisa de ingresso (mesmo se for gratuito)" checked={!!draft.ticket.required} onChange={(required) => setTicket({ required })} />
            <div className="a-form-grid">
              <Input label="Link da venda" value={draft.ticket.url} error={errors.ticketUrl} onChange={(url) => setTicket({ url: url.trim() })} placeholder="https://www.sympla.com.br/…" hint="Sympla, Eventim, Ingresse ou o site do evento." />
              <Input label="Texto do botão" value={draft.ticket.label} onChange={(label) => setTicket({ label })} placeholder={draft.price.free ? "Garantir ingresso" : "Comprar ingresso"} maxCount={28} />
            </div>
          </Card>
          <Card title="Mais informações">
            <div className="a-form-grid">
              <Select label="Classificação etária" value={draft.age} onChange={(age) => set({ age })} options={AGE_RATINGS} />
              <Input label="Instagram do evento" value={draft.insta} onChange={(v) => set({ insta: v.startsWith("@") || !v ? v : "@" + v })} hint="Vira o botão do Instagram no topo da página." />
            </div>
          </Card>
        </>)}

        {tab === "classificacao" && (
          <Card>
            <Select label="Categoria" required value={draft.category} onChange={(category) => set({ category })} error={errors.category}
              placeholder="Escolha a categoria" options={cats.map(c => [c.id, c.label])} hint="As categorias são gerenciadas em Eventos › Categorias." />
            <OrderedPicker label="Vibes" error={errors.affs} hint="A ordem aqui é a ordem em que as vibes aparecem no site."
              value={draft.affs} onChange={(affs) => set({ affs })} options={db.vibes.map(v => [v.id, v.label, v.cls])} />
            <ChipInput label="Assuntos" value={draft.tags} onChange={(tags) => set({ tags })} hint="Palavras que descrevem o evento (ex.: Jazz, Cerveja artesanal). Aparecem na página e ajudam na busca."
              suggestions={[...new Set([...(db.events || []).flatMap(e => e.tags || []), ...db.places.flatMap(p => p.tags || [])])]} />
          </Card>
        )}

        {tab === "local" && (<>
          <Card title="Onde vai ser" subtitle="Escolha um lugar do catálogo: o endereço é preenchido sozinho e continua editável.">
            <Select label="Lugar" value={draft.venue} onChange={pickVenue} placeholder="Outro local (fora do catálogo)"
              options={db.places.filter(p => p.status !== "arquivado").map(p => [p.id, `${p.name} · ${p.bairro}`])}
              hint={venue ? "A página do evento mostra o card deste lugar na seção Onde fica." : "Sem lugar do catálogo, informe o nome do local e o endereço abaixo."} />
            {!venue && <Input label="Nome do local" value={draft.venueName} onChange={(venueName) => set({ venueName })} placeholder="Ex.: Praça Coronel Fernando Prestes" />}
            <Input label="WhatsApp" type="tel" value={draft.whatsapp || ""} onChange={(whatsapp) => set({ whatsapp })} placeholder="(15) 99999-9999" error={errors.whatsapp}
              hint={venue ? `Preenchido com o WhatsApp de ${venue.name}${venue.whatsapp ? "" : " (o lugar não tem WhatsApp cadastrado)"}. Edite se o contato do evento for outro.` : "Número com DDD (celular ou fixo do WhatsApp Business). Vira o botão de WhatsApp na página do evento."} />
            {changedAddress && (
              <p className="a-hint a-menu-warn">Endereço ou WhatsApp diferente do cadastro de {venue.name}.{" "}
                <button type="button" className="a-link" onClick={() => pickVenue(venue.id)}>Usar os dados do lugar</button></p>
            )}
          </Card>
          <LocationTab draft={draft} set={set} errors={errors} title="Endereço do evento" pinLabel={venue?.name || draft.venueName || draft.title || "Local do evento"}
            subtitle={venue ? `Preenchido com o endereço de ${venue.name}. Edite se o evento for em outra entrada ou espaço.` : "Escolha o endereço nas sugestões do Google: cidade e bairro são preenchidos sozinhos."} />
        </>)}

        {tab === "imagens" && (
          <Card title="Fotos do evento" subtitle="Foto ou arte horizontal, sem textos pequenos. As imagens são comprimidas automaticamente.">
            <Toggle label="Mostrar a seção Fotos do evento na página" checked={draft.showGallery !== false} onChange={(showGallery) => set({ showGallery })} />
            <ImageField label="Imagem principal (capa e cards)" path={eventImg(previewId)} hint="16:10 · mín. 1400 px" />
            {isNew ? <p className="a-hint">Salve o evento para liberar o envio da galeria.</p> : (
              <>
                <span className="a-label">Galeria (4 fotos)</span>
                <div className="a-gallery-grid">
                  {eventGallery(previewId).map((g, i) => <ImageField key={g} path={g} hint={`Foto ${i + 1} · 3:4`} ratio="3 / 4" compact />)}
                </div>
              </>
            )}
          </Card>
        )}

        {tab === "seo" && (
          <Card subtitle="Como o evento aparece no Google e nas redes.">
            <Input label="Título da página" value={draft.seo.title} placeholder={`${draft.title || "Nome do evento"} · ${whenLabel(draft)} | Onde Sair`}
              onChange={(v) => set({ seo: { ...draft.seo, title: v } })} maxCount={60} />
            <Textarea label="Meta descrição" value={draft.seo.desc} placeholder={draft.tagline || draft.desc} rows={3}
              onChange={(v) => set({ seo: { ...draft.seo, desc: v } })} maxCount={160} />
            <div className="a-serp" aria-label="Prévia no Google">
              <span className="a-serp-url">ondesair.com.br › eventos › {draft.slug || slugify(draft.title) || "evento"}</span>
              <strong>{draft.seo.title || `${draft.title || "Nome do evento"} · ${whenLabel(draft)} | Onde Sair`}</strong>
              <p>{(draft.seo.desc || draft.tagline || draft.desc || "A descrição aparece aqui.").slice(0, 160)}</p>
            </div>
          </Card>
        )}
      </>}
      side={<>
        <PublishPanel coll="events" draft={draft} set={set} dirty={dirty} isNew={isNew} onSave={save} validate={validate} />
        <Card title="Prévia do card">
          <div className="a-preview" aria-hidden="true">
            <EventCard e={{ ...draft, id: previewId, title: draft.title || "Nome do evento", tagline: draft.tagline || "Frase de destaque do evento.", venueName: venue?.name || draft.venueName }} />
          </div>
        </Card>
        <Checklist items={checklist} />
      </>}
    />
  );
}
