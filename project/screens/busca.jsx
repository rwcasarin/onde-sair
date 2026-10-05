/* global React */
function Busca({ onOpenPlace }) {
  const PL = window.OS_DATA.PLACES;
  const A = window.OS_DATA.AFFINITIES;
  const [q, setQ] = React.useState("");
  const [types, setTypes] = React.useState(new Set());
  const [affs, setAffs] = React.useState(new Set());
  const [price, setPrice] = React.useState(null);
  const [vipOnly, setVipOnly] = React.useState(false);
  const [openNow, setOpenNow] = React.useState(false);
  const [saved, setSaved] = React.useState(new Set());
  const [sort, setSort] = React.useState("curadoria");

  const allTypes = [...new Set(PL.map(p => p.type))];

  function toggle(set, val, setter) {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    setter(next);
  }

  let results = PL.filter(p => {
    if (q && !(p.name + p.bairro + p.type + p.desc).toLowerCase().includes(q.toLowerCase())) return false;
    if (types.size > 0 && !types.has(p.type)) return false;
    if (affs.size > 0 && !p.affs.some(a => affs.has(a))) return false;
    if (price !== null && p.priceLevel !== price) return false;
    if (vipOnly && !p.vip) return false;
    return true;
  });

  if (sort === "rating") results = [...results].sort((a, b) => b.rating - a.rating);
  else if (sort === "preco") results = [...results].sort((a, b) => a.priceLevel - b.priceLevel);

  function toggleSave(id) {
    toggle(saved, id, setSaved);
  }

  function clearAll() {
    setTypes(new Set()); setAffs(new Set()); setPrice(null); setVipOnly(false); setOpenNow(false); setQ("");
  }

  const filterCount = types.size + affs.size + (price !== null ? 1 : 0) + (vipOnly ? 1 : 0) + (openNow ? 1 : 0);

  return (
    <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Eyebrow>Buscar · curadoria</Eyebrow>
      <h1 className="display" style={{ fontSize: 44, margin: "8px 0 24px", letterSpacing: "-0.03em", lineHeight: 1.12 }}>
        O que você está <span className="accent">procurando?</span>
      </h1>

      <div className="search-bar">
        <form onSubmit={(e) => e.preventDefault()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)", marginLeft: -8, marginRight: 4 }}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
          </svg>
          <input
            type="text"
            placeholder="bar com chope no Centro... café tranquilo... jantar romântico..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Buscar</button>
        </form>
      </div>

      <div className="search-layout">
        <aside>
          <div className="row between" style={{ marginBottom: 4 }}>
            <Eyebrow>Filtros{filterCount > 0 ? ` · ${filterCount}` : ""}</Eyebrow>
            {filterCount > 0 && <button onClick={clearAll} className="kicker" style={{ background: "none", border: 0, color: "var(--primary)", cursor: "pointer", fontFamily: "inherit" }}>Limpar tudo</button>}
          </div>

          <div className="filter-group">
            <h5>Afinidade</h5>
            {A.map(a => (
              <label key={a.id} className="filter-check">
                <input type="checkbox" checked={affs.has(a.id)} onChange={() => toggle(affs, a.id, setAffs)} />
                <span>{a.label}</span>
                <span className="count">{a.count}</span>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h5>Tipo</h5>
            {allTypes.map(t => (
              <label key={t} className="filter-check">
                <input type="checkbox" checked={types.has(t)} onChange={() => toggle(types, t, setTypes)} />
                <span>{t}</span>
                <span className="count">{PL.filter(p => p.type === t).length}</span>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h5>Faixa de preço</h5>
            <div className="price-row">
              {[null, 0, 1, 2, 3].map((v, i) => (
                <button
                  key={i}
                  className={"price-btn" + (price === v ? " active" : "")}
                  onClick={() => setPrice(price === v ? null : v)}
                >{v === null ? "Tudo" : v === 0 ? "Grátis" : "$".repeat(v)}</button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h5>Extras</h5>
            <label className="filter-check">
              <input type="checkbox" checked={vipOnly} onChange={() => setVipOnly(!vipOnly)} />
              <span>Apenas VIP</span>
            </label>
            <label className="filter-check">
              <input type="checkbox" checked={openNow} onChange={() => setOpenNow(!openNow)} />
              <span>Aberto agora</span>
            </label>
          </div>
        </aside>

        <section>
          <div className="results-head">
            <span className="kicker mute">{results.length} lugares encontrados</span>
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="curadoria">Ordem da curadoria</option>
              <option value="rating">Melhor avaliados</option>
              <option value="preco">Preço (mais barato)</option>
            </select>
          </div>

          {results.length === 0 && (
            <div style={{ padding: "80px 0", textAlign: "center", color: "var(--muted)" }}>
              <h3 className="display" style={{ fontSize: 26, lineHeight: 1.2 }}>Nada bateu com sua busca.</h3>
              <p>Tente afrouxar um filtro — ou nos diga o que falta.</p>
            </div>
          )}

          {results.map(p => (
            <article key={p.id} className="search-card" onClick={() => onOpenPlace(p.id)}>
              <Placeholder tint={p.tint} label={p.map.label} />
              <div>
                <span className="kicker mute">{p.type} · {p.bairro}</span>
                <h4>{p.name}</h4>
                <p className="desc">{p.desc}</p>
                <div className="row gap-8">
                  {p.affs.slice(0, 2).map(a => {
                    const aff = A.find(x => x.id === a);
                    return <ChipContext key={a} muted>{aff?.label}</ChipContext>;
                  })}
                  <span className="kicker mute">★ {p.rating.toFixed(1)} · {p.reviews}</span>
                </div>
              </div>
              <button
                className={"save" + (saved.has(p.id) ? " on" : "")}
                onClick={(e) => { e.stopPropagation(); toggleSave(p.id); }}
                title="salvar"
              >★</button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

window.Busca = Busca;
