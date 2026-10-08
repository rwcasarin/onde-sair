import { useEffect, useState } from "react";
import { TYPES, PRICE_RANGE, MOMENTOS, AMBIENTES, placeImg, placeGallery } from "../../data.js";
import { ListingCard, MapArt } from "../../components/site.jsx";
import { ImageSlot } from "../../components/image-slot.jsx";
import {
  AIcon, Btn, Card, Input, Textarea, Select, Toggle, ChipInput, PillPicker, Repeater, ImageField, Segmented, Tabs, Field, Check,
  PageHeader, useAdmin, useDraft,
} from "../kit.jsx";
import { slugify, addCity, addBairro } from "../store.js";
import { AddressAutocomplete, CreatableField, Pending, findCity, findBairro } from "./location.jsx";
import { checkInstaProfile } from "../../insta.js";
import { PlaceMap } from "../../components/placemap.jsx";
import { loadGoogle, addressOf } from "../../maps.js";
import { ContentList, PublishPanel, useEditorSave, Checklist, EditorLayout, NotFoundItem } from "./content.jsx";

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
  affs: [], tags: [], reasons: [["star", ""], ["heart", ""], ["users", ""]], momento: [], ambiente: [],
  priceLevel: 2, open: "", end: "", cep: "", geo: null, placeId: "", phone: "", site: "", insta: "", reserva: false, note: "",
  showGallery: true, showInstagram: true,
  rating: 0, reviews: 0, map: { x: 50, y: 50, label: "" }, tint: "tint-impress", seo: { title: "", desc: "" }, status: "rascunho",
};

const RULES = [
  ["name", (d) => d.name.trim().length >= 2, "Dê um nome ao lugar."],
  ["type", (d) => !!d.type, "Escolha o tipo.", true],
  ["city", (d) => !!d.city, "Escolha a cidade.", true],
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
  return <PlaceForm initial={isNew ? { ...BLANK, city: db.settings.defaultCity || BLANK.city, by: `Curadoria · ${user.name.split(" ")[0]}` } : found} isNew={isNew} />;
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
          ["detalhes", "Detalhes práticos", tabErr(["type"])],
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
            <ChipInput label="Tags" value={draft.tags} onChange={(tags) => set({ tags })} hint="Aparecem no topo da página do lugar (abaixo das vibes) e nos cards da listagem. De 3 a 5 funcionam melhor."
              suggestions={[...new Set(db.places.flatMap(p => p.tags || []))]} />
          </Card>
        )}

        {tab === "imagens" && (<>
          <Card title="Instagram" subtitle="Seção “No Instagram”, antes das fotos do lugar, com os 10 posts mais recentes do perfil — atualizada automaticamente.">
            <Toggle label="Mostrar a seção Instagram na página" hint="Só aparece se o perfil for público e profissional (empresa ou criador)."
              checked={draft.showInstagram !== false} onChange={(showInstagram) => set({ showInstagram })} />
            <InstaStatus handle={draft.insta} />
          </Card>
          <Card title="Fotos do lugar" subtitle="Envie fotos horizontais com boa luz. Elas são comprimidas automaticamente.">
            <Toggle label="Mostrar a seção Fotos do lugar na página" checked={draft.showGallery !== false} onChange={(showGallery) => set({ showGallery })} />
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
        </>)}

        {tab === "mapa" && <LocationTab draft={draft} set={set} errors={errors} />}

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

// ---------------------------------------------------------------------
// Aba Localização: endereço (Google), cidade e bairro relacionados, pino no mapa
// ---------------------------------------------------------------------
function LocationTab({ draft, set, errors }) {
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
      <Card title="Endereço" subtitle="Escolha o endereço nas sugestões do Google: cidade e bairro são preenchidos sozinhos.">
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
            items={[{ id: "__draft", place: { ...draft, id: draft.id || "__draft", name: draft.name || "Novo lugar" } },
              ...db.places.filter(p => p.id !== draft.id && p.city === draft.city).map(p => ({ id: p.id, place: p }))]} />
        </Card>
      ) : (
        <Card title="Pino no mapa ilustrado" subtitle="Sem chave do Google Maps, o site usa o mapa ilustrado. Clique para posicionar o pino.">
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

// Situação do perfil do Instagram (consulta o servidor ao mudar o perfil)
const INSTA_MSG = {
  ok: (d) => ["ok", `Perfil público${d.username ? " @" + d.username : ""}: os ${d.posts.length} posts mais recentes aparecem na página.`],
  "sem-posts": () => ["warn", "O perfil é público, mas ainda não tem posts. A seção não aparece."],
  indisponivel: () => ["warn", "Perfil privado, pessoal ou inexistente. A seção não aparece na página."],
  "nao-configurado": () => ["warn", "A integração com o Instagram ainda não foi configurada no servidor. A seção não aparece."],
  invalido: () => ["warn", "O Instagram em Detalhes práticos não parece um perfil válido."],
  erro: (d) => ["warn", d.detail || "Não foi possível consultar o Instagram agora. Tente de novo mais tarde."],
};
function InstaStatus({ handle }) {
  const h = (handle || "").trim();
  const [st, setSt] = useState(null);
  useEffect(() => {
    setSt(null);
    if (!h) return;
    let alive = true;
    const t = setTimeout(() => checkInstaProfile(h).then(d => alive && setSt(d)).catch(() => alive && setSt({ status: "erro", posts: [] })), 500);
    return () => { alive = false; clearTimeout(t); };
  }, [h]);
  if (!h) return <p className="a-hint">Preencha o Instagram do lugar em Detalhes práticos.</p>;
  if (!st) return <p className="a-hint">Verificando o perfil {h}…</p>;
  const [tone, text] = (INSTA_MSG[st.status] || INSTA_MSG.erro)(st);
  return <p className={"a-insta-status " + tone} role="status">{text}</p>;
}
