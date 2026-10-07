import { useEffect, useState } from "react";
import { vibeImg } from "../../data.js";
import { AIcon, Btn, Card, Input, Textarea, Toggle, Repeater, ImageField, Field, PageHeader, useAdmin, useDraft, Empty } from "../kit.jsx";
import { saveVibes, slugify } from "../store.js";
import { IconPicker } from "./Places.jsx";

const COLORS = [["vibe-pink", "Rosa"], ["vibe-yellow", "Amarelo"], ["vibe-mint", "Menta"], ["vibe-lavender", "Lavanda"], ["vibe-orange", "Laranja"], ["vibe-sky", "Azul"]];
const VIBE_ICONS = ["heart", "cheers", "leaf", "camera", "coins", "smile", "music", "sun", "star", "martini", "landmark", "tree", "sparkle", "users", "wine"];

export function VibesPage() {
  const { db, user, toast, saved, confirm, setDirty } = useAdmin();
  const { draft, set, dirty, commit } = useDraft({ vibes: db.vibes });
  const [open, setOpen] = useState(null);
  useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]);
  const vibes = draft.vibes;
  const upd = (i, patch) => set({ vibes: vibes.map((v, k) => k === i ? { ...v, ...patch } : v) });
  const move = (i, d) => { const n = [...vibes]; [n[i], n[i + d]] = [n[i + d], n[i]]; set({ vibes: n }); };

  function save() {
    const bad = vibes.find(v => !v.label.trim());
    if (bad) return toast("Toda vibe precisa de um nome.", "error");
    saveVibes(vibes.map(v => ({ ...v, slug: v.slug || slugify(v.label) })), user);
    commit({ vibes });
    saved("Vibes salvas e aplicadas ao site.");
  }
  async function remove(i) {
    const v = vibes[i];
    const used = db.places.filter(p => p.affs.includes(v.id)).length;
    const ok = await confirm({ title: `Excluir a vibe “${v.label}”?`, danger: true, ok: "Excluir",
      text: used ? `${used} lugar(es) usam essa vibe; ela deixará de aparecer neles. Considere desativar em vez de excluir.` : "Ela sai do site depois que você salvar." });
    if (ok) set({ vibes: vibes.filter((_, k) => k !== i) });
  }
  function add() {
    const id = "v" + Date.now().toString(36);
    set({ vibes: [...vibes, { id, label: "Nova vibe", sub: "", slug: "", tint: "tint-relax", count: 0, icon: "star", cls: "vibe-lavender", active: false, lede: "", note: "", features: [] }] });
    setOpen(id);
  }

  return (
    <>
      <PageHeader title="Vibes" crumbs={[["Painel", "/"], ["Vibes"]]}
        subtitle="As afinidades que organizam o site: pílulas da home, páginas de vibe e filtros. A ordem aqui é a ordem no site."
        actions={<><Btn icon="plus" onClick={add}>Nova vibe</Btn><Btn kind="primary" icon="check" disabled={!dirty} onClick={save}>Salvar alterações</Btn></>} />
      {dirty && <p className="a-dirty a-dirty-bar"><i /> Alterações não salvas</p>}
      {!vibes.length && <Empty title="Nenhuma vibe" action={<Btn onClick={add}>Criar a primeira</Btn>} />}
      <div className="a-stack">
        {vibes.map((v, i) => {
          const isOpen = open === v.id;
          const n = db.places.filter(p => p.affs.includes(v.id)).length;
          return (
            <Card key={v.id} className={"a-vibe-card" + (v.active ? "" : " inactive")} pad={false}>
              <div className="a-vibe-row">
                <span className={"vibe-pill vibe-pill-md " + v.cls}><span className="vibe-pill-icon"><AIcon name={v.icon} size={20} /></span>{v.label}</span>
                <span className="a-vibe-info"><strong>{v.sub || "—"}</strong><em>{n} lugar(es) · /vibes/{v.slug || slugify(v.label)}{!v.active && " · desativada"}</em></span>
                <div className="a-row-actions">
                  <Btn size="sm" kind="ghost" icon="up" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)} />
                  <Btn size="sm" kind="ghost" icon="down" aria-label="Descer" disabled={i === vibes.length - 1} onClick={() => move(i, 1)} />
                  <Btn size="sm" icon="edit" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : v.id)}>{isOpen ? "Fechar" : "Editar"}</Btn>
                </div>
              </div>
              {isOpen && (
                <div className="a-card-pad a-vibe-edit">
                  <div className="a-form-grid">
                    <Input label="Nome" required value={v.label} onChange={(label) => upd(i, { label })} maxCount={24} />
                    <Input label="Subtítulo" value={v.sub} onChange={(sub) => upd(i, { sub })} hint="Ex.: Pra começar bem" />
                    <Input label="Slug" value={v.slug} placeholder={slugify(v.label)} onChange={(s) => upd(i, { slug: slugify(s) })} prefix="/vibes/" />
                    <Field label="Ícone"><IconPicker value={v.icon} icons={VIBE_ICONS} onChange={(icon) => upd(i, { icon })} /></Field>
                  </div>
                  <Field label="Cor">
                    <div className="a-swatches" role="radiogroup" aria-label="Cor">
                      {COLORS.map(([c, l]) => <button key={c} type="button" role="radio" aria-checked={v.cls === c} aria-label={l} className={"a-swatch " + c + (v.cls === c ? " on" : "")} onClick={() => upd(i, { cls: c })}><span /></button>)}
                    </div>
                  </Field>
                  <Textarea label="Texto da página da vibe" value={v.lede} onChange={(lede) => upd(i, { lede })} rows={2} maxCount={140} />
                  <Input label="Frase manuscrita da foto" value={v.note} onChange={(note) => upd(i, { note })} maxCount={60} />
                  <Field label="Destaques da página (até 4)">
                    <Repeater items={v.features || []} max={4} addLabel="Adicionar destaque" newItem={() => ["star", ""]}
                      onChange={(features) => upd(i, { features })}
                      render={(f, u) => (
                        <div className="a-reason">
                          <IconPicker value={f[0]} icons={VIBE_ICONS} onChange={(ic) => u(() => [ic, f[1]])} />
                          <input className="a-input" value={f[1]} onChange={(e) => u(() => [f[0], e.target.value])} aria-label="Destaque" placeholder="Ex.: Jantares especiais" />
                        </div>
                      )} />
                  </Field>
                  <ImageField label="Foto do topo da página" path={vibeImg(v.id)} hint="16:10 · ~1400 px" ratio="16 / 7" />
                  <div className="a-vibe-foot">
                    <Toggle label="Vibe ativa no site" hint="Desativada, some das pílulas, filtros e páginas." checked={v.active} onChange={(active) => upd(i, { active })} />
                    <Btn kind="ghost" size="sm" icon="trash" className="a-danger-text" onClick={() => remove(i)}>Excluir vibe</Btn>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
