// Caixa de busca com sugestões (menu, home e página de resultados):
// atalhos, resultados por tipo com o termo destacado, buscas recentes e teclado (↑ ↓ Enter Esc).
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons.jsx";
import { ImageSlot } from "./image-slot.jsx";
import { placeImg, eventImg, roteiroImg, AFFINITIES, VIBE_ORDER } from "../data.js";
import { go, href, vibePath } from "../router.js";
import { search, shortcuts, didYouMean, highlightParts, kindInfo, kindsOn, recentSearches, saveRecent, removeRecent, clearRecent } from "../search.js";

export const searchPath = (q, tab) => "/busca" + (q || tab ? "?" + new URLSearchParams({ ...(q ? { q } : {}), ...(tab && tab !== "tudo" ? { tipo: tab } : {}) }).toString() : "");
export const thumbOf = (d) => d.kind === "place" ? placeImg(d.id) : d.kind === "event" ? eventImg(d.id) : d.kind === "roteiro" ? roteiroImg(d.id) : d.kind === "story" ? d.item.img : "";

export function Hl({ text, toks }) {
  return <>{highlightParts(text, toks).map((p, i) => typeof p === "string" ? <Fragment key={i}>{p}</Fragment> : <mark key={i}>{p.mark}</mark>)}</>;
}

function openPath(path, e) {
  if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return false;
  e?.preventDefault();
  go(path); window.scrollTo(0, 0);
  return true;
}

// lista de opções (a mesma ordem do teclado)
function useOptions(q) {
  return useMemo(() => {
    const t = q.trim();
    if (!t) {
      const recent = recentSearches().map(r => ({ type: "recent", label: r, path: searchPath(r) }));
      const vibes = VIBE_ORDER.slice(0, 6).map(id => AFFINITIES.find(a => a.id === id)).filter(Boolean).map(a => ({ type: "vibe", label: a.label, path: vibePath(a.id), aff: a.id }));
      return { groups: [["Buscas recentes", recent], ["Explore por vibe", vibes]].filter(([, l]) => l.length), total: 0, toks: [] };
    }
    const { results, tokens: toks } = search(t);
    const sc = shortcuts(t, 4).map(s => ({ type: "shortcut", ...s }));
    const groups = [["Atalhos", sc]];
    kindsOn().forEach(k => {
      const list = results.filter(r => r.kind === k.kind).slice(0, k.kind === "place" ? 4 : 3).map(d => ({ type: "doc", d, label: d.title, path: d.path }));
      if (list.length) groups.push([k.label, list]);
    });
    return { groups: groups.filter(([, l]) => l.length), total: results.length, toks };
  }, [q]);
}

export function SearchBox({ value = "", onSubmit, autoFocus, variant = "hero", placeholder = "Busque por lugares, eventos, roteiros, bairros…", children, onNavigate, label = "Buscar no site" }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(!!autoFocus);
  const [active, setActive] = useState(-1);
  const [, bump] = useState(0);
  const box = useRef(null), input = useRef(null), list = useRef(null);
  const id = useId();
  useEffect(() => setQ(value), [value]);
  const { groups, total, toks } = useOptions(q);
  const flat = groups.flatMap(([, l]) => l);
  const hasMore = q.trim() && total > 0;
  const count = flat.length + (hasMore ? 1 : 0);
  useEffect(() => setActive(-1), [q]);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  useEffect(() => { list.current?.querySelector(".sb-opt.on")?.scrollIntoView({ block: "nearest" }); }, [active]);

  function submit(text = q) {
    const v = text.trim();
    setOpen(false);
    if (v) saveRecent(v);
    onNavigate?.();
    if (onSubmit) onSubmit(v); else { go(searchPath(v)); window.scrollTo(0, 0); }
  }
  function pick(o, e) {
    if (o.type === "recent") { setQ(o.label); return submit(o.label); }
    if (q.trim()) saveRecent(q.trim());
    setOpen(false); onNavigate?.();
    openPath(o.path, e);
  }
  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive(a => (a + 1) % Math.max(count, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => (a <= 0 ? count - 1 : a - 1)); }
    else if (e.key === "Escape") { if (open && (q || active >= 0)) { e.stopPropagation(); setOpen(false); setActive(-1); } }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < flat.length) pick(flat[active]);
      else submit();
    }
  }

  let n = -1;
  const optId = (i) => `${id}-o${i}`;
  const show = open && (groups.length > 0 || q.trim());
  return (
    <div className={"sb sb-" + variant + (show ? " is-open" : "")} ref={box}>
      <form className={variant === "hero" ? "hero2-search sb-form" : "sb-form"} role="search" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Icon name="search" size={variant === "hero" ? 22 : 20} />
        <input ref={input} type="search" value={q} autoFocus={autoFocus} placeholder={placeholder} aria-label={label}
          role="combobox" aria-expanded={!!show} aria-controls={id} aria-autocomplete="list" aria-activedescendant={active >= 0 ? optId(active) : undefined}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey} autoComplete="off" enterKeyHint="search" />
        {q && <button type="button" className="sb-clear" aria-label="Limpar busca" onClick={() => { setQ(""); input.current?.focus(); setOpen(true); }}><Icon name="x" size={16} /></button>}
        {children}
        <button type="submit" className="btn-pill">Buscar</button>
      </form>

      {show && (
        <div className="sb-pop" ref={list} id={id} role="listbox" aria-label="Sugestões">
          {groups.map(([title, items]) => (
            <div className="sb-group" key={title} role="group" aria-label={title}>
              <div className="sb-group-head">
                <span>{title}</span>
                {title === "Buscas recentes" && <button type="button" className="link-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => { clearRecent(); bump(x => x + 1); }}>Limpar</button>}
              </div>
              <div className={title === "Explore por vibe" ? "sb-chips" : undefined}>
                {items.map(o => {
                  n++; const i = n;
                  const common = { id: optId(i), role: "option", "aria-selected": active === i, className: "sb-opt sb-" + o.type + (active === i ? " on" : ""),
                    onMouseEnter: () => setActive(i), onMouseDown: (e) => e.preventDefault() };
                  if (o.type === "recent") return (
                    <div key={"r" + o.label} {...common} onClick={() => pick(o)}>
                      <Icon name="clock" size={16} /><span className="sb-label">{o.label}</span>
                      <button type="button" className="sb-x" aria-label={"Remover " + o.label} onClick={(e) => { e.stopPropagation(); removeRecent(o.label); bump(x => x + 1); }}><Icon name="x" size={14} /></button>
                    </div>
                  );
                  if (o.type === "vibe") return <a key={o.aff} href={href(o.path)} {...common} onClick={(e) => pick(o, e)}>{o.label}</a>;
                  if (o.type === "shortcut") return (
                    <a key={o.kind + o.label} href={href(o.path)} {...common} onClick={(e) => pick(o, e)}>
                      <span className="sb-ico"><Icon name={o.icon} size={16} /></span>
                      <span className="sb-text"><strong><Hl text={o.label} toks={toks} /></strong><em>{o.kind}</em></span>
                      <Icon name="arrow" size={14} />
                    </a>
                  );
                  const d = o.d, k = kindInfo(d.kind);
                  return (
                    <a key={d.kind + d.id} href={href(d.path)} {...common} onClick={(e) => pick(o, e)}>
                      {d.kind === "page" ? <span className="sb-ico"><Icon name="list" size={16} /></span> : <ImageSlot className="sb-thumb" src={thumbOf(d)} compact />}
                      <span className="sb-text"><strong><Hl text={d.title} toks={toks} /></strong><em>{[k.one[0].toUpperCase() + k.one.slice(1), d.sub].filter(Boolean).join(" · ")}{d.past ? " · encerrado" : ""}</em></span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
          {q.trim() && !total && !groups.length && (() => { const dym = didYouMean(q); return (
            <p className="sb-empty">Nada encontrado para “{q.trim()}”.{" "}
              {dym ? <>Você quis dizer <button type="button" className="link-btn strong" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(dym); input.current?.focus(); }}>{dym}</button>?</>
                : <>Tente outra palavra ou veja <a href={href("/lugares")} onClick={(e) => { setOpen(false); onNavigate?.(); openPath("/lugares", e); }}>todos os lugares</a>.</>}
            </p>
          ); })()}
          {hasMore && (() => { n++; const i = n; return (
            <a id={optId(i)} role="option" aria-selected={active === i} href={href(searchPath(q.trim()))} className={"sb-opt sb-all" + (active === i ? " on" : "")}
              onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); submit(); }}>
              Ver todos os {total} resultado{total === 1 ? "" : "s"} para “{q.trim()}” <Icon name="arrow" size={14} />
            </a>
          ); })()}
        </div>
      )}
    </div>
  );
}

// Busca do menu: abre por cima da página (ícone da lupa, "/" ou Ctrl+K)
export function SearchOverlay({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    document.body.classList.add("search-lock");
    return () => { document.removeEventListener("keydown", esc); document.body.classList.remove("search-lock"); };
  }, [open]); // eslint-disable-line
  if (!open) return null;
  return createPortal(
    <div className="sb-modal" role="dialog" aria-modal="true" aria-label="Buscar no site">
      <div className="sb-modal-bg" onClick={onClose} />
      <div className="sb-modal-panel">
        <div className="sb-modal-top">
          <span className="sb-modal-title">O que você procura?</span>
          <button type="button" className="sb-modal-close" onClick={onClose} aria-label="Fechar busca"><Icon name="x" size={20} /></button>
        </div>
        <SearchBox variant="overlay" autoFocus onNavigate={onClose} />
        <p className="sb-modal-hint"><kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Enter</kbd> abrir · <kbd>Esc</kbd> fechar</p>
      </div>
    </div>,
    document.body,
  );
}

// atalhos de teclado para abrir a busca: "/" fora de campos de texto, ou Ctrl/⌘ + K
export function useSearchHotkey(openFn) {
  useEffect(() => {
    const on = (e) => {
      const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openFn(); }
      else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); openFn(); }
    };
    document.addEventListener("keydown", on);
    return () => document.removeEventListener("keydown", on);
  }, [openFn]);
}
