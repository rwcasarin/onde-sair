// Tipos de lugar (Restaurantes, Bares, Parques…): nome, cor e ícone da etiqueta dos cards.
import { useEffect, useState } from "react";
import { Btn, Card, Input, Select, PageHeader, Modal, Field, useAdmin, useDraft, Empty } from "../kit.jsx";
import { saveTypes, slugify, can } from "../store.js";
import { SEED_TYPES } from "../../data.js";
import { Icon } from "../../components/icons.jsx";
import { IconPicker } from "./Places.jsx";

export const TYPE_COLORS = [["vibe-pink", "Rosa"], ["vibe-yellow", "Amarelo"], ["vibe-mint", "Menta"], ["vibe-lavender", "Lavanda"], ["vibe-orange", "Laranja"], ["vibe-sky", "Azul"]];
const TYPE_ICONS = ["utensils", "cheers", "martini", "wine", "tree", "leaf", "music", "calendar", "landmark", "camera", "coins", "sun", "star", "heart", "users", "pin", "sparkle", "smile"];
const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// menu interno da área Lugares (o mesmo na lista e nos tipos)
export const placesNav = (db) => [
  { path: "lugares", label: "Lugares", badge: db.places.length },
  { path: "lugares/tipos", label: "Tipos", badge: (db.types?.length ? db.types : SEED_TYPES).length, perm: "content.publish" },
];

export function TypesPage() {
  const { user, db } = useAdmin();
  if (!can(user, "content.publish")) return <><PageHeader title="Lugares" crumbs={[["Painel", "/"], ["Lugares", "lugares"], ["Tipos"]]} nav={placesNav(db)} />
    <Empty title="Sem acesso aos tipos" text="Só quem publica conteúdo gerencia os tipos de lugar." /></>;
  return <TypesEditor />;
}

function TypesEditor() {
  const { db, user, toast, saved, setDirty } = useAdmin();
  const current = db.types?.length ? db.types : SEED_TYPES;
  const { draft, set, dirty, commit } = useDraft({ types: JSON.parse(JSON.stringify(current)), moves: {} });
  const [removing, setRemoving] = useState(null);
  useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]);
  const types = draft.types;
  const count = (t) => {
    const own = db.places.filter(p => current.find(x => x.id === t.id)?.label === p.type).length;
    const moved = Object.entries(draft.moves).filter(([, to]) => to === t.id)
      .reduce((n, [from]) => n + db.places.filter(p => current.find(x => x.id === from)?.label === p.type).length, 0);
    return own + moved;
  };
  const upd = (i, patch) => set({ types: types.map((t, k) => k === i ? { ...t, ...patch } : t) });
  const move = (i, d) => { const n = [...types]; [n[i], n[i + d]] = [n[i + d], n[i]]; set({ types: n }); };
  const add = () => set({ types: [...types, { id: "t-" + Date.now().toString(36), label: "", slug: "", cls: "vibe-lavender", icon: "pin" }] });
  function remove(i) { const t = types[i]; if (count(t) > 0) return setRemoving(t); set({ types: types.filter((_, k) => k !== i) }); }
  function save() {
    const labels = types.map(t => t.label.trim());
    if (labels.some(l => !l)) return toast("Todo tipo precisa de um nome.", "error");
    if (new Set(labels.map(norm)).size !== labels.length) return toast("Há tipos com o mesmo nome.", "error");
    if (!types.length) return toast("Mantenha pelo menos um tipo.", "error");
    const clean = types.map(t => ({ ...t, label: t.label.trim(), slug: slugify(t.slug || t.label) }));
    if (new Set(clean.map(t => t.slug)).size !== clean.length) return toast("Há tipos com o mesmo endereço.", "error");
    saveTypes(clean, user, draft.moves);
    commit({ types: clean, moves: {} });
    saved("Tipos salvos. Os lugares foram atualizados.");
  }

  return (
    <>
      <PageHeader title="Lugares" crumbs={[["Painel", "/"], ["Lugares", "lugares"], ["Tipos"]]} nav={placesNav(db)}
        subtitle="Tipos de lugar: aparecem como etiqueta nos cards e filtram a lista (/lugares?tipo=…). Renomear atualiza os lugares do tipo."
        actions={<><Btn icon="plus" onClick={add}>Novo tipo</Btn><Btn kind="primary" icon="check" disabled={!dirty} onClick={save}>Salvar tipos</Btn></>} />
      {dirty && <p className="a-dirty a-dirty-bar"><i /> Alterações não salvas</p>}
      {!types.length && <Empty title="Nenhum tipo" action={<Btn onClick={add}>Criar o primeiro</Btn>} />}
      <Card pad={false}>
        <ul className="a-cat-list">
          {types.map((t, i) => {
            const n = count(t);
            return (
              <li key={t.id} className="a-cat-row a-type-row">
                <span className={"vibe-pill vibe-pill-sm " + t.cls} aria-hidden="true"><span className="vibe-pill-icon"><Icon name={t.icon} size={12} /></span>{t.label || "Tipo"}</span>
                <Input value={t.label} onChange={(label) => upd(i, { label })} placeholder="Nome do tipo" aria-label="Nome do tipo" maxCount={30} />
                <IconPicker value={t.icon} icons={TYPE_ICONS} onChange={(icon) => upd(i, { icon })} />
                <div className="a-swatches" role="radiogroup" aria-label={"Cor de " + (t.label || "tipo")}>
                  {TYPE_COLORS.map(([c, l]) => <button key={c} type="button" role="radio" aria-checked={t.cls === c} aria-label={l} className={"a-swatch " + c + (t.cls === c ? " on" : "")} onClick={() => upd(i, { cls: c })}><span /></button>)}
                </div>
                <span className="a-cat-count">{n} lugar{n === 1 ? "" : "es"}</span>
                <div className="a-row-actions">
                  <Btn size="sm" kind="ghost" icon="up" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)} />
                  <Btn size="sm" kind="ghost" icon="down" aria-label="Descer" disabled={i === types.length - 1} onClick={() => move(i, 1)} />
                  <Btn size="sm" kind="ghost" icon="trash" aria-label="Excluir" onClick={() => remove(i)} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      {removing && <MoveModal t={removing} types={types.filter(x => x.id !== removing.id)} n={count(removing)} onClose={() => setRemoving(null)}
        onConfirm={(to) => {
          const moves = { ...draft.moves, [removing.id]: to };
          Object.keys(moves).forEach(k => { if (moves[k] === removing.id) moves[k] = to; });
          set({ types: types.filter(x => x.id !== removing.id), moves }); setRemoving(null);
        }} />}
    </>
  );
}

function MoveModal({ t, types, n, onClose, onConfirm }) {
  const [to, setTo] = useState(types[0]?.id || "");
  return (
    <Modal title={`Excluir “${t.label}”?`} size="sm" onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn kind="primary" icon="trash" disabled={!to} onClick={() => onConfirm(to)}>Excluir e mover</Btn></>}>
      <p>{n} lugar{n === 1 ? " é" : "es são"} desse tipo. Para qual tipo {n === 1 ? "ele vai" : "eles vão"}?</p>
      <Select label="Mover para" value={to} onChange={setTo} options={types.map(x => [x.id, x.label || "(sem nome)"])} />
      <p className="a-hint">A mudança só vale depois de salvar os tipos.</p>
    </Modal>
  );
}
