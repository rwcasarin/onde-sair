import { useState } from "react";
import { AIcon, Badge, Btn, Card, DataTable, Input, Modal, PageHeader, Select, Toolbar, FilterSelect, useAdmin } from "../kit.jsx";
import { updateMembers, inviteMember, updateTeamMember, removeTeamMember, ROLES, PERMISSIONS, rolePerms, relTime, fmtDate } from "../store.js";

const MTONE = { ativo: "green", pendente: "amber", bloqueado: "red" };

// ---------------------------------------------------------------------
// Usuários do site
// ---------------------------------------------------------------------
export function MembersPage() {
  const { db, user, toast, confirm } = useAdmin();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(null);
  const cityName = (id) => db.cities.find(c => c.id === id)?.name || id;
  const rows = db.members.filter(m => (!status || m.status === status) && (!plan || m.plan === plan) && (!city || m.city === city)
    && (!q || `${m.name} ${m.email}`.toLowerCase().includes(q.toLowerCase())));

  async function block(ids, v) {
    if (v && !(await confirm({ title: `Bloquear ${ids.length} usuário(s)?`, text: "Eles não conseguirão entrar nem publicar avaliações.", ok: "Bloquear", danger: true }))) return;
    try { await updateMembers(ids, { status: v ? "bloqueado" : "ativo" }, user); toast(v ? "Bloqueado(s)." : "Desbloqueado(s).", "success"); }
    catch (e) { toast(e.message, "error"); }
  }
  function exportCsv() {
    const head = ["nome", "email", "cidade", "plano", "status", "salvos", "avaliacoes", "entrou"];
    const lines = rows.map(m => [m.name, m.email, cityName(m.city), m.plan, m.status, m.saves, m.reviews, m.joined.slice(0, 10)].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "usuarios-onde-sair.csv"; a.click();
    URL.revokeObjectURL(a.href);
  }
  const m = open && db.members.find(x => x.id === open);

  return (
    <>
      <PageHeader title="Usuários" crumbs={[["Painel", "/"], ["Usuários"]]} subtitle="Pessoas cadastradas no site."
        actions={<Btn icon="download" onClick={exportCsv}>Exportar CSV</Btn>} />
      <div className="a-kpis a-kpis-4">
        <div className="a-kpi static"><span className="a-kpi-label">Cadastrados</span><strong className="a-kpi-value">{db.members.length}</strong></div>
        <div className="a-kpi static"><span className="a-kpi-label">Ativos</span><strong className="a-kpi-value">{db.members.filter(x => x.status === "ativo").length}</strong></div>
        <div className="a-kpi static"><span className="a-kpi-label">Assinantes VIP</span><strong className="a-kpi-value">{db.members.filter(x => x.plan === "VIP").length}</strong></div>
        <div className="a-kpi static"><span className="a-kpi-label">Bloqueados</span><strong className="a-kpi-value">{db.members.filter(x => x.status === "bloqueado").length}</strong></div>
      </div>
      <Card pad={false}>
        <div className="a-card-pad a-card-pad-tight">
          <Toolbar search={q} onSearch={setQ} placeholder="Buscar por nome ou e-mail…">
            <FilterSelect label="Status" value={status} onChange={setStatus} options={[["ativo", "Ativo"], ["pendente", "Pendente"], ["bloqueado", "Bloqueado"]]} />
            <FilterSelect label="Plano" value={plan} onChange={setPlan} options={["Grátis", "VIP"]} />
            <FilterSelect label="Cidade" value={city} onChange={setCity} options={db.cities.map(c => [c.id, c.name])} />
          </Toolbar>
        </div>
        <DataTable rows={rows} pageSize={12} onRowClick={(x) => setOpen(x.id)} initialSort={{ key: "joined", dir: "desc" }}
          bulkActions={[
            { label: "Bloquear", icon: "ban", kind: "danger", run: (ids) => block(ids, true) },
            { label: "Desbloquear", icon: "check", run: (ids) => block(ids, false) },
          ]}
          columns={[
            { key: "name", label: "Pessoa", render: (x) => <span className="a-cell-main"><span className="a-avatar sm">{x.name.split(" ").map(s => s[0]).join("")}</span><span><strong>{x.name}</strong><em>{x.email}</em></span></span> },
            { key: "city", label: "Cidade", width: 140, render: (x) => cityName(x.city) },
            { key: "plan", label: "Plano", width: 90, render: (x) => x.plan === "VIP" ? <Badge tone="teal">VIP</Badge> : "Grátis" },
            { key: "saves", label: "Salvos", width: 80, align: "right" },
            { key: "reviews", label: "Avaliações", width: 100, align: "right" },
            { key: "joined", label: "Entrou", width: 110, render: (x) => <span className="a-muted-cell">{fmtDate(x.joined, false)}</span> },
            { key: "status", label: "Status", width: 110, render: (x) => <Badge tone={MTONE[x.status]}>{x.status[0].toUpperCase() + x.status.slice(1)}</Badge> },
          ]} />
      </Card>

      {m && (
        <Modal title={m.name} onClose={() => setOpen(null)}
          footer={<>
            {m.status === "bloqueado"
              ? <Btn icon="check" onClick={() => block([m.id], false)}>Desbloquear</Btn>
              : <Btn kind="danger" icon="ban" onClick={() => block([m.id], true)}>Bloquear</Btn>}
            <Btn onClick={async () => { try { await updateMembers([m.id], { plan: m.plan === "VIP" ? "Grátis" : "VIP" }, user); toast("Plano atualizado.", "success"); } catch (e) { toast(e.message, "error"); } }}>{m.plan === "VIP" ? "Remover VIP" : "Conceder VIP"}</Btn>
            <Btn kind="primary" onClick={() => setOpen(null)}>Fechar</Btn>
          </>}>
          <dl className="a-meta a-meta-cols">
            <div><dt>E-mail</dt><dd>{m.email}</dd></div>
            <div><dt>Cidade</dt><dd>{cityName(m.city)}</dd></div>
            <div><dt>Plano</dt><dd>{m.plan}</dd></div>
            <div><dt>Status</dt><dd><Badge tone={MTONE[m.status]}>{m.status}</Badge></dd></div>
            <div><dt>Entrou em</dt><dd>{fmtDate(m.joined, false)}</dd></div>
            <div><dt>Último acesso</dt><dd>{relTime(m.lastSeen)}</dd></div>
            <div><dt>Lugares salvos</dt><dd>{m.saves}</dd></div>
            <div><dt>Avaliações</dt><dd>{m.reviews}</dd></div>
            {m.providers && <div><dt>Entra com</dt><dd>{[...(m.hasPassword ? ["E-mail e senha"] : []), ...m.providers.map(p => ({ google: "Google", instagram: "Instagram", tiktok: "TikTok" }[p] || p))].join(", ") || "—"}</dd></div>}
            {m.vibes?.length > 0 && <div><dt>Vibes</dt><dd>{m.vibes.map(v => db.vibes.find(x => x.id === v)?.label || v).join(", ")}</dd></div>}
          </dl>
          <p className="a-hint">Por privacidade (LGPD), o painel mostra só os dados necessários. Pedidos de exclusão de conta são atendidos em Configurações › Dados.</p>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------
// Equipe e permissões
// ---------------------------------------------------------------------
export function TeamPage() {
  const { db, user, toast, confirm } = useAdmin();
  const [invite, setInvite] = useState(null);
  const [secret, setSecret] = useState(null);   // { name, email, password } mostrado uma única vez
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState({});
  const admins = db.team.filter(t => t.role === "admin" && t.status === "ativo").length;

  async function run(fn, ok) {
    try { const r = await fn(); if (ok) toast(ok, "success"); return r; }
    catch (e) { toast(e.message, "error"); }
  }
  function changeRole(t, role) {
    if (t.role === "admin" && role !== "admin" && admins <= 1) return toast("O painel precisa de pelo menos um administrador ativo.", "error");
    if (t.id === user.id && role !== "admin") return toast("Você não pode remover o seu próprio acesso de administrador.", "error");
    run(() => updateTeamMember(t.id, { role }, user), `${t.name} agora é ${ROLES[role].label}.`);
  }
  async function toggleActive(t) {
    if (t.id === user.id) return toast("Você não pode desativar a si mesmo.", "error");
    run(() => updateTeamMember(t.id, { status: t.status === "ativo" ? "inativo" : "ativo" }, user), t.status === "ativo" ? "Acesso desativado." : "Acesso reativado.");
  }
  async function resetPass(t) {
    if (!(await confirm({ title: `Gerar nova senha para ${t.name}?`, text: "A senha atual deixa de funcionar e a pessoa sai de todas as sessões abertas.", ok: "Gerar senha" }))) return;
    const r = await run(() => updateTeamMember(t.id, { resetPassword: true }, user));
    if (r?.tempPassword) setSecret({ name: t.name, email: t.email, password: r.tempPassword });
  }
  async function remove(t) {
    if (t.id === user.id) return toast("Você não pode remover a si mesmo.", "error");
    if (t.role === "admin" && admins <= 1) return toast("Não dá para remover o último administrador.", "error");
    if (await confirm({ title: `Remover ${t.name} da equipe?`, text: "O acesso ao painel é revogado na hora. O conteúdo criado por essa pessoa continua no site.", ok: "Remover", danger: true })) {
      run(() => removeTeamMember(t.id, user), "Acesso removido.");
    }
  }
  async function sendInvite() {
    const e = {};
    if (!invite.name.trim()) e.name = "Informe o nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)) e.email = "E-mail inválido.";
    else if (db.team.some(t => t.email.toLowerCase() === invite.email.toLowerCase())) e.email = "Essa pessoa já está na equipe.";
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const r = await run(() => inviteMember(invite, user));
    setBusy(false);
    if (r) { setInvite(null); setSecret({ name: invite.name, email: invite.email, password: r.tempPassword }); }
  }

  return (
    <>
      <PageHeader title="Equipe e permissões" crumbs={[["Painel", "/"], ["Equipe"]]} subtitle="Quem acessa o painel e o que cada perfil pode fazer."
        actions={<Btn kind="primary" icon="plus" onClick={() => { setErr({}); setInvite({ name: "", email: "", role: "curador" }); }}>Adicionar pessoa</Btn>} />
      <Card pad={false}>
        <DataTable rows={db.team} columns={[
          { key: "name", label: "Pessoa", render: (t) => <span className="a-cell-main"><span className="a-avatar sm">{t.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span><span><strong>{t.name}{t.id === user.id && " (você)"}</strong><em>{t.email}</em></span></span> },
          { key: "role", label: "Perfil", width: 200, render: (t) => (
            <Select value={t.role} onChange={(r) => changeRole(t, r)} options={Object.entries(ROLES).map(([k, v]) => [k, v.label])} aria-label={`Perfil de ${t.name}`} />
          ) },
          { key: "status", label: "Status", width: 110, render: (t) => <Badge tone={t.status === "ativo" ? "green" : "gray"}>{t.status === "ativo" ? "Ativo" : "Inativo"}</Badge> },
          { key: "lastLogin", label: "Último acesso", width: 130, render: (t) => <span className="a-muted-cell">{t.lastLogin ? relTime(t.lastLogin) : "Nunca"}</span> },
          { key: "_a", label: "", sortable: false, width: 150, align: "right", render: (t) => (
            <div className="a-row-actions">
              <Btn size="sm" kind="ghost" icon="lock" aria-label={`Gerar nova senha para ${t.name}`} title="Gerar nova senha" onClick={() => resetPass(t)} />
              {t.id !== user.id && <Btn size="sm" kind="ghost" icon={t.status === "ativo" ? "ban" : "check"} aria-label={t.status === "ativo" ? "Desativar" : "Reativar"} title={t.status === "ativo" ? "Desativar acesso" : "Reativar acesso"} onClick={() => toggleActive(t)} />}
              {t.id !== user.id && <Btn size="sm" kind="ghost" icon="trash" aria-label={`Remover ${t.name}`} title="Remover" onClick={() => remove(t)} />}
            </div>
          ) },
        ]} />
      </Card>

      <Card title="O que cada perfil pode fazer">
        <div className="a-table-scroll">
          <table className="a-table a-matrix">
            <thead><tr><th>Permissão</th>{Object.entries(ROLES).map(([k, v]) => <th key={k} className="a-center">{v.label}</th>)}</tr></thead>
            <tbody>
              {PERMISSIONS.map(([p, label]) => (
                <tr key={p}><td>{label}</td>{Object.keys(ROLES).map(r => (
                  <td key={r} className="a-center">{rolePerms(r).includes(p)
                    ? <span className="a-yes" aria-label="Sim"><AIcon name="check" size={15} /></span>
                    : <span className="a-no" aria-label="Não">—</span>}</td>
                ))}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="a-role-notes">{Object.entries(ROLES).map(([k, v]) => <li key={k}><strong>{v.label}:</strong> {v.desc}</li>)}</ul>
      </Card>

      {invite && (
        <Modal title="Adicionar à equipe" size="sm" onClose={() => setInvite(null)}
          footer={<><Btn onClick={() => setInvite(null)}>Cancelar</Btn><Btn kind="primary" icon="plus" disabled={busy} onClick={sendInvite}>{busy ? "Criando…" : "Criar acesso"}</Btn></>}>
          <Input label="Nome" required value={invite.name} onChange={(name) => setInvite({ ...invite, name })} error={err.name} />
          <Input label="E-mail" required type="email" value={invite.email} onChange={(email) => setInvite({ ...invite, email })} error={err.email} />
          <Select label="Perfil" value={invite.role} onChange={(role) => setInvite({ ...invite, role })} options={Object.entries(ROLES).map(([k, v]) => [k, v.label])} hint={ROLES[invite.role].desc} />
          <p className="a-hint">Vamos gerar uma senha provisória para você repassar. A pessoa troca no primeiro acesso, em “Alterar senha”.</p>
        </Modal>
      )}

      {secret && (
        <Modal title="Senha provisória" size="sm" onClose={() => setSecret(null)}
          footer={<Btn kind="primary" onClick={() => setSecret(null)}>Pronto, já copiei</Btn>}>
          <p className="a-confirm-text">Envie para <strong>{secret.name}</strong> por um canal seguro. Ela não será mostrada de novo.</p>
          <div className="a-secret">
            <div><span>E-mail</span><code>{secret.email}</code></div>
            <div><span>Senha</span><code>{secret.password}</code></div>
            <Btn size="sm" icon="copy" onClick={() => { navigator.clipboard?.writeText(`${secret.email}\n${secret.password}`); toast("Copiado.", "success"); }}>Copiar</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
