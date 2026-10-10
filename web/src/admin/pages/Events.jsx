// Eventos no painel: lista (Eventos | Categorias) e editor no modelo do cadastro de lugar
import { useState } from "react";
import { SEED_EVENT_CATEGORIES, AGE_RATINGS, eventImg, eventGallery } from "../../data.js";
import { EventCard } from "../../components/site.jsx";
import { ImageSlot } from "../../components/image-slot.jsx";
import {
  AIcon, Btn, Card, Input, Textarea, Select, Toggle, ChipInput, OrderedPicker, Repeater, ImageField, Segmented, Tabs, Field, PageHeader, useAdmin, useDraft,
} from "../kit.jsx";
import { slugify, can } from "../store.js";
import { href } from "../../router.js";
import { ContentList, PublishPanel, useEditorSave, Checklist, EditorLayout, NotFoundItem } from "./content.jsx";
import { LocationTab, IconPicker, REASON_ICONS } from "./Places.jsx";
import { eventsNav } from "./Types.jsx";
import { parseLocal, toLocal, whenLabel, priceLabel, isPast, schedOf, eventDays, deriveRange, periodLabel, dayLabel, hoursLabel, sameHoursAllDays } from "../../events.js";

const catsOf = (db) => db.eventCategories?.length ? db.eventCategories : SEED_EVENT_CATEGORIES;

// ---------------------------------------------------------------------
// Lista
// ---------------------------------------------------------------------
export function EventsList() {
  const { db, user, go } = useAdmin();
  const ep = db.settings.eventsPause;
  const cats = catsOf(db);
  return (
    <ContentList
      notice={ep?.paused && (
        <div className="a-alert tone-warn" role="status">
          <AIcon name="alert" size={16} />
          <div><strong>Os eventos estão pausados no site.</strong> {ep.hideCatalog !== false ? "A agenda não aparece para os visitantes e ninguém consegue enviar eventos." : "O envio de eventos pelo site está pausado; a agenda segue visível."} Aqui no painel tudo funciona normalmente.{" "}
            {can(user, "settings.edit") && <a href={href("/admin/configuracoes/pausas")} onClick={(e) => { e.preventDefault(); go("configuracoes/pausas"); }}>Gerenciar a pausa</a>}</div>
        </div>
      )}
      coll="events" title="Eventos" newLabel="Novo evento" nav={eventsNav(db)}
      subtitle="A agenda da cidade. Só os publicados aparecem no site; eventos encerrados saem da agenda sozinhos."
      searchText={(e) => `${e.title} ${e.venueName || ""} ${e.bairro} ${(e.tags || []).join(" ")}`}
      filters={[
        { key: "when", label: "Quando", options: [["proximos", "Próximos"], ["encerrados", "Encerrados"]], test: (e, v) => v === "encerrados" ? isPast(e) : !isPast(e) },
        { key: "origem", label: "Origem", options: [["site", "Enviados pelo site"], ["equipe", "Cadastrados pela equipe"]], test: (e, v) => v === "site" ? !!e.submittedBy : !e.submittedBy },
        { key: "cat", label: "Categoria", options: cats.map(c => [c.id, c.label]), test: (e, v) => e.category === v },
        { key: "vibe", label: "Vibe", options: db.vibes.map(v => [v.id, v.label]), test: (e, v) => (e.affs || []).includes(v) },
      ]}
      columns={[
        { key: "title", label: "Evento", render: (e) => (
          <span className="a-cell-main">
            <ImageSlot className="a-thumb" src={eventImg(e.id)} compact />
            <span><strong>{e.title}</strong><em>{cats.find(c => c.id === e.category)?.label || "Sem categoria"}{e.submittedBy ? ` · enviado por ${e.submittedBy.name}` : ""}</em></span>
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
  const day = toLocal(s).slice(0, 10);
  return {
    dateFrom: day, dateTo: day, timeFrom: "20:00", timeTo: "23:00", perDay: false, days: {},
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
  ["dateFrom", (d) => !!parseLocal(d.dateFrom), "Informe o primeiro dia."],
  ["dateTo", (d) => !!parseLocal(d.dateTo) && d.dateTo >= d.dateFrom, "O último dia não pode ser antes do primeiro."],
  ["timeFrom", (d) => !!d.timeFrom && eventDays(d).every(x => !!x.from), "Informe o horário de início de todos os dias."],
  ["perDay", (d) => !d.perDay || eventDays(d).length < 2 || !sameHoursAllDays(eventDays(d)), "Com “Dias com horários diferentes” ligado, ao menos um dia precisa ter horário diferente dos outros. Ajuste um dia ou desligue a opção."],
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
  return <EventForm initial={isNew ? { ...base, city: db.settings.defaultCity || base.city } : { ...base, ...found, ...schedOf(found), price: { ...base.price, ...found.price }, ticket: { ...base.ticket, ...found.ticket }, seo: { ...base.seo, ...found.seo } }} isNew={isNew} />;
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
  // período e horários: guarda os dias diferentes só dentro do período e recalcula início/término
  function setSched(patch) {
    const next = { ...draft, ...patch };
    if (next.dateTo < next.dateFrom) next.dateTo = next.dateFrom;
    const inside = Object.fromEntries(Object.entries(next.days || {}).filter(([d]) => d >= next.dateFrom && d <= next.dateTo));
    const days = next.perDay ? inside : {};
    set({ ...patch, dateTo: next.dateTo, days, ...deriveRange({ ...next, days }) });
  }
  const schedDays = eventDays(draft);
  const setDay = (date, patch) => {
    const cur = schedDays.find(d => d.date === date);
    setSched({ days: { ...draft.days, [date]: { from: cur.from, to: cur.to, ...patch } } });
  };

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
    ["Período e horários", !!draft.dateFrom && !!draft.timeFrom],
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
          ["data", "Data e ingressos", tabErr(["dateFrom", "dateTo", "timeFrom", "perDay", "ticketUrl"])],
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
          <Card title="Período e horários" subtitle="Um dia só ou vários dias seguidos. O horário vale para todos os dias, a não ser que você marque dias com horários diferentes.">
            <div className="a-form-grid">
              <Input label="Primeiro dia" required type="date" value={draft.dateFrom} error={errors.dateFrom}
                onChange={(dateFrom) => {
                  // mantém a duração do período ao mudar o primeiro dia
                  const len = Math.max(0, Math.round((parseLocal(draft.dateTo) - parseLocal(draft.dateFrom)) / 864e5)) || 0;
                  const d = parseLocal(dateFrom); if (!d) return setSched({ dateFrom });
                  d.setDate(d.getDate() + len);
                  setSched({ dateFrom, dateTo: toLocal(d).slice(0, 10) });
                }} />
              <Input label="Último dia" required type="date" value={draft.dateTo} min={draft.dateFrom} error={errors.dateTo}
                onChange={(dateTo) => setSched({ dateTo })} hint="Igual ao primeiro dia para eventos de um dia só." />
              <Input label={draft.perDay ? "Abre às (padrão)" : "Abre às"} required type="time" value={draft.timeFrom} error={errors.timeFrom} onChange={(timeFrom) => setSched({ timeFrom })} />
              <Input label={draft.perDay ? "Fecha às (padrão)" : "Fecha às"} type="time" value={draft.timeTo} onChange={(timeTo) => setSched({ timeTo })}
                hint="Se terminar depois da meia-noite, use o horário do dia seguinte (ex.: 02:00)." />
            </div>
            {schedDays.length > 1 && (
              <Toggle label="Dias com horários diferentes" checked={!!draft.perDay} onChange={(perDay) => setSched({ perDay })}
                hint={draft.perDay ? "Ajuste o horário de cada dia abaixo. Os dias que você não mudar seguem o horário padrão." : "Marque para definir um horário próprio em algum dia do período."} />
            )}
            {errors.perDay && <p className="a-error" role="alert">{errors.perDay}</p>}
            {draft.perDay && schedDays.length > 1 && (
              <ul className="a-day-hours" aria-label="Horário de cada dia">
                {schedDays.map(d => {
                  const own = !!draft.days?.[d.date];
                  return (
                    <li key={d.date} className={own ? "is-own" : ""}>
                      <span className="a-day-name">{dayLabel(d.date)}</span>
                      <input className="a-input" type="time" value={d.from} aria-label={`Abre às · ${dayLabel(d.date)}`} onChange={(ev) => setDay(d.date, { from: ev.target.value })} />
                      <span className="a-muted">às</span>
                      <input className="a-input" type="time" value={d.to} aria-label={`Fecha às · ${dayLabel(d.date)}`} onChange={(ev) => setDay(d.date, { to: ev.target.value })} />
                      {own
                        ? <button type="button" className="a-link" onClick={() => { const { [d.date]: _, ...rest } = draft.days; setSched({ days: rest }); }}>Usar o padrão</button>
                        : <span className="a-muted a-day-std">Padrão</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            <Input label="Abertura da casa" value={draft.doors} onChange={(doors) => set({ doors })} placeholder="19h30" hint="Opcional. Quando os portões abrem, se for diferente do início." />
            {draft.dateFrom && <p className="a-hint">No site: {periodLabel(draft)}{schedDays.length === 1 ? ` · ${hoursLabel(schedDays[0])}` : ""}</p>}
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
        {draft.submittedBy && (
          <Card title="Enviado pelo site">
            <dl className="a-meta">
              <div><dt>Quem enviou</dt><dd>{draft.submittedBy.name}</dd></div>
              {draft.submittedBy.email && <div><dt>E-mail da conta</dt><dd><a href={`mailto:${draft.submittedBy.email}`}>{draft.submittedBy.email}</a></dd></div>}
              {draft.contact && <div><dt>Contato informado</dt><dd>{draft.contact}</dd></div>}
              <div><dt>Enviado em</dt><dd>{new Date(draft.submittedBy.at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</dd></div>
            </dl>
            <p className="a-hint">{draft.status === "revisao" ? "Revise os dados (e a foto, se veio) e publique para aprovar. Para recusar, arquive: a pessoa vê “Não aprovado” em Meus eventos." : "Quem enviou acompanha a situação em Meus eventos."}</p>
          </Card>
        )}
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
