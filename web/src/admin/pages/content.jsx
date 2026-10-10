// Peças compartilhadas pelas coleções editoriais (lugares, roteiros, histórias)
import { useEffect, useMemo, useState } from "react";
import {
  AIcon, Btn, Card, DataTable, PageHeader, StatusBadge, Tabs, Toolbar, FilterSelect, Select, useAdmin, Modal,
} from "../kit.jsx";
import { go as goPath, toPath } from "../../router.js";
import { STATUS, can, relTime, fmtDate, setStatus, removeItems, duplicateItem, saveItem, isLive } from "../store.js";

export const COLL = {
  places:   { one: "lugar", many: "lugares", path: "lugares", title: (x) => x.name, siteScreen: "detalhe" },
  roteiros: { one: "roteiro", many: "roteiros", path: "roteiros", title: (x) => x.title, siteScreen: "roteiro" },
  stories:  { one: "post", many: "posts", path: "radar", title: (x) => x.title, siteScreen: "historia" },
  events:   { one: "evento", many: "eventos", path: "eventos", title: (x) => x.title, siteScreen: "evento" },
  pages:    { one: "página", many: "páginas", path: "paginas", title: (x) => x.title, siteScreen: "pagina" },
};

// Abre o site público já na página do conteúdo (URL pelo slug)
export function openOnSite(screen, params = {}) {
  goPath(toPath(screen, params));
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------
// Lista com abas de status, busca, filtros e ações em lote
// ---------------------------------------------------------------------
export function ContentList({ coll, title, subtitle, columns, filters = [], searchText, newLabel, actions, nav, notice }) {
  const { db, user, go, toast, saved, confirm } = useAdmin();
  const meta = COLL[coll];
  const [tab, setTab] = useState("todos");
  const [q, setQ] = useState("");
  const [fv, setFv] = useState({});
  const all = db[coll];

  const counts = Object.fromEntries(Object.keys(STATUS).map(s => [s, all.filter(x => x.status === s).length]));
  const rows = all.filter(x =>
    (tab === "todos" ? x.status !== "arquivado" : x.status === tab) &&
    (!q || searchText(x).toLowerCase().includes(q.toLowerCase())) &&
    filters.every(f => !fv[f.key] || f.test(x, fv[f.key])));

  const canPub = can(user, "content.publish"), canDel = can(user, "content.delete");
  async function bulkDelete(ids) {
    const ok = await confirm({ title: `Excluir ${ids.length} ${meta.one}(s)?`, text: "Essa ação não pode ser desfeita. Prefira arquivar se quiser guardar o conteúdo.", ok: "Excluir", danger: true });
    if (ok) { removeItems(coll, ids, user); saved(`${ids.length} ${meta.one}(s) excluído(s).`); }
  }
  const bulk = [
    canPub && { label: "Publicar", icon: "check", kind: "primary", run: (ids) => { setStatus(coll, ids, "publicado", user); saved("Publicado."); } },
    !canPub && { label: "Enviar para revisão", icon: "send2", run: (ids) => { setStatus(coll, ids, "revisao", user); saved("Enviado para revisão."); } },
    canPub && { label: "Despublicar", icon: "eyeoff", run: (ids) => { setStatus(coll, ids, "rascunho", user); saved("Movido para rascunho."); } },
    canPub && { label: "Arquivar", icon: "bookmark", run: (ids) => { setStatus(coll, ids, "arquivado", user); saved("Arquivado."); } },
    canDel && { label: "Excluir", icon: "trash", kind: "danger", run: bulkDelete },
  ].filter(Boolean);

  const actionsCol = {
    key: "_a", label: "", sortable: false, align: "right", width: 120, render: (x) => (
      <div className="a-row-actions">
        <Btn size="sm" kind="ghost" icon="edit" aria-label="Editar" title="Editar" onClick={() => go(`${meta.path}/${x.id}`)} />
        <Btn size="sm" kind="ghost" icon="copy" aria-label="Duplicar" title="Duplicar" onClick={() => { const c = duplicateItem(coll, x.id, user); saved("Cópia criada como rascunho."); go(`${meta.path}/${c.id}`); }} />
        {isLive(x) && <Btn size="sm" kind="ghost" icon="ext" aria-label="Ver no site" title="Ver no site" onClick={() => openOnSite(meta.siteScreen, { id: x.id })} />}
      </div>
    ),
  };
  const statusCol = { key: "status", label: "Status", width: 130, render: (x) => <StatusBadge status={x.status} publishAt={x.publishAt} />, sortValue: (x) => Object.keys(STATUS).indexOf(x.status) };
  const updatedCol = { key: "updatedAt", label: "Atualizado", width: 160, render: (x) => <span className="a-muted-cell" title={fmtDate(x.updatedAt)}>{relTime(x.updatedAt)}<em>{x.updatedBy}</em></span> };

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} crumbs={[["Painel", "/"], [title]]} nav={nav}
        actions={<>{actions}<Btn kind="primary" icon="plus" onClick={() => go(`${meta.path}/novo`)}>{newLabel}</Btn></>} />
      {notice}
      <Card pad={false}>
        <div className="a-card-pad a-card-pad-tight">
          <Tabs value={tab} onChange={setTab} tabs={[
            ["todos", "Todos", all.filter(x => x.status !== "arquivado").length],
            ["publicado", "Publicados", counts.publicado],
            ["revisao", "Em revisão", counts.revisao],
            ["rascunho", "Rascunhos", counts.rascunho],
            ["agendado", "Agendados", counts.agendado],
            ["arquivado", "Arquivados", counts.arquivado],
          ]} />
          <Toolbar search={q} onSearch={setQ} placeholder={`Buscar ${meta.many}…`}>
            {filters.map(f => <FilterSelect key={f.key} label={f.label} value={fv[f.key] || ""} onChange={(v) => setFv({ ...fv, [f.key]: v })} options={f.options} />)}
          </Toolbar>
        </div>
        <DataTable
          key={tab}
          columns={[...columns, statusCol, updatedCol, actionsCol]}
          rows={rows}
          onRowClick={(x) => go(`${meta.path}/${x.id}`)}
          bulkActions={bulk}
          initialSort={{ key: "updatedAt", dir: "desc" }}
        />
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------
// Painel lateral de publicação (fluxo editorial + permissões)
// ---------------------------------------------------------------------
export function PublishPanel({ coll, draft, set, dirty, isNew, onSave, validate }) {
  const { user, confirm, go, toast, saved } = useAdmin();
  const meta = COLL[coll];
  const [scheduling, setScheduling] = useState(false);
  const [when, setWhen] = useState(() => toLocalInput(draft.publishAt || new Date(Date.now() + 864e5).toISOString()));
  const canPub = can(user, "content.publish"), canDel = can(user, "content.delete");

  async function del() {
    const ok = await confirm({ title: `Excluir “${meta.title(draft)}”?`, text: "Essa ação não pode ser desfeita.", ok: "Excluir", danger: true });
    if (ok) { removeItems(coll, [draft.id], user); saved("Excluído."); go(meta.path); }
  }
  function publish(status, extra = {}) {
    if (status !== "rascunho" && status !== "arquivado") {
      const errs = validate(true);
      if (errs) return toast("Corrija os campos destacados antes de " + (status === "revisao" ? "enviar." : "publicar."), "error");
    }
    onSave(status, extra);
  }

  return (
    <Card title="Publicação" className="a-publish">
      <dl className="a-meta">
        <div><dt>Status</dt><dd><StatusBadge status={draft.status || "rascunho"} publishAt={draft.publishAt} /></dd></div>
        {draft.status === "agendado" && draft.publishAt && <div><dt>Vai ao ar</dt><dd>{fmtDate(draft.publishAt)}</dd></div>}
        {!isNew && <div><dt>Atualizado</dt><dd>{relTime(draft.updatedAt)} · {draft.updatedBy}</dd></div>}
        {!isNew && <div><dt>Criado</dt><dd>{fmtDate(draft.createdAt, false)}</dd></div>}
      </dl>
      {dirty && <p className="a-dirty"><i /> Alterações não salvas</p>}

      <div className="a-publish-actions">
        {canPub ? (
          <>
            <Btn kind="primary" className="a-btn-block" icon="check" onClick={() => publish("publicado")}>
              {draft.status === "publicado" ? "Salvar e manter publicado" : "Publicar agora"}
            </Btn>
            <div className="a-btn-row">
              <Btn className="a-btn-block" onClick={() => publish(draft.status === "publicado" ? "publicado" : "rascunho")} disabled={!dirty && !isNew}>Salvar</Btn>
              <Btn className="a-btn-block" icon="calendar" onClick={() => setScheduling(true)}>Agendar</Btn>
            </div>
            {draft.status === "revisao" && <Btn kind="ghost" size="sm" icon="left" onClick={() => publish("rascunho")}>Devolver para rascunho</Btn>}
            {draft.status === "publicado" && <Btn kind="ghost" size="sm" icon="eyeoff" onClick={() => publish("rascunho")}>Despublicar</Btn>}
          </>
        ) : (
          <>
            <Btn kind="primary" className="a-btn-block" icon="send2" onClick={() => publish("revisao")} disabled={draft.status === "publicado" && !dirty}>
              {draft.status === "revisao" ? "Atualizar envio para revisão" : "Enviar para revisão"}
            </Btn>
            <Btn className="a-btn-block" onClick={() => publish(draft.status === "publicado" ? "revisao" : "rascunho")} disabled={!dirty && !isNew}>Salvar rascunho</Btn>
            <p className="a-hint">Seu perfil envia para revisão; um editor publica.</p>
          </>
        )}
        {!isNew && draft.status !== "arquivado" && canPub && <Btn kind="ghost" size="sm" icon="bookmark" onClick={() => publish("arquivado")}>Arquivar</Btn>}
        {!isNew && canDel && <Btn kind="ghost" size="sm" icon="trash" className="a-danger-text" onClick={del}>Excluir</Btn>}
        {!isNew && isLive(draft) && <Btn kind="ghost" size="sm" icon="ext" onClick={() => openOnSite(meta.siteScreen, { id: draft.id })}>Ver no site</Btn>}
      </div>

      {scheduling && (
        <Modal title="Agendar publicação" size="sm" onClose={() => setScheduling(false)}
          footer={<><Btn onClick={() => setScheduling(false)}>Cancelar</Btn><Btn kind="primary" icon="calendar" onClick={() => {
            const iso = new Date(when).toISOString();
            if (new Date(iso) <= new Date()) return toast("Escolha uma data no futuro.", "error");
            setScheduling(false); publish("agendado", { publishAt: iso });
          }}>Agendar</Btn></>}>
          <label className="a-label" htmlFor="sched">Data e hora</label>
          <input id="sched" type="datetime-local" className="a-input" value={when} onChange={(e) => setWhen(e.target.value)} />
          <p className="a-hint">O conteúdo entra no ar automaticamente nesse horário.</p>
        </Modal>
      )}
    </Card>
  );
}
const toLocalInput = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

// ---------------------------------------------------------------------
// Lógica comum dos editores: rascunho, validação, salvar, guarda de saída
// ---------------------------------------------------------------------
export function useEditorSave({ coll, draft, commit, dirty, rules }) {
  const { user, go, toast, saved, setDirty } = useAdmin();
  const [errors, setErrors] = useState({});
  const [tried, setTried] = useState(false);
  useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]);

  function validate(full) {
    const e = {};
    rules.forEach(([key, test, msg, onlyFull]) => { if ((full || !onlyFull) && !test(draft)) e[key] = msg; });
    setErrors(e); setTried(true);
    return Object.keys(e).length ? e : null;
  }
  // revalida enquanto o usuário corrige
  useEffect(() => { if (tried) { const e = {}; rules.forEach(([k, t, m, f]) => { if (errors[k] !== undefined && !t(draft)) e[k] = m; }); setErrors(e); } // eslint-disable-next-line
  }, [draft]);

  function save(status, extra = {}) {
    if (validate(false)) return toast("Preencha os campos obrigatórios.", "error");
    const isNew = !draft.id;
    const item = saveItem(coll, { ...draft, ...extra }, user, { status });
    commit(item);
    setDirty(false);
    const msg = { publicado: "Publicado no site.", revisao: "Enviado para revisão.", agendado: "Publicação agendada.", arquivado: "Arquivado.", rascunho: "Rascunho salvo." }[status];
    saved(msg);
    if (isNew) setTimeout(() => go(`${COLL[coll].path}/${item.id}`), 0);
  }
  return { errors, validate, save };
}

// Checklist de qualidade exibido no editor
export function Checklist({ items }) {
  const done = items.filter(i => i[1]).length;
  return (
    <Card title="Qualidade" subtitle={`${done} de ${items.length} itens`} >
      <div className="a-progress"><i style={{ width: (done / items.length) * 100 + "%" }} /></div>
      <ul className="a-checklist">
        {items.map(([label, ok]) => <li key={label} className={ok ? "ok" : ""}><AIcon name={ok ? "check" : "x"} size={14} />{label}</li>)}
      </ul>
    </Card>
  );
}

export function EditorLayout({ header, main, side }) {
  return <>{header}<div className="a-editor"><div className="a-editor-main">{main}</div><aside className="a-editor-side">{side}</aside></div></>;
}

export function NotFoundItem({ what, path }) {
  const { go } = useAdmin();
  return <div className="a-empty a-empty-page"><strong>{what} não encontrado</strong><p>Pode ter sido excluído.</p><Btn onClick={() => go(path)}>Voltar para a lista</Btn></div>;
}

export { Select };
