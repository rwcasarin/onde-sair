import { useEffect, useState } from "react";
import { placeImg } from "../../data.js";
import { ImageSlot } from "../../components/image-slot.jsx";
import { AIcon, Btn, Card, Input, Textarea, Select, Repeater, ImageField, Field, PageHeader, ChipInput, Segmented, useAdmin, useDraft } from "../kit.jsx";
import { saveHome, isLive, removeMedia, getDB } from "../store.js";
import { carouselOf, slideImg, visibleSlides } from "../../carousel.js";
import { CarouselEditor, slideErrors } from "./HomeCarouselEditor.jsx";
import { IconPicker } from "./Places.jsx";
import { openOnSite } from "./content.jsx";

const COLORS = [["vibe-pink", "Rosa"], ["vibe-yellow", "Amarelo"], ["vibe-mint", "Menta"], ["vibe-lavender", "Lavanda"], ["vibe-orange", "Laranja"], ["vibe-sky", "Azul"], ["vibe-coral", "Coral"], ["vibe-violet", "Violeta"], ["vibe-lime", "Lima"]];

export function HomePage() {
  const { db, user, toast, saved, setDirty } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(db.home);
  useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]);
  const hero = draft.hero;
  const mode = draft.heroMode || "fixo";
  const car = carouselOf(draft);
  const [errors, setErrors] = useState({});
  const setHero = (patch) => set({ hero: { ...hero, ...patch } });
  const livePlaces = db.places.filter(isLive);
  const liveStories = db.stories.filter(s => isLive(s));
  const liveRots = db.roteiros.filter(isLive);

  async function save() {
    if (!hero.title.trim()) return toast("O título do topo não pode ficar vazio.", "error");
    // destaques ativos precisam estar completos; os desativados podem ficar como rascunho
    const errs = {};
    car.slides.forEach(sl => { const e = slideErrors(sl); if (Object.keys(e).length && (sl.active !== false || Object.keys(e).some(k => k !== "title"))) errs[sl.id] = e; });
    setErrors(errs);
    if (Object.keys(errs).length) return toast("Revise os destaques marcados antes de salvar.", "error");
    const next = { ...draft, heroMode: mode, carousel: car };
    // imagens de destaques excluídos saem do armazenamento
    const before = carouselOf(db.home).slides.map(x => x.id);
    const gone = before.filter(id => !car.slides.some(x => x.id === id)).map(slideImg).filter(p => getDB().media[p]);
    saveHome(next, user); commit(next);
    for (const p of gone) { try { await removeMedia(p, user); } catch { /* fica órfã */ } }
    saved(mode === "carrossel" && !visibleSlides(car).length ? "Salvo. Nenhum destaque no ar: o site segue com o topo fixo até haver um." : "Home atualizada no site.");
  }

  return (
    <>
      <PageHeader title="Home" crumbs={[["Painel", "/"], ["Home"]]} subtitle="Escolha o que aparece em cada seção da página inicial."
        actions={<><Btn icon="ext" onClick={() => openOnSite("home")}>Ver home</Btn><Btn kind="primary" icon="check" disabled={!dirty} onClick={save}>Salvar home</Btn></>} />
      {dirty && <p className="a-dirty a-dirty-bar"><i /> Alterações não salvas</p>}

      <Card title="Topo da home" subtitle="Escolha o que aparece no alto da página inicial.">
        <Segmented label="Tipo de topo" value={mode} onChange={(heroMode) => set({ heroMode })}
          options={[["fixo", "Fixo · título e foto"], ["carrossel", "Carrossel de destaques"]]} />
        <p className="a-muted a-car-modehint">
          {mode === "fixo"
            ? "Título, texto de apoio e foto, com a busca e as vibes ao lado."
            : "Eventos ou lugares em destaque, cadastrados um a um abaixo. Sem nenhum destaque no ar, o site volta a mostrar o topo fixo."}
        </p>
      </Card>

      {mode === "carrossel" && <CarouselEditor car={car} onChange={(carousel) => set({ carousel })} errors={errors} />}

      {mode === "fixo" && <div className="a-grid-2-1">
        <Card title="Topo (hero)" subtitle="Título, texto e foto principal.">
          <Textarea label="Título" value={hero.title} onChange={(title) => setHero({ title })} rows={2} hint="Use Enter para quebrar a linha. Ideal: até 2 linhas curtas." maxCount={40} />
          <Textarea label="Texto de apoio" value={hero.lede} onChange={(lede) => setHero({ lede })} rows={3} maxCount={160} />
          <div className="a-form-grid">
            <Input label="Frase manuscrita da foto" value={hero.note} onChange={(note) => setHero({ note })} maxCount={60} />
            <ChipInput label="Palavras do painel geométrico" value={hero.geoWords} onChange={(geoWords) => setHero({ geoWords })} />
          </div>
        </Card>
        <Card title="Foto do topo">
          <ImageField path={hero.img} hint="~1400×800 · pessoas em clima de rolê" ratio="16 / 10" />
        </Card>
      </div>}

      <Card title="Dicas para hoje" subtitle="Até seis lugares publicados, na ordem abaixo.">
        <Repeater items={draft.tips} max={6} addLabel="Adicionar dica" newItem={() => ({ place: livePlaces.find(x => !draft.tips.some(t => t.place === x.id))?.id || livePlaces[0]?.id })}
          onChange={(tips) => set({ tips })}
          render={(t, upd) => {
            const p = db.places.find(x => x.id === t.place);
            return (
              <div className="a-home-tip">
                <ImageSlot className="a-thumb" src={placeImg(t.place)} compact />
                <Select label="Lugar" value={t.place} onChange={(place) => upd(() => ({ place }))}
                  options={livePlaces.map(x => [x.id, `${x.name} · ${x.bairro}`])} error={p && !isLive(p) ? "Este lugar não está publicado." : null} />
              </div>
            );
          }} />
      </Card>

      <div className="a-grid-2">
        <Card title="Radar" subtitle="Até 3 posts publicados, na ordem abaixo.">
          <Repeater items={draft.storyIds.map(id => ({ id }))} max={3} addLabel="Adicionar post" newItem={() => ({ id: liveStories.find(s => !draft.storyIds.includes(s.id))?.id || liveStories[0]?.id })}
            onChange={(items) => set({ storyIds: items.map(x => x.id) })}
            render={(s, upd) => (
              <Select value={s.id} onChange={(id) => upd({ id })} options={db.stories.map(x => [x.id, x.title + (isLive(x) ? "" : " (não publicada)")])} aria-label="Post" />
            )} />
        </Card>
        <Card title="Valores da marca" subtitle="Faixa “Lugares reais. Pessoas reais.”">
          <Repeater items={draft.brandValues} max={4} addLabel="Adicionar valor" newItem={() => ({ icon: "star", text: "" })}
            onChange={(brandValues) => set({ brandValues })}
            render={(b, upd) => (
              <div className="a-reason">
                <IconPicker value={b.icon} icons={["users", "pin", "star", "heart", "leaf", "sparkle", "coins", "smile"]} onChange={(icon) => upd({ icon })} />
                <input className="a-input" value={b.text} onChange={(e) => upd({ text: e.target.value })} aria-label="Texto do valor" />
              </div>
            )} />
        </Card>
      </div>

      <Card title="Roteiros por vibe" subtitle="Quatro cards coloridos, cada um levando a um roteiro.">
        <Repeater items={draft.vibeRoteiros} max={4} addLabel="Adicionar card" newItem={() => ({ id: "v" + Date.now().toString(36), title: "Nova vibe", desc: "", icon: "star", cls: "vibe-lavender", img: "images/home/vibe-nova.jpg", roteiro: liveRots[0]?.id })}
          onChange={(vibeRoteiros) => set({ vibeRoteiros })}
          render={(v, upd) => (
            <div className="a-home-vibe">
              <div className={"a-home-vibe-prev " + v.cls}><AIcon name={v.icon} size={24} /><strong>{v.title}</strong></div>
              <div className="a-form-grid">
                <Input label="Título" value={v.title} onChange={(title) => upd({ title })} maxCount={22} />
                <Select label="Roteiro" value={v.roteiro} onChange={(roteiro) => upd({ roteiro })} options={db.roteiros.map(r => [r.id, r.title + (isLive(r) ? "" : " (não publicado)")])} />
                <Input label="Descrição" value={v.desc} onChange={(desc) => upd({ desc })} maxCount={60} />
                <div className="a-form-grid">
                  <Field label="Ícone"><IconPicker value={v.icon} icons={["heart", "landmark", "tree", "martini", "music", "sun", "camera", "star"]} onChange={(icon) => upd({ icon })} /></Field>
                  <Select label="Cor" value={v.cls} onChange={(cls) => upd({ cls })} options={COLORS} />
                </div>
              </div>
              <ImageField path={v.img} ratio="3 / 4" compact hint="3:4" />
            </div>
          )} />
      </Card>
    </>
  );
}
