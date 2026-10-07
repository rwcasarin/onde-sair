// Componentes compartilhados do site (v3)
import { AFFINITIES, CITIES, PLACES, VIBE_STYLE, PRICE_RANGE, placeImg, roteiroImg, ROTEIRO_TAGS } from "../data.js";
import { OSLogo, OSIcon } from "./brand.jsx";
import { Icon } from "./icons.jsx";
import { ImageSlot } from "./image-slot.jsx";
import { href, go, toPath } from "../router.js";
import { useNav, useCity, useFaves } from "../nav.js";
import { CitySelect } from "./cityselect.jsx";

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

export const fmtReviews = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",") + "k" : String(n);

export function Rating({ p }) {
  return (
    <span className="rating">
      <Icon name="star" size={14} fill /> {p.rating.toFixed(1).replace(".", ",")} <span>({fmtReviews(p.reviews)})</span>
    </span>
  );
}

export function FaveButton({ id, className = "fave" }) {
  const { faves, toggle } = useFaves();
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
export function PageHead({ crumbs, title, lede, children }) {
  return (
    <section className="page-head">
      <div className="page-head-copy">
        {crumbs && <Crumbs items={crumbs} />}
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
export function ListingCard({ p, badge }) {
  const nav = useNav();
  return (
    <article className="listing-card" onClick={() => nav("detalhe", { id: p.id })}>
      <ImageSlot className="listing-img" src={placeImg(p.id)} alt={p.name} hint="16:10">
        {badge && <span className="listing-badge"><Icon name="cheers" size={13} /> {badge}</span>}
        <FaveButton id={p.id} className="fave fave-float" />
      </ImageSlot>
      <div className="listing-body">
        <div className="listing-title">
          <h3>{p.name}</h3>
          <Rating p={p} />
        </div>
        <span className="listing-sub">{p.sub} <i>•</i> {p.bairro}</span>
        <p>{p.desc.split(".")[0]}.</p>
        <div className="listing-tags">{p.tags.map(t => <Tag key={t}>{t}</Tag>)}</div>
        <div className="listing-foot">
          <strong>{PRICE_RANGE[p.priceLevel]}</strong>
          <PriceDots level={p.priceLevel} />
          <span className="listing-where"><Icon name="pin" size={14} /> {p.bairro}</span>
        </div>
      </div>
    </article>
  );
}

// Card compacto de lugar (home "Dicas para hoje" e "Lugares parecidos")
export function MiniPlaceCard({ p, aff = p.affs[0], showDesc = true }) {
  const nav = useNav();
  return (
    <article className="tip-card" onClick={() => nav("detalhe", { id: p.id })}>
      <ImageSlot className="tip-img" src={placeImg(p.id)} alt={p.name} hint="5:4" />
      <div className="tip-body">
        <VibePill aff={aff} size="sm" />
        <div className="tip-title">
          <h3>{p.name}</h3>
          <FaveButton id={p.id} />
        </div>
        <span className="tip-where"><Icon name="pin" size={13} /> {p.bairro}</span>
        {showDesc && <p>{p.desc.split(".")[0]}.</p>}
      </div>
    </article>
  );
}

// Card de roteiro ("Continue explorando")
export function RoteiroMini({ r }) {
  const nav = useNav();
  return (
    <article className="rot-mini" onClick={() => nav("roteiro", { id: r.id })}>
      <ImageSlot className="rot-mini-img" src={roteiroImg(r.id)} alt="" hint="2:1" />
      <div className="rot-mini-body">
        <h3>{r.title}</h3>
        <div className="rot-mini-tags">
          {(ROTEIRO_TAGS[r.id] || []).map(([t, c]) => <Tag key={t} cls={c}>{t}</Tag>)}
        </div>
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
  const nav = useNav();
  const links = [["Sobre"], ["Histórias", "historias"], ["Para parceiros", "home", { anchor: "parceiros" }], ["Fale com a gente"], ["Trabalhe conosco"]];
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
            {links.map(([l, s, params]) => <a key={l} href={s ? href(toPath(s, params)) : "#"} onClick={(e) => { e.preventDefault(); s && nav(s, params); }}>{l}</a>)}
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
            <a href="#" onClick={(e) => e.preventDefault()}>Termos de uso</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Privacidade</a>
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
