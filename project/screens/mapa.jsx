/* global React */
function Mapa({ onOpenPlace }) {
  const PL = window.OS_DATA.PLACES;
  const [active, setActive] = React.useState(PL[0].id);
  const [aff, setAff] = React.useState(null);
  const A = window.OS_DATA.AFFINITIES;

  const filtered = aff ? PL.filter(p => p.affs.includes(aff)) : PL;
  const cur = PL.find(p => p.id === active);

  return (
    <main className="map-wrap">
      <aside className="map-list">
        <div className="map-list-head">
          <Eyebrow>Mapa · curadoria</Eyebrow>
          <h2>{filtered.length} lugares passaram pelo crivo</h2>
          <div className="row gap-8" style={{ marginTop: 14 }}>
            <ChipContext muted active={aff === null} onClick={() => setAff(null)}>Todos</ChipContext>
            {A.slice(0, 4).map(a => (
              <ChipContext key={a.id} muted active={aff === a.id} onClick={() => setAff(aff === a.id ? null : a.id)}>{a.label}</ChipContext>
            ))}
          </div>
        </div>
        {filtered.map(p => (
          <div
            key={p.id}
            className={"map-list-item" + (active === p.id ? " active" : "")}
            onClick={() => setActive(p.id)}
            onDoubleClick={() => onOpenPlace(p.id)}
          >
            <Placeholder tint={p.tint} label={p.map.label} />
            <div>
              <h4>{p.name}</h4>
              <div className="sub">{p.type} · {p.bairro}</div>
            </div>
            <div className="pin">{p.priceLevel === 0 ? "Grátis" : "R$".repeat(p.priceLevel)}</div>
          </div>
        ))}
      </aside>

      <div className="map-canvas">
        {/* fake roads */}
        <svg className="map-roads" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
          <path d="M0,38 Q30,30 60,42 T100,36" fill="none" stroke="rgba(15,15,14,0.10)" strokeWidth="0.6" />
          <path d="M10,0 Q15,30 25,55 T20,100" fill="none" stroke="rgba(15,15,14,0.10)" strokeWidth="0.6" />
          <path d="M70,0 Q60,30 78,55 T82,100" fill="none" stroke="rgba(15,15,14,0.10)" strokeWidth="0.6" />
          <path d="M0,70 Q40,72 70,68 T100,72" fill="none" stroke="rgba(15,15,14,0.10)" strokeWidth="0.6" />
          <circle cx="40" cy="48" r="14" fill="rgba(217,232,222,0.4)" />
          <circle cx="75" cy="65" r="9" fill="rgba(217,232,222,0.4)" />
        </svg>

        {/* overlay top */}
        <div className="map-overlay-top">
          <ChipContext active>Tudo aberto agora</ChipContext>
          <ChipContext muted>A pé · 15 min</ChipContext>
          <ChipContext muted>VIP disponível</ChipContext>
          <ChipContext muted>Para hoje</ChipContext>
        </div>

        {/* pins */}
        {filtered.map(p => (
          <button
            key={p.id}
            className={"map-pin" + (active === p.id ? " active" : "")}
            style={{ left: p.map.x + "%", top: p.map.y + "%" }}
            onClick={() => setActive(p.id)}
            onDoubleClick={() => onOpenPlace(p.id)}
          >
            <span className="label">{p.name}</span>
            <span className="marker">{p.map.label}</span>
          </button>
        ))}

        {/* selected place card */}
        {cur && (
          <div className="map-overlay-card">
            <Placeholder tint={cur.tint} label={cur.map.label} />
            <div>
              <span className="kicker mute">{cur.type} · {cur.bairro}</span>
              <h4>{cur.name}</h4>
              <div className="mute" style={{ fontSize: 13, marginTop: 4 }}>★ {cur.rating.toFixed(1)} · {cur.reviews} avaliações</div>
            </div>
            <button className="icon-btn" title="salvar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button className="btn btn-primary" onClick={() => onOpenPlace(cur.id)}>Abrir →</button>
          </div>
        )}
      </div>
    </main>
  );
}

window.Mapa = Mapa;
