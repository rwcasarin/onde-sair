/* global React */
function Home({ city, onOpenPlace, onOpenRoteiro }) {
  const [aff, setAff] = React.useState(null);
  const [type, setType] = React.useState(null);
  const ROT = window.OS_DATA.ROTEIROS;
  const PL = window.OS_DATA.PLACES;
  const T = window.OS_DATA.TYPES;
  const TAG = window.OS_DATA.TAGLINES;
  const cityName = (window.OS_DATA.CITIES.find(c => c.id === city) || { name: "São Paulo" }).name;

  let roteirosFiltered = ROT;
  if (aff) roteirosFiltered = ROT.filter(r => r.aff === aff);

  let placesFiltered = PL;
  if (aff)  placesFiltered = placesFiltered.filter(p => p.affs.includes(aff));
  if (type) placesFiltered = placesFiltered.filter(p => p.type === T.find(t => t.id === type)?.label);

  return (
    <main className="shell">
      {/* HERO */}
      <section className="hero">
        <Eyebrow>Curadoria por afinidade · {cityName}</Eyebrow>
        <div className="hero-grid">
          <h1>
            {TAG.hero}<br />
            <span className="it">{TAG.heroEm}</span>
          </h1>
          <aside className="hero-side">
            <p className="lede" style={{ margin: 0, maxWidth: "38ch" }}>
              {cityName} tem mais do que você imagina.
              A gente monta um rolê que faz sentido pra você — sem 200 abas abertas, sem perder a noite no Google.
            </p>
            <div className="row gap-12" style={{ marginTop: 24 }}>
              <button className="btn btn-cta btn-lg" onClick={() => onOpenRoteiro(ROT[0].id)}>Quero meu roteiro →</button>
              <button className="btn btn-ghost btn-lg" onClick={() => window.OS_NAV("mapa")}>Ver no mapa</button>
            </div>
            <p className="mute small" style={{ marginTop: 14 }}>Grátis. Sem cadastro pra navegar.</p>
          </aside>
        </div>
        <div className="hero-shapes" aria-hidden="true">
          <span className="s1"></span><span className="s2"></span><span className="s3"></span><span className="s4"></span><span className="s5"></span><span className="s6"></span>
        </div>
      </section>

      {/* AFFINITY GRID — Camada 1 (contexto) */}
      <section className="section tight">
        <div className="head">
          <div>
            <Eyebrow>01 · Comece pela afinidade</Eyebrow>
            <h2>O que <span className="accent">você</span> quer hoje?</h2>
          </div>
          {aff && <button className="btn btn-ghost btn-sm" onClick={() => setAff(null)}>Limpar contexto ✕</button>}
        </div>
        <AffinityGrid selected={aff} onSelect={setAff} />

        {/* Camada 2 — tipo (filtro) */}
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Eyebrow>Filtre por tipo →</Eyebrow>
          <TypeRail selected={type} onSelect={setType} />
        </div>
      </section>

      {/* ROTEIROS */}
      <section className="section">
        <div className="head">
          <div>
            <Eyebrow>Roteiros em destaque</Eyebrow>
            <h2>Escolhidos a dedo,<br />um a um.</h2>
            <p>Não é lista — é curadoria. Cada roteiro tem propósito e ordem.</p>
          </div>
          <button className="btn btn-ghost btn-sm">Ver todos os roteiros →</button>
        </div>
        <div className="roteiro-grid">
          {roteirosFiltered.slice(0, 4).map(r => (
            <RoteiroCard key={r.id} r={r} onClick={() => onOpenRoteiro(r.id)} />
          ))}
        </div>
      </section>

      {/* LUGARES */}
      <section className="section">
        <div className="head">
          <div>
            <Eyebrow>Lugares em destaque</Eyebrow>
            <h2>Endereços que passaram pelo crivo</h2>
            <p>A gente foi, testou e voltou. Cada um aqui ganhou o lugar.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => window.OS_NAV("busca")}>Ver tudo →</button>
        </div>
        <div className="places-grid">
          {placesFiltered.slice(0, 6).map(p => (
            <PlaceCard key={p.id} p={p} onClick={() => onOpenPlace(p.id)} />
          ))}
        </div>
        {placesFiltered.length === 0 && (
          <p className="mute" style={{ textAlign: "center", padding: 32 }}>Nada nesse cruzamento ainda. Tira um filtro pra ver mais.</p>
        )}
      </section>

      {/* AGENDA DO FIM DE SEMANA */}
      <section className="section">
        <div className="head">
          <div>
            <Eyebrow>Agenda · 13–15 de junho</Eyebrow>
            <h2>O fim de semana<br />já está aqui.</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { day: "SEX", date: "13", title: "Cinema de quinta vira sexta no Cine Vitória", time: "21h", price: "R$ 25", tint: "tint-eco" },
            { day: "SÁB", date: "14", title: "Feira do Largo São Bento", time: "9–18h", price: "Grátis", tint: "tint-crianca" },
            { day: "DOM", date: "15", title: "Brunch no Florado Café", time: "10–14h", price: "R$ 55 / pessoa", tint: "tint-relax" },
          ].map((e, i) => (
            <article key={i} className="card interactive" style={{ padding: 24, display: "grid", gridTemplateColumns: "70px 1fr", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRight: "1px solid var(--line)", paddingRight: 14 }}>
                <span className="kicker">{e.day}</span>
                <span className="display" style={{ fontSize: 34, lineHeight: 1.1, marginTop: 4 }}>{e.date}</span>
              </div>
              <div>
                <span className="kicker">{e.time} · {e.price}</span>
                <h4 style={{ fontWeight: 700, fontSize: 18, margin: "6px 0 12px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>{e.title}</h4>
                <button className="btn btn-ghost btn-sm">Ver detalhes →</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* VIP */}
      <section className="section tight">
        <div className="vip">
          <div>
            <span className="tag-vip solid">Experiência VIP</span>
            <h3>Mesa reservada.<br />Brinde na chegada.<br /><span className="accent">No seu ritmo.</span></h3>
            <p>Você paga antecipado, chega como convidado. O parceiro entrega. A partir de R$ 89.</p>
          </div>
          <div className="vip-side">
            <button className="btn btn-cta btn-lg">Quero uma experiência VIP →</button>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section tight">
        <div className="news">
          <Eyebrow>Newsletter</Eyebrow>
          <h3>Recebe o roteiro da semana<br />direto no seu e-mail.</h3>
          <p className="mute" style={{ marginTop: 8 }}>Grátis. Sem enrolação. Só o que vale a pena.</p>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="seu@email.com" />
            <button className="btn btn-primary">Quero receber</button>
          </form>
          <p className="mute small" style={{ marginTop: 18 }}>{cityName} tem mais do que você imagina. A gente te mostra.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="row between" style={{ width: "100%", flexWrap: "wrap", gap: 24 }}>
          <div>
            <span className="footer-logo"><OSLogo /></span>
            <span className="kicker" style={{ color: "rgba(255,255,255,0.7)", display: "block", marginTop: 12 }}>Curadoria por afinidade</span>
          </div>
          <div className="footer-links">
            <a href="#" onClick={(e) => e.preventDefault()}>Roteiros</a><a href="#" onClick={(e) => e.preventDefault()}>Lugares</a><a href="#" onClick={(e) => e.preventDefault()}>Para dates</a><a href="#" onClick={(e) => e.preventDefault()}>Pra impressionar</a><a href="#" onClick={(e) => e.preventDefault()}>VIP</a><a href="#" onClick={(e) => e.preventDefault()}>Para negócios</a>
          </div>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 }}>© 2026 Onde Sair</span>
        </div>
      </div>
    </footer>
  );
}

window.Home = Home;
window.Footer = Footer;
