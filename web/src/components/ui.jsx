import { AFFINITIES, TYPES, priceLabel } from "../data.js";
import { useNav, useCity } from "../nav.js";
import { CitySelect } from "./cityselect.jsx";
import { href, toPath, go } from "../router.js";
import { menuItems, isActive } from "../menus.js";
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

export function CityPill() {
  const { id, name, set } = useCity();
  return (
    <CitySelect value={id} onChange={set} className="city-pill" align="right" label={`Cidade: ${name}. Trocar cidade`}>
      <Icon name="pin" size={16} />
      <span>{name}</span>
      <Icon name="chevron" size={14} />
    </CitySelect>
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

// Link de um item de menu (tela do site, página de conteúdo ou link externo)
export function MenuLink({ to, className, children, ...rest }) {
  const nav = useNav();
  if (to.external) return <a className={className} href={to.url} {...(to.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>{children}</a>;
  if (to.internal && to.newTab) return <a className={className} href={href(to.path)} target="_blank" rel="noopener" {...rest}>{children}</a>;
  return (
    <a className={className} href={href(to.path)} {...rest}
      onClick={(e) => { e.preventDefault(); if (to.screen) nav(to.screen, to.params || {}); else { go(to.path); window.scrollTo(0, 0); } }}>{children}</a>
  );
}

export function TopNav({ current, params = {}, unread, user, paused }) {
  const nav = useNav();
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Brand />
        <nav className="navlinks">
          {menuItems("header").map(({ it, to }) => (
            <MenuLink key={it.id} to={to} className={"navlink" + (isActive(it, current, params) ? " active" : "")}>{it.label}</MenuLink>
          ))}
        </nav>
        <div className="nav-right">
          <CityPill />
          <IconBtn title="Buscar" onClick={() => nav("lista")}><Icon name="search" size={20} /></IconBtn>
          {!paused && <IconBtn title="Favoritos" onClick={() => nav("favoritos")}><Icon name="heart" size={20} /></IconBtn>}
          {user && <IconBtn title="Notificações" badge={unread > 0 ? unread : null} onClick={() => nav("notificacoes")}><Icon name="bell" size={20} /></IconBtn>}
          {user
            ? <button className="nav-avatar" title="Meu perfil" aria-label={"Meu perfil · " + user.name} onClick={() => nav("perfil")}>
                {user.avatar ? <img src={user.avatar} alt="" /> : <span>{(user.name || "?").trim().charAt(0).toUpperCase()}</span>}
              </button>
            : !paused && <button className="btn-enter" onClick={() => nav("entrar")}>Entrar</button>}
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
        <span>{priceLabel(p.priceLevel)}</span>
      </div>
    </article>
  );
}

export function Eyebrow({ children }) { return <span className="eyebrow">{children}</span>; }
