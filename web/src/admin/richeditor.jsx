// Editor de texto rico (páginas de conteúdo): negrito, itálico, títulos, listas, citação e links.
// O HTML é sempre limpo por sanitizeHtml antes de ir para o rascunho.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AIcon, Btn, Modal, Input, Textarea, Segmented, Field, useAdmin, compressImage } from "./kit.jsx";
import { sanitizeHtml, safeHref, safeImg, htmlToText, figureHtml, embedHtml, placeHtml, asHtml } from "../richtext.js";
import { parseEmbed, mountEmbeds } from "../embeds.js";
import { resolveMedia, setMedia } from "./store.js";

// no editor, imagens e incorporados são blocos fechados (clique para editar)
const embedLabel = (code) => { const e = parseEmbed(code); return e ? `${e.provider} · clique para editar` : "Código incorporado inválido · clique para editar"; };
const plain = (t = "") => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const BLOCKS = [["p", "Parágrafo"], ["h2", "Título"], ["h3", "Subtítulo"], ["blockquote", "Citação"]];
const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// places: lista de lugares que podem virar card no texto (posts do Radar). Sem ela, o botão "Lugar" não aparece.
export function RichEditor({ value, onChange, label = "Conteúdo", error, hint, placeholder = "Escreva o conteúdo da página…", places }) {
  const EDITOR = useMemo(() => ({
    editor: true, resolveImg: resolveMedia, embedLabel,
    placeLabel: (id) => { const p = places?.find(x => x.id === id); return p ? `${p.name} · ${[p.sub, p.bairro].filter(Boolean).join(" · ")}` : "Lugar não encontrado (excluído ou não publicado) · clique para trocar"; },
  }), [places]);
  const el = useRef(null);
  const last = useRef(null);          // último HTML emitido (evita reescrever o editor enquanto digita)
  const saved = useRef(null);         // seleção guardada ao abrir o campo de link
  const [state, setState] = useState({});
  const [link, setLink] = useState(null);   // { url } quando o campo de link está aberto
  const [dialog, setDialog] = useState(null);   // { type: "img" | "embed", data, fig? }
  const closeDialog = useCallback(() => setDialog(null), []);   // estável: a janela não refaz o foco a cada render

  useEffect(() => {
    if (!el.current || value === last.current) return;
    el.current.innerHTML = sanitizeHtml(asHtml(value || ""), EDITOR);
    last.current = value;
  }, [value]);

  // estado dos botões conforme o cursor
  useEffect(() => {
    const upd = () => {
      if (!el.current?.contains(document.getSelection()?.anchorNode)) return;
      const block = (document.queryCommandValue("formatBlock") || "p").toLowerCase();
      const next = {
        bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"), strike: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"), ol: document.queryCommandState("insertOrderedList"),
        block: BLOCKS.some(([b]) => b === block) ? block : "p",
        link: !!closestLink(),
      };
      setState(prev => Object.keys(next).every(k => prev[k] === next[k]) ? prev : next);
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
  function keepSelection() {
    const sel = document.getSelection();
    saved.current = sel.rangeCount && el.current.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
  }
  // insere um bloco (imagem/incorporado) onde estava o cursor, ou no fim
  function insertBlock(html) {
    const sel = document.getSelection();
    el.current.focus();
    if (saved.current) { sel.removeAllRanges(); sel.addRange(saved.current); }
    else { const r = document.createRange(); r.selectNodeContents(el.current); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
    document.execCommand("insertHTML", false, sanitizeHtml(html, EDITOR) + "<p><br></p>");
    emit();
  }
  function replaceFigure(fig, html) {
    const after = fig.nextSibling, parent = fig.parentNode;
    if (html) fig.insertAdjacentHTML("afterend", sanitizeHtml(html, EDITOR));
    fig.remove();
    // cursor logo depois do bloco editado (o próximo bloco inserido entra ali)
    const r = document.createRange();
    if (after && after.parentNode === parent) r.setStartBefore(after); else { r.selectNodeContents(el.current); r.collapse(false); }
    r.collapse(true);
    saved.current = r;
    const sel = document.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    emit();
  }
  function onAreaClick(e) {
    const fig = e.target.closest?.("figure");
    if (!fig || !el.current.contains(fig)) return;
    e.preventDefault();
    if (fig.classList.contains("place")) {
      setDialog({ type: "place", fig, data: { id: fig.getAttribute("data-place") || "" } });
    } else if (fig.classList.contains("embed")) {
      let code = ""; try { code = decodeURIComponent(fig.getAttribute("data-embed") || ""); } catch { /* inválido */ }
      setDialog({ type: "embed", fig, data: { code } });
    } else {
      const img = fig.querySelector("img");
      setDialog({ type: "img", fig, data: { src: img?.getAttribute("data-src") || img?.getAttribute("src") || "", alt: img?.getAttribute("alt") || "", caption: fig.querySelector("figcaption")?.textContent || "", wide: fig.classList.contains("wide") } });
    }
  }
  function saveDialog(html) {
    if (dialog.fig) replaceFigure(dialog.fig, html); else insertBlock(html);
    setDialog(null);
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
          <span className="a-md-sep" />
          <button type="button" title="Inserir imagem" aria-label="Inserir imagem" onMouseDown={(e) => { e.preventDefault(); keepSelection(); }}
            onClick={() => setDialog({ type: "img", data: { src: "", alt: "", caption: "", wide: false } })}><AIcon name="image" size={15} /> Imagem</button>
          <button type="button" title="Incorporar código (vídeo, mapa, post, formulário…)" aria-label="Incorporar código" onMouseDown={(e) => { e.preventDefault(); keepSelection(); }}
            onClick={() => setDialog({ type: "embed", data: { code: "" } })}>&lt;/&gt; Incorporar</button>
          {places && <button type="button" title="Inserir um lugar cadastrado (card com link)" aria-label="Inserir lugar" onMouseDown={(e) => { e.preventDefault(); keepSelection(); }}
            onClick={() => setDialog({ type: "place", data: { id: "" } })}><AIcon name="pin" size={15} /> Lugar</button>}
          <span className="a-md-sep" />
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
          aria-labelledby="rte-label" data-placeholder={placeholder} onInput={emit} onBlur={emit} onPaste={onPaste} onKeyDown={onKeyDown} onClick={onAreaClick} />
      </div>
      {dialog?.type === "img" && <ImageDialog initial={dialog.data} editing={!!dialog.fig} onClose={closeDialog} onSave={saveDialog} onRemove={() => { replaceFigure(dialog.fig, null); setDialog(null); }} />}
      {dialog?.type === "place" && <PlaceDialog places={places || []} initial={dialog.data} editing={!!dialog.fig}
        inPost={[...(el.current?.querySelectorAll("figure.place") || [])].map(f => f.getAttribute("data-place"))}
        onClose={closeDialog} onSave={saveDialog} onRemove={() => { replaceFigure(dialog.fig, null); setDialog(null); }} />}
      {dialog?.type === "embed" && <EmbedDialog initial={dialog.data} editing={!!dialog.fig} onClose={closeDialog} onSave={saveDialog} onRemove={() => { replaceFigure(dialog.fig, null); setDialog(null); }} />}
      {error ? <span className="a-error">{error}</span> : <span className="a-hint">{hint ? hint + " · " : ""}{words} palavra(s) · ~{Math.max(1, Math.round(words / 200))} min de leitura</span>}
    </div>
  );
}

// ---------------------------------------------------------------------
// Janela de imagem: enviar arquivo ou usar um link, texto alternativo, legenda e tamanho
// ---------------------------------------------------------------------
function ImageDialog({ initial, editing, onClose, onSave, onRemove }) {
  const { user, toast } = useAdmin();
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(/^https:/.test(initial.src) ? initial.src : "");
  const file = useRef(null);
  const set = (p) => setD(x => ({ ...x, ...p }));
  const src = safeImg(d.src);

  async function onFile(f) {
    if (!f) return;
    if (!/^image\//.test(f.type)) return toast("Escolha um arquivo de imagem.", "error");
    if (f.size > 15 * 1024 * 1024) return toast("Arquivo acima de 15 MB.", "error");
    setBusy(true);
    try {
      const path = `images/paginas/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.jpg`;
      const ok = await setMedia(path, await compressImage(f), user);
      if (!ok) toast("Sem espaço no armazenamento local — use uma imagem menor.", "error");
      else { set({ src: path }); setUrl(""); }
    } catch (e) { toast(e.status ? `Falha no envio: ${e.message}` : "Não foi possível ler esse arquivo de imagem.", "error"); }
    setBusy(false);
  }
  function save() {
    if (!src) return toast("Envie uma imagem ou cole um link https.", "error");
    if (!d.alt.trim()) return toast("Descreva a imagem no texto alternativo.", "error");
    onSave(figureHtml({ src, alt: d.alt.trim(), caption: d.caption.trim(), wide: d.wide }));
  }

  return (
    <Modal title={editing ? "Editar imagem" : "Inserir imagem"} onClose={onClose}
      footer={<>{editing && <Btn kind="ghost" icon="trash" className="a-danger-text" onClick={onRemove}>Remover</Btn>}<span style={{ flex: 1 }} />
        <Btn onClick={onClose}>Cancelar</Btn><Btn kind="primary" icon="check" disabled={busy} onClick={save}>{editing ? "Salvar" : "Inserir"}</Btn></>}>
      <div className="a-rte-imgpick"
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("over"); }} onDragLeave={(e) => e.currentTarget.classList.remove("over")}
        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("over"); onFile(e.dataTransfer.files[0]); }}>
        {src ? <img src={resolveMedia(src)} alt="" /> : <span className="a-hint">Arraste uma imagem para cá</span>}
        {busy && <span className="a-img-busy">Enviando…</span>}
      </div>
      <div className="a-rte-imgsrc">
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files[0]); e.target.value = ""; }} />
        <Btn icon="upload" onClick={() => file.current?.click()} disabled={busy}>Enviar do computador</Btn>
        <span className="a-hint">ou</span>
        <Input value={url} placeholder="Cole o link da imagem (https://…)" aria-label="Link da imagem" className="a-grow"
          onChange={(v) => { setUrl(v); set({ src: v.trim() }); }} />
      </div>
      <Input label="Texto alternativo" required value={d.alt} onChange={(alt) => set({ alt })} maxCount={140}
        hint="Descreva a imagem para quem usa leitor de tela e para o Google." />
      <Input label="Legenda" value={d.caption} onChange={(caption) => set({ caption })} maxCount={200} hint="Opcional. Aparece embaixo da imagem." />
      <Field label="Tamanho"><Segmented label="Tamanho da imagem" value={d.wide ? "wide" : "normal"} onChange={(v) => set({ wide: v === "wide" })}
        options={[["normal", "Largura do texto"], ["wide", "Larga"]]} /></Field>
    </Modal>
  );
}

// ---------------------------------------------------------------------
// Janela de código incorporado: cola o código (ou o link) e vê a prévia
// ---------------------------------------------------------------------
function EmbedDialog({ initial, editing, onClose, onSave, onRemove }) {
  const { toast } = useAdmin();
  const [code, setCode] = useState(initial.code);
  const box = useRef(null);
  const e = code.trim() ? parseEmbed(code) : null;
  useEffect(() => {
    if (!box.current) return;
    box.current.innerHTML = e ? embedHtml(code.trim()) : "";
    return mountEmbeds(box.current);
  }, [code]); // eslint-disable-line

  return (
    <Modal title={editing ? "Editar código incorporado" : "Incorporar código"} size="lg" onClose={onClose}
      footer={<>{editing && <Btn kind="ghost" icon="trash" className="a-danger-text" onClick={onRemove}>Remover</Btn>}<span style={{ flex: 1 }} />
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn kind="primary" icon="check" onClick={() => e ? onSave(embedHtml(code.trim())) : toast(code.trim() ? "Código grande demais ou inválido." : "Cole o código ou o link.", "error")}>{editing ? "Salvar" : "Inserir"}</Btn></>}>
      <Textarea label="Código ou link" value={code} onChange={setCode} rows={5} spellCheck={false} className="a-code"
        hint="Cole o código de incorporação (YouTube, Spotify, Google Maps, Instagram, TikTok, Google Forms…) ou só o link do vídeo/post." />
      {e && <p className={"a-insta-status " + (e.kind === "player" ? "ok" : "warn")} role="status">
        {e.kind === "player" ? `${e.provider}: será exibido com o player oficial.` : "Código personalizado: roda numa área isolada, sem acesso ao site, aos cookies ou aos dados de quem visita."}
      </p>}
      <span className="a-label">Prévia</span>
      {!e && <p className="a-hint">A prévia aparece aqui.</p>}
      <div className="a-rte-embed-prev rich-text" ref={box} />
    </Modal>
  );
}

// ---------------------------------------------------------------------
// Janela de lugar: busca entre os lugares cadastrados e publicados
// ---------------------------------------------------------------------
function PlaceDialog({ places, initial, editing, inPost, onClose, onSave, onRemove }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(initial.id);
  const list = places.filter(p => !q || plain(`${p.name} ${p.sub} ${p.bairro} ${p.cityName || ""} ${p.type || ""}`).includes(plain(q))).slice(0, 60);
  const choose = (id) => onSave(placeHtml(id));
  return (
    <Modal title={editing ? "Trocar lugar" : "Inserir lugar"} onClose={onClose}
      footer={<>{editing && <Btn kind="ghost" icon="trash" className="a-danger-text" onClick={onRemove}>Remover</Btn>}<span style={{ flex: 1 }} />
        <Btn onClick={onClose}>Cancelar</Btn><Btn kind="primary" icon="check" disabled={!sel} onClick={() => choose(sel)}>{editing ? "Salvar" : "Inserir"}</Btn></>}>
      <p className="a-hint">O lugar aparece no post como um card com foto, informações principais e link para a página dele.</p>
      <Input value={q} onChange={setQ} placeholder="Buscar por nome, bairro, cidade ou tipo…" aria-label="Buscar lugar" autoFocus />
      <ul className="a-place-pick" role="listbox" aria-label="Lugares">
        {list.map(p => (
          <li key={p.id} role="option" aria-selected={sel === p.id} className={sel === p.id ? "on" : ""}
            onClick={() => setSel(p.id)} onDoubleClick={() => choose(p.id)}>
            <strong>{p.name}</strong>
            <em>{[p.sub, p.bairro, p.cityName].filter(Boolean).join(" · ")}</em>
            {inPost.includes(p.id) && p.id !== initial.id && <span className="a-place-pick-tag">já no post</span>}
          </li>
        ))}
        {!list.length && <li className="a-place-pick-empty">Nenhum lugar publicado encontrado.</li>}
      </ul>
    </Modal>
  );
}
