import { useState } from "react";
import { Badge, Btn, Card, DataTable, PageHeader, Tabs, Toolbar, FilterSelect, useAdmin, Empty, Toggle, AIcon } from "../kit.jsx";
import { moderate, removeReviews, relTime, fmtDate, saveSettings } from "../store.js";

const TONE = { pendente: "amber", aprovada: "green", rejeitada: "red" };

export function ReviewsPage() {
  const { db, user, toast, confirm, go } = useAdmin();
  const [tab, setTab] = useState("pendente");
  const [q, setQ] = useState("");
  const [place, setPlace] = useState("");
  const [stars, setStars] = useState("");
  const all = db.reviews;
  const count = (s) => all.filter(r => r.status === s).length;
  const rows = all.filter(r =>
    (tab === "denunciadas" ? r.reports > 0 : tab === "destaque" ? r.featured && r.status === "aprovada" : r.status === tab) &&
    (!place || r.place === place) && (!stars || String(r.rating) === stars) &&
    (!q || `${r.author} ${r.text}`.toLowerCase().includes(q.toLowerCase())));
  const placeName = (id) => db.places.find(p => p.id === id)?.name || "—";

  const act = (ids, patch, msg) => { moderate(ids, patch, user); toast(msg, "success"); };
  async function del(ids) {
    if (await confirm({ title: `Excluir ${ids.length} avaliação(ões)?`, text: "A avaliação some do site e do histórico.", ok: "Excluir", danger: true })) {
      removeReviews(ids, user); toast("Excluída(s).", "success");
    }
  }

  return (
    <>
      <PageHeader title="Avaliações" crumbs={[["Painel", "/"], ["Avaliações"]]}
        subtitle="Modere o que a comunidade publica. Destaques aparecem em “Dicas de quem já foi” nas páginas de lugar." />
      <div className="a-grid-2-1">
        <Card pad={false}>
          <div className="a-card-pad a-card-pad-tight">
            <Tabs value={tab} onChange={setTab} tabs={[
              ["pendente", "Pendentes", count("pendente")], ["aprovada", "Aprovadas", count("aprovada")], ["rejeitada", "Rejeitadas", count("rejeitada")],
              ["destaque", "Em destaque", all.filter(r => r.featured && r.status === "aprovada").length], ["denunciadas", "Denunciadas", all.filter(r => r.reports > 0).length],
            ]} />
            <Toolbar search={q} onSearch={setQ} placeholder="Buscar por autor ou texto…">
              <FilterSelect label="Lugar" value={place} onChange={setPlace} options={[...new Set(all.map(r => r.place))].map(id => [id, placeName(id)])} />
              <FilterSelect label="Nota" value={stars} onChange={setStars} options={[5, 4, 3, 2, 1].map(n => [String(n), "★".repeat(n)])} />
            </Toolbar>
          </div>
          <DataTable
            key={tab}
            rows={rows}
            empty={<Empty icon="check" title={tab === "pendente" ? "Nenhuma avaliação esperando" : "Nada aqui"} text={tab === "pendente" ? "A fila de moderação está vazia." : undefined} />}
            initialSort={{ key: "createdAt", dir: "desc" }}
            bulkActions={[
              { label: "Aprovar", icon: "check", kind: "primary", run: (ids) => act(ids, { status: "aprovada" }, "Aprovada(s).") },
              { label: "Rejeitar", icon: "ban", run: (ids) => act(ids, { status: "rejeitada", featured: false }, "Rejeitada(s).") },
              { label: "Excluir", icon: "trash", kind: "danger", run: del },
            ]}
            columns={[
              { key: "text", label: "Avaliação", render: (r) => (
                <div className="a-review-cell">
                  <span className="a-stars" aria-label={`${r.rating} de 5`}>{"★".repeat(r.rating)}<i>{"★".repeat(5 - r.rating)}</i></span>
                  <p>“{r.text}”</p>
                  <em>{r.author} · <a href="#" onClick={(e) => { e.preventDefault(); go("lugares/" + r.place); }}>{placeName(r.place)}</a>{r.reports > 0 && <b className="a-flag"><AIcon name="flag" size={12} /> {r.reports} denúncia(s)</b>}</em>
                </div>
              ) },
              { key: "createdAt", label: "Recebida", width: 110, render: (r) => <span title={fmtDate(r.createdAt)} className="a-muted-cell">{relTime(r.createdAt)}</span> },
              { key: "status", label: "Status", width: 120, render: (r) => <Badge tone={TONE[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Badge> },
              { key: "_a", label: "", sortable: false, align: "right", width: 230, render: (r) => (
                <div className="a-row-actions">
                  {r.status !== "aprovada" && <Btn size="sm" kind="primary" icon="check" onClick={() => act([r.id], { status: "aprovada" }, "Aprovada.")}>Aprovar</Btn>}
                  {r.status !== "rejeitada" && <Btn size="sm" icon="ban" onClick={() => act([r.id], { status: "rejeitada", featured: false }, "Rejeitada.")}>Rejeitar</Btn>}
                  {r.status === "aprovada" && (
                    <Btn size="sm" kind={r.featured ? "secondary" : "ghost"} icon="star" aria-pressed={r.featured} title="Destacar no site"
                      onClick={() => act([r.id], { featured: !r.featured }, r.featured ? "Destaque removido." : "Destacada no site.")}>{r.featured ? "Destacada" : "Destacar"}</Btn>
                  )}
                </div>
              ) },
            ]}
          />
        </Card>
        <div className="a-stack">
          <Card title="Regras de publicação">
            <Toggle label="Exigir aprovação antes de publicar" hint="Desligado, avaliações entram no ar na hora e você modera depois."
              checked={db.settings.reviewsRequireApproval} onChange={(v) => { saveSettings({ ...db.settings, reviewsRequireApproval: v }, user); toast("Regra atualizada.", "success"); }} />
          </Card>
          <Card title="Guia rápido de moderação">
            <ul className="a-guide">
              <li><AIcon name="check" size={14} /> Aprove relatos reais, mesmo críticos, se forem respeitosos.</li>
              <li><AIcon name="ban" size={14} /> Rejeite ofensas, spam, dados pessoais ou propaganda.</li>
              <li><AIcon name="star" size={14} /> Destaque relatos com dica prática: horário, prato, mesa.</li>
              <li><AIcon name="flag" size={14} /> Denúncias aparecem na aba “Denunciadas”.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
