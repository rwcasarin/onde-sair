// Componentes compartilhados do site (v3)
import { AFFINITIES, CITIES, PLACES, TYPES, VIBE_STYLE, PRICE_RANGE, EVENT_CATEGORIES, placeImg, roteiroImg, eventImg } from "../data.js";
import { isPast, venueName, cardWhen } from "../events.js";
import { OSLogo, OSIcon } from "./brand.jsx";
import { Icon } from "./icons.jsx";
import { ImageSlot } from "./image-slot.jsx";
import { href, go, toPath } from "../router.js";
import { useNav, useCity, useFaves, useAccount } from "../nav.js";
import { CitySelect } from "./cityselect.jsx";
import { MenuLink } from "./ui.jsx";
import { menuItems } from "../menus.js";

export const affById = (id) => AFFINITIES.find(a => a.id === id);
export const placeById = (id) => PLACES.find(p => p.id === id);

// ---------- Pílulas e tags ----------
export function VibePill({ aff, size = "md", onClick, active }) {
  const a = affById(aff);
  const v = VIBE_STYLE[aff];
  if (!a || !v) return null; // vibe desativada no painel
  const Tag = onClick ? "button" : "span";
  return (
    <Tag className={`vibe-pill vibe-pill-${size} ${v.cls}` + (active ? " active" : "")} onClick={onClick}>
      <span className="vibe-pill-icon"><Icon name={v.icon} size={size === "sm" ? 12 : 22} /></span>
      {a.label}
    </Tag>
  );
}

// Pílula livre (ícone + texto + cor)
export function IconPill({ icon, cls = "vibe-lavender", children }) {
  return (
    <span className={"vibe-pill vibe-pill-md " + cls}>
      <span className="vibe-pill-icon"><Icon name={icon} size={20} /></span>
      {children}
    </span>
  );
}

export function Tag({ children, cls = "" }) {
  return <span className={"soft-tag " + cls}>{children}</span>;
}

export function PriceDots({ level }) {
  if (level === 0) return <span className="price-dots">Grátis</span>;
  return (
    <span className="price-dots" aria-label={`Preço nível ${level} de 3`}>
      {"$".repeat(level)}<span className="off">{"$".repeat(3 - level)}</span>
    </span>
  );
}


export function FaveButton({ id, className = "fave" }) {
  const { faves, toggle } = useFaves();
  const { paused } = useAccount();
  if (paused) return null;                       // contas e interações pausadas
  const on = faves.has(id);
  return (
    <button
      className={className + (on ? " on" : "")} aria-label={on ? "Remover dos favoritos" : "Salvar"} aria-pressed={on}
      onClick={(e) => { e.stopPropagation(); toggle(id); }}
    ><Icon name="heart" size={18} fill={on} /></button>
  );
}

// ---------- Cabeçalhos ----------
export function Crumbs({ items }) {
  const nav = useNav();
  return (
    <nav className="crumbs2" aria-label="Você está em">
      {items.map(([label, screen, params], i) => (
        <span key={i}>
          {i > 0 && <Icon name="right" size={12} />}
          {screen
            ? <a href={href(toPath(screen, params))} onClick={(e) => { e.preventDefault(); nav(screen, params); }}>{label}</a>
            : <span aria-current="page">{label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function SectionHead({ title, sub, link, onLink, to }) {
  return (
    <div className="h2-head">
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
      {link && (
        <a href={to ? href(to) : "#"} className="h2-link" onClick={(e) => { e.preventDefault(); to ? (go(to), window.scrollTo(0, 0)) : onLink?.(); }}>
          {link} <Icon name="arrow" size={16} />
        </a>
      )}
    </div>
  );
}

// ---------- Mídia do hero: foto + frase manuscrita + painel geométrico ----------
export function HeroMedia({ img, note, words = ["Mais cultura", "Mais encontros", "Mais histórias"], hint, shape = "curve" }) {
  return (
    <div className={"hero2-media shape-" + shape} aria-hidden="true">
      <ImageSlot className="hero2-photo" src={img} hint={hint}>
        {note && <p className="hero2-note">{note}<span className="hero2-note-line"></span></p>}
      </ImageSlot>
      <div className="hero2-geo">
        <svg className="hero2-geo-shapes" viewBox="0 0 80 340" preserveAspectRatio="none">
          <circle cx="40" cy="38" r="38" fill="var(--c-yellow)" />
          <rect x="0" y="80" width="80" height="90" fill="var(--c-teal)" />
          <polygon points="0,80 80,125 0,170" fill="var(--c-magenta)" />
          <rect x="0" y="170" width="80" height="80" fill="var(--c-yellow)" />
          <polygon points="0,170 80,250 0,250" fill="var(--primary)" />
          <rect x="0" y="250" width="80" height="90" fill="var(--c-magenta)" />
          <path d="M0,340 A80,80 0 0 1 80,260 L80,340 Z" fill="var(--c-yellow)" />
        </svg>
        <div className="hero2-geo-side">
          <svg className="hero2-geo-top" viewBox="0 0 80 80">
            <rect width="80" height="80" fill="var(--c-magenta)" />
            <polygon points="0,0 80,0 80,80" fill="var(--primary)" />
            <polygon points="0,0 40,40 0,80" fill="#fff" />
          </svg>
          <ul className="hero2-geo-words">{words.map(w => <li key={w}>{w}</li>)}</ul>
          <span className="hero2-geo-mark"><OSIcon /></span>
        </div>
      </div>
    </div>
  );
}

// Faixa geométrica pequena (cabeçalhos das telas internas)
export function GeoStrip() {
  return (
    <svg className="geo-strip" viewBox="0 0 240 80" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--c-yellow)" />
      <rect x="80" y="0" width="80" height="80" fill="var(--c-teal)" />
      <polygon points="80,0 160,40 80,80" fill="var(--c-magenta)" />
      <rect x="160" y="0" width="80" height="80" fill="var(--primary)" />
      <path d="M160,80 A80,80 0 0 1 240,0 L240,80 Z" fill="var(--c-yellow)" />
    </svg>
  );
}

// Cabeçalho das telas internas (favoritos, perfil, notificações…)
export function PageHead({ crumbs, back, eyebrow, title, lede, children }) {
  return (
    <section className="page-head">
      <div className="page-head-copy">
        {crumbs && <Crumbs items={crumbs} />}
        {back}
        {eyebrow && <div className="page-head-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {lede && <p className="page-head-lede">{lede}</p>}
        {children}
      </div>
      <GeoStrip />
    </section>
  );
}

// ---------- Cards ----------
// Card de lugar da listagem (3 por linha)
// Etiqueta do tipo de lugar (mesmo estilo das vibes nos cards de roteiro)
export function TypePill({ type }) {
  const t = TYPES.find(x => x.label === type);
  if (!type) return null;
  return <span className={"vibe-pill vibe-pill-sm " + (t?.cls || "vibe-lavender")}><span className="vibe-pill-icon"><Icon name={t?.icon || "pin"} size={12} /></span>{type}</span>;
}

// "Saiba mais" no rodapé dos cards: link de verdade (abre em nova aba com o botão do meio) que navega sem recarregar
export function CardMore({ screen, params, label = "Saiba mais" }) {
  const nav = useNav();
  return (
    <a className="h2-link card-more" href={href(toPath(screen, params))}
      onClick={(e) => { e.stopPropagation(); if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); nav(screen, params); }}>
      {label} <Icon name="arrow" size={16} />
    </a>
  );
}

// Card de lugar — o mesmo em todo o site e no formato do card de roteiro:
// foto 16:10 com favoritar, tipo, nome, bairro, descrição e "Saiba mais" no rodapé
export function PlaceCard({ p }) {
  const nav = useNav();
  const desc = p.tagline || (p.desc ? p.desc.split(".")[0] + "." : "");
  return (
    <article className="rot-index-card place-card" onClick={() => nav("detalhe", { id: p.id })}>
      <ImageSlot className="rot-index-img" src={placeImg(p.id)} alt={p.name} hint="16:10">
        <FaveButton id={p.id} className="fave fave-float" />
      </ImageSlot>
      <div className="rot-index-body">
        {p.type && <div className="rot-index-vibes"><TypePill type={p.type} /></div>}
        <h3>{p.name}</h3>
        {p.bairro && <ul className="rot-index-meta card-sub"><li><Icon name="pin" size={14} /> {p.bairro}</li></ul>}
        {desc && <p>{desc}</p>}
        <div className="card-foot"><CardMore screen="detalhe" params={{ id: p.id }} /></div>
      </div>
    </article>
  );
}
// Etiqueta da categoria de evento (mesmo estilo do tipo de lugar)
export function CategoryPill({ id }) {
  const c = EVENT_CATEGORIES.find(x => x.id === id);
  if (!c) return null;
  return <span className={"vibe-pill vibe-pill-sm " + c.cls}><span className="vibe-pill-icon"><Icon name={c.icon} size={12} /></span>{c.label}</span>;
}

// Card de evento — mesmo formato dos cards de lugar e roteiro, com a data em destaque sobre a foto
export function EventCard({ e }) {
  const nav = useNav();
  const tag = cardWhen(e);
  const where = [venueName(e), e.bairro].filter(Boolean).join(" · ");
  return (
    <article className={"rot-index-card event-card" + (isPast(e) ? " is-past" : "")} onClick={() => nav("evento", { id: e.id })}>
      <ImageSlot className="rot-index-img" src={eventImg(e.id)} alt={e.title} hint="16:10">
        {tag && (
          <span className={"event-date is-" + tag.kind} role="img" aria-label={tag.text} title={tag.text}>
            <em>{tag.kind === "live" && <i aria-hidden="true" />}{tag.top}</em><strong>{tag.day}</strong><em>{tag.month}</em><b>{tag.hour}</b>
          </span>
        )}
        <FaveButton id={e.id} className="fave fave-float" />
      </ImageSlot>
      <div className="rot-index-body">
        {e.category && <div className="rot-index-vibes"><CategoryPill id={e.category} /></div>}
        <h3>{e.title}</h3>
        <ul className="rot-index-meta card-sub card-sub-stack">
          {where && <li><Icon name="pin" size={14} /> {where}</li>}
        </ul>
        {e.tagline && <p>{e.tagline}</p>}
        <div className="card-foot"><CardMore screen="evento" params={{ id: e.id }} /></div>
      </div>
    </article>
  );
}

// nomes antigos (listagem e cards compactos) usam o mesmo card
export const ListingCard = ({ p }) => <PlaceCard p={p} />;
export const MiniPlaceCard = ({ p }) => <PlaceCard p={p} />;

// Card de roteiro — o mesmo em todo o site (lista de roteiros, página do lugar, "Continue explorando", perfil).
// mine: roteiro criado pelo visitante (foto da 1ª parada, abre o roteiro dele); actions: botões extras no rodapé.
export function RoteiroCard({ r, mine = false, actions }) {
  const nav = useNav();
  const vibes = [...new Set([r.aff, ...(r.vibes || [])].filter(Boolean))].slice(0, 2);
  const thumb = mine ? r.steps.find(s => s.place)?.place : null;
  const paradas = r.paradas ?? r.steps?.length ?? 0;
  const open = () => nav(mine ? "meuRoteiro" : "roteiro", { id: r.id });
  return (
    <article className="rot-index-card" onClick={open}>
      <ImageSlot className="rot-index-img" src={mine ? (thumb ? placeImg(thumb) : undefined) : roteiroImg(r.id)} alt="" hint={mine && !thumb ? "Sem foto" : "16:10"} compact={mine}>
        {!mine && <FaveButton id={r.id} className="fave fave-float" />}
        {mine && <span className="rot-index-badge">Meu roteiro</span>}
      </ImageSlot>
      <div className="rot-index-body">
        {vibes.length > 0 && <div className="rot-index-vibes">{vibes.map(a => <VibePill key={a} aff={a} size="sm" />)}</div>}
        <h3>{r.title || "Sem nome"}</h3>
        <ul className="rot-index-meta card-sub">
          <li><Icon name="pin" size={14} /> {paradas} parada{paradas === 1 ? "" : "s"}</li>
          {r.stats?.tempo && <li><Icon name="clock" size={14} /> {r.stats.tempo}</li>}
        </ul>
        {r.desc && <p>{r.desc}</p>}
        {mine && r.from && <span className="my-rot-from">Baseado em “{r.from.title}”</span>}
        <div className="card-foot"><CardMore screen={mine ? "meuRoteiro" : "roteiro"} params={{ id: r.id }} /></div>
        {actions && <div className="my-rot-actions" onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </div>
    </article>
  );
}

// ---------- Mapa ilustrado ----------
// pins: [{ x, y, label?, num?, color?, onClick?, active? }] em % da área
export function MapArt({ pins = [], route = false, park = true, className = "", children }) {
  const pts = pins.map(p => `${p.x},${p.y}`).join(" ");
  return (
    <div className={"map-art " + className}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect width="100" height="100" fill="#F1EEE6" />
        {park && <path d="M30,30 Q45,18 62,28 Q78,40 70,60 Q60,78 40,72 Q22,64 24,46 Q25,36 30,30Z" fill="#CFEBD9" />}
        <g stroke="#fff" strokeWidth="2.2" fill="none">
          <path d="M0,22 L100,30" /><path d="M0,58 Q50,50 100,64" /><path d="M0,86 L100,80" />
          <path d="M18,0 L26,100" /><path d="M54,0 Q48,50 58,100" /><path d="M86,0 L80,100" />
        </g>
        <g stroke="#E4DFD3" strokeWidth="0.8" fill="none">
          <path d="M0,40 L100,44" /><path d="M0,72 L100,70" /><path d="M36,0 L40,100" /><path d="M70,0 L68,100" />
        </g>
        {route && pins.length > 1 && (
          <polyline points={pts} fill="none" stroke="var(--primary)" strokeWidth="0.9" strokeDasharray="2 1.6" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {pins.map((p, i) => (
        <button
          key={i}
          className={"map-art-pin" + (p.active ? " active" : "") + (p.num ? " numbered" : "")}
          style={{ left: p.x + "%", top: p.y + "%", "--pin": p.color || "var(--primary)" }}
          onClick={p.onClick} tabIndex={p.onClick ? 0 : -1} aria-label={p.title || p.label}
        >
          {p.num ? <span className="map-art-num">{p.num}</span> : <Icon name="pin" size={30} fill />}
          {p.label && <span className="map-art-label">{p.label}</span>}
        </button>
      ))}
      {children}
    </div>
  );
}

// ---------- Rodapé ----------
export function Footer() {
  const { id: cityId, name: city, set: setCity } = useCity();
  const social = [["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"], ["spotify", "Spotify"]];
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <span className="site-footer-logo"><OSLogo /></span>
            <span className="site-footer-motto">O lugar certo<br />pra cada vibe.</span>
          </div>
          <nav className="site-footer-links">
            {menuItems("footer").map(({ it, to }) => <MenuLink key={it.id} to={to}>{it.label}</MenuLink>)}
          </nav>
          <div className="site-footer-social">
            {social.map(([icon, label]) => (
              <a key={icon} href="#" aria-label={label} onClick={(e) => e.preventDefault()}><Icon name={icon} size={20} /></a>
            ))}
          </div>
          <CitySelect value={cityId} onChange={setCity} className="site-footer-city" align="right" placement="top" label="Trocar cidade">
            {city || CITIES[0]?.name} <Icon name="chevron" size={14} />
          </CitySelect>
        </div>
        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} Onde Sair. Todos os direitos reservados.</span>
          <span className="site-footer-legal">
            {menuItems("legal").map(({ it, to }) => <MenuLink key={it.id} to={to}>{it.label}</MenuLink>)}
            <a href={href("/admin")} className="site-footer-admin">Área administrativa</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

// Card geométrico "Explorar também é um jeito de viver."
export function GeoCard({ text = ["Explorar", "também", "é um jeito", "de viver."], className = "" }) {
  return (
    <div className={"geo-card " + className} aria-hidden="true">
      <svg viewBox="0 0 140 140" preserveAspectRatio="none">
        <polygon points="0,0 60,0 0,60" fill="var(--c-yellow)" />
        <polygon points="0,60 60,0 60,60" fill="var(--c-magenta)" />
        <rect x="0" y="60" width="60" height="80" fill="var(--c-teal)" />
        <polygon points="0,60 60,140 0,140" fill="var(--primary)" />
        <path d="M60,140 A80,80 0 0 1 140,60 L140,140 Z" fill="var(--c-yellow)" />
      </svg>
      <p>{text.map((t, i) => <span key={i}>{t}<br /></span>)}</p>
    </div>
  );
}
