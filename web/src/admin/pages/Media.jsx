import { useMemo, useState } from "react";
import { placeImg, placeGallery, roteiroImg, vibeImg } from "../../data.js";
import { Badge, Card, ImageField, PageHeader, Toolbar, FilterSelect, useAdmin, useImageStatus, Empty, Btn } from "../kit.jsx";

// Todos os espaços de imagem que o site usa, derivados do conteúdo
export function expectedImages(db) {
  const out = [];
  const add = (path, label, group, ratio = "16 / 10") => out.push({ path, label, group, ratio });
  add(db.home.hero.img, "Home · foto do topo", "Home");
  db.home.vibeRoteiros.forEach(v => add(v.img, `Home · card ${v.title}`, "Home", "3 / 4"));
  add("images/home/banner-encontros.jpg", "Banner “Viva bons encontros”", "Home");
  db.stories.forEach(s => add(s.img || `images/historias/${s.id}.jpg`, `Post · ${s.title}`, "Radar", "3 / 4"));
  db.vibes.forEach(v => add(vibeImg(v.id), `Vibe · ${v.label}`, "Vibes", "16 / 7"));
  add("images/vibes/lugares.jpg", "Página Lugares", "Vibes", "16 / 7");
  db.places.forEach(p => {
    add(placeImg(p.id), `${p.name} · capa`, "Lugares");
    placeGallery(p.id).forEach((g, i) => add(g, `${p.name} · galeria ${i + 1}`, "Lugares", "3 / 4"));
  });
  db.roteiros.forEach(r => {
    add(roteiroImg(r.id), `${r.title} · capa`, "Roteiros");
    r.steps.forEach((s, i) => add(roteiroImg(r.id, i + 1), `${r.title} · parada ${i + 1}`, "Roteiros", "2 / 1"));
  });
  ["marina", "rafael", "camila", "time-onde-sair"].forEach(n => add(`images/pessoas/${n}.jpg`, `Avatar · ${n}`, "Pessoas", "1 / 1"));
  return out.filter((x, i, a) => x.path && a.findIndex(y => y.path === x.path) === i);
}

const STATE = { arquivo: ["green", "No servidor"], enviada: ["blue", "Enviada no painel"], faltando: ["red", "Faltando"] };

export function MediaPage() {
  const { db } = useAdmin();
  const all = useMemo(() => expectedImages(db), [db]);
  const status = useImageStatus(all.map(i => i.path));
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [st, setSt] = useState("");
  const [limit, setLimit] = useState(48);
  const rows = all.filter(i => (!group || i.group === group) && (!st || status[i.path] === st) && (!q || (i.label + i.path).toLowerCase().includes(q.toLowerCase())));
  const n = (s) => all.filter(i => status[i.path] === s).length;
  const bytes = Object.values(db.media).reduce((a, d) => a + d.length * 0.75, 0);

  return (
    <>
      <PageHeader title="Mídia" crumbs={[["Painel", "/"], ["Mídia"]]}
        subtitle="Todos os espaços de imagem do site. Envie aqui ou coloque o arquivo com o mesmo nome em web/public/images/." />
      <div className="a-kpis a-kpis-4">
        <div className="a-kpi static"><span className="a-kpi-label">Espaços de imagem</span><strong className="a-kpi-value">{all.length}</strong></div>
        <div className="a-kpi static tone-green"><span className="a-kpi-label">Com imagem</span><strong className="a-kpi-value">{n("arquivo") + n("enviada")}</strong><span className="a-kpi-note">{n("enviada")} enviada(s) pelo painel</span></div>
        <div className="a-kpi static tone-red"><span className="a-kpi-label">Faltando</span><strong className="a-kpi-value">{n("faltando")}</strong></div>
        <div className="a-kpi static"><span className="a-kpi-label">Armazenamento local</span><strong className="a-kpi-value">{(bytes / 1024 / 1024).toFixed(1)} MB</strong><span className="a-kpi-note">limite do navegador ≈ 5 MB</span></div>
      </div>
      <Card pad={false}>
        <div className="a-card-pad a-card-pad-tight">
          <Toolbar search={q} onSearch={setQ} placeholder="Buscar por nome ou caminho…">
            <FilterSelect label="Seção" value={group} onChange={setGroup} options={[...new Set(all.map(i => i.group))]} />
            <FilterSelect label="Situação" value={st} onChange={setSt} options={Object.entries(STATE).map(([k, v]) => [k, v[1]])} />
          </Toolbar>
        </div>
        <div className="a-card-pad">
          {!rows.length ? <Empty title="Nenhuma imagem com esses filtros" /> : (
            <div className="a-media-grid">
              {rows.slice(0, limit).map(i => (
                <figure key={i.path} className="a-media-item">
                  <ImageField path={i.path} ratio="4 / 3" compact />
                  <figcaption>
                    <strong title={i.label}>{i.label}</strong>
                    <code title={i.path}>{i.path}</code>
                    {status[i.path] ? <Badge tone={STATE[status[i.path]][0]}>{STATE[status[i.path]][1]}</Badge> : <Badge>Verificando…</Badge>}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          {rows.length > limit && <div className="a-center"><Btn onClick={() => setLimit(limit + 48)}>Mostrar mais ({rows.length - limit})</Btn></div>}
        </div>
      </Card>
    </>
  );
}
