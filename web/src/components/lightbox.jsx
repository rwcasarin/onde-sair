// Galeria em tela cheia: foto grande com passadores, legenda (texto, crédito e link) e miniaturas abaixo.
// Teclado (← → Esc), deslizar no celular, zoom ao tocar na foto e tela cheia.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons.jsx";
import { resolveMedia } from "../admin/store.js";
import { safeUrl } from "../photos.js";

export function Lightbox({ photos, index = 0, title = "", onClose, onIndex }) {
  const [i, setI] = useState(index);
  const [zoom, setZoom] = useState(null);           // { x, y } em % quando ampliada
  const root = useRef(null), thumbs = useRef(null), back = useRef(null), touch = useRef(null);
  const n = photos.length, cur = photos[i] || {};
  const go = (d) => { setZoom(null); setI(k => (k + d + n) % n); };
  const pick = (k) => { setZoom(null); setI(k); };

  useEffect(() => { onIndex?.(i); }, [i]); // eslint-disable-line
  // foco, rolagem da página e teclado
  useEffect(() => {
    back.current = document.activeElement;
    document.body.classList.add("lb-lock");
    root.current?.querySelector(".lb-close")?.focus();
    const key = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab") {              // mantém o foco dentro da galeria
        const f = [...root.current.querySelectorAll("button, a[href]")].filter(el => !el.disabled);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.classList.remove("lb-lock");
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      back.current?.focus?.();
    };
  }, []); // eslint-disable-line
  // miniatura ativa sempre visível; carrega antes as vizinhas
  useEffect(() => {
    thumbs.current?.querySelector(".on")?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    [i + 1, i - 1].forEach(k => { const p = photos[(k + n) % n]; if (p) { const im = new Image(); im.src = resolveMedia(p.path); } });
  }, [i]); // eslint-disable-line

  function onTouchStart(e) { if (zoom) return; const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; }
  function onTouchEnd(e) {
    const s = touch.current; touch.current = null;
    if (!s || zoom) return;
    const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onClose();   // puxar para baixo fecha
  }
  const at = (e) => { const r = e.currentTarget.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }; };
  const full = () => { const el = root.current; if (document.fullscreenElement) document.exitFullscreen?.(); else el?.requestFullscreen?.().catch(() => {}); };
  const link = safeUrl(cur.link);

  return createPortal(
    <div className="lb" ref={root} role="dialog" aria-modal="true" aria-label={title ? `Fotos de ${title}` : "Fotos"}>
      <div className="lb-top">
        <span className="lb-count" aria-live="polite">{i + 1} de {n}</span>
        {title && <strong className="lb-title">{title}</strong>}
        <div className="lb-tools">
          {document.fullscreenEnabled && <button type="button" className="lb-btn" onClick={full} aria-label="Tela cheia"><Icon name="expand" size={18} /></button>}
          <button type="button" className="lb-btn lb-close" onClick={onClose} aria-label="Fechar galeria"><Icon name="x" size={20} /></button>
        </div>
      </div>

      <div className="lb-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {n > 1 && <button type="button" className="lb-nav lb-prev" onClick={() => go(-1)} aria-label="Foto anterior"><Icon name="left" size={24} /></button>}
        <figure className="lb-figure">
          <div className={"lb-frame" + (zoom ? " is-zoom" : "")}
            onClick={(e) => setZoom(zoom ? null : at(e))}
            onMouseMove={(e) => zoom && setZoom(at(e))}>
            <img key={cur.path} src={resolveMedia(cur.path)} alt={cur.alt || cur.caption || (title ? `${title} — foto ${i + 1}` : `Foto ${i + 1}`)}
              style={zoom ? { transform: "scale(2.2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} draggable={false} />
          </div>
          {(cur.caption || cur.credit || link) && (
            <figcaption className="lb-caption">
              {cur.caption && <p>{cur.caption}</p>}
              <div className="lb-caption-meta">
                {cur.credit && <span className="lb-credit">{cur.credit}</span>}
                {link && <a className="lb-link" href={link} target="_blank" rel="noopener noreferrer">{cur.linkLabel || "Saiba mais"} <Icon name="arrow" size={14} /></a>}
              </div>
            </figcaption>
          )}
        </figure>
        {n > 1 && <button type="button" className="lb-nav lb-next" onClick={() => go(1)} aria-label="Próxima foto"><Icon name="right" size={24} /></button>}
      </div>

      {n > 1 && (
        <div className="lb-thumbs" ref={thumbs} role="tablist" aria-label="Miniaturas">
          {photos.map((p, k) => (
            <button key={p.path} type="button" role="tab" aria-selected={k === i} className={"lb-thumb" + (k === i ? " on" : "")} onClick={() => pick(k)} aria-label={`Foto ${k + 1}${p.caption ? ": " + p.caption : ""}`}>
              <img src={resolveMedia(p.path)} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
