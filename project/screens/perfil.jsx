/* global React */
function Perfil({ user, onOpenPlace }) {
  const [tab, setTab] = React.useState("historico");
  const A = window.OS_DATA.AFFINITIES;
  const PL = window.OS_DATA.PLACES;

  return (
    <main className="shell" style={{ paddingBottom: 80 }}>
      <section className="profile-head">
        <div>
          <Eyebrow>Membro · {user.joined}</Eyebrow>
          <h1>{user.name}</h1>
          <span className="kicker mute">{user.city} · curadoria personalizada</span>
        </div>
        <div className="row gap-12">
          <button className="btn btn-ghost">Editar perfil</button>
          <button className="btn btn-primary">Convidar amigo</button>
        </div>
      </section>

      <section className="profile-stats">
        <div className="stat"><div className="num">{user.saves}</div><div className="lbl">Salvos</div></div>
        <div className="stat"><div className="num">{user.done}</div><div className="lbl">Já fui</div></div>
        <div className="stat"><div className="num">{user.lists}</div><div className="lbl">Rolês</div></div>
        <div className="stat"><div className="num">8</div><div className="lbl">Avaliações</div></div>
        <div className="stat"><div className="num">3</div><div className="lbl">VIPs usadas</div></div>
      </section>

      <section className="profile-section">
        <h3>Suas afinidades</h3>
        <p className="mute" style={{ marginTop: -8 }}>Calibramos seu feed por essas escolhas. Você pode editar a qualquer momento.</p>
        <div className="affinity-tags" style={{ marginTop: 18 }}>
          {A.map(a => {
            const on = ["dates", "impress", "relax"].includes(a.id);
            return <ChipContext key={a.id} muted active={on}>{a.label}</ChipContext>;
          })}
        </div>
      </section>

      <section className="profile-section">
        <div className="fav-tabs">
          <button className={"fav-tab" + (tab === "historico" ? " active" : "")} onClick={() => setTab("historico")}>Histórico</button>
          <button className={"fav-tab" + (tab === "avaliacoes" ? " active" : "")} onClick={() => setTab("avaliacoes")}>Minhas avaliações</button>
          <button className={"fav-tab" + (tab === "conta" ? " active" : "")} onClick={() => setTab("conta")}>Conta & VIP</button>
        </div>

        {tab === "historico" && (
          <div className="timeline" style={{ marginTop: 24 }}>
            {[
              { when: "ESTA SEMANA", text: "Você foi ao Quintal do Centro · Centro" },
              { when: "8 JUN · DOM",  text: "Salvou o roteiro \"Domingo sem pressa: parque, café e pôr do sol\"" },
              { when: "1 JUN · DOM",  text: "Avaliou Florado Café · 5 estrelas" },
              { when: "29 MAI · QUI", text: "VIP na Casa Komorebi · Mesa pra 2 confirmada" },
              { when: "23 MAI · SEX", text: "Criou o rolê \"Aniversário da Bia\" com 6 lugares" },
              { when: "17 MAI · SÁB", text: "Foi ao Cine Vitória · Sessão das 21h" },
            ].map((e, i) => (
              <div key={i} className="timeline-item">
                <span className="when">{e.when}</span>
                <p>{e.text}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "avaliacoes" && (
          <div style={{ marginTop: 24 }}>
            {[
              { p: PL[0], rating: 5, text: "A dica do pastel de pernil salvou a noite. Voltei na mesma semana." },
              { p: PL[2], rating: 5, text: "Melhor coado da cidade. Brunch de sábado virou ritual da família." },
              { p: PL[7], rating: 4, text: "Bao excelente, soju forte na medida. Cabe pra date." },
            ].map((r, i) => (
              <article key={i} className="review">
                <div className="head">
                  <Placeholder tint={r.p.tint} style={{ width: 48, height: 48, borderRadius: 8 }} label={r.p.map.label} />
                  <div>
                    <div className="name" style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>{r.p.name}</div>
                    <span className="kicker mute">{r.p.type} · {r.p.bairro}</span>
                  </div>
                  <span style={{ marginLeft: "auto" }}>{"★".repeat(r.rating)}<span style={{ color: "var(--line-strong)" }}>{"★".repeat(5 - r.rating)}</span></span>
                </div>
                <p>{r.text}</p>
              </article>
            ))}
          </div>
        )}

        {tab === "conta" && (
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <Eyebrow>Plano atual</Eyebrow>
              <h4 style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.015em", margin: "10px 0 6px" }}>Onde Sair · Grátis</h4>
              <p className="mute" style={{ marginBottom: 18 }}>Feed personalizado, mapa, favoritos, rolês em grupo.</p>
              <button className="btn btn-primary">Conhecer o VIP →</button>
            </div>
            <div className="card" style={{ padding: 24, background: "var(--ink)", color: "#fff" }}>
              <span className="tag-vip solid">3 VIPs disponíveis</span>
              <h4 style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.015em", margin: "14px 0 8px", color: "#fff" }}>Suas reservas VIP</h4>
              <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>Próxima: Mesa 14 · sex, 13 jun · 21h</p>
            </div>
          </div>
        )}
      </section>

      <section className="profile-section">
        <h3>Sugerido pra você</h3>
        <div className="places-grid">
          {PL.slice(2, 5).map(p => <PlaceCard key={p.id} p={p} onClick={() => onOpenPlace(p.id)} />)}
        </div>
      </section>
    </main>
  );
}

window.Perfil = Perfil;
