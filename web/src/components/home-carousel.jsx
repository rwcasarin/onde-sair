// Carrossel de destaques no topo da home (modo "carrossel", cadastro manual no painel)
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons.jsx";
import { ImageSlot } from "./image-slot.jsx";
import { href, go } from "../router.js";
import { slideImg, slideWhen, isExternal, normLink } from "../carousel.js";

const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// etiqueta de data e horário: as mesmas cores e fontes do selo dos cards de eventos, numa linha só
export function SlideDate({ s, className = "" }) {
  const tag = slideWhen(s);
  if (!tag) return null;
  return (
    <span className={"slide-when is-" + tag.kind + (className ? " " + className : "")} role="img" aria-label={tag.text} title={tag.text}>
      <em>{tag.kind === "live" && <i aria-hidden="true" />}{tag.top}</em><strong>{tag.day}</strong><span>{tag.month}</span>{tag.hour && <b>{tag.hour}</b>}
    </span>
  );
}

function SlideLink({ s, className, children, tabIndex }) {
  const url = normLink(s.link);
  if (!url) return null;
  if (isExternal(url)) return <a className={className} href={url} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex}>{children}</a>;
  return (
    <a className={className} href={href(url)} tabIndex={tabIndex}
      onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); go(url); window.scrollTo(0, 0); }}>
      {children}
    </a>
  );
}

export function HomeCarousel({ car, slides }) {
  const [cur, setCur] = useState(0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [stopped, setStopped] = useState(() => reducedMotion());    // pausa pelo botão (opcional) ou movimento reduzido
  const [hidden, setHidden] = useState(false);
  const drag = useRef(null);
  const swiped = useRef(false);
  const n = slides.length;
  const many = n > 1;
  const auto = many && car.autoplay !== false;
  const paused = !auto || stopped || hover || focus || hidden;
  const ms = Math.max(3, +car.interval || 6) * 1000;

  const goTo = (i) => setCur(((i % n) + n) % n);
  useEffect(() => { if (cur >= n) setCur(0); }, [n, cur]);
  useEffect(() => {
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => goTo(cur + 1), ms);
    return () => clearTimeout(t);
  }, [cur, paused, ms, n]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKey = (e) => {
    if (!many) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(cur - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(cur + 1); }
  };
  // arrastar (toque ou mouse) troca de slide
  const down = (e) => { if (many && e.isPrimary) drag.current = { x: e.clientX, y: e.clientY, moved: false }; };
  const up = (e) => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { goTo(cur + (dx < 0 ? 1 : -1)); swiped.current = true; setTimeout(() => { swiped.current = false; }, 50); }
  };

  return (
    <section className={"hcar" + (many ? "" : " is-single")} aria-roledescription="carrossel" aria-label="Destaques"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); }}
      onKeyDown={onKey}>
      <div className="hcar-viewport" onPointerDown={down} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}
        onClickCapture={(e) => { if (swiped.current) { e.preventDefault(); e.stopPropagation(); } }}>
        <div className="hcar-track" style={{ transform: `translateX(-${cur * 100}%)` }} aria-live={paused ? "polite" : "off"}>
          {slides.map((s, i) => {
            const on = i === cur;
            return (
              <article key={s.id} className={"hcar-slide" + (on ? " is-on" : "") + (s.link ? " has-link" : "")}
                aria-roledescription="slide" aria-label={`${i + 1} de ${n}: ${s.title}`} aria-hidden={!on} inert={on ? undefined : ""}>
                <ImageSlot className="hcar-img" src={slideImg(s.id)} alt={s.alt || ""} hint="Imagem do destaque · 1600×900"
                  style={{ "--focus": s.focus === "left" ? "left center" : s.focus === "right" ? "right center" : s.focus || "center" }} />
                <div className="hcar-shade" aria-hidden="true" />
                <div className="hcar-copy">
                  <div className="hcar-meta">
                    <SlideDate s={s} className="hcar-date" />
                    {s.tag && <span className="hcar-tag">{s.tag}</span>}
                  </div>
                  {i === 0 ? <h1 className="hcar-title">{s.title}</h1> : <h2 className="hcar-title">{s.title}</h2>}
                  {s.desc && <p className="hcar-desc">{s.desc}</p>}
                  <SlideLink s={s} className="btn-pill hcar-cta" tabIndex={on ? undefined : -1}>
                    {s.linkLabel || "Saiba mais"} <Icon name={isExternal(normLink(s.link)) ? "ext" : "arrow"} size={16} />
                  </SlideLink>
                </div>
                {s.link && <SlideLink s={s} className="hcar-hit" tabIndex={-1}><span className="sr-only">{s.title}</span></SlideLink>}
              </article>
            );
          })}
        </div>
      </div>

      {many && (
        <div className="hcar-ui">
          <div className="hcar-dots" role="group" aria-label="Escolher destaque">
            {slides.map((s, i) => (
              <button key={s.id} type="button" className={"hcar-dot" + (i === cur ? " on" : "")} aria-label={`Destaque ${i + 1}: ${s.title}`} aria-current={i === cur ? "true" : undefined} onClick={() => goTo(i)}>
                {i === cur && auto && <i key={cur + "-" + stopped} style={{ animationDuration: ms + "ms", animationPlayState: paused ? "paused" : "running" }} />}
              </button>
            ))}
          </div>
          <span className="hcar-count" aria-hidden="true">{String(cur + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
          {auto && car.showPause && (
            <button type="button" className="hcar-btn hcar-pause" onClick={() => setStopped(!stopped)} aria-label={stopped ? "Retomar a troca automática" : "Pausar a troca automática"}>
              <Icon name={stopped ? "play" : "pause"} size={16} />
            </button>
          )}
          <button type="button" className="hcar-btn" onClick={() => goTo(cur - 1)} aria-label="Destaque anterior"><Icon name="left" size={18} /></button>
          <button type="button" className="hcar-btn" onClick={() => goTo(cur + 1)} aria-label="Próximo destaque"><Icon name="right" size={18} /></button>
        </div>
      )}
    </section>
  );
}
