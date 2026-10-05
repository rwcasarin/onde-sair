/* global React */
function Detalhe({ placeId, onOpenPlace }) {
  const PL = window.OS_DATA.PLACES;
  const R = window.OS_DATA.REVIEWS;
  const p = PL.find(x => x.id === placeId) || PL[0];
  const [saved, setSaved] = React.useState(false);

  const related = PL.filter(x => x.id !== p.id && x.affs.some(a => p.affs.includes(a))).slice(0, 3);

  return (
    <main className="shell">
      <section className="detail-hero">
        <div className="crumbs">
          <a href="#" onClick={(e) => { e.preventDefault(); window.OS_NAV("home"); }}>Onde Sair</a>
          <span className="sep">/</span>
          <a href="#" onClick={(e) => { e.preventDefault(); window.OS_NAV("busca"); }}>{p.type}</a>
          <span className="sep">/</span>
          <span>{p.bairro}</span>
        </div>

        <h1 className="detail-title">{p.name}</h1>

        <div className="detail-meta">
          {p.affs.map(a => {
            const aff = window.OS_DATA.AFFINITIES.find(x => x.id === a);
            return <ChipContext key={a}>{aff?.label}</ChipContext>;
          })}
          <ChipType>{p.type}</ChipType>
          <span className="dot"></span>
          <span>★ {p.rating.toFixed(1)} · {p.reviews} avaliações</span>
          <span className="dot"></span>
          <span>{p.priceLevel === 0 ? "Grátis" : "R$".repeat(p.priceLevel)}</span>
          {p.vip && (<><span className="dot"></span><span style={{ color: "#0F6B3E" }}>⬤ VIP disponível</span></>)}
        </div>

        <div className="detail-cover">
          <Placeholder tint={p.tint} label={p.type + " · " + p.bairro} style={{ width: "100%", height: "100%" }} />
        </div>
      </section>

      <section className="detail-grid">
        <div className="detail-body">
          <Eyebrow>A leitura do lugar</Eyebrow>
          <p style={{ margin: "12px 0 24px", fontWeight: 500, fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.015em", color: "var(--ink)" }}>
            {p.desc}
          </p>

          <div className="dica-block">
            <Eyebrow>A dica que importa</Eyebrow>
            <p>"{p.dica}"</p>
            <span className="by">— {p.by}</span>
          </div>

          <p>
            {p.name} entrou pra nossa curadoria depois de três visitas em momentos diferentes — almoço corrido, jantar de quarta, fim de noite de sábado.
            Em todas, o lugar manteve o que importa: atendimento atento sem ser exagerado, ingredientes honestos, conta sem sustos.
          </p>
          <p>
            É um daqueles endereços que funciona pra muita coisa — date sem pressão, jantar com cliente que precisa lembrar do nome, ou uma terça onde só se quer comer bem. Por isso entrou nessas afinidades específicas, e não em outras.
          </p>

          <div style={{ marginTop: 32 }}>
            <Eyebrow>Avaliações de quem foi</Eyebrow>
            {R.map((r, i) => (
              <article key={i} className="review">
                <div className="head">
                  <span className="av">{r.name.split(" ").map(s => s[0]).join("").slice(0, 2)}</span>
                  <span>
                    <div className="name">{r.name}</div>
                    <div className="when">{r.when}</div>
                  </span>
                  <span style={{ marginLeft: "auto", color: "var(--ink)" }}>★ ★ ★ ★ ★</span>
                </div>
                <p>{r.text}</p>
              </article>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 18 }}>Ver todas as avaliações →</button>
          </div>
        </div>

        <aside className="detail-side">
          {p.vip && (
            <div className="book-card">
              <span className="tag-vip solid">VIP disponível</span>
              <h4>Mesa reservada<br />+ brinde de cortesia</h4>
              <p>Pague aqui, chegue como convidado. Cuidamos do resto.</p>
              <div className="row gap-12">
                <button className="btn btn-cta">Quero VIP · R$ 89 →</button>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 24 }}>
            <div className="row gap-12" style={{ marginBottom: 18 }}>
              <button
                className={"btn " + (saved ? "btn-primary" : "btn-ghost")}
                onClick={() => setSaved(s => !s)}
                style={{ flex: 1 }}
              >
                {saved ? "★ Salvo" : "☆ Salvar"}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }}>Compartilhar</button>
            </div>

            <div className="info-row"><span className="label">Tipo</span><span className="val">{p.type}</span></div>
            <div className="info-row"><span className="label">Bairro</span><span className="val">{p.bairro}</span></div>
            <div className="info-row"><span className="label">Funcionamento</span><span className="val">{p.open}</span></div>
            <div className="info-row"><span className="label">Endereço</span><span className="val"><a href="#">{p.end}</a></span></div>
            <div className="info-row"><span className="label">Faixa de preço</span><span className="val">{p.priceLevel === 0 ? "Grátis" : "$".repeat(p.priceLevel) + " · cerca de R$ " + (50 + p.priceLevel * 60) + " p/p"}</span></div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Eyebrow>Está em</Eyebrow>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {window.OS_DATA.ROTEIROS.filter(r => p.affs.includes(r.aff)).slice(0, 2).map(r => (
                <a key={r.id} href="#" onClick={(e) => e.preventDefault()} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                  <span className="kicker mute" style={{ minWidth: 28 }}>0{r.id.slice(1)}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{r.title}</div>
                    <span className="kicker mute">{r.affLabel} · {r.paradas} paradas</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {/* Related */}
      <section className="section">
        <div className="head">
          <div>
            <Eyebrow>Mesma vibe</Eyebrow>
            <h2>Se você gostou daqui</h2>
          </div>
        </div>
        <div className="places-grid">
          {related.map(rp => (
            <PlaceCard key={rp.id} p={rp} onClick={() => onOpenPlace(rp.id)} />
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

window.Detalhe = Detalhe;
