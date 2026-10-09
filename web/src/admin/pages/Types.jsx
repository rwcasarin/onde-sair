// Tipos de lugar (Restaurantes, Bares, Parques…): nome, cor e ícone da etiqueta dos cards.
import { useEffect, useState } from "react";
import { Btn, Card, Input, Select, PageHeader, Modal, Field, useAdmin, useDraft, Empty } from "../kit.jsx";
import { saveTypes, saveEventCategories, slugify, can } from "../store.js";
import { SEED_TYPES, SEED_EVENT_CATEGORIES } from "../../data.js";
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

// menu interno da área Eventos
export const eventsNav = (db) => [
  { path: "eventos", label: "Eventos", badge: (db.events || []).length },
  { path: "eventos/categorias", label: "Categorias", badge: (db.eventCategories?.length ? db.eventCategories : SEED_EVENT_CATEGORIES).length, perm: "content.publish" },
];

// A mesma tela serve aos tipos de lugar e às categorias de evento
const KINDS = {
  types: (db) => ({
    title: "Lugares", crumbs: [["Painel", "/"], ["Lugares", "lugares"], ["Tipos"]], nav: placesNav(db),
    subtitle: "Tipos de lugar: aparecem como etiqueta nos cards e filtram a lista (/lugares?tipo=…). Renomear atualiza os lugares do tipo.",
    current: db.types?.length ? db.types : SEED_TYPES, items: db.places, owns: (x, t) => x.type === t.label,
    one: "tipo", newLabel: "Novo tipo", saveLabel: "Salvar tipos", unit: ["lugar", "lugares"], idPrefix: "t-",
    noAccess: "Só quem publica conteúdo gerencia os tipos de lugar.", savedMsg: "Tipos salvos. Os lugares foram atualizados.", save: saveTypes,
  }),
  eventCategories: (db) => ({
    title: "Eventos", crumbs: [["Painel", "/"], ["Eventos", "eventos"], ["Categorias"]], nav: eventsNav(db),
    subtitle: "Categorias de evento: aparecem como etiqueta nos cards e filtram a agenda (/eventos?categoria=…).",
    current: db.eventCategories?.length ? db.eventCategories : SEED_EVENT_CATEGORIES, items: db.events || [], owns: (x, t) => x.category === t.id,
    one: "categoria", newLabel: "Nova categoria", saveLabel: "Salvar categorias", unit: ["evento", "eventos"], idPrefix: "c-",
    noAccess: "Só quem publica conteúdo gerencia as categorias de evento.", savedMsg: "Categorias salvas.", save: saveEventCategories,
  }),
};

export function TypesPage({ kind = "types" }) {
  const { user, db } = useAdmin();
  const cfg = KINDS[kind](db);
  if (!can(user, "content.publish")) return <><PageHeader title={cfg.title} crumbs={cfg.crumbs} nav={cfg.nav} />
    <Empty title={`Sem acesso às ${cfg.one === "tipo" ? "tipos" : "categorias"}`} text={cfg.noAccess} /></>;
  return <TypesEditor kind={kind} />;
}
export const EventCategoriesPage = () => <TypesPage kind="eventCategories" />;

function TypesEditor({ kind }) {
  const { db, user, toast, saved, setDirty } = useAdmin();
  const cfg = KINDS[kind](db);
  const current = cfg.current;
  const { draft, set, dirty, commit } = useDraft({ types: JSON.parse(JSON.stringify(current)), moves: {} });
  const [removing, setRemoving] = useState(null);
  useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]);
  const types = draft.types;
  const count = (t) => {
    const own = cfg.items.filter(p => { const c = current.find(x => x.id === t.id); return c && cfg.owns(p, c); }).length;
    const moved = Object.entries(draft.moves).filter(([, to]) => to === t.id)
      .reduce((n, [from]) => n + cfg.items.filter(p => { const c = current.find(x => x.id === from); return c && cfg.owns(p, c); }).length, 0);
    return own + moved;
  };
  const upd = (i, patch) => set({ types: types.map((t, k) => k === i ? { ...t, ...patch } : t) });
  const move = (i, d) => { const n = [...types]; [n[i], n[i + d]] = [n[i + d], n[i]]; set({ types: n }); };
  const add = () => set({ types: [...types, { id: cfg.idPrefix + Date.now().toString(36), label: "", slug: "", cls: "vibe-lavender", icon: "pin" }] });
  function remove(i) { const t = types[i]; if (count(t) > 0) return setRemoving(t); set({ types: types.filter((_, k) => k !== i) }); }
  function save() {
    const labels = types.map(t => t.label.trim());
    const many = cfg.one === "tipo" ? "tipos" : "categorias";
    if (labels.some(l => !l)) return toast(cfg.one === "tipo" ? "Todo tipo precisa de um nome." : "Toda categoria precisa de um nome.", "error");
    if (new Set(labels.map(norm)).size !== labels.length) return toast(`Há ${many} com o mesmo nome.`, "error");
    if (!types.length) return toast(`Mantenha pelo menos ${cfg.one === "tipo" ? "um tipo" : "uma categoria"}.`, "error");
    const clean = types.map(t => ({ ...t, label: t.label.trim(), slug: slugify(t.slug || t.label) }));
    if (new Set(clean.map(t => t.slug)).size !== clean.length) return toast(`Há ${many} com o mesmo endereço.`, "error");
    cfg.save(clean, user, draft.moves);
    commit({ types: clean, moves: {} });
    saved(cfg.savedMsg);
  }

  return (
    <>
      <PageHeader title={cfg.title} crumbs={cfg.crumbs} nav={cfg.nav} subtitle={cfg.subtitle}
        actions={<><Btn icon="plus" onClick={add}>{cfg.newLabel}</Btn><Btn kind="primary" icon="check" disabled={!dirty} onClick={save}>{cfg.saveLabel}</Btn></>} />
      {dirty && <p className="a-dirty a-dirty-bar"><i /> Alterações não salvas</p>}
      {!types.length && <Empty title={cfg.one === "tipo" ? "Nenhum tipo" : "Nenhuma categoria"} action={<Btn onClick={add}>Criar {cfg.one === "tipo" ? "o primeiro" : "a primeira"}</Btn>} />}
      <Card pad={false}>
        <ul className="a-cat-list">
          {types.map((t, i) => {
            const n = count(t);
            return (
              <li key={t.id} className="a-cat-row a-type-row">
                <span className={"vibe-pill vibe-pill-sm " + t.cls} aria-hidden="true"><span className="vibe-pill-icon"><Icon name={t.icon} size={12} /></span>{t.label || (cfg.one === "tipo" ? "Tipo" : "Categoria")}</span>
                <Input value={t.label} onChange={(label) => upd(i, { label })} placeholder={`Nome ${cfg.one === "tipo" ? "do tipo" : "da categoria"}`} aria-label={`Nome ${cfg.one === "tipo" ? "do tipo" : "da categoria"}`} maxCount={30} />
                <IconPicker value={t.icon} icons={TYPE_ICONS} onChange={(icon) => upd(i, { icon })} />
                <div className="a-swatches" role="radiogroup" aria-label={"Cor de " + (t.label || "tipo")}>
                  {TYPE_COLORS.map(([c, l]) => <button key={c} type="button" role="radio" aria-checked={t.cls === c} aria-label={l} className={"a-swatch " + c + (t.cls === c ? " on" : "")} onClick={() => upd(i, { cls: c })}><span /></button>)}
                </div>
                <span className="a-cat-count">{n} {n === 1 ? cfg.unit[0] : cfg.unit[1]}</span>
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
      {removing && <MoveModal cfg={cfg} t={removing} types={types.filter(x => x.id !== removing.id)} n={count(removing)} onClose={() => setRemoving(null)}
        onConfirm={(to) => {
          const moves = { ...draft.moves, [removing.id]: to };
          Object.keys(moves).forEach(k => { if (moves[k] === removing.id) moves[k] = to; });
          set({ types: types.filter(x => x.id !== removing.id), moves }); setRemoving(null);
        }} />}
    </>
  );
}

function MoveModal({ cfg, t, types, n, onClose, onConfirm }) {
  const [to, setTo] = useState(types[0]?.id || "");
  return (
    <Modal title={`Excluir “${t.label}”?`} size="sm" onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn kind="primary" icon="trash" disabled={!to} onClick={() => onConfirm(to)}>Excluir e mover</Btn></>}>
      <p>{n} {n === 1 ? cfg.unit[0] + " é" : cfg.unit[1] + " são"} {cfg.one === "tipo" ? "desse tipo" : "dessa categoria"}. Para {cfg.one === "tipo" ? "qual tipo" : "qual categoria"} {n === 1 ? "ele vai" : "eles vão"}?</p>
      <Select label="Mover para" value={to} onChange={setTo} options={types.map(x => [x.id, x.label || "(sem nome)"])} />
      <p className="a-hint">A mudança só vale depois de salvar {cfg.one === "tipo" ? "os tipos" : "as categorias"}.</p>
    </Modal>
  );
}
