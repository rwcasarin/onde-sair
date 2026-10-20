// Home · carrossel de destaques: cadastro manual de cada slide (imagem, conteúdo, data/horário e link)
import { useState } from "react";
import { AIcon, Badge, Btn, Card, Field, Input, Textarea, Select, Toggle, ImageField, useAdmin } from "../kit.jsx";
import { ImageSlot } from "../../components/image-slot.jsx";
import { SlideDate } from "../../components/home-carousel.jsx";
import { isLive } from "../store.js";
import { eventPath, placePath, roteiroPath, storyPath } from "../../router.js";
import { slideImg, newSlide, slideStatus, slideWhen, SLIDE_INTERVALS, FOCUS, normLink, linkError, isExternal } from "../../carousel.js";

export const MAX_SLIDES = 10;
const toLocalInput = (iso) => { if (!iso) return ""; const d = new Date(iso); if (isNaN(d)) return ""; const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const fromLocalInput = (v) => { if (!v) return ""; const d = new Date(v); return isNaN(d) ? "" : d.toISOString(); };

// erros de cada slide (só os ativos bloqueiam o salvamento)
export function slideErrors(s) {
  const e = {};
  if (!String(s.title || "").trim()) e.title = "Dê um título ao destaque.";
  if (s.dateTo && !s.dateFrom) e.dateFrom = "Informe o primeiro dia.";
  if (s.dateTo && s.dateFrom && s.dateTo < s.dateFrom) e.dateTo = "O último dia vem antes do primeiro.";
  if ((s.timeFrom || s.timeTo) && !s.dateFrom) e.dateFrom = "Informe a data do horário.";
  if (s.timeTo && !s.timeFrom) e.timeFrom = "Informe o horário de início.";
  const le = linkError(s.link); if (le) e.link = le;
  if (s.showFrom && s.showUntil && s.showUntil <= s.showFrom) e.showUntil = "O fim da exibição vem antes do início.";
  return e;
}

function linkOptions(db) {
  const g = (label, list, path, name = (x) => x.name || x.title) => list.filter(isLive).map(x => [path(x), `${label} · ${name(x)}`]);
  return [
    ["/eventos", "Página · Agenda de eventos"], ["/lugares", "Página · Lugares"], ["/roteiros", "Página · Roteiros"], ["/radar", "Página · Radar"], ["/vibes", "Página · Vibes"],
    ...g("Evento", db.events || [], eventPath, x => x.title),
    ...g("Lugar", db.places, placePath),
    ...g("Roteiro", db.roteiros, roteiroPath, x => x.title),
    ...g("Radar", db.stories, storyPath, x => x.title),
  ];
}

function SlidePreview({ s }) {
  const url = normLink(s.link);
  return (
    <div className="a-car-prev" aria-hidden="true">
      <ImageSlot className="a-car-prev-img" src={slideImg(s.id)} compact style={{ "--focus": s.focus === "left" ? "left center" : s.focus === "right" ? "right center" : s.focus || "center" }} />
      <div className="a-car-prev-copy">
        <div className="a-car-prev-meta"><SlideDate s={s} className="a-car-prev-date" />{s.tag && <span className="a-car-prev-tag">{s.tag}</span>}</div>
        <strong>{s.title || "Título do destaque"}</strong>
        {s.desc && <p>{s.desc}</p>}
        {url && <span className="a-car-prev-cta">{s.linkLabel || "Saiba mais"} <AIcon name={isExternal(url) ? "ext" : "arrow"} size={12} /></span>}
      </div>
    </div>
  );
}

function SlideEditor({ s, upd, i, n, onMove, onRemove, onDuplicate, errors, open, setOpen, links }) {
  const [tone, label] = slideStatus(s);
  const when = slideWhen(s);
  const url = normLink(s.link);
  const picked = links.some(([v]) => v === url) ? url : "";
  const bad = Object.keys(errors).length > 0;
  return (
    <div className={"a-car-slide" + (open ? " open" : "") + (s.active === false ? " is-off" : "") + (bad ? " has-error" : "")} data-slide={s.id}>
      <div className="a-car-head">
        <span className="a-rep-num">{i + 1}</span>
        <ImageSlot className="a-car-thumb" src={slideImg(s.id)} compact />
        <button type="button" className="a-car-title" onClick={() => setOpen(open ? null : s.id)} aria-expanded={open}>
          <strong>{s.title || "Destaque sem título"}</strong>
          <span>{[when?.text, s.tag, url].filter(Boolean).join(" · ") || "Sem data e sem link"}</span>
        </button>
        <Badge tone={bad ? "red" : tone}>{bad ? "Revisar" : label}</Badge>
        <div className="a-rep-tools">
          <button type="button" aria-label="Mover para cima" disabled={i === 0} onClick={() => onMove(-1)}><AIcon name="up" size={15} /></button>
          <button type="button" aria-label="Mover para baixo" disabled={i === n - 1} onClick={() => onMove(1)}><AIcon name="down" size={15} /></button>
          <button type="button" aria-label="Duplicar" disabled={n >= MAX_SLIDES} onClick={onDuplicate}><AIcon name="copy" size={15} /></button>
          <button type="button" aria-label="Remover" onClick={onRemove}><AIcon name="trash" size={15} /></button>
          <button type="button" aria-label={open ? "Fechar" : "Editar"} onClick={() => setOpen(open ? null : s.id)}><AIcon name={open ? "up" : "edit"} size={15} /></button>
        </div>
      </div>

      {open && (
        <div className="a-car-body">
          <div className="a-car-col">
            <ImageField label="Imagem" path={slideImg(s.id)} ratio="16 / 9" hint="1600×900 · horizontal" />
            <div className="a-form-grid">
              <Select label="Enquadramento" value={s.focus || "center"} onChange={(focus) => upd({ focus })} options={FOCUS} hint="Parte da foto que fica sempre visível." />
              <Input label="Texto alternativo" value={s.alt} onChange={(alt) => upd({ alt })} maxCount={120} hint="Descreva a imagem (acessibilidade)." />
            </div>
            <Field label="Prévia"><SlidePreview s={s} /></Field>
          </div>

          <div className="a-car-col">
            <Toggle label="Ativo" hint="Desative para tirar do ar sem apagar." checked={s.active !== false} onChange={(active) => upd({ active })} />
            <div className="a-form-grid">
              <Input label="Etiqueta" value={s.tag} onChange={(tag) => upd({ tag })} maxCount={24} hint="Opcional. Ex.: Evento, Novidade, Lugar." />
              <Input label="Título" required value={s.title} onChange={(title) => upd({ title })} maxCount={70} error={errors.title} />
            </div>
            <Textarea label="Descrição" value={s.desc} onChange={(desc) => upd({ desc })} rows={3} maxCount={180} />

            <fieldset className="a-car-set">
              <legend>Data e horário <small>opcional · aparece numa etiqueta com as cores do selo dos eventos</small></legend>
              <div className="a-car-dates">
                <Input label="Data" type="date" value={s.dateFrom} error={errors.dateFrom} onChange={(dateFrom) => upd({ dateFrom, ...(s.dateTo && s.dateTo < dateFrom ? { dateTo: "" } : {}) })} />
                <Input label="Até (vários dias)" type="date" value={s.dateTo} min={s.dateFrom} error={errors.dateTo} onChange={(dateTo) => upd({ dateTo })} />
                <Input label="Início" type="time" value={s.timeFrom} error={errors.timeFrom} onChange={(timeFrom) => upd({ timeFrom })} />
                <Input label="Término" type="time" value={s.timeTo} onChange={(timeTo) => upd({ timeTo })} />
              </div>
              {(s.dateFrom || s.timeFrom) && <Btn size="sm" kind="ghost" icon="x" onClick={() => upd({ dateFrom: "", dateTo: "", timeFrom: "", timeTo: "" })}>Limpar data</Btn>}
              <Toggle label="Sair do ar quando a data passar" checked={s.hideAfter !== false} onChange={(hideAfter) => upd({ hideAfter })} disabled={!s.dateFrom} />
            </fieldset>

            <fieldset className="a-car-set">
              <legend>Link</legend>
              <div className="a-form-grid">
                <Input label="Endereço" value={s.link} onChange={(link) => upd({ link })} error={errors.link} placeholder="/eventos/… ou https://…"
                  hint={url ? (isExternal(url) ? "Abre em outra aba: " : "Página do site: ") + url : "Sem link, o destaque não é clicável."} />
                <Select label="Ou escolha uma página do site" value={picked} placeholder="Escolher…" onChange={(link) => upd({ link })} options={links} />
              </div>
              <Input label="Texto do botão" value={s.linkLabel} onChange={(linkLabel) => upd({ linkLabel })} maxCount={24} placeholder="Saiba mais" disabled={!url} />
            </fieldset>

            <fieldset className="a-car-set">
              <legend>Período de exibição <small>opcional</small></legend>
              <div className="a-form-grid">
                <Input label="Entra no ar em" type="datetime-local" value={toLocalInput(s.showFrom)} onChange={(v) => upd({ showFrom: fromLocalInput(v) })} />
                <Input label="Sai do ar em" type="datetime-local" value={toLocalInput(s.showUntil)} error={errors.showUntil} onChange={(v) => upd({ showUntil: fromLocalInput(v) })} />
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}

export function CarouselEditor({ car, onChange, errors }) {
  const { db } = useAdmin();
  const [open, setOpen] = useState(() => car.slides[0]?.id || null);
  const links = linkOptions(db);
  const slides = car.slides;
  const setSlides = (list) => onChange({ ...car, slides: list });
  const upd = (i) => (patch) => setSlides(slides.map((x, k) => k === i ? { ...x, ...patch } : x));
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= slides.length) return; const n = [...slides]; [n[i], n[j]] = [n[j], n[i]]; setSlides(n); };
  const add = () => { const s = newSlide(); setSlides([...slides, s]); setOpen(s.id); };
  const dup = (i) => { const s = { ...slides[i], id: newSlide().id, title: slides[i].title + " (cópia)", active: false }; const n = [...slides]; n.splice(i + 1, 0, s); setSlides(n); setOpen(s.id); };
  const live = slides.filter(s => slideStatus(s)[1] === "No ar").length;

  return (
    <>
      <Card title="Carrossel" subtitle="Como os destaques passam no topo da home.">
        <div className="a-car-opts">
          <div className="a-car-optcol">
            <Toggle label="Troca automática" hint="Pausa enquanto o mouse está sobre o carrossel e retoma ao sair." checked={car.autoplay !== false} onChange={(autoplay) => onChange({ ...car, autoplay })} />
            <Toggle label="Mostrar botão de pausar" hint="Botão para a pessoa parar a troca automática." checked={!!car.showPause} disabled={car.autoplay === false} onChange={(showPause) => onChange({ ...car, showPause })} />
          </div>
          <Select label="Tempo de cada destaque" value={String(car.interval || 6)} onChange={(v) => onChange({ ...car, interval: +v })} options={SLIDE_INTERVALS.map(n => [String(n), `${n} segundos`])} disabled={car.autoplay === false} />
          <Toggle label="Busca e vibes abaixo do carrossel" hint="Mantém a barra de busca e os atalhos de vibe logo abaixo." checked={car.showSearch !== false} onChange={(showSearch) => onChange({ ...car, showSearch })} />
        </div>
      </Card>

      <Card title={`Destaques (${slides.length}/${MAX_SLIDES})`}
        subtitle={live ? `${live} no ar agora, na ordem abaixo.` : "Nenhum destaque no ar: o site mostra o topo fixo até haver um."}
        actions={slides.length < MAX_SLIDES && <Btn size="sm" icon="plus" onClick={add}>Novo destaque</Btn>}>
        {!slides.length && <p className="a-muted">Cadastre o primeiro destaque: imagem, título, descrição, data e link.</p>}
        <div className="a-car-list">
          {slides.map((s, i) => (
            <SlideEditor key={s.id} s={s} i={i} n={slides.length} upd={upd(i)} errors={errors[s.id] || {}} links={links}
              open={open === s.id} setOpen={setOpen}
              onMove={(d) => move(i, d)} onDuplicate={() => dup(i)}
              onRemove={() => setSlides(slides.filter((_, k) => k !== i))} />
          ))}
        </div>
        {slides.length > 0 && slides.length < MAX_SLIDES && <Btn kind="ghost" size="sm" icon="plus" onClick={add}>Adicionar destaque</Btn>}
      </Card>
    </>
  );
}
