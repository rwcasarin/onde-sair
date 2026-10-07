import { AFFINITIES, TYPES, priceLabel } from "../data.js";
import { useNav } from "../nav.js";
import { href, toPath } from "../router.js";
import { OSLogo, OSIcon } from "./brand.jsx";
import { Icon } from "./icons.jsx";

// ============ Brand mark ============
export function Brand({ city = "" }) {
  const nav = useNav();
  return (
    <a className="brand" href={href("/")} onClick={(e) => { e.preventDefault(); nav("home"); }} aria-label="Onde Sair">
      <span className="brand-logo"><OSLogo /></span>
      {city ? <span className="brand-city">{city}</span> : null}
    </a>
  );
}

export function NavLink({ id, params, active, children }) {
  const nav = useNav();
  return (
    <a
      className={"navlink" + (active ? " active" : "")}
      href={href(toPath(id, params))}
      onClick={(e) => { e.preventDefault(); nav(id, params); }}
    >{children}</a>
  );
}

export function CityPill({ city, onClick }) {
  return (
    <button className="city-pill" onClick={onClick}>
      <Icon name="pin" size={16} />
      <span>{city}</span>
      <Icon name="chevron" size={14} />
    </button>
  );
}

export function IconBtn({ children, badge, onClick, title }) {
  return (
    <button className="icon-btn" title={title} aria-label={title} onClick={onClick}>
      {children}
      {badge ? <span className="badge">{badge}</span> : null}
    </button>
  );
}

const NAV_ITEMS = [
  { label: "Hoje",           id: "home",     active: (c) => c === "home" },
  { label: "Vibes",          id: "home",     params: { anchor: "vibes" }, active: (c, p) => c === "lista" && !!p.aff },
  { label: "Lugares",        id: "lista",    active: (c, p) => (c === "lista" && !p.aff) || c === "detalhe" },
  { label: "Roteiros",       id: "roteiros", active: (c) => c === "roteiros" || c === "roteiro" },
  { label: "Guia da cidade", id: "mapa",     active: (c) => c === "mapa" },
  { label: "Para parceiros", id: "home",     params: { anchor: "parceiros" }, active: () => false },
];

export function TopNav({ current, params = {}, city, unread, user, onCityClick }) {
  const nav = useNav();
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Brand />
        <nav className="navlinks">
          {NAV_ITEMS.map(n => (
            <NavLink key={n.label} id={n.id} params={n.params} active={n.active(current, params)}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="nav-right">
          <CityPill city={city} onClick={onCityClick} />
          <IconBtn title="Buscar" onClick={() => nav("lista")}><Icon name="search" size={20} /></IconBtn>
          <IconBtn title="Favoritos" onClick={() => nav("favoritos")}><Icon name="heart" size={20} /></IconBtn>
          {user && <IconBtn title="Notificações" badge={unread > 0 ? unread : null} onClick={() => nav("notificacoes")}><Icon name="bell" size={20} /></IconBtn>}
          {user
            ? <button className="nav-avatar" title="Meu perfil" aria-label={"Meu perfil · " + user.name} onClick={() => nav("perfil")}>
                {user.avatar ? <img src={user.avatar} alt="" /> : <span>{(user.name || "?").trim().charAt(0).toUpperCase()}</span>}
              </button>
            : <button className="btn-enter" onClick={() => nav("entrar")}>Entrar</button>}
        </div>
      </div>
    </header>
  );
}

// ============ Chips ============
// Camada 1 — Contexto (roxo cheio · destaque)
export function ChipContext({ active, onClick, children, muted }) {
  const cls = (muted ? "chip muted" : "chip") + (active ? " active" : "");
  return <button className={cls} onClick={onClick}>{children}</button>;
}

// Camada 2 — Tipo (outline lavanda · filtro)
export function ChipType({ active, onClick, children }) {
  return (
    <button className={"chip-type" + (active ? " active" : "")} onClick={onClick}>
      {children}
    </button>
  );
}

// ============ Affinity grid ============
export function AffinityGrid({ selected, onSelect }) {
  return (
    <div className="aff-grid">
      {AFFINITIES.map((a, i) => (
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
export function TypeRail({ selected, onSelect, items = TYPES }) {
  return (
    <div className="type-rail">
      {items.map(t => (
        <ChipType key={t.id} active={selected === t.id} onClick={() => onSelect(selected === t.id ? null : t.id)}>
          {t.label}
        </ChipType>
      ))}
    </div>
  );
}

// ============ Placeholders & Cards ============
export function Placeholder({ tint, label, style, className }) {
  return (
    <div className={"placeholder ph " + (tint || "") + (className ? " " + className : "")} style={style} aria-label={label || undefined}>
      <span className="ph-mark"><OSIcon /></span>
    </div>
  );
}

export function RoteiroCard({ r, onClick }) {
  return (
    <article className="card roteiro interactive" onClick={onClick}>
      <Placeholder tint={r.tint} label={r.affLabel} />
      <div className="body">
        <ChipContext>{r.affLabel}</ChipContext>
        <h3>{r.title}</h3>
        <p>{r.desc}</p>
        <div className="meta">
          <span>{r.paradas} paradas</span>
          <span>·</span>
          <span>{r.bairros}</span>
        </div>
      </div>
    </article>
  );
}

export function PlaceCard({ p, onClick }) {
  return (
    <article className="card place interactive" onClick={onClick}>
      <Placeholder tint={p.tint} label={p.type} />
      <div className="body">
        <ChipType>{p.type}</ChipType>
        <h4>{p.name}</h4>
        <p className="sub">{p.bairro} · {p.desc.split(".")[0]}.</p>
      </div>
      <div className="footer">
        <span className="stars">★ {p.rating.toFixed(1)} <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>· {p.reviews}</span></span>
        <span>{priceLabel(p.priceLevel)}</span>
      </div>
    </article>
  );
}

export function Eyebrow({ children }) { return <span className="eyebrow">{children}</span>; }
