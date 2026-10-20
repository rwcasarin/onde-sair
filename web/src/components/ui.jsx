import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AFFINITIES, TYPES, priceLabel } from "../data.js";
import { useNav, useCity } from "../nav.js";
import { CitySelect, singleCity } from "./cityselect.jsx";
import { SearchOverlay, useSearchHotkey } from "./searchbox.jsx";
import { href, toPath, go, onPathChange } from "../router.js";
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
  if (singleCity()) return <div className="city-select is-single"><span className="city-pill"><span>em {name}</span><Icon name="pin" size={16} /></span></div>;
  return (
    <CitySelect value={id} onChange={set} className="city-pill" align="left" label={`Cidade: ${name}. Trocar cidade`}>
      <Icon name="pin" size={16} />
      <span>em {name}</span>
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
  const [searching, setSearching] = useState(false);
  const [menu, setMenu] = useState(false);
  const burger = useRef(null);
  const openSearch = useCallback(() => { setMenu(false); setSearching(true); }, []);
  useSearchHotkey(openSearch);
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Brand />
        <CityPill />
        <nav className="navlinks">
          {menuItems("header").map(({ it, to }) => (
            <MenuLink key={it.id} to={to} className={"navlink" + (isActive(it, current, params) ? " active" : "")}>{it.label}</MenuLink>
          ))}
        </nav>
        <div className="nav-right">
          <IconBtn title="Buscar (/)" onClick={openSearch}><Icon name="search" size={20} /></IconBtn>
          {!paused && <IconBtn title="Favoritos" onClick={() => nav("favoritos")}><Icon name="heart" size={20} /></IconBtn>}
          {user && <IconBtn title="Notificações" badge={unread > 0 ? unread : null} onClick={() => nav("notificacoes")}><Icon name="bell" size={20} /></IconBtn>}
          {user
            ? <button className="nav-avatar" title="Meu perfil" aria-label={"Meu perfil · " + user.name} onClick={() => nav("perfil")}>
                {user.avatar ? <img src={user.avatar} alt="" /> : <span>{(user.name || "?").trim().charAt(0).toUpperCase()}</span>}
              </button>
            : !paused && <button className="btn-enter" onClick={() => nav("entrar")}>Entrar</button>}
          <button ref={burger} type="button" className="nav-burger" aria-label="Abrir menu" aria-expanded={menu} aria-controls="menu-mobile" onClick={() => setMenu(true)}>
            <Icon name="menu" size={24} />
            {user && unread > 0 && <span className="badge" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <SearchOverlay open={searching} onClose={() => setSearching(false)} />
      <MobileMenu open={menu} onClose={() => { setMenu(false); burger.current?.focus(); }} current={current} params={params} user={user} unread={unread} paused={paused} onSearch={openSearch} />
    </header>
  );
}

// Menu do celular e tablet: painel lateral com as seções, a cidade, a busca e a conta
function MobileMenu({ open, onClose, current, params, user, unread, paused, onSearch }) {
  const nav = useNav();
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    panel.current?.querySelector("a, button")?.focus();
    const key = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key === "Tab" && panel.current) {           // o foco fica dentro do menu
        const els = [...panel.current.querySelectorAll("a[href], button:not([disabled]), input")].filter(el => el.offsetParent !== null);
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    document.body.classList.add("menu-lock");
    const off = onPathChange(() => onClose());          // fecha ao navegar
    return () => { document.removeEventListener("keydown", key); document.body.classList.remove("menu-lock"); off(); if (prev && !document.contains(prev)) document.body.focus(); };
  }, [open]); // eslint-disable-line
  const go2 = (screen, p) => () => { onClose(); nav(screen, p); };
  const main = menuItems("header"), more = [...menuItems("footer"), ...menuItems("legal")].filter(x => !main.some(m => m.it.label === x.it.label));
  return createPortal(
    <div className={"mmenu" + (open ? " open" : "")} aria-hidden={!open} inert={open ? undefined : ""}>
      <div className="mmenu-bg" onClick={onClose} />
      <aside className="mmenu-panel" id="menu-mobile" role="dialog" aria-modal="true" aria-label="Menu" ref={panel} onClick={(e) => { if (e.target.closest("a")) setTimeout(onClose, 0); }}>
        <div className="mmenu-head">
          <Brand />
          <button type="button" className="mmenu-close" onClick={onClose} aria-label="Fechar menu"><Icon name="x" size={22} /></button>
        </div>

        <button type="button" className="mmenu-search" onClick={onSearch}>
          <Icon name="search" size={18} /><span>Buscar lugares, eventos, roteiros…</span>
        </button>
        <div className="mmenu-city"><CityPill /></div>

        <nav className="mmenu-main" aria-label="Seções">
          {main.map(({ it, to }) => (
            <MenuLink key={it.id} to={to} className={"mmenu-link" + (isActive(it, current, params) ? " active" : "")} aria-current={isActive(it, current, params) ? "page" : undefined}>
              <span>{it.label}</span><Icon name="arrow" size={18} />
            </MenuLink>
          ))}
        </nav>

        {!paused && (
          <div className="mmenu-account">
            {user ? (
              <>
                <button type="button" className="mmenu-user" onClick={go2("perfil")}>
                  <span className="mmenu-avatar" aria-hidden="true">{user.avatar ? <img src={user.avatar} alt="" /> : <span>{(user.name || "?").trim().charAt(0).toUpperCase()}</span>}</span>
                  <span><strong>{user.name}</strong><em>Meu perfil</em></span>
                </button>
                <div className="mmenu-quick">
                  <button type="button" onClick={go2("perfil", { tab: "favoritos" })}><Icon name="heart" size={18} /> Favoritos</button>
                  <button type="button" onClick={go2("notificacoes")}><Icon name="bell" size={18} /> Notificações{unread > 0 && <em className="mmenu-count">{unread}</em>}</button>
                </div>
              </>
            ) : (
              <>
                <button type="button" className="btn-pill mmenu-enter" onClick={go2("entrar")}>Entrar</button>
                <button type="button" className="btn-enter mmenu-signup" onClick={go2("entrar", { mode: "cadastro" })}>Criar conta</button>
                <button type="button" className="mmenu-fav" onClick={go2("favoritos")}><Icon name="heart" size={18} /> Favoritos</button>
              </>
            )}
          </div>
        )}

        {more.length > 0 && (
          <nav className="mmenu-more" aria-label="Mais links">
            {more.map(({ it, to }) => <MenuLink key={it.id} to={to}>{it.label}</MenuLink>)}
          </nav>
        )}
        <div className="mmenu-geo" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </aside>
    </div>,
    document.body,
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
