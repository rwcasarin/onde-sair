import { useEffect, useRef, useState } from "react";
import { RichEditor } from "../richeditor.jsx";
import { htmlToText, asHtml } from "../../richtext.js";
import { SEED_TYPES, MOMENTOS, AMBIENTES, placeImg } from "../../data.js";
import { photosForEdit, blankPhoto, safeUrl, MAX_PHOTOS } from "../../photos.js";
import { placesNav } from "./Types.jsx";
const typesOf = (db) => db.types?.length ? db.types : SEED_TYPES;
import { ListingCard, MapArt } from "../../components/site.jsx";
import { ImageSlot } from "../../components/image-slot.jsx";
import {
  AIcon, Btn, Card, Input, Textarea, Select, Toggle, ChipInput, PillPicker, OrderedPicker, Repeater, ImageField, Segmented, Tabs, Field, Check,
  PageHeader, useAdmin, useDraft, compressImage,
} from "../kit.jsx";
import { slugify, addCity, addBairro, SITE, setMedia, removeMedia, resolveMedia } from "../store.js";
import { Busy, Loader } from "../../components/loader.jsx";
import { AddressAutocomplete, CreatableField, Pending, findCity, findBairro } from "./location.jsx";
import { PlaceMap } from "../../components/placemap.jsx";
import { loadGoogle, addressOf } from "../../maps.js";
import { ContentList, PublishPanel, useEditorSave, Checklist, EditorLayout, NotFoundItem } from "./content.jsx";
import { autoTitle, autoDesc } from "../../seo.js";

export const REASON_ICONS = ["eye", "star", "heart", "users", "music", "leaf", "sun", "coins", "clock", "sparkle", "image", "camera", "wine", "smile", "pin"];

// ---------------------------------------------------------------------
// Lista
// ---------------------------------------------------------------------
export function PlacesList() {
  const { db } = useAdmin();
  const vibes = db.vibes;
  const bairros = [...new Set(db.places.map(p => p.bairro))].sort();
  return (
    <ContentList
      coll="places" title="Lugares" newLabel="Novo lugar" nav={placesNav(db)}
      subtitle="Todos os endereços da curadoria. Só os publicados aparecem no site."
      searchText={(p) => `${p.name} ${p.bairro} ${p.type} ${p.sub} ${(p.tags || []).join(" ")}`}
      filters={[
        { key: "type", label: "Tipo", options: typesOf(db).map(t => t.label), test: (p, v) => p.type === v },
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
  affs: [], tags: [], reasons: [["star", ""], ["heart", ""], ["users", ""]], momento: [], ambiente: [],
  photos: [], open: "", end: "", cep: "", geo: null, placeId: "", phone: "", whatsapp: "", site: "", insta: "", note: "",
  showGallery: true,
  map: { x: 50, y: 50 }, tint: "tint-impress", seo: { title: "", desc: "" }, status: "rascunho",
};

const RULES = [
  ["photos", (d) => (d.photos || []).every(ph => !ph.link || safeUrl(ph.link)), "Há um link de legenda inválido na galeria (use um endereço como www.site.com.br)."],
  ["whatsapp", (d) => !d.whatsapp || /^(55)?\d{10,11}$/.test(d.whatsapp.replace(/\D/g, "")), "Use o número com DDD, como (15) 99999-9999 ou (15) 3333-4444."],
  ["name", (d) => d.name.trim().length >= 2, "Dê um nome ao lugar."],
  ["type", (d) => !!d.type, "Escolha o tipo.", true],
  ["city", (d) => !!d.city, "Escolha a cidade.", true],
  ["bairro", (d) => !!d.bairro, "Escolha o bairro.", true],
  ["desc", (d) => htmlToText(asHtml(d.desc || "")).length >= 40, "Escreva pelo menos 40 caracteres.", true],
  ["affs", (d) => d.affs.length > 0, "Marque ao menos uma vibe.", true],
  ["end", (d) => !!d.end.trim(), "Informe o endereço.", true],
];

export function PlaceEditor({ id }) {
  const { db, user } = useAdmin();
  const isNew = id === "novo";
  const found = db.places.find(p => p.id === id);
  if (!isNew && !found) return <NotFoundItem what="Lugar" path="lugares" />;
  return <PlaceForm initial={isNew ? { ...BLANK, city: db.settings.defaultCity || BLANK.city, by: `Curadoria · ${user.name.split(" ")[0]}` } : { ...found, photos: photosForEdit(found) }} isNew={isNew} />;
}

function PlaceForm({ initial, isNew }) {
  const { db } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(initial);
  const { errors, validate, save } = useEditorSave({ coll: "places", draft, commit, dirty, rules: RULES });
  const [tab, setTab] = useState("conteudo");
  const previewId = draft.id || "novo";

  const tabErr = (keys) => keys.some(k => errors[k]) ? "!" : null;
  const checklist = [
    ["Nome e subtítulo", !!draft.name && !!draft.sub],
    ["Descrição com 40+ caracteres", htmlToText(asHtml(draft.desc || "")).length >= 40],
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
          ["detalhes", "Detalhes práticos", tabErr(["type", "whatsapp"])],
          ["vibes", "Vibes e tags", tabErr(["affs"])],
          ["imagens", "Imagens"],
          ["mapa", "Localização", tabErr(["end", "city", "bairro"])],
          ["seo", "SEO"],
        ]} />

        {tab === "conteudo" && (
          <Card>
            <div className="a-form-grid">
              <Input label="Nome" required value={draft.name} onChange={(v) => set({ name: v })} error={errors.name} maxCount={60} />
              <Input label="Endereço na URL (slug)" value={draft.slug} placeholder={slugify(draft.name)} onChange={(v) => set({ slug: slugify(v) })} prefix="/lugares/" hint="Deixe em branco para gerar a partir do nome." />
              <Input label="Subtítulo" value={draft.sub} onChange={(v) => set({ sub: v })} hint="Aparece no mapa do Guia, nos cards dos posts do Radar e na busca. Ex.: Rooftop, Boteco de raiz." maxCount={40} />
              <Input label="Tipo de cozinha / programa" value={draft.cuisine} onChange={(v) => set({ cuisine: v })} hint="Ex.: Contemporânea, Café e brunch." />
            </div>
            <Input label="Frase de destaque" value={draft.tagline} onChange={(v) => set({ tagline: v })} maxCount={110} hint="Linha fina abaixo do nome na página do lugar." />
            <RichEditor label="Descrição" required value={draft.desc} onChange={(v) => set({ desc: v })} error={errors.desc} placeholder="Conte como é o lugar…"
              hint="Texto de “Sobre o lugar”. Sem limite de tamanho. Só vai para os cards (sem formatação) quando a frase de destaque está vazia. Tom de amigo, não de guia." />
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
              <Select label="Tipo" required value={draft.type} onChange={(v) => set({ type: v })} options={[...new Set([...typesOf(db).map(t => t.label), draft.type].filter(Boolean))]} error={errors.type} />
              <Input label="Funcionamento" value={draft.open} onChange={(v) => set({ open: v })} placeholder="Ter–Dom · 12h – 23h" />
              <Input label="Telefone" value={draft.phone} onChange={(v) => set({ phone: v })} type="tel" placeholder="(00) 0000-0000" />
              <Input label="Site" value={draft.site} onChange={(v) => set({ site: v.replace(/^https?:\/\//, "") })} prefix="https://" />
              <Input label="Instagram" value={draft.insta} onChange={(v) => set({ insta: v.startsWith("@") || !v ? v : "@" + v })} />
              <Input label="WhatsApp" value={draft.whatsapp || ""} onChange={(v) => set({ whatsapp: v })} type="tel" placeholder="(15) 99999-9999"
                error={errors.whatsapp} hint="Número com DDD (celular ou fixo do WhatsApp Business). Vira o botão de WhatsApp na página do lugar." />
            </div>
            <div className="a-form-grid">
              <PillPicker label="Momento" value={draft.momento} onChange={(momento) => set({ momento })} options={MOMENTOS.map(m => [m, m])} />
              <PillPicker label="Ambiente" value={draft.ambiente} onChange={(ambiente) => set({ ambiente })} options={AMBIENTES.map(m => [m, m])} />
            </div>
          </Card>
        )}

        {tab === "vibes" && (
          <Card>
            <OrderedPicker label="Vibes" error={errors.affs} hint="A ordem aqui é a ordem em que as vibes aparecem no site."
              value={draft.affs} onChange={(affs) => set({ affs })} options={db.vibes.map(v => [v.id, v.label, v.cls])} />
            <ChipInput label="Tags" value={draft.tags} onChange={(tags) => set({ tags })} hint="Aparecem na página do lugar (abaixo do texto “Sobre o lugar”) e ajudam na busca. De 3 a 5 funcionam melhor."
              suggestions={[...new Set(db.places.flatMap(p => p.tags || []))]} />
          </Card>
        )}

        {tab === "imagens" && (<>
          <Card title="Fotos do lugar" subtitle="Envie fotos horizontais com boa luz. Elas são comprimidas automaticamente.">
            <Toggle label="Mostrar a seção Fotos do lugar na página" checked={draft.showGallery !== false} onChange={(showGallery) => set({ showGallery })} />
            <ImageField label="Foto principal (topo da página e card)" path={placeImg(previewId)} hint="16:10 · mín. 1400 px" />
            <p className="a-hint">Ela ilustra o topo da página e o card do lugar; não entra na galeria.</p>
          </Card>
          <Card title="Galeria" subtitle={`Até ${MAX_PHOTOS} fotos, na ordem em que aparecem no site. Clicar numa foto abre a galeria em tela cheia, com legendas e miniaturas.`}>
            {errors.photos && <p className="a-error" role="alert">{errors.photos}</p>}
            {isNew ? <p className="a-hint">Salve o lugar para liberar o envio da galeria.</p>
              : <PhotoGallery id={previewId} photos={draft.photos || []} onChange={(v) => set(d => ({ photos: typeof v === "function" ? v(d.photos || []) : v }))} />}
          </Card>
        </>)}

        {tab === "mapa" && <LocationTab draft={draft} set={set} errors={errors} />}

        {tab === "seo" && (
          <Card subtitle="Como o lugar aparece no Google e nas redes.">
            <Input label="Título da página" value={draft.seo.title} placeholder={autoTitle("places", draft)}
              onChange={(v) => set({ seo: { ...draft.seo, title: v } })} maxCount={60} />
            <Textarea label="Meta descrição" value={draft.seo.desc} placeholder={autoDesc("places", draft) || "Sem preencher, usamos a frase de destaque."} rows={3}
              onChange={(v) => set({ seo: { ...draft.seo, desc: v } })} maxCount={160} />
            <div className="a-serp" aria-label="Prévia no Google">
              <span className="a-serp-url">ondesair.com.br › lugares › {draft.slug || slugify(draft.name) || "lugar"}</span>
              <strong>{draft.seo.title || autoTitle("places", draft)}</strong>
              <p>{(draft.seo.desc || autoDesc("places", draft) || SITE.seoDesc || "A descrição aparece aqui.").slice(0, 160)}</p>
            </div>
          </Card>
        )}
      </>}
      side={<>
        <PublishPanel coll="places" draft={draft} set={set} dirty={dirty} isNew={isNew} onSave={save} validate={validate} />
        <Card title="Prévia do card">
          <div className="a-preview" aria-hidden="true">
            <ListingCard p={{ ...draft, id: previewId, name: draft.name || "Nome do lugar", sub: draft.sub || "Subtítulo", desc: draft.desc || "Descrição.", tags: draft.tags, reviews: draft.reviews || 0 }} />
          </div>
        </Card>
        <Checklist items={checklist} />
        {!isNew && (
          <Card title="Na comunidade">
            <dl className="a-meta">
            </dl>
          </Card>
        )}
      </>}
    />
  );
}

// ---------------------------------------------------------------------
// Aba Localização: endereço (Google), cidade e bairro relacionados, pino no mapa
// ---------------------------------------------------------------------
export function LocationTab({ draft, set, errors, pinLabel, title = "Endereço", subtitle = "Escolha o endereço nas sugestões do Google: cidade e bairro são preenchidos sozinhos." }) {
  const pinName = pinLabel || draft.name || "Novo lugar";
  const { db, user, toast } = useAdmin();
  const [pending, setPending] = useState(null);       // cidade/bairro vindos do Google que ainda não existem
  const [newUf, setNewUf] = useState(null);           // cadastro manual de cidade: falta a UF
  const city = db.cities.find(c => c.id === draft.city);
  const apiKey = db.settings.mapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [locating, setLocating] = useState(false);
  // coordenadas a partir do endereço (Geocoding)
  async function locate() {
    setLocating(true);
    try {
      const g = await loadGoogle(apiKey);
      const { results } = await new g.Geocoder().geocode({ address: addressOf({ ...draft, id: draft.id || "__draft" }), region: "br" });
      const l = results?.[0]?.geometry?.location;
      if (l) { set({ geo: { lat: +l.lat().toFixed(6), lng: +l.lng().toFixed(6) } }); toast("Pino posicionado pelo endereço. Confira no mapa e ajuste se precisar.", "success"); }
      else toast("Endereço não encontrado no Google. Clique no mapa para posicionar.", "error");
    } catch (e) { toast("Não foi possível localizar: confira se a Geocoding API está liberada para a chave.", "error"); }
    setLocating(false);
  }

  // endereço escolhido no Google: preenche tudo o que já existe e sinaliza o que falta cadastrar
  function onPick(a) {
    const patch = { end: a.end, cep: a.cep, geo: a.geo, placeId: a.placeId };
    const c = a.city && findCity(db.cities, a.city, a.uf);
    const b = c && a.bairro && findBairro(c, a.bairro);
    if (c) { patch.city = c.id; patch.bairro = b || ""; } else if (a.city) { patch.city = ""; patch.bairro = ""; }
    set(patch);
    setPending({ city: !c && a.city ? { name: a.city, sub: a.uf } : null, bairro: a.bairro && !b ? a.bairro : null });
  }

  function createCity(name, sub) {
    const r = addCity({ name, sub }, user);
    if (r.error) { toast(r.error, "error"); return null; }
    if (r.existed) toast(`${r.city.name} já estava cadastrada.`, "info");
    else toast(`Cidade ${r.city.name} (${r.city.sub}) cadastrada. Ela entra inativa no site até você ativá-la.`, "success");
    set({ city: r.city.id, bairro: "" });
    return r.city;
  }
  function createBairro(name, cityId = draft.city) {
    const r = addBairro(cityId, name, user);
    if (r.error) return toast(r.error, "error");
    if (r.existed) toast(`${r.bairro} já estava cadastrado.`, "info");
    else toast(`Bairro ${r.bairro} cadastrado.`, "success");
    set({ city: cityId, bairro: r.bairro });
  }
  // aceita a sugestão do Google: cadastra a cidade (se faltar) e o bairro em sequência
  function acceptPending() {
    let cityId = draft.city;
    if (pending.city) { const c = createCity(pending.city.name, pending.city.sub); if (!c) return; cityId = c.id; }
    if (pending.bairro) createBairro(pending.bairro, cityId);
    setPending(null);
  }
  const pendingText = pending && (pending.city || pending.bairro)
    ? [pending.city && `a cidade ${pending.city.name}${pending.city.sub ? " (" + pending.city.sub + ")" : ""}`, pending.bairro && `o bairro ${pending.bairro}`].filter(Boolean).join(" e ")
    : null;

  const cityOptions = db.cities.map(c => ({ value: c.id, label: c.name, note: (c.sub || "") + (c.active ? "" : " · inativa") }));
  const bairroOptions = (city?.bairros || []).map(b => ({ value: b, label: b }));
  const mapsUrl = draft.geo ? `https://www.google.com/maps/search/?api=1&query=${draft.geo.lat},${draft.geo.lng}${draft.placeId ? "&query_place_id=" + draft.placeId : ""}` : null;

  return (
    <>
      <Card title={title} subtitle={subtitle}>
        <AddressAutocomplete label="Endereço" required apiKey={apiKey} value={draft.end} error={errors.end}
          onChange={(end) => { set({ end, geo: null, placeId: "" }); setPending(null); }} onPick={onPick} />
        {pendingText && (
          <Pending text={`O endereço fica em ${pendingText}, que ainda não ${pending.city && pending.bairro ? "estão cadastrados" : "está cadastrado"}.`}
            action="Cadastrar" onClick={acceptPending} />
        )}
        <div className="a-form-grid">
          <CreatableField label="Cidade" required error={errors.city} value={city?.name || ""}
            options={cityOptions} placeholder="Busque ou cadastre a cidade"
            onSelect={(id) => { set({ city: id, bairro: id === draft.city ? draft.bairro : "" }); setPending(p => p && { ...p, city: null }); }}
            onCreate={(name) => setNewUf({ name, sub: "" })}
            createLabel={(t) => `Cadastrar a cidade “${t}”`}
            extra={newUf && (
              <div className="a-inline-create">
                <span>Estado (UF) de <strong>{newUf.name}</strong>:</span>
                <input className="a-input" value={newUf.sub} maxLength={2} autoFocus aria-label="Sigla do estado" placeholder="SP"
                  onChange={(e) => setNewUf({ ...newUf, sub: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (createCity(newUf.name, newUf.sub)) setNewUf(null); } }} />
                <Btn size="sm" kind="primary" onClick={() => { if (createCity(newUf.name, newUf.sub)) setNewUf(null); }}>Cadastrar</Btn>
                <Btn size="sm" kind="ghost" onClick={() => setNewUf(null)}>Cancelar</Btn>
              </div>
            )} />
          <CreatableField label="Bairro" required error={errors.bairro} value={draft.bairro} disabled={!city}
            options={bairroOptions} placeholder={city ? `Bairros de ${city.name}` : "Escolha a cidade primeiro"}
            hint={city ? `${city.bairros.length} bairro(s) em ${city.name}. Digite para buscar ou cadastrar.` : null}
            onSelect={(b) => { set({ bairro: b }); setPending(p => p && { ...p, bairro: null }); }}
            onCreate={(name) => createBairro(name)}
            createLabel={(t) => `Cadastrar o bairro “${t}” em ${city?.name}`} />
          <Input label="CEP" value={draft.cep || ""} onChange={(cep) => set({ cep: cep.replace(/[^\d-]/g, "").slice(0, 9) })} placeholder="00000-000" />
          <Field label="Coordenadas">
            <div className="a-geo">
              {draft.geo
                ? <><span>{draft.geo.lat}, {draft.geo.lng}</span><a href={mapsUrl} target="_blank" rel="noreferrer"><AIcon name="ext" size={14} /> Ver no Google Maps</a></>
                : <span className="a-muted">Preenchidas ao escolher o endereço nas sugestões.</span>}
            </div>
          </Field>
        </div>
      </Card>

      {apiKey ? (
        <Card title="Pino no mapa" subtitle="É assim que o lugar aparece nos mapas do site. Clique no mapa para ajustar a posição exata do pino.">
          <div className="a-map-tools">
            <Btn size="sm" icon="pin" disabled={locating || !draft.end} onClick={locate}>{locating ? "Localizando…" : "Localizar pelo endereço"}</Btn>
            {draft.geo && <span className="a-hint">{draft.geo.lat}, {draft.geo.lng}</span>}
            {!draft.geo && <span className="a-hint">Sem coordenadas ainda: o site tenta achar pelo endereço.</span>}
          </div>
          <PlaceMap className="a-map-art" card={false} mainId="__draft" onPick={(geo) => set({ geo })}
            items={[{ id: "__draft", place: { ...draft, id: draft.id || "__draft", name: pinName } },
              ...db.places.filter(p => p.id !== draft.id && p.city === draft.city).map(p => ({ id: p.id, place: p }))]} />
        </Card>
      ) : (
        <Card title="Pino no mapa ilustrado" subtitle="Sem chave do Google Maps, o site usa o mapa ilustrado. Clique para posicionar o pino.">
          <div className="a-map-pick" onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            set({ map: { ...draft.map, x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) } });
          }}>
            <MapArt className="a-map-art" pins={[...db.places.filter(p => p.id !== draft.id).map(p => ({ x: p.map.x, y: p.map.y, color: "#C9C3DB", title: p.name })), { x: draft.map.x, y: draft.map.y, label: pinName, color: "var(--c-magenta)" }]} />
          </div>
          <div className="a-form-grid">
            <Input label="Posição X (%)" type="number" min={0} max={100} value={draft.map.x} onChange={(v) => set({ map: { ...draft.map, x: +v } })} />
            <Input label="Posição Y (%)" type="number" min={0} max={100} value={draft.map.y} onChange={(v) => set({ map: { ...draft.map, y: +v } })} />
          </div>
        </Card>
      )}
    </>
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

// ---------------------------------------------------------------------
// Galeria do lugar: envio de várias fotos (com andamento de cada uma), ordem por arrastar ou
// pelas setas, trocar a imagem mantendo a legenda, usar como foto principal e remover.
// ---------------------------------------------------------------------
const newPath = (id, k = 0) => `images/lugares/${id}-f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}${k}.jpg`;
const MIN_WIDTH = 1000;   // abaixo disso, a foto fica borrada na galeria em tela cheia

// lê uma imagem já enviada (para copiá-la como foto principal)
async function mediaAsDataUrl(path) {
  const blob = await (await fetch(resolveMedia(path))).blob();
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
}

function PhotoGallery({ id, photos, onChange }) {
  const { user, toast, confirm } = useAdmin();
  const input = useRef(null), replaceInput = useRef(null), replaceAt = useRef(null);
  const [queue, setQueue] = useState([]);          // envios em andamento ou com erro: { key, file, name, status, error }
  const [busy, setBusy] = useState({});            // por foto: "trocando" | "removendo" | "capa"
  const [over, setOver] = useState(false);
  const [drag, setDrag] = useState(null);          // { from, to } ao arrastar uma foto
  const [dims, setDims] = useState({});            // tamanho real de cada foto (aviso de foto pequena)
  const [view, setView] = useState("lista");       // "lista" (com legendas) ou "grade" (só miniaturas, para ordenar)
  const sending = queue.filter(q => q.status === "enviando").length;
  const room = MAX_PHOTOS - photos.length - sending;

  // mede as fotos para avisar quando forem pequenas demais
  useEffect(() => {
    photos.forEach(ph => {
      if (dims[ph.path]) return;
      const im = new Image();
      im.onload = () => setDims(d => ({ ...d, [ph.path]: [im.naturalWidth, im.naturalHeight] }));
      im.src = resolveMedia(ph.path);
    });
  }, [photos]); // eslint-disable-line

  const upd = (k, patch) => onChange(photos.map((p, i) => i === k ? { ...p, ...patch } : p));
  const moveTo = (from, to) => {
    if (from === to || to < 0 || to >= photos.length) return;
    const n = [...photos]; const [it] = n.splice(from, 1); n.splice(to, 0, it); onChange(n);
  };
  const setBusyOf = (path, v) => setBusy(b => { const n = { ...b }; if (v) n[path] = v; else delete n[path]; return n; });

  // envia um arquivo e devolve o caminho salvo
  async function upload(file, k = 0) {
    if (!file.type.startsWith("image/")) throw new Error("não é uma imagem.");
    if (file.size > 15 * 1024 * 1024) throw new Error("arquivo acima de 15 MB.");
    const path = newPath(id, k);
    await setMedia(path, await compressImage(file), user);
    return path;
  }
  async function send(items) {
    // até 2 envios ao mesmo tempo; cada foto entra na lista assim que termina, na ordem escolhida
    const done = new Map();
    let next = 0;
    const order = items.map(it => it.key);
    const flush = () => {
      const ready = [];
      while (order.length && done.has(order[0])) { const p = done.get(order.shift()); if (p) ready.push(blankPhoto(p)); }
      if (ready.length) onChange(cur => [...cur, ...ready]);
    };
    async function worker() {
      while (next < items.length) {
        const it = items[next++];
        try {
          const path = await upload(it.file, next);
          done.set(it.key, path);
          setQueue(q => q.filter(x => x.key !== it.key));
        } catch (e) {
          done.set(it.key, null);
          setQueue(q => q.map(x => x.key === it.key ? { ...x, status: "erro", error: e.message || "falha no envio." } : x));
        }
        flush();
      }
    }
    await Promise.all([worker(), worker()]);
    const ok = items.filter(it => done.get(it.key)).length;
    if (ok) toast(ok === 1 ? "Foto enviada. Salve o lugar para publicar." : `${ok} fotos enviadas. Salve o lugar para publicar.`, "success");
  }
  function add(files) {
    const all = [...files];
    const list = all.filter(f => f.type.startsWith("image/")).slice(0, Math.max(0, room));
    if (!list.length) return toast(room > 0 ? "Escolha arquivos de imagem." : `A galeria já tem ${MAX_PHOTOS} fotos.`, "error");
    if (all.length > list.length) toast(room > 0 ? `Só cabem mais ${room} foto(s); as demais ficaram de fora.` : "Só arquivos de imagem são aceitos.", "error");
    const items = list.map((file, k) => ({ key: Date.now().toString(36) + k + Math.random(), file, name: file.name, status: "enviando" }));
    setQueue(q => [...q, ...items]);
    send(items);
  }
  function retry(it) {
    const again = { ...it, status: "enviando", error: "" };
    setQueue(q => q.map(x => x.key === it.key ? again : x));
    send([again]);
  }

  async function replace(k, file) {
    const ph = photos[k]; if (!file || !ph) return;
    setBusyOf(ph.path, "trocando");
    try {
      const path = await upload(file, k);
      onChange(cur => cur.map(p => p.path === ph.path ? { ...p, path } : p));
      setDims(d => { const n = { ...d }; delete n[ph.path]; return n; });
      removeMedia(ph.path, user).catch(() => {});
      toast("Foto trocada. A legenda foi mantida.", "success");
    } catch (e) { toast(`Não foi possível trocar: ${e.message || "falha no envio."}`, "error"); }
    setBusyOf(ph.path, null);
  }
  async function makeCover(k) {
    const ph = photos[k];
    if (!(await confirm({ title: "Usar como foto principal?", text: "Ela passa a ser a foto do topo da página e do card do lugar. A foto continua na galeria.", ok: "Usar como principal" }))) return;
    setBusyOf(ph.path, "capa");
    try {
      await setMedia(placeImg(id), await mediaAsDataUrl(ph.path), user);
      toast("Foto principal atualizada.", "success");
    } catch (e) { toast(`Não foi possível copiar a foto: ${e.message}`, "error"); }
    setBusyOf(ph.path, null);
  }
  async function remove(k) {
    const ph = photos[k];
    if (!(await confirm({ title: "Remover esta foto?", text: "Ela sai da galeria e do armazenamento.", ok: "Remover", danger: true }))) return;
    setBusyOf(ph.path, "removendo");
    try { await removeMedia(ph.path, user); } catch { /* já não existia */ }
    onChange(cur => cur.filter(p => p.path !== ph.path));
    setBusyOf(ph.path, null);
  }

  // arrastar para reordenar (ponteiro: funciona com mouse e no toque)
  const list = useRef(null);
  function startDrag(k, e) {
    if (busy[photos[k].path]) return;
    e.preventDefault();
    const items = [...list.current.querySelectorAll("[data-photo]")];
    const boxes = items.map(r => r.getBoundingClientRect());
    let to = k;
    setDrag({ from: k, to: k });
    const onMove = (ev) => {
      const x = ev.clientX, y = ev.clientY;
      if (view === "lista") to = boxes.filter(r => r.top + r.height / 2 < y).length;     // posição de inserção (0..n)
      else {                                                                             // grade: antes ou depois da miniatura mais próxima
        let best = 0, dist = Infinity;
        boxes.forEach((r, i) => { const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y); if (d < dist) { dist = d; best = i; } });
        to = x > boxes[best].left + boxes[best].width / 2 ? best + 1 : best;
      }
      setDrag({ from: k, to });
      if (y < 80) window.scrollBy(0, -12); else if (y > innerHeight - 80) window.scrollBy(0, 12);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp);
      setDrag(null);
      moveTo(k, to > k ? to - 1 : to);
    };
    document.addEventListener("pointermove", onMove); document.addEventListener("pointerup", onUp);
  }
  const BUSY_LABEL = { trocando: "Trocando…", removendo: "Removendo…", capa: "Copiando…" };

  return (
    <div className="a-photos">
      <div className={"a-photos-drop" + (over ? " over" : "")}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        <input ref={replaceInput} type="file" accept="image/*" hidden onChange={(e) => { replace(replaceAt.current, e.target.files[0]); e.target.value = ""; }} />
        <AIcon name="upload" size={22} />
        <span>Arraste fotos para cá ou <button type="button" className="a-link" onClick={() => input.current?.click()} disabled={room <= 0}>escolha no computador</button></span>
        <small>{photos.length} de {MAX_PHOTOS}{sending ? ` · enviando ${sending}` : ""} · mín. {MIN_WIDTH} px de largura · comprimidas automaticamente</small>
      </div>

      {photos.length > 1 && (
        <div className="a-photos-bar">
          <p className="a-hint">{view === "lista" ? <>Arraste pelo <AIcon name="grip" size={13} /> para mudar a ordem (ou use as setas).</> : "Arraste as miniaturas para mudar a ordem."} A primeira foto é a maior do mosaico.</p>
          <div className="a-seg" role="group" aria-label="Visualização">
            <button type="button" className={view === "lista" ? "on" : ""} aria-pressed={view === "lista"} onClick={() => setView("lista")}>Lista com legendas</button>
            <button type="button" className={view === "grade" ? "on" : ""} aria-pressed={view === "grade"} onClick={() => setView("grade")}>Grade para ordenar</button>
          </div>
        </div>
      )}
      {view === "grade" && (
        <ol ref={list} className={"a-photo-grid" + (drag ? " is-dragging" : "")}>
          {photos.map((ph, k) => (
            <li key={ph.path} data-photo={k} onPointerDown={(e) => startDrag(k, e)}
              className={"a-photo-cell" + (drag?.from === k ? " is-drag" : "") + (drag && drag.to === k && drag.from !== k ? " drop-before" : "") + (drag && drag.to === k + 1 && k === photos.length - 1 && drag.from !== k ? " drop-after" : "")}
              title={ph.caption || `Foto ${k + 1}`}>
              <ImageSlot key={ph.path} src={ph.path} alt="" compact />
              <span className="a-photo-n">{k + 1}</span>
              {busy[ph.path] && <span className="a-photo-busy"><Loader size={26} label={BUSY_LABEL[busy[ph.path]]} /></span>}
            </li>
          ))}
          {queue.filter(q => q.status === "enviando").map(it => <li key={it.key} className="a-photo-cell is-pending"><span className="a-photo-busy"><Loader size={26} label="Enviando" /></span></li>)}
        </ol>
      )}
      {photos.length === 0 && !queue.length && <p className="a-hint">Nenhuma foto na galeria ainda.</p>}

      {view === "lista" && <ol ref={list} className={"a-photo-list" + (drag ? " is-dragging" : "")}>
        {photos.map((ph, k) => {
          const b = busy[ph.path], d = dims[ph.path], small = d && d[0] < MIN_WIDTH;
          return (
            <li key={ph.path} data-photo={k} className={"a-photo-row" + (drag?.from === k ? " is-drag" : "") + (drag && drag.to === k && drag.from !== k ? " drop-before" : "") + (drag && drag.to === photos.length && k === photos.length - 1 && drag.from !== k ? " drop-after" : "")}
>
              <span className="a-photo-grip" onPointerDown={(e) => startDrag(k, e)} title="Arraste para mudar a ordem" aria-hidden="true"><AIcon name="grip" size={18} /></span>
              <div className="a-photo-thumb">
                <ImageSlot key={ph.path} src={ph.path} alt="" compact />
                <span className="a-photo-n">{k + 1}</span>
                {b && <span className="a-photo-busy"><Loader size={34} label={BUSY_LABEL[b]} /><em>{BUSY_LABEL[b]}</em></span>}
              </div>
              <div className="a-photo-fields">
                {d && <span className={"a-photo-size" + (small ? " warn" : "")}>{d[0]}×{d[1]} px{small ? " · foto pequena, pode ficar borrada em tela cheia" : ""}</span>}
                <Input label="Legenda" value={ph.caption} onChange={(caption) => upd(k, { caption })} maxCount={160} placeholder="Ex.: O salão principal, com vista para o lago" />
                <div className="a-form-grid">
                  <Input label="Crédito" value={ph.credit} onChange={(credit) => upd(k, { credit })} maxCount={60} placeholder="Foto: @perfil ou nome" />
                  <Input label="Descrição da imagem" value={ph.alt} onChange={(alt) => upd(k, { alt })} maxCount={140} hint="Para leitores de tela. Em branco, usa a legenda." />
                  <Input label="Link da legenda" value={ph.link} onChange={(link) => upd(k, { link: link.trim() })} placeholder="www.site.com.br/cardapio"
                    error={ph.link && !safeUrl(ph.link) ? "Endereço inválido." : undefined} />
                  <Input label="Texto do link" value={ph.linkLabel} onChange={(linkLabel) => upd(k, { linkLabel })} maxCount={40} placeholder="Saiba mais" />
                </div>
                <div className="a-photo-tools">
                  <Btn size="sm" icon="refresh" disabled={!!b} onClick={() => { replaceAt.current = k; replaceInput.current?.click(); }}>Trocar foto</Btn>
                  <Btn size="sm" icon="image" disabled={!!b} onClick={() => makeCover(k)}>Usar como principal</Btn>
                  <Btn size="sm" kind="ghost" icon="trash" disabled={!!b} onClick={() => remove(k)}>Remover</Btn>
                </div>
              </div>
              <div className="a-photo-actions">
                <Btn size="sm" kind="ghost" icon="up" aria-label="Subir" disabled={k === 0 || !!b} onClick={() => moveTo(k, k - 1)} />
                <Btn size="sm" kind="ghost" icon="down" aria-label="Descer" disabled={k === photos.length - 1 || !!b} onClick={() => moveTo(k, k + 1)} />
              </div>
            </li>
          );
        })}
        {queue.map(it => (
          <li key={it.key} className={"a-photo-row a-photo-pending" + (it.status === "erro" ? " is-error" : "")}>
            <span className="a-photo-grip" aria-hidden="true" />
            <div className="a-photo-thumb">
              {it.status === "enviando" ? <span className="a-photo-busy"><Loader size={34} label="Enviando" /><em>Enviando…</em></span>
                : <span className="a-photo-busy is-error"><AIcon name="alert" size={22} /><em>Não enviada</em></span>}
            </div>
            <div className="a-photo-fields">
              <strong className="a-photo-name">{it.name}</strong>
              {it.status === "enviando" ? <span className="a-hint">Comprimindo e enviando a foto…</span>
                : <span className="a-error">{it.error}</span>}
              {it.status === "erro" && (
                <div className="a-photo-tools">
                  <Btn size="sm" icon="refresh" onClick={() => retry(it)}>Tentar de novo</Btn>
                  <Btn size="sm" kind="ghost" onClick={() => setQueue(q => q.filter(x => x.key !== it.key))}>Descartar</Btn>
                </div>
              )}
            </div>
            <div className="a-photo-actions" />
          </li>
        ))}
      </ol>}
      {view === "grade" && queue.some(q => q.status === "erro") && <p className="a-error">Algumas fotos não foram enviadas. Veja em “Lista com legendas” para tentar de novo.</p>}
    </div>
  );
}
