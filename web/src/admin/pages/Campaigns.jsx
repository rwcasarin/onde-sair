import { useState } from "react";
import { Badge, Btn, Card, DataTable, Input, Modal, PageHeader, Segmented, Select, Textarea, Field, useAdmin, AIcon } from "../kit.jsx";
import { saveCampaign, removeCampaign, fmtDate, relTime } from "../store.js";

const KINDS = ["ROTEIRO NOVO", "FAVORITO", "AGENDA", "AMIGO"];
const TONE = { enviada: "green", agendada: "blue", rascunho: "gray" };

export function CampaignsPage() {
  const { db, user, toast, confirm } = useAdmin();
  const [edit, setEdit] = useState(null);
  const sent = db.campaigns.filter(c => c.status === "enviada");
  const reach = sent.reduce((a, c) => a + (c.reach || 0), 0), opens = sent.reduce((a, c) => a + (c.opens || 0), 0);

  return (
    <>
      <PageHeader title="Notificações" crumbs={[["Painel", "/"], ["Notificações"]]}
        subtitle="Avisos que aparecem no sino do site para quem usa o Onde Sair."
        actions={<Btn kind="primary" icon="plus" onClick={() => setEdit({ kind: "ROTEIRO NOVO", title: "", body: "", audience: "Todos", status: "rascunho", when: "agora" })}>Nova notificação</Btn>} />
      <div className="a-kpis a-kpis-4">
        <div className="a-kpi static"><span className="a-kpi-label">Enviadas</span><strong className="a-kpi-value">{sent.length}</strong></div>
        <div className="a-kpi static"><span className="a-kpi-label">Agendadas</span><strong className="a-kpi-value">{db.campaigns.filter(c => c.status === "agendada").length}</strong></div>
        <div className="a-kpi static"><span className="a-kpi-label">Alcance total</span><strong className="a-kpi-value">{reach.toLocaleString("pt-BR")}</strong></div>
        <div className="a-kpi static"><span className="a-kpi-label">Taxa de abertura</span><strong className="a-kpi-value">{reach ? Math.round((opens / reach) * 100) : 0}%</strong></div>
      </div>
      <Card pad={false}>
        <DataTable
          rows={db.campaigns}
          initialSort={{ key: "date", dir: "desc" }}
          onRowClick={(c) => c.status !== "enviada" && setEdit({ ...c, when: c.status === "agendada" ? "agendar" : "agora" })}
          columns={[
            { key: "title", label: "Notificação", render: (c) => <span className="a-cell-main"><span><strong>{c.title}</strong><em><b className="a-mini-kind">{c.kind}</b> {c.body}</em></span></span> },
            { key: "audience", label: "Público", width: 160 },
            { key: "status", label: "Status", width: 110, render: (c) => <Badge tone={TONE[c.status]}>{c.status[0].toUpperCase() + c.status.slice(1)}</Badge> },
            { key: "date", label: "Data", width: 150, sortValue: (c) => c.sentAt || c.scheduledAt || "", render: (c) => <span className="a-muted-cell" title={fmtDate(c.sentAt || c.scheduledAt)}>{relTime(c.sentAt || c.scheduledAt)}</span> },
            { key: "reach", label: "Aberturas", width: 120, align: "right", render: (c) => c.status === "enviada" ? `${c.opens || 0} / ${c.reach || 0}` : "—" },
            { key: "_a", label: "", sortable: false, width: 60, align: "right", render: (c) => (
              <Btn size="sm" kind="ghost" icon="trash" aria-label="Excluir" onClick={async () => {
                if (await confirm({ title: "Excluir notificação?", text: c.status === "enviada" ? "Ela some do histórico, mas quem já recebeu continua vendo." : "Ela não será enviada.", ok: "Excluir", danger: true })) { removeCampaign(c.id, user); toast("Excluída.", "success"); }
              }} />
            ) },
          ]}
        />
      </Card>
      {edit && <Composer initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function Composer({ initial, onClose }) {
  const { db, user, toast } = useAdmin();
  const [c, setC] = useState(initial);
  const [err, setErr] = useState({});
  const set = (p) => setC(x => ({ ...x, ...p }));
  const audiences = ["Todos", ...db.vibes.map(v => "Vibe: " + v.label), ...db.cities.filter(x => x.active).map(x => "Cidade: " + x.name)];
  const toLocal = (iso) => { const d = new Date(iso || Date.now() + 864e5); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

  function go(status) {
    const e = {};
    if (!c.title.trim()) e.title = "Escreva um título.";
    if (!c.body.trim()) e.body = "Escreva a mensagem.";
    if (status === "agendada" && (!c.scheduledAt || new Date(c.scheduledAt) <= new Date())) e.when = "Escolha uma data no futuro.";
    setErr(e);
    if (Object.keys(e).length && status !== "rascunho") return;
    if (status === "rascunho" && !c.title.trim()) return;
    const { when, ...rest } = c;
    saveCampaign({ ...rest, status }, user);
    toast({ enviada: "Notificação enviada.", agendada: "Notificação agendada.", rascunho: "Rascunho salvo." }[status], "success");
    onClose();
  }

  return (
    <Modal title={c.id ? "Editar notificação" : "Nova notificação"} size="lg" onClose={onClose}
      footer={<>
        <Btn onClick={() => go("rascunho")}>Salvar rascunho</Btn>
        {c.when === "agendar"
          ? <Btn kind="primary" icon="calendar" onClick={() => go("agendada")}>Agendar envio</Btn>
          : <Btn kind="primary" icon="send2" onClick={() => go("enviada")}>Enviar agora</Btn>}
      </>}>
      <div className="a-composer">
        <div>
          <Select label="Tipo" value={c.kind} onChange={(kind) => set({ kind })} options={KINDS} />
          <Input label="Título" required value={c.title} onChange={(title) => set({ title })} error={err.title} maxCount={60} />
          <Textarea label="Mensagem" required value={c.body} onChange={(body) => set({ body })} error={err.body} rows={3} maxCount={140} />
          <Select label="Público" value={c.audience} onChange={(audience) => set({ audience })} options={audiences} />
          <Field label="Quando">
            <Segmented label="Quando" value={c.when} onChange={(when) => set({ when, scheduledAt: when === "agendar" ? (c.scheduledAt || new Date(Date.now() + 864e5).toISOString()) : undefined })} options={[["agora", "Imediatamente"], ["agendar", "Em data marcada"]]} />
          </Field>
          {c.when === "agendar" && (
            <Field label="Data e hora" error={err.when}>
              {(id) => <input id={id} type="datetime-local" className="a-input" value={toLocal(c.scheduledAt)} onChange={(e) => set({ scheduledAt: new Date(e.target.value).toISOString() })} />}
            </Field>
          )}
        </div>
        <div className="a-phone" aria-label="Prévia no celular">
          <span className="a-phone-notch" />
          <div className="a-phone-notif">
            <span className="a-phone-app"><AIcon name="bell" size={14} /> Onde Sair · agora</span>
            <strong>{c.title || "Título da notificação"}</strong>
            <p>{c.body || "A mensagem aparece aqui."}</p>
          </div>
          <span className="a-phone-meta">{c.audience}</span>
        </div>
      </div>
    </Modal>
  );
}
