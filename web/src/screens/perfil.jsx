import { useState } from "react";
import { PLACES, VIBE_ORDER } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, VibePill, MiniPlaceCard, SectionHead, Footer } from "../components/site.jsx";
import { useNav, useCity, useFaves } from "../nav.js";

const HISTORY = [
  { when: "Esta semana",  icon: "pin",      text: "Você foi ao Quintal do Centro · Centro" },
  { when: "8 jun · dom",  icon: "bookmark", text: "Salvou o roteiro “Domingo sem pressa: parque, café e pôr do sol”" },
  { when: "1 jun · dom",  icon: "star",     text: "Avaliou Florado Café · 5 estrelas" },
  { when: "29 mai · qui", icon: "sparkle",  text: "VIP na Casa Komorebi · mesa pra 2 confirmada" },
  { when: "23 mai · sex", icon: "users",    text: "Criou o rolê “Aniversário da Bia” com 6 lugares" },
];
const MY_REVIEWS = [
  { p: "p1", rating: 5, text: "A dica do pastel de pernil salvou a noite. Voltei na mesma semana." },
  { p: "p3", rating: 5, text: "Melhor coado da cidade. Brunch de sábado virou ritual da família." },
  { p: "p8", rating: 4, text: "Bao excelente, soju forte na medida. Cabe pra date." },
];

export function Perfil({ user }) {
  const nav = useNav();
  const { name: city } = useCity();
  const { faves } = useFaves();
  const [tab, setTab] = useState("historico");
  const [affs, setAffs] = useState(new Set(["dates", "impress", "relax"]));

  const stats = [[faves.size, "Salvos"], [user.done, "Já fui"], [user.lists, "Rolês"], [MY_REVIEWS.length, "Avaliações"], [3, "VIPs usadas"]];

  function toggleAff(a) { const n = new Set(affs); n.has(a) ? n.delete(a) : n.add(a); setAffs(n); }

  return (
    <main className="home2">
      <div className="shell">
        <PageHead crumbs={[["Início", "home"], ["Perfil"]]} title={user.name} lede={`Membro desde ${user.joined} · ${city}`}>
          <div className="row gap-12">
            <button className="btn-outline">Editar perfil</button>
            <button className="btn-pill">Convidar amigo</button>
          </div>
        </PageHead>

        <ul className="stat-row">
          {stats.map(([n, l]) => <li key={l}><strong>{n}</strong><span>{l}</span></li>)}
        </ul>

        <section className="h2-section">
          <SectionHead title="Suas vibes" sub="Calibramos suas dicas por essas escolhas. Toque para ligar ou desligar." />
          <div className="hero2-vibes">
            {VIBE_ORDER.map(a => <VibePill key={a} aff={a} active={affs.has(a)} onClick={() => toggleAff(a)} />)}
          </div>
        </section>

        <div className="underline-tabs" role="tablist">
          {[["historico", "Histórico"], ["avaliacoes", "Minhas avaliações"], ["conta", "Conta & VIP"]].map(([id, l]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{l}</button>
          ))}
        </div>

        <section className="tab-panel">
          {tab === "historico" && (
            <ol className="timeline2">
              {HISTORY.map((h, i) => (
                <li key={i}><span className="timeline2-icon"><Icon name={h.icon} size={16} /></span><span className="timeline2-when">{h.when}</span><p>{h.text}</p></li>
              ))}
            </ol>
          )}

          {tab === "avaliacoes" && (
            <div className="tip-reviews">
              {MY_REVIEWS.map(r => {
                const p = PLACES.find(x => x.id === r.p);
                return (
                  <article key={r.p} className="tip-review" onClick={() => nav("detalhe", { id: p.id })} style={{ cursor: "pointer" }}>
                    <header>
                      <ImageSlot className="avatar-slot sm square" src={`images/lugares/${p.id}.jpg`} compact />
                      <div><strong>{p.name}</strong><span>{p.sub} · {p.bairro}</span></div>
                      <span className="stars-row">{"★".repeat(r.rating)}<i>{"★".repeat(5 - r.rating)}</i></span>
                    </header>
                    <p>{r.text}</p>
                  </article>
                );
              })}
            </div>
          )}

          {tab === "conta" && (
            <div className="account-grid">
              <div className="info-box">
                <h2 className="h2t">Plano atual</h2>
                <p><strong>Onde Sair · Grátis</strong><br />Dicas personalizadas, mapa, favoritos e rolês em grupo.</p>
                <button className="btn-outline">Conhecer o VIP <Icon name="arrow" size={14} /></button>
              </div>
              <div className="save-card">
                <Icon name="sparkle" size={30} fill />
                <div>
                  <h3>3 VIPs disponíveis</h3>
                  <p>Próxima reserva: Mesa 14 · sex, 21h. Mesa garantida e brinde na chegada.</p>
                  <button className="btn-white">Ver reservas</button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="h2-section">
          <SectionHead title="Sugerido pra você" sub="A partir das suas vibes." link="Ver mais" onLink={() => nav("lista")} />
          <div className="tips-grid">
            {PLACES.filter(p => p.affs.some(a => affs.has(a))).slice(0, 6).map(p => (
              <MiniPlaceCard key={p.id} p={p} aff={p.affs.find(a => affs.has(a))} />
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
