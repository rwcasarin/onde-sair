// Categorias do Radar: nome e cor da etiqueta. A ordem aqui é a ordem dos filtros em /radar.
import { useEffect, useState } from "react";
import { AIcon, Btn, Card, Input, Select, PageHeader, Modal, useAdmin, useDraft, Empty } from "../kit.jsx";
import { saveRadarCategories, slugify, can } from "../store.js";
import { radarNav } from "./Stories.jsx";

export const TONES = [["purple", "Roxo"], ["pink", "Rosa"], ["orange", "Laranja"], ["yellow", "Amarelo"], ["green", "Verde"], ["teal", "Turquesa"], ["sky", "Azul"], ["lavender", "Lavanda"]];
const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function RadarCategoriesPage() {
  const { user } = useAdmin();
  if (!can(user, "content.publish")) return <><PageHeader title="Radar" crumbs={[["Painel", "/"], ["Radar", "radar"], ["Categorias"]]} />
    <Empty title="Sem acesso às categorias" text="Só quem publica conteúdo gerencia as categorias do Radar." /></>;
  return <CategoriesEditor />;
}

function CategoriesEditor() {
  const { db, user, toast, saved, setDirty } = useAdmin();
  const { draft, set, dirty, commit } = useDraft({ cats: db.radarCategories || [], moves: {} });
  const [removing, setRemoving] = useState(null);   // categoria em uso sendo excluída
  useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]);
  const cats = draft.cats;
  // posts por categoria (pelo nome salvo; categorias movidas somam no destino)
  const saved0 = db.radarCategories || [];
  const count = (c) => {
    const own = db.stories.filter(s => saved0.find(x => x.id === c.id)?.label === s.tag).length;
    const moved = Object.entries(draft.moves).filter(([, to]) => to === c.id)
      .reduce((n, [from]) => n + db.stories.filter(s => saved0.find(x => x.id === from)?.label === s.tag).length, 0);
    return own + moved;
  };
  const upd = (i, patch) => set({ cats: cats.map((c, k) => k === i ? { ...c, ...patch } : c) });
  const move = (i, d) => { const n = [...cats]; [n[i], n[i + d]] = [n[i + d], n[i]]; set({ cats: n }); };
  function add() { set({ cats: [...cats, { id: "c-" + Date.now().toString(36), label: "", tone: "purple" }] }); }
  function remove(i) {
    const c = cats[i];
    if (count(c) > 0) return setRemoving(c);
    set({ cats: cats.filter((_, k) => k !== i) });
  }
  function save() {
    const labels = cats.map(c => c.label.trim());
    if (labels.some(l => !l)) return toast("Toda categoria precisa de um nome.", "error");
    if (new Set(labels.map(norm)).size !== labels.length) return toast("Há categorias com o mesmo nome.", "error");
    if (!cats.length) return toast("Mantenha pelo menos uma categoria.", "error");
    const clean = cats.map(c => ({ ...c, label: c.label.trim() }));
    saveRadarCategories(clean, user, draft.moves);
    commit({ cats: clean, moves: {} });
    saved("Categorias salvas. Os posts foram atualizados.");
  }

  return (
    <>
      <PageHeader title="Radar" crumbs={[["Painel", "/"], ["Radar", "radar"], ["Categorias"]]} nav={radarNav(db)}
        subtitle="Categorias: as etiquetas dos posts e os filtros da página do Radar. Renomear ou trocar a cor atualiza todos os posts da categoria."
        actions={<><Btn icon="plus" onClick={add}>Nova categoria</Btn><Btn kind="primary" icon="check" disabled={!dirty} onClick={save}>Salvar categorias</Btn></>} />
      {dirty && <p className="a-dirty a-dirty-bar"><i /> Alterações não salvas</p>}
      {!cats.length && <Empty title="Nenhuma categoria" action={<Btn onClick={add}>Criar a primeira</Btn>} />}
      <Card pad={false}>
        <ul className="a-cat-list">
          {cats.map((c, i) => {
            const n = count(c);
            return (
              <li key={c.id} className="a-cat-row">
                <span className={"story-tag tone-" + c.tone} aria-hidden="true">{c.label || "Categoria"}</span>
                <Input value={c.label} onChange={(label) => upd(i, { label })} placeholder="Nome da categoria" aria-label="Nome da categoria" maxCount={24} />
                <div className="a-tone-pick" role="radiogroup" aria-label={"Cor de " + (c.label || "categoria")}>
                  {TONES.map(([t, l]) => (
                    <button key={t} type="button" role="radio" aria-checked={c.tone === t} title={l} aria-label={l}
                      className={"a-tone-dot tone-" + t + (c.tone === t ? " on" : "")} onClick={() => upd(i, { tone: t })} />
                  ))}
                </div>
                <span className="a-cat-count">{n} post{n === 1 ? "" : "s"}</span>
                <div className="a-row-actions">
                  <Btn size="sm" kind="ghost" icon="up" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)} />
                  <Btn size="sm" kind="ghost" icon="down" aria-label="Descer" disabled={i === cats.length - 1} onClick={() => move(i, 1)} />
                  <Btn size="sm" kind="ghost" icon="trash" aria-label="Excluir" onClick={() => remove(i)} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      <p className="a-hint">Endereço do filtro no site: /radar?categoria={slugify(cats[0]?.label || "novidades")}</p>
      {removing && <MoveModal cat={removing} cats={cats.filter(c => c.id !== removing.id)} n={count(removing)} onClose={() => setRemoving(null)}
        onConfirm={(to) => {
          const moves = { ...draft.moves, [removing.id]: to };
          Object.keys(moves).forEach(k => { if (moves[k] === removing.id) moves[k] = to; });   // o que vinha para ela segue junto
          set({ cats: cats.filter(c => c.id !== removing.id), moves }); setRemoving(null);
        }} />}
    </>
  );
}

function MoveModal({ cat, cats, n, onClose, onConfirm }) {
  const [to, setTo] = useState(cats[0]?.id || "");
  return (
    <Modal title={`Excluir “${cat.label}”?`} size="sm" onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn kind="primary" icon="trash" disabled={!to} onClick={() => onConfirm(to)}>Excluir e mover</Btn></>}>
      <p>{n} post{n === 1 ? " usa" : "s usam"} essa categoria. Para onde {n === 1 ? "ele vai" : "eles vão"}?</p>
      <Select label="Mover para" value={to} onChange={setTo} options={cats.map(c => [c.id, c.label || "(sem nome)"])} />
      <p className="a-hint">A mudança só vale depois de salvar as categorias.</p>
    </Modal>
  );
}
