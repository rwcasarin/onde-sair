/* global React */
const { useState, useEffect, useRef } = React;

// ============ Brand mark ============
function Brand({ city = "" }) {
  return (
    <a className="brand" href="#" onClick={(e) => { e.preventDefault(); window.OS_NAV?.("home"); }} aria-label="Onde Sair">
      <span className="brand-logo"><OSLogo /></span>
      {city ? <span className="brand-city">{city}</span> : null}
    </a>
  );
}

function NavLink({ id, current, children }) {
  return (
    <a
      className={"navlink" + (current === id ? " active" : "")}
      href="#"
      onClick={(e) => { e.preventDefault(); window.OS_NAV?.(id); }}
    >{children}</a>
  );
}

function CityPill({ city, onClick }) {
  return (
    <button className="city-pill" onClick={onClick}>
      <span className="dot"></span>
      <span>{city}</span>
      <span className="caret">▾</span>
    </button>
  );
}

function IconBtn({ children, badge, onClick, title }) {
  return (
    <button className="icon-btn" title={title} onClick={onClick}>
      {children}
      {badge ? <span className="badge">{badge}</span> : null}
    </button>
  );
}

function Avatar({ initials = "MA", onClick }) {
  return <button className="avatar" onClick={onClick} aria-label="perfil">{initials}</button>;
}

function TopNav({ current, user, city, unread, onCityClick }) {
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Brand city={city} />
        <nav className="navlinks">
          <NavLink id="home"       current={current}>Descobrir</NavLink>
          <NavLink id="mapa"       current={current}>Mapa</NavLink>
          <NavLink id="busca"      current={current}>Buscar</NavLink>
          <NavLink id="favoritos"  current={current}>Favoritos</NavLink>
        </nav>
        <div className="nav-right">
          <CityPill city={city} onClick={onCityClick} />
          <IconBtn title="Notificações" badge={unread > 0 ? unread : null} onClick={() => window.OS_NAV("notificacoes")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </IconBtn>
          <Avatar initials={user.initials} onClick={() => window.OS_NAV("perfil")} />
        </div>
      </div>
    </header>
  );
}

// ============ Chips ============
// Camada 1 — Contexto (roxo cheio · destaque)
function ChipContext({ active, onClick, children, muted }) {
  const cls = muted
    ? "chip muted" + (active ? " active" : "")
    : "chip" + (active ? " active" : "");
  return <button className={cls} onClick={onClick}>{children}</button>;
}

// Camada 2 — Tipo (outline lavanda · filtro)
function ChipType({ active, onClick, children }) {
  return (
    <button className={"chip-type" + (active ? " active" : "")} onClick={onClick}>
      {children}
    </button>
  );
}

// ============ Affinity grid ============
function AffinityGrid({ selected, onSelect }) {
  const A = window.OS_DATA.AFFINITIES;
  return (
    <div className="aff-grid">
      {A.map((a, i) => (
        <button
          key={a.id}
          className={"aff-cell" + (selected === a.id ? " selected" : "")}
          onClick={() => onSelect(a.id === selected ? null : a.id)}
        >
          <span className="aff-num">0{i + 1}</span>
          <span className="aff-name">{a.label}</span>
          <span className="aff-count">{a.count} lugares</span>
        </button>
      ))}
    </div>
  );
}

// ============ Type rail ============
function TypeRail({ selected, onSelect, items }) {
  const list = items || window.OS_DATA.TYPES;
  return (
    <div className="type-rail">
      {list.map(t => (
        <ChipType key={t.id} active={selected === t.id} onClick={() => onSelect(selected === t.id ? null : t.id)}>
          {t.label}
        </ChipType>
      ))}
    </div>
  );
}

// ============ Placeholders & Cards ============
function Placeholder({ tint, label, style, className }) {
  return (
    <div className={"placeholder ph " + (tint || "") + (className ? " " + className : "")} style={style} aria-label={label || undefined}>
      <span className="ph-mark"><OSIcon /></span>
    </div>
  );
}

function RoteiroCard({ r, onClick }) {
  return (
    <article className="card roteiro interactive" onClick={onClick}>
      <Placeholder tint={r.tint} className="ph" label={r.affLabel} />
      <div className="body">
        <ChipContext>{r.affLabel}</ChipContext>
        <h3>{r.title}</h3>
        <p>{r.desc}</p>
        <div className="meta">
          <span>{r.paradas} paradas</span>
          <span>·</span>
          <span>{r.bairros}</span>
          {r.vip && (<><span>·</span><span className="tag-vip">VIP disponível</span></>)}
        </div>
      </div>
    </article>
  );
}

function PlaceCard({ p, onClick }) {
  return (
    <article className="card place interactive" onClick={onClick}>
      <Placeholder tint={p.tint} className="ph" label={p.type} />
      <div className="body">
        <ChipType>{p.type}</ChipType>
        <h4>{p.name}</h4>
        <p className="sub">{p.bairro} · {p.desc.split(".")[0]}.</p>
      </div>
      <div className="footer">
        <span className="stars">★ {p.rating.toFixed(1)} <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>· {p.reviews}</span></span>
        <span>{p.priceLevel === 0 ? "Grátis" : "R$".repeat(p.priceLevel)}</span>
      </div>
    </article>
  );
}

function Eyebrow({ children }) { return <span className="eyebrow">{children}</span>; }

Object.assign(window, {
  Brand, NavLink, CityPill, IconBtn, Avatar, TopNav,
  ChipContext, ChipType, AffinityGrid, TypeRail,
  Placeholder, RoteiroCard, PlaceCard, Eyebrow,
  // back-compat alias
  Chip: ChipContext,
});
