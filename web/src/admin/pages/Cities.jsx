import { useEffect, useState } from "react";
import { Btn, Card, ChipInput, Input, Modal, PageHeader, Toggle, useAdmin, useDraft, Badge } from "../kit.jsx";
import { saveCities, slugify } from "../store.js";

export function CitiesPage() {
  const { db, user, toast, saved, confirm, setDirty } = useAdmin();
  const { draft, set, dirty, commit } = useDraft({ cities: db.cities });
  const [adding, setAdding] = useState(null);
  const [err, setErr] = useState({});
  useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]);
  const cities = draft.cities;
  const upd = (i, patch) => set({ cities: cities.map((c, k) => k === i ? { ...c, ...patch } : c) });

  async function changeBairros(i, bairros) {
    const c = cities[i];
    const removed = c.bairros.filter(b => !bairros.includes(b));
    const used = removed.filter(b => db.places.some(p => p.city === c.id && p.bairro === b));
    if (used.length && !(await confirm({ title: "Remover bairro em uso?", text: `${used.join(", ")} tem lugares cadastrados. Eles continuarão com esse bairro até você editá-los.`, ok: "Remover mesmo assim" }))) return;
    upd(i, { bairros });
  }
  function save() {
    if (!cities.some(c => c.active)) return toast("Mantenha pelo menos uma cidade ativa.", "error");
    saveCities(cities, user); commit({ cities });
    saved("Cidades atualizadas no site.");
  }
  function addCity() {
    const e = {};
    if (!adding.name.trim()) e.name = "Informe o nome.";
    if (!/^[A-Za-z]{2}$/.test(adding.sub)) e.sub = "Use a sigla do estado (2 letras).";
    const id = slugify(adding.name).slice(0, 12);
    if (cities.some(c => c.id === id)) e.name = "Essa cidade já existe.";
    setErr(e);
    if (Object.keys(e).length) return;
    set({ cities: [...cities, { id, name: adding.name.trim(), sub: adding.sub.toUpperCase(), active: false, bairros: [] }] });
    setAdding(null);
  }

  return (
    <>
      <PageHeader title="Cidades e bairros" crumbs={[["Painel", "/"], ["Cidades e bairros"]]}
        subtitle="Cidades ativas aparecem no seletor do site. Bairros alimentam os filtros e o cadastro de lugares."
        actions={<><Btn icon="plus" onClick={() => { setErr({}); setAdding({ name: "", sub: "" }); }}>Nova cidade</Btn><Btn kind="primary" icon="check" disabled={!dirty} onClick={save}>Salvar</Btn></>} />
      {dirty && <p className="a-dirty a-dirty-bar"><i /> Alterações não salvas</p>}
      <div className="a-stack">
        {cities.map((c, i) => {
          const n = db.places.filter(p => p.city === c.id).length;
          return (
            <Card key={c.id} title={<>{c.name} <span className="a-muted">· {c.sub}</span></>} subtitle={`${n} lugar(es) · ${c.bairros.length} bairro(s)`}
              actions={<>{db.settings.defaultCity === c.id && <Badge tone="blue">Cidade padrão</Badge>}<Toggle label={c.active ? "Ativa" : "Inativa"} checked={c.active} onChange={(active) => upd(i, { active })} /></>}>
              <ChipInput label="Bairros" value={c.bairros} onChange={(b) => changeBairros(i, b)} placeholder="Digite um bairro e tecle Enter" />
            </Card>
          );
        })}
      </div>
      {adding && (
        <Modal title="Nova cidade" size="sm" onClose={() => setAdding(null)}
          footer={<><Btn onClick={() => setAdding(null)}>Cancelar</Btn><Btn kind="primary" onClick={addCity}>Adicionar</Btn></>}>
          <Input label="Nome da cidade" required value={adding.name} onChange={(name) => setAdding({ ...adding, name })} error={err.name} />
          <Input label="Estado (UF)" required value={adding.sub} onChange={(sub) => setAdding({ ...adding, sub: sub.slice(0, 2) })} error={err.sub} placeholder="SP" />
          <p className="a-hint">A cidade entra inativa. Ative quando tiver lugares publicados.</p>
        </Modal>
      )}
    </>
  );
}
