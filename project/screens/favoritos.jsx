/* global React */
function Favoritos({ onOpenPlace }) {
  const [tab, setTab] = React.useState("listas");
  const LISTS = window.OS_DATA.FAV_LISTS;
  const PL = window.OS_DATA.PLACES;
  const ROT = window.OS_DATA.ROTEIROS;

  return (
    <main className="shell" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <Eyebrow>Meus salvos</Eyebrow>
      <h1 className="display" style={{ fontSize: 50, margin: "8px 0 28px", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: "16ch" }}>
        Onde eu quero <span className="accent">ir</span>.
      </h1>

      <div className="row between" style={{ marginBottom: 18 }}>
        <div className="fav-tabs">
          <button className={"fav-tab" + (tab === "listas" ? " active" : "")} onClick={() => setTab("listas")}>Meus rolês</button>
          <button className={"fav-tab" + (tab === "lugares" ? " active" : "")} onClick={() => setTab("lugares")}>Lugares ({PL.length})</button>
          <button className={"fav-tab" + (tab === "roteiros" ? " active" : "")} onClick={() => setTab("roteiros")}>Roteiros ({ROT.length})</button>
        </div>
        <button className="btn btn-cta btn-sm">+ Novo rolê</button>
      </div>

      {tab === "listas" && (
        <div className="fav-grid">
          {LISTS.map(l => (
            <article key={l.id} className="list-card">
              <div className="list-thumbs">
                <Placeholder tint={l.thumbs[0]} label="" />
                <div className="right">
                  <Placeholder tint={l.thumbs[1]} label="" />
                  <Placeholder tint={l.thumbs[2]} label="" />
                </div>
              </div>
              <div>
                <h4>{l.title}</h4>
                <div className="info">
                  <span>{l.count} lugares</span>
                  <span>{l.when}</span>
                </div>
              </div>
            </article>
          ))}

          <article className="list-card" style={{ borderStyle: "dashed", justifyContent: "center", alignItems: "center", textAlign: "center", minHeight: 280 }}>
            <div style={{ fontWeight: 300, fontSize: 64, color: "var(--ink-3)", lineHeight: 1 }}>+</div>
            <div style={{ fontWeight: 700, fontSize: 22, marginTop: 8, letterSpacing: "-0.015em" }}>Novo rolê</div>
            <span className="kicker mute" style={{ marginTop: 4 }}>Convide até 8 amigos</span>
          </article>
        </div>
      )}

      {tab === "lugares" && (
        <div className="places-grid">
          {PL.slice(0, 6).map(p => <PlaceCard key={p.id} p={p} onClick={() => onOpenPlace(p.id)} />)}
        </div>
      )}

      {tab === "roteiros" && (
        <div className="roteiro-grid">
          {ROT.slice(0, 4).map(r => <RoteiroCard key={r.id} r={r} onClick={() => {}} />)}
        </div>
      )}

      <section style={{ marginTop: 64 }}>
        <Eyebrow>Convide amigos</Eyebrow>
        <h2 className="display" style={{ fontSize: 32, margin: "8px 0 16px", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
          Planejar com gente é melhor.
        </h2>
        <p className="mute" style={{ maxWidth: "56ch", marginBottom: 24 }}>
          Crie um rolê, convide até 8 pessoas, todo mundo salva onde quer ir e o app fecha a melhor combinação de horários.
        </p>
        <button className="btn btn-ghost">Como funciona →</button>
      </section>
    </main>
  );
}

window.Favoritos = Favoritos;
