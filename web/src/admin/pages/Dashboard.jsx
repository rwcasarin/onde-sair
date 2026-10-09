import { useMemo, useState } from "react";
import { AIcon, Btn, Card, PageHeader, StatusBadge, Toolbar, FilterSelect, useAdmin, useImageStatus, Empty } from "../kit.jsx";
import { can, relTime, fmtDate, isLive } from "../store.js";
import { expectedImages } from "./Media.jsx";

// Série de exemplo para visitas (substituir pela integração de analytics)
const VISITS = [820, 760, 910, 1040, 1380, 1620, 1490, 870, 830, 980, 1110, 1450, 1710, 1580];

export function Dashboard() {
  const { db, user, go } = useAdmin();
  const paths = useMemo(() => expectedImages(db).map(i => i.path), [db]);
  const imgs = useImageStatus(paths);
  const missing = paths.filter(p => imgs[p] === "faltando").length;
  const checked = Object.keys(imgs).length;

  const live = db.places.filter(isLive);
  const pendingReview = [
    ...db.places.filter(p => p.status === "revisao").map(p => ({ t: p.name, k: "Lugar", path: "lugares/" + p.id, s: p })),
    ...db.roteiros.filter(p => p.status === "revisao").map(p => ({ t: p.title, k: "Roteiro", path: "roteiros/" + p.id, s: p })),
    ...db.stories.filter(p => p.status === "revisao").map(p => ({ t: p.title, k: "Post", path: "radar/" + p.id, s: p })),
  ];
  const drafts = [...db.places, ...db.roteiros, ...db.stories].filter(x => x.status === "rascunho").length;
  const weak = live.filter(p => !p.seo?.desc || (p.reasons || []).length < 3 || !p.dica);
  const weekAgo = Date.now() - 7 * 864e5;
  const newThisWeek = db.places.filter(p => new Date(p.createdAt) > weekAgo).length;

  const kpis = [
    { label: "Lugares publicados", value: live.length, note: `${newThisWeek} criado(s) nos últimos 7 dias`, path: "lugares", icon: "pin" },
    { label: "Roteiros publicados", value: db.roteiros.filter(isLive).length, note: `${db.roteiros.length} no total`, path: "roteiros", icon: "route" },
    { label: "Aguardando revisão", value: pendingReview.length, note: `${drafts} rascunho(s) em andamento`, path: "lugares", icon: "edit", tone: pendingReview.length ? "amber" : null },
    { label: "Imagens faltando", value: checked < paths.length ? "…" : missing, note: `de ${paths.length} espaços de imagem`, path: "midia", icon: "image", tone: missing ? "red" : "green" },
  ];

  const byVibe = db.vibes.map(v => ({ label: v.label, n: live.filter(p => p.affs.includes(v.id)).length }));
  const maxVibe = Math.max(1, ...byVibe.map(v => v.n));
  const first = user.name.split(" ")[0];
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader
        title={`Olá, ${first}`}
        subtitle={`Hoje é ${today}. Aqui está o resumo da curadoria.`}
        actions={can(user, "content.edit") && <>
          <Btn icon="plus" onClick={() => go("radar/novo")}>Novo post</Btn>
          <Btn icon="plus" onClick={() => go("roteiros/novo")}>Novo roteiro</Btn>
          <Btn kind="primary" icon="plus" onClick={() => go("lugares/novo")}>Novo lugar</Btn>
        </>}
      />

      <div className="a-kpis">
        {kpis.map(k => (
          <button key={k.label} type="button" className={"a-kpi" + (k.tone ? " tone-" + k.tone : "")} onClick={() => go(k.path)}>
            <span className="a-kpi-icon"><AIcon name={k.icon} size={18} /></span>
            <span className="a-kpi-label">{k.label}</span>
            <strong className="a-kpi-value">{k.value}</strong>
            <span className="a-kpi-note">{k.note}</span>
          </button>
        ))}
      </div>

      <div className="a-grid-2-1">
        <Card title="Visitas ao site" subtitle="Últimos 14 dias · dados de exemplo até conectar o analytics">
          <VisitsChart data={VISITS} />
        </Card>
        <Card title="Lugares por vibe" subtitle="Publicados">
          <ul className="a-hbars">
            {byVibe.map(v => (
              <li key={v.label}>
                <span>{v.label}</span>
                <span className="a-hbar"><i style={{ width: (v.n / maxVibe) * 100 + "%" }} /></span>
                <b>{v.n}</b>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="a-grid-2">
        <Card title="Para revisar" subtitle="Enviado pela curadoria" actions={<Badge n={pendingReview.length} />}>
          {pendingReview.length ? (
            <ul className="a-list">
              {pendingReview.map(r => (
                <li key={r.path}><button type="button" onClick={() => go(r.path)}>
                  <span><strong>{r.t}</strong><em>{r.k} · por {r.s.updatedBy} · {relTime(r.s.updatedAt)}</em></span>
                  <StatusBadge status="revisao" />
                </button></li>
              ))}
            </ul>
          ) : <Empty icon="check" title="Nada para revisar" text="Tudo em dia por aqui." />}
        </Card>

        <Card title="Melhorar conteúdo" subtitle="Publicados com campos incompletos">
          {weak.length ? (
            <ul className="a-list">
              {weak.slice(0, 5).map(p => (
                <li key={p.id}><button type="button" onClick={() => go("lugares/" + p.id)}>
                  <span><strong>{p.name}</strong><em>{[!p.seo?.desc && "sem descrição SEO", (p.reasons || []).length < 3 && "menos de 3 motivos", !p.dica && "sem dica da curadoria"].filter(Boolean).join(" · ")}</em></span>
                  <AIcon name="right" size={16} />
                </button></li>
              ))}
            </ul>
          ) : <Empty icon="check" title="Tudo completo" text="Todos os lugares publicados têm os campos principais." />}
        </Card>
      </div>

      <Card title="Atividade recente" actions={<Btn size="sm" kind="ghost" onClick={() => go("atividade")}>Ver tudo</Btn>}>
        <ActivityList items={db.activity.slice(0, 8)} />
      </Card>
    </>
  );
}

function Badge({ n }) { return n ? <span className="a-count">{n}</span> : null; }

// Gráfico de barras simples (uma série) com dica ao passar o mouse/foco
function VisitsChart({ data }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data);
  const nice = Math.ceil(max / 500) * 500;
  const days = data.map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (data.length - 1 - i)); return d; });
  const total = data.reduce((a, b) => a + b, 0);
  const lastWeek = data.slice(-7).reduce((a, b) => a + b, 0), prevWeek = data.slice(0, 7).reduce((a, b) => a + b, 0);
  const delta = Math.round(((lastWeek - prevWeek) / prevWeek) * 100);
  return (
    <div className="a-chart">
      <div className="a-chart-hero">
        <strong>{total.toLocaleString("pt-BR")}</strong><span>visitas no período</span>
        <em className={delta >= 0 ? "up" : "down"}><AIcon name={delta >= 0 ? "up" : "down"} size={14} /> {Math.abs(delta)}% vs. semana anterior</em>
      </div>
      <div className="a-chart-plot" role="img" aria-label={`Visitas por dia, de ${data[0]} a ${data[data.length - 1]}; pico de ${max}.`}>
        <div className="a-chart-grid">{[nice, nice / 2, 0].map(v => <span key={v}><em>{v.toLocaleString("pt-BR")}</em></span>)}</div>
        <div className="a-chart-bars">
          {data.map((v, i) => (
            <button key={i} type="button" className="a-chart-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              aria-label={`${days[i].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}: ${v} visitas`}>
              <i style={{ height: (v / nice) * 100 + "%" }} className={hover === i ? "on" : ""} />
              {hover === i && <span className="a-tip"><strong>{v.toLocaleString("pt-BR")}</strong> visitas<br />{days[i].toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</span>}
            </button>
          ))}
        </div>
        <div className="a-chart-x">
          {days.map((d, i) => <span key={i}>{i % 2 === 0 ? d.toLocaleDateString("pt-BR", { day: "2-digit" }) : ""}</span>)}
        </div>
      </div>
    </div>
  );
}

const TYPE_ICON = { lugar: "pin", roteiro: "route", "história": "file", mídia: "image", usuário: "users", equipe: "shield", config: "settings", home: "layout", vibes: "palette", notificação: "bell", acesso: "lock" };

export function ActivityList({ items }) {
  if (!items.length) return <Empty title="Sem atividade ainda" />;
  return (
    <ol className="a-activity">
      {items.map((a, i) => (
        <li key={i}>
          <span className="a-activity-icon"><AIcon name={TYPE_ICON[a.type] || "info"} size={15} /></span>
          <p><strong>{a.who}</strong> {a.action} {a.target && <b>{a.target}</b>}</p>
          <time dateTime={a.at} title={fmtDate(a.at)}>{relTime(a.at)}</time>
        </li>
      ))}
    </ol>
  );
}

export function ActivityPage() {
  const { db } = useAdmin();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const types = [...new Set(db.activity.map(a => a.type))];
  const items = db.activity.filter(a => (!type || a.type === type) && (`${a.who} ${a.action} ${a.target}`).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Atividade" subtitle="Registro de tudo o que a equipe fez no painel." crumbs={[["Painel", "/"], ["Atividade"]]} />
      <Card pad={false}>
        <div className="a-card-pad"><Toolbar search={q} onSearch={setQ} placeholder="Buscar por pessoa ou conteúdo…"><FilterSelect label="Tipo" value={type} onChange={setType} options={types} /></Toolbar></div>
        <div className="a-card-pad"><ActivityList items={items} /></div>
      </Card>
    </>
  );
}
