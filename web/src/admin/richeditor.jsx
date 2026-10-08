// Editor de texto rico (páginas de conteúdo): negrito, itálico, títulos, listas, citação e links.
// O HTML é sempre limpo por sanitizeHtml antes de ir para o rascunho.
import { useEffect, useRef, useState } from "react";
import { AIcon, Btn } from "./kit.jsx";
import { sanitizeHtml, safeHref, htmlToText } from "../richtext.js";

const BLOCKS = [["p", "Parágrafo"], ["h2", "Título"], ["h3", "Subtítulo"], ["blockquote", "Citação"]];
const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function RichEditor({ value, onChange, label = "Conteúdo", error, hint, placeholder = "Escreva o conteúdo da página…" }) {
  const el = useRef(null);
  const last = useRef(null);          // último HTML emitido (evita reescrever o editor enquanto digita)
  const saved = useRef(null);         // seleção guardada ao abrir o campo de link
  const [state, setState] = useState({});
  const [link, setLink] = useState(null);   // { url } quando o campo de link está aberto

  useEffect(() => {
    if (!el.current || value === last.current) return;
    el.current.innerHTML = sanitizeHtml(value || "");
    last.current = value;
  }, [value]);

  // estado dos botões conforme o cursor
  useEffect(() => {
    const upd = () => {
      if (!el.current?.contains(document.getSelection()?.anchorNode)) return;
      const block = (document.queryCommandValue("formatBlock") || "p").toLowerCase();
      setState({
        bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"), strike: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"), ol: document.queryCommandState("insertOrderedList"),
        block: BLOCKS.some(([b]) => b === block) ? block : "p",
        link: !!closestLink(),
      });
    };
    document.addEventListener("selectionchange", upd);
    return () => document.removeEventListener("selectionchange", upd);
  }, []);

  function emit() {
    const html = sanitizeHtml(el.current.innerHTML);
    last.current = html;
    onChange(html);
  }
  function exec(cmd, arg) {
    el.current.focus();
    document.execCommand("defaultParagraphSeparator", false, "p");
    document.execCommand(cmd, false, arg);
    emit();
  }
  function closestLink() {
    let n = document.getSelection()?.anchorNode;
    while (n && n !== el.current) { if (n.nodeName === "A") return n; n = n.parentNode; }
    return null;
  }
  function openLink() {
    const sel = document.getSelection();
    if (!sel.rangeCount || !el.current.contains(sel.anchorNode)) { el.current.focus(); }
    saved.current = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    setLink({ url: closestLink()?.getAttribute("href") || "" });
  }
  function applyLink() {
    let url = link.url.trim();
    if (url && !/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url)) url = (/@/.test(url) && !/\//.test(url) ? "mailto:" : "https://") + url;
    const sel = document.getSelection();
    el.current.focus();
    if (saved.current) { sel.removeAllRanges(); sel.addRange(saved.current); }
    if (!url) document.execCommand("unlink");
    else if (safeHref(url)) {
      if (sel.isCollapsed && !closestLink()) document.execCommand("insertHTML", false, `<a href="${esc(url)}">${esc(url)}</a>`);
      else document.execCommand("createLink", false, url);
    }
    setLink(null); emit();
  }
  function onPaste(e) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    const clean = html ? sanitizeHtml(html) : text.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
    document.execCommand("insertHTML", false, clean);
    emit();
  }
  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); openLink(); }
  }

  const B = ({ cmd, arg, on, icon, title, children }) => (
    <button type="button" className={on ? "on" : ""} title={title} aria-label={title} aria-pressed={on ? "true" : "false"}
      onMouseDown={(e) => e.preventDefault()} onClick={() => exec(cmd, arg)}>{icon ? <AIcon name={icon} size={15} /> : children}</button>
  );
  const words = htmlToText(value || "").split(/\s+/).filter(Boolean).length;

  return (
    <div className="a-field">
      <span className="a-label" id="rte-label">{label}</span>
      <div className={"a-rte" + (error ? " has-error" : "")}>
        <div className="a-md-bar a-rte-bar" role="toolbar" aria-label="Formatação">
          <select className="a-rte-block" aria-label="Estilo do parágrafo" value={state.block || "p"}
            onMouseDown={() => { const s = document.getSelection(); saved.current = s.rangeCount ? s.getRangeAt(0).cloneRange() : null; }}
            onChange={(e) => { const s = document.getSelection(); el.current.focus(); if (saved.current) { s.removeAllRanges(); s.addRange(saved.current); } exec("formatBlock", `<${e.target.value}>`); }}>
            {BLOCKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span className="a-md-sep" />
          <B cmd="bold" on={state.bold} title="Negrito (Ctrl+B)"><b>B</b></B>
          <B cmd="italic" on={state.italic} title="Itálico (Ctrl+I)"><i>I</i></B>
          <B cmd="underline" on={state.underline} title="Sublinhado (Ctrl+U)"><u>U</u></B>
          <B cmd="strikeThrough" on={state.strike} title="Tachado"><s>S</s></B>
          <span className="a-md-sep" />
          <B cmd="insertUnorderedList" on={state.ul} title="Lista com marcadores" icon="list" />
          <B cmd="insertOrderedList" on={state.ol} title="Lista numerada">1.</B>
          <B cmd="insertHorizontalRule" title="Linha divisória">―</B>
          <span className="a-md-sep" />
          <button type="button" className={state.link ? "on" : ""} title="Link (Ctrl+K)" aria-label="Link" onMouseDown={(e) => e.preventDefault()} onClick={openLink}><AIcon name="link" size={15} /></button>
          {state.link && <button type="button" title="Remover link" aria-label="Remover link" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("unlink")}><AIcon name="x" size={15} /></button>}
          <B cmd="removeFormat" title="Limpar formatação">T<sub>x</sub></B>
          <span className="a-md-sep" />
          <B cmd="undo" title="Desfazer (Ctrl+Z)" icon="left" />
          <B cmd="redo" title="Refazer (Ctrl+Shift+Z)" icon="right" />
        </div>
        {link && (
          <div className="a-rte-link">
            <input className="a-input" autoFocus value={link.url} placeholder="https://… , /pagina ou e-mail" aria-label="Endereço do link"
              onChange={(e) => setLink({ url: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } if (e.key === "Escape") setLink(null); }} />
            <Btn kind="primary" size="sm" onClick={applyLink}>Aplicar</Btn>
            <Btn size="sm" onClick={() => setLink(null)}>Cancelar</Btn>
          </div>
        )}
        <div ref={el} className="a-rte-area rich-text" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
          aria-labelledby="rte-label" data-placeholder={placeholder} onInput={emit} onBlur={emit} onPaste={onPaste} onKeyDown={onKeyDown} />
      </div>
      {error ? <span className="a-error">{error}</span> : <span className="a-hint">{hint ? hint + " · " : ""}{words} palavra(s) · ~{Math.max(1, Math.round(words / 200))} min de leitura</span>}
    </div>
  );
}
