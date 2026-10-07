// Onde Sair · CMS — kit de componentes do painel
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { STATUS, setMedia, removeMedia, getDB } from "./store.js";

// ---------------------------------------------------------------------
// Contexto do painel: usuário, navegação, toasts, confirmação
// ---------------------------------------------------------------------
export const AdminCtx = createContext(null);
export const useAdmin = () => useContext(AdminCtx);

// ---------------------------------------------------------------------
// Ícones extras do painel
// ---------------------------------------------------------------------
const EXTRA = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  route:     <><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></>,
  file:      <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4M10 13h6M10 17h6M8 9h2" /></>,
  palette:   <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.96 6.01 17.46 2 12 2Z" /></>,
  layout:    <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
  chat:      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  shield:    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  settings:  <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  globe:     <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" /></>,
  plus:      <path d="M12 5v14M5 12h14" />,
  edit:      <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  trash:     <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  copy:      <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  upload:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>,
  logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  lock:      <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  mail:      <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  eyeoff:    <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" /></>,
  up:        <path d="m18 15-6-6-6 6" />,
  down:      <path d="m6 9 6 6 6-6" />,
  grip:      <><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></>,
  ext:       <><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  alert:     <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4M12 17h.01" /></>,
  info:      <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
  menu:      <path d="M4 6h16M4 12h16M4 18h16" />,
  filter:    <path d="M22 3H2l8 9.46V19l4 2v-8.54Z" />,
  send2:     <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  ban:       <><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></>,
  flag:      <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></>,
  download:  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
  refresh:   <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>,
};
export function AIcon({ name, size = 18, ...rest }) {
  if (!EXTRA[name]) return <Icon name={name} size={size} {...rest} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>{EXTRA[name]}</svg>
  );
}

// ---------------------------------------------------------------------
// Botões e badges
// ---------------------------------------------------------------------
export function Btn({ kind = "secondary", size, icon, children, className = "", ...rest }) {
  return (
    <button type="button" className={`a-btn a-btn-${kind}` + (size ? ` a-btn-${size}` : "") + (!children ? " a-btn-icon" : "") + (className ? " " + className : "")} {...rest}>
      {icon && <AIcon name={icon} size={size === "sm" ? 15 : 17} />}
      {children}
    </button>
  );
}

export function StatusBadge({ status, publishAt }) {
  const s = STATUS[status] || { label: status, tone: "gray" };
  return <span className={"a-badge tone-" + s.tone} title={status === "agendado" && publishAt ? new Date(publishAt).toLocaleString("pt-BR") : undefined}><i />{s.label}</span>;
}
export function Badge({ tone = "gray", children }) { return <span className={"a-badge tone-" + tone}><i />{children}</span>; }

// ---------------------------------------------------------------------
// Estrutura de página
// ---------------------------------------------------------------------
export function PageHeader({ title, subtitle, crumbs, actions, children }) {
  const { go } = useAdmin();
  return (
    <header className="a-page-head">
      <div>
        {crumbs && (
          <nav className="a-crumbs" aria-label="Você está em">
            {crumbs.map(([label, path], i) => (
              <span key={i}>{i > 0 && <AIcon name="right" size={12} />}{path ? <a href={"#" + path} onClick={(e) => { e.preventDefault(); go(path); }}>{label}</a> : <span aria-current="page">{label}</span>}</span>
            ))}
          </nav>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="a-page-actions">{actions}</div>}
    </header>
  );
}

export function Card({ title, subtitle, actions, children, className = "", pad = true }) {
  return (
    <section className={"a-card" + (pad ? "" : " no-pad") + (className ? " " + className : "")}>
      {(title || actions) && (
        <header className="a-card-head">
          <div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>
          {actions && <div className="a-card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Empty({ icon = "info", title, text, action }) {
  return (
    <div className="a-empty">
      <span className="a-empty-icon"><AIcon name={icon} size={24} /></span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="a-tabs" role="tablist">
      {tabs.map(([id, label, badge]) => (
        <button key={id} role="tab" type="button" aria-selected={value === id} className={value === id ? "on" : ""} onClick={() => onChange(id)}>
          {label}{badge != null && badge !== 0 && <span className="a-tab-badge">{badge}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Formulários
// ---------------------------------------------------------------------
let fid = 0;
const useFieldId = () => useMemo(() => "f" + (++fid), []);

export function Field({ label, hint, error, required, counter, children, className = "", inline }) {
  const id = useFieldId();
  const child = typeof children === "function" ? children(id) : children;
  return (
    <div className={"a-field" + (error ? " has-error" : "") + (inline ? " inline" : "") + (className ? " " + className : "")}>
      {label && (
        <label htmlFor={id} className="a-label">
          {label}{required && <span className="a-req" aria-hidden="true">*</span>}
          {counter && <span className={"a-counter" + (counter.value > counter.max ? " over" : "")}>{counter.value}/{counter.max}</span>}
        </label>
      )}
      {child}
      {error ? <span className="a-error" role="alert"><AIcon name="alert" size={13} /> {error}</span> : hint ? <span className="a-hint">{hint}</span> : null}
    </div>
  );
}

export function Input({ label, hint, error, required, maxCount, value, onChange, className, prefix, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}
      counter={maxCount ? { value: (value || "").length, max: maxCount } : null}>
      {(id) => (
        <div className={"a-input-wrap" + (prefix ? " has-prefix" : "")}>
          {prefix && <span className="a-prefix">{prefix}</span>}
          <input id={id} className="a-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} {...rest} />
        </div>
      )}
    </Field>
  );
}

export function Textarea({ label, hint, error, required, maxCount, value, onChange, rows = 4, className, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}
      counter={maxCount ? { value: (value || "").length, max: maxCount } : null}>
      {(id) => <textarea id={id} className="a-input a-textarea" rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} {...rest} />}
    </Field>
  );
}

export function Select({ label, hint, error, required, value, onChange, options, className, placeholder, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(id) => (
        <div className="a-select">
          <select id={id} className="a-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
          </select>
          <AIcon name="chevron" size={16} />
        </div>
      )}
    </Field>
  );
}

export function Toggle({ label, hint, checked, onChange, disabled }) {
  return (
    <label className={"a-toggle" + (disabled ? " disabled" : "")}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span className="a-toggle-track"><span /></span>
      <span className="a-toggle-text"><strong>{label}</strong>{hint && <em>{hint}</em>}</span>
    </label>
  );
}

export function Check({ checked, onChange, label, indeterminate, ...rest }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <label className="a-check">
      <input ref={ref} type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="a-seg" role="radiogroup" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

// Campo de tags: Enter ou vírgula adiciona
export function ChipInput({ label, hint, value = [], onChange, placeholder = "Digite e tecle Enter", suggestions = [] }) {
  const [text, setText] = useState("");
  function add(t) {
    const v = t.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setText("");
  }
  const sugg = suggestions.filter(s => !value.includes(s) && s.toLowerCase().includes(text.toLowerCase())).slice(0, 6);
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div>
          <div className="a-chips-input" onClick={() => document.getElementById(id)?.focus()}>
            {value.map(t => (
              <span key={t} className="a-chip">{t}<button type="button" aria-label={`Remover ${t}`} onClick={() => onChange(value.filter(x => x !== t))}><AIcon name="x" size={12} /></button></span>
            ))}
            <input id={id} value={text} placeholder={value.length ? "" : placeholder}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === ",") && text.trim()) { e.preventDefault(); add(text); }
                if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
              }} />
          </div>
          {text && sugg.length > 0 && (
            <div className="a-sugg">{sugg.map(s => <button key={s} type="button" onClick={() => add(s)}>{s}</button>)}</div>
          )}
        </div>
      )}
    </Field>
  );
}

// Seleção múltipla em pílulas
export function PillPicker({ label, hint, options, value = [], onChange, error }) {
  return (
    <Field label={label} hint={hint} error={error}>
      <div className="a-pills" role="group" aria-label={label}>
        {options.map(([v, l, cls]) => {
          const on = value.includes(v);
          return (
            <button key={v} type="button" aria-pressed={on} className={"a-pill " + (cls || "") + (on ? " on" : "")}
              onClick={() => onChange(on ? value.filter(x => x !== v) : [...value, v])}>
              {on && <AIcon name="check" size={13} />}{l}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

// Lista reordenável (motivos, paradas, destaques…)
export function Repeater({ items, onChange, render, newItem, addLabel = "Adicionar", max, min = 0 }) {
  function move(i, d) {
    const n = [...items]; const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]]; onChange(n);
  }
  return (
    <div className="a-repeater">
      {items.map((it, i) => (
        <div key={i} className="a-rep-row">
          <span className="a-rep-num">{i + 1}</span>
          <div className="a-rep-body">{render(it, (patch) => onChange(items.map((x, k) => k === i ? (typeof patch === "function" ? patch(x) : { ...x, ...patch }) : x)), i)}</div>
          <div className="a-rep-tools">
            <button type="button" aria-label="Mover para cima" disabled={i === 0} onClick={() => move(i, -1)}><AIcon name="up" size={15} /></button>
            <button type="button" aria-label="Mover para baixo" disabled={i === items.length - 1} onClick={() => move(i, 1)}><AIcon name="down" size={15} /></button>
            <button type="button" aria-label="Remover" disabled={items.length <= min} onClick={() => onChange(items.filter((_, k) => k !== i))}><AIcon name="trash" size={15} /></button>
          </div>
        </div>
      ))}
      {(!max || items.length < max) && (
        <Btn kind="ghost" size="sm" icon="plus" onClick={() => onChange([...items, newItem()])}>{addLabel}</Btn>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Imagem: prévia + envio (comprimido) + remoção
// ---------------------------------------------------------------------
export function compressImage(file, max = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("tipo"));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("leitura")); };
    img.src = url;
  });
}

export function ImageField({ label, path, hint, ratio = "16 / 10", compact }) {
  const { user, toast } = useAdmin();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const uploaded = !!getDB().media[path];
  async function onFile(f) {
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) return toast("Arquivo acima de 15 MB.", "error");
    setBusy(true);
    try {
      const data = await compressImage(f);
      const ok = await setMedia(path, data, user);
      toast(ok ? "Imagem enviada." : "Sem espaço no armazenamento local — use uma imagem menor.", ok ? "success" : "error");
    } catch (e) { toast(e.status ? `Falha no envio: ${e.message}` : "Não foi possível ler esse arquivo de imagem.", "error"); }
    setBusy(false);
  }
  return (
    <div className={"a-imgfield" + (compact ? " compact" : "")}>
      {label && <span className="a-label">{label}</span>}
      <div
        className="a-img-drop" style={{ aspectRatio: ratio }}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("over"); }}
        onDragLeave={(e) => e.currentTarget.classList.remove("over")}
        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("over"); onFile(e.dataTransfer.files[0]); }}
      >
        <ImageSlot key={path + uploaded} src={path} hint={hint} compact={compact} />
        {busy && <span className="a-img-busy">Enviando…</span>}
      </div>
      <div className="a-img-actions">
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files[0]); e.target.value = ""; }} />
        <Btn size="sm" icon="upload" onClick={() => input.current?.click()}>{uploaded ? "Trocar" : "Enviar"}</Btn>
        {uploaded && <Btn size="sm" kind="ghost" icon="trash" onClick={async () => { try { await removeMedia(path, user); toast("Imagem removida."); } catch (e) { toast(e.message, "error"); } }} aria-label="Remover imagem" />}
        {!compact && <code title={path}>{path}</code>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tabela de dados: seleção, ordenação, paginação e ações em lote
// ---------------------------------------------------------------------
export function DataTable({ columns, rows, getId = (r) => r.id, onRowClick, bulkActions, pageSize = 10, empty, initialSort }) {
  const [sel, setSel] = useState(new Set());
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find(c => c.key === sort.key);
    const get = col.sortValue || ((r) => r[sort.key]);
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), "pt-BR");
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const visible = sorted.slice(cur * pageSize, cur * pageSize + pageSize);
  const ids = rows.map(getId);
  const selIds = [...sel].filter(id => ids.includes(id));
  const allOnPage = visible.length > 0 && visible.every(r => sel.has(getId(r)));

  function toggleAll(v) {
    const n = new Set(sel);
    visible.forEach(r => v ? n.add(getId(r)) : n.delete(getId(r)));
    setSel(n);
  }

  return (
    <div className="a-table-wrap">
      {bulkActions && selIds.length > 0 && (
        <div className="a-bulk" role="region" aria-label="Ações em lote">
          <strong>{selIds.length} selecionado(s)</strong>
          {bulkActions.map(b => <Btn key={b.label} size="sm" kind={b.kind || "secondary"} icon={b.icon} onClick={() => { b.run(selIds); setSel(new Set()); }}>{b.label}</Btn>)}
          <button type="button" className="a-link" onClick={() => setSel(new Set())}>Limpar seleção</button>
        </div>
      )}
      <div className="a-table-scroll">
        <table className="a-table">
          <thead>
            <tr>
              {bulkActions && <th className="a-col-check"><Check checked={allOnPage} indeterminate={!allOnPage && visible.some(r => sel.has(getId(r)))} onChange={toggleAll} aria-label="Selecionar todos" /></th>}
              {columns.map(c => (
                <th key={c.key} style={{ width: c.width }} className={c.align ? "a-" + c.align : ""}
                  aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                  {c.sortable !== false && c.label ? (
                    <button type="button" className="a-th-sort" onClick={() => setSort(s => ({ key: c.key, dir: s?.key === c.key && s.dir === "asc" ? "desc" : "asc" }))}>
                      {c.label}<AIcon name={sort?.key === c.key && sort.dir === "desc" ? "down" : "up"} size={12} className={sort?.key === c.key ? "on" : ""} />
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(r => {
              const id = getId(r);
              return (
                <tr key={id} className={(sel.has(id) ? "sel " : "") + (onRowClick ? "click" : "")} onClick={onRowClick ? (e) => { if (!e.target.closest("button,a,input,label")) onRowClick(r); } : undefined}>
                  {bulkActions && <td className="a-col-check"><Check checked={sel.has(id)} onChange={(v) => { const n = new Set(sel); v ? n.add(id) : n.delete(id); setSel(n); }} aria-label="Selecionar linha" /></td>}
                  {columns.map(c => <td key={c.key} className={c.align ? "a-" + c.align : ""}>{c.render ? c.render(r) : r[c.key]}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (empty || <Empty title="Nada encontrado" text="Ajuste a busca ou os filtros." />)}
      </div>
      {rows.length > pageSize && (
        <footer className="a-pager">
          <span>{cur * pageSize + 1}–{Math.min(rows.length, (cur + 1) * pageSize)} de {rows.length}</span>
          <Btn size="sm" kind="ghost" icon="left" disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="Página anterior" />
          <span>Página {cur + 1} de {pages}</span>
          <Btn size="sm" kind="ghost" icon="right" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="Próxima página" />
        </footer>
      )}
    </div>
  );
}

// Barra de busca + filtros acima das tabelas
export function Toolbar({ search, onSearch, placeholder = "Buscar…", children, right }) {
  return (
    <div className="a-toolbar">
      <label className="a-search">
        <AIcon name="search" size={16} />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label="Buscar" />
        {search && <button type="button" aria-label="Limpar busca" onClick={() => onSearch("")}><AIcon name="x" size={14} /></button>}
      </label>
      {children}
      {right && <div className="a-toolbar-right">{right}</div>}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, label }) {
  return (
    <div className="a-select a-filter">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="">{label}: todos</option>
        {options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
      </select>
      <AIcon name="chevron" size={14} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Modal, confirmação e toasts
// ---------------------------------------------------------------------
export function Modal({ title, children, onClose, footer, size = "md" }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector("input,select,textarea,button")?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="a-modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={"a-modal a-modal-" + size} role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><Btn kind="ghost" icon="x" onClick={onClose} aria-label="Fechar" /></header>
        <div className="a-modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

export function useDialogs() {
  const [dialog, setDialog] = useState(null);
  const confirm = useCallback((opts) => new Promise(resolve => setDialog({ ...opts, resolve })), []);
  const node = dialog && (
    <Modal title={dialog.title} size="sm" onClose={() => { dialog.resolve(false); setDialog(null); }}
      footer={<>
        <Btn onClick={() => { dialog.resolve(false); setDialog(null); }}>{dialog.cancel || "Cancelar"}</Btn>
        <Btn kind={dialog.danger ? "danger" : "primary"} onClick={() => { dialog.resolve(true); setDialog(null); }}>{dialog.ok || "Confirmar"}</Btn>
      </>}>
      <p className="a-confirm-text">{dialog.text}</p>
    </Modal>
  );
  return { confirm, node };
}

export function useToasts() {
  const [items, setItems] = useState([]);
  const toast = useCallback((text, tone = "info") => {
    const id = Math.random().toString(36).slice(2);
    setItems(t => [...t, { id, text, tone }]);
    setTimeout(() => setItems(t => t.filter(x => x.id !== id)), 3800);
  }, []);
  const node = (
    <div className="a-toasts" role="status" aria-live="polite">
      {items.map(t => (
        <div key={t.id} className={"a-toast tone-" + t.tone}>
          <AIcon name={t.tone === "error" ? "alert" : t.tone === "success" ? "check" : "info"} size={16} />{t.text}
        </div>
      ))}
    </div>
  );
  return { toast, node };
}

// Rascunho local de formulário com controle de alterações
export function useDraft(initial) {
  const [base, setBase] = useState(() => JSON.stringify(initial));
  const [draft, setDraft] = useState(initial);
  const dirty = JSON.stringify(draft) !== base;
  const set = useCallback((patch) => setDraft(d => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) })), []);
  const commit = useCallback((saved) => { setDraft(saved); setBase(JSON.stringify(saved)); }, []);
  return { draft, set, dirty, commit, reset: () => setDraft(JSON.parse(base)) };
}

// Verificação de quais imagens existem (arquivo em images/ ou enviada no painel)
export function useImageStatus(paths) {
  const [found, setFound] = useState({});
  const key = paths.join("|");
  useEffect(() => {
    let alive = true;
    const media = getDB().media;
    paths.forEach(p => {
      if (media[p]) { setFound(f => ({ ...f, [p]: "enviada" })); return; }
      const img = new Image();
      img.onload = () => alive && setFound(f => ({ ...f, [p]: "arquivo" }));
      img.onerror = () => alive && setFound(f => ({ ...f, [p]: "faltando" }));
      img.src = p;
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return found;
}
