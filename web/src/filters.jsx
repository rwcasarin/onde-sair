// Filtros das listagens (Lugares, Vibes, Roteiros e Eventos): mesmo painel, mesmos nomes
// e o estado salvo no link — voltar do detalhe ou compartilhar a página mantém os filtros.
import { useEffect, useRef, useState } from "react";
import { REMOTE, isPartial, mergeObjects } from "./admin/store.js";
import { listQuery, runList } from "./listings.js";
import { Icon } from "./components/icons.jsx";
import { currentPath, HASH_MODE } from "./router.js";
import { WEEK as WEEK_NAMES, WEEK_ORDER as WHEN_DAY_ORDER, DAY_SLUGS as WHEN_DAY_SLUGS, PERIODS as WHEN_PERIODS } from "./hours.js";

export function toggleIn(set, v) { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); return n; }
export { fslug, PRICE_LEVELS, eventPriceLevel, recentOf, sortBy } from "./listutil.js";
import { fslug } from "./listutil.js";

// Ordenação: as mesmas opções em todas as páginas, mais as próprias de cada uma
export const SORT_LABELS = { relevancia: "Mais relevantes", data: "Data (mais próximos)", az: "A–Z", preco: "Menor preço", recentes: "Mais recentes", paradas: "Menos paradas" };

// ---------------------------------------------------------------------
// Estado no link
// defs: { chave: [parâmetro, tipo, padrão] } — tipo "set" (lista), "one" (um valor), "bool"
// Só o que difere do padrão vai para o link.
// ---------------------------------------------------------------------
const readQuery = () => new URLSearchParams(currentPath().split("?")[1] || "");
const emptyOf = (kind) => kind === "set" ? new Set() : kind === "bool" ? false : "";

export function useFilters(initialDefs) {
  const defs = useRef(initialDefs).current;   // o padrão é o da abertura da página (a cidade do site pode carregar depois)
  const [f, setF] = useState(() => {
    const q = readQuery(), s = {};
    for (const [k, [param, kind, def]] of Object.entries(defs)) {
      const raw = q.get(param);
      if (kind === "set") s[k] = new Set(raw ? raw.split(",").map(x => x.trim()).filter(Boolean) : def || []);
      else if (kind === "bool") s[k] = raw === null ? !!def : raw === "1";
      else s[k] = raw ?? (def ?? "");
    }
    return s;
  });
  useEffect(() => {
    const q = new URLSearchParams();
    for (const [k, [param, kind, def]] of Object.entries(defs)) {
      const v = f[k];
      if (kind === "set") { if (v.size) q.set(param, [...v].join(",")); }
      else if (kind === "bool") { if (v !== !!def) q.set(param, v ? "1" : "0"); }
      else if (v && v !== (def ?? "")) q.set(param, v);
    }
    const qs = q.toString().replace(/%2C/g, ",");
    const url = currentPath().split("?")[0] + (qs ? "?" + qs : "");
    if (url !== currentPath()) history.replaceState(history.state, "", HASH_MODE ? "#" + url : url);
  }, [f]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    f,
    set: (k, v) => setF(s => ({ ...s, [k]: v })),
    toggle: (k, v) => setF(s => ({ ...s, [k]: toggleIn(s[k], v) })),
    reset: (keys) => setF(s => { const n = { ...s }; keys.forEach(k => { n[k] = emptyOf(defs[k][1]); }); return n; }),
  };
}

// ---------------------------------------------------------------------
// Peças do painel
// ---------------------------------------------------------------------
// opção sem resultado fica apagada (a não ser que já esteja marcada, para poder desmarcar)
export function CheckRow({ checked, onChange, children, count, boxed }) {
  const off = !checked && count === 0;
  return (
    <label className={"check-row" + (boxed ? " boxed" : "") + (off ? " is-off" : "")}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={off} />
      <span>{children}{count != null && <em> ({count})</em>}</span>
    </label>
  );
}

// lista de opções: "Ver mais" passado o limite e busca quando há muitas
export function CheckList({ options, selected, onToggle, boxed, limit = 6, searchLabel }) {
  const [all, setAll] = useState(false);
  const [q, setQ] = useState("");
  const many = options.length > 10 && searchLabel;
  const plain = (s) => fslug(s).replace(/-/g, " ");
  const found = q ? options.filter(o => plain(o.label).includes(plain(q))) : options;
  // marcadas sempre aparecem; depois as com resultado e, no fim, as sem (apagadas)
  const rest = found.filter(o => !selected.has(o.value));
  const ordered = [...found.filter(o => selected.has(o.value)), ...(boxed ? rest : [...rest.filter(o => o.count !== 0), ...rest.filter(o => o.count === 0)])];
  const shown = all || q ? ordered : ordered.slice(0, Math.max(limit, found.filter(o => selected.has(o.value)).length));
  return (
    <>
      {many && <input className="filter-search filter-search-sm" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchLabel} aria-label={searchLabel} />}
      {shown.map(o => (
        <CheckRow key={o.value} boxed={boxed} checked={selected.has(o.value)} onChange={() => onToggle(o.value)} count={o.count}>{o.label}</CheckRow>
      ))}
      {q && !found.length && <p className="filter-empty">Nada com “{q}”.</p>}
      {!q && ordered.length > limit && (
        <button type="button" className="link-btn strong" onClick={() => setAll(!all)}>{all ? "Ver menos −" : `Ver mais (${ordered.length - limit}) +`}</button>
      )}
    </>
  );
}

export function FilterBlock({ title, note, children }) {
  return (
    <div className="filter-block">
      <h3>{title}{note && <> <small>{note}</small></>}</h3>
      {children}
    </div>
  );
}

export function SearchBlock({ value, onChange, placeholder }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  // grava no filtro depois de uma pausa na digitação
  useEffect(() => { const t = setTimeout(() => v !== value && onChange(v), 250); return () => clearTimeout(t); }, [v]); // eslint-disable-line
  return (
    <FilterBlock title="Buscar">
      <input className="filter-search" type="search" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </FilterBlock>
  );
}

// painel: coluna no desktop; no celular, gaveta com "Ver X resultados" no rodapé
export function FilterPanel({ open, onClose, active, onClear, total, noun, sort, sorts, onSort, children }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.classList.add("filters-lock");
    return () => { document.removeEventListener("keydown", esc); document.body.classList.remove("filters-lock"); };
  }, [open]); // eslint-disable-line
  return (
    <>
      {open && <div className="filters-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={"filters" + (open ? " open" : "")} aria-label="Filtros">
        <div className="filters-head">
          <h2>Filtrar por</h2>
          {active > 0 && <button type="button" className="link-btn" onClick={onClear}>Limpar tudo</button>}
          <button type="button" className="filters-close" onClick={onClose} aria-label="Fechar filtros"><Icon name="x" size={18} /></button>
        </div>
        {/* no celular a ordenação mora aqui, como primeira opção (na barra de resultados ela some) */}
        {sorts?.length > 1 && (
          <div className="filter-block filters-sort">
            <h3>Ordenar por</h3>
            <div role="radiogroup" aria-label="Ordenar por">
              {sorts.map(k => (
                <label key={k} className="check-row radio-row">
                  <input type="radio" name="ordem" checked={sort === k} onChange={() => onSort(k)} />
                  <span>{SORT_LABELS[k]}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {children}
        <div className="filters-foot">
          <button type="button" className="btn-pill btn-block" onClick={() => { onClose(); document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth" }); }}>
            Ver {total} {noun}
          </button>
        </div>
      </aside>
    </>
  );
}

// barra de resultados: título, botão de filtros (celular) e ordenação
export function ResultsBar({ title, active, onOpenFilters, sort, sorts, onSort, children }) {
  return (
    <div className="results-bar">
      <h2>{title}</h2>
      <button type="button" className="btn-outline filters-toggle" onClick={onOpenFilters}>
        <Icon name="list" size={16} /> Filtros{active ? ` (${active})` : ""}
      </button>
      <label className="sort">
        <span>Ordenar por</span>
        <span className="select-wrap">
          <select value={sort} onChange={(e) => onSort(e.target.value)}>{sorts.map(k => <option key={k} value={k}>{SORT_LABELS[k]}</option>)}</select>
          <Icon name="chevron" size={16} />
        </span>
      </label>
      {children}
    </div>
  );
}

// filtros ativos em etiquetas removíveis, com "Limpar tudo"
export function ActiveChips({ chips, onClear }) {
  if (!chips.length) return null;
  return (
    <div className="active-chips">
      {chips.map(c => <button key={c.key} type="button" className="soft-tag removable" onClick={c.onRemove} aria-label={"Remover filtro " + c.label}>{c.label} <Icon name="x" size={12} /></button>)}
      {chips.length > 1 && <button type="button" className="link-btn" onClick={onClear}>Limpar tudo</button>}
    </div>
  );
}

// Dia e horário (lugares): "aberto agora", dia da semana (ou hoje) e período do dia.
// value: { agora: bool, dia: "" | "hoje" | "seg"…, periodo: "" | "manha"… }; count(patch) → nº de lugares com o filtro aplicado
export function WhenFilter({ value, onChange, count }) {
  const today = new Date().getDay();
  const DAYS = [["hoje", `Hoje (${WEEK_NAMES[today]})`], ...WHEN_DAY_ORDER.map(d => [WHEN_DAY_SLUGS[d], WEEK_NAMES[d]])];
  return (
    <FilterBlock title="Dia e horário">
      <CheckRow checked={!!value.agora} onChange={() => onChange("agora", !value.agora)} count={count({ agora: true })}>Aberto agora</CheckRow>
      <label className="when-day">
        <span className="sr-only">Dia</span>
        <span className="select-wrap">
          <select value={value.dia || ""} onChange={(e) => onChange("dia", e.target.value)} aria-label="Dia">
            <option value="">Qualquer dia</option>
            {DAYS.map(([v, l]) => <option key={v} value={v}>{l} ({count({ dia: v })})</option>)}
          </select>
          <Icon name="chevron" size={16} />
        </span>
      </label>
      {WHEN_PERIODS.map(([v, l, range]) => (
        <CheckRow key={v} checked={value.periodo === v} onChange={() => onChange("periodo", value.periodo === v ? "" : v)} count={count({ periodo: v })}>
          {l} <small className="when-range">{range}</small>
        </CheckRow>
      ))}
    </FilterBlock>
  );
}
// contagens do "Dia e horário" vindas do servidor → função que o WhenFilter usa
export const whenCount = (w) => (patch) => !w ? null : patch.agora ? w.agora : patch.dia ? w.dia?.[patch.dia] : patch.periodo ? w.periodo?.[patch.periodo] : null;
// rótulos das etiquetas de filtros ativos
export function whenChips(value, onChange) {
  const out = [];
  if (value.agora) out.push({ key: "w-agora", label: "Aberto agora", onRemove: () => onChange("agora", false) });
  if (value.dia) out.push({ key: "w-dia", label: value.dia === "hoje" ? "Hoje" : WEEK_NAMES[WHEN_DAY_SLUGS.indexOf(value.dia)] || value.dia, onRemove: () => onChange("dia", "") });
  if (value.periodo) out.push({ key: "w-per", label: WHEN_PERIODS.find(p => p[0] === value.periodo)?.[1] || value.periodo, onRemove: () => onChange("periodo", "") });
  return out;
}

// ---------------------------------------------------------------------
// Listagem paginada: o servidor filtra, conta e devolve só a página (src/listings.js)
// ---------------------------------------------------------------------
// filtros + página: mudar qualquer filtro volta para a página 1
export function usePagedFilters(defs) {
  const base = useFilters({ ...defs, pagina: ["pagina", "one"] });
  const back = (k) => { if (k !== "pagina") base.set("pagina", ""); };
  return {
    f: base.f,
    page: Math.max(1, parseInt(base.f.pagina, 10) || 1),
    setPage: (n) => base.set("pagina", n > 1 ? String(n) : ""),
    set: (k, v) => { base.set(k, v); back(k); },
    toggle: (k, v) => { base.toggle(k, v); back(k); },
    reset: (keys) => { base.reset(keys); if (!keys.includes("pagina")) base.set("pagina", ""); },
  };
}

const listCache = new Map();          // pedido → resposta (até recarregar a página)
async function fetchList(qs, signal) {
  const r = await fetch("/api/content?" + qs, { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error("lista " + r.status);
  return r.json();
}
// { data, loading }: enquanto a próxima página chega, a anterior continua na tela
export function useListing(kind, f, { page = 1, map = false } = {}) {
  const qs = listQuery(kind, f, { page, map });
  // eventos: sempre direto do banco (não guarda páginas já vistas)
  const keep = kind !== "eventos";
  // sem servidor ou com o banco todo na memória (modo local, painel): roda aqui mesmo
  const local = !REMOTE || !isPartial();
  const first = useRef(true);
  const [state, setState] = useState(() => local ? { data: runList(kind, new URLSearchParams(qs)), loading: false } : { data: (keep && listCache.get(qs)) || null, loading: true });
  useEffect(() => {
    if (local) { setState({ data: runList(kind, new URLSearchParams(qs)), loading: false }); return; }
    if (keep && listCache.has(qs)) { setState({ data: listCache.get(qs), loading: false }); first.current = false; return; }
    setState(s => ({ ...s, loading: true }));
    const ctrl = new AbortController();
    // espera a digitação parar (busca no campo de texto) antes de pedir
    const t = setTimeout(() => {
      fetchList(qs, ctrl.signal).then(d => {
        if (keep) listCache.set(qs, d);
        mergeObjects(d.db);
        setState({ data: d, loading: false });
      }).catch(e => { if (e.name !== "AbortError") setState(s => ({ ...s, loading: false, error: true })); });
    }, first.current ? 0 : 250);
    first.current = false;
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [qs, local]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
// itens da página, já com os objetos guardados no site
export function listItems(data, lists) {
  const by = { place: lists.places, roteiro: lists.roteiros, story: lists.stories, event: lists.events };
  const pages = new Map((data?.db?.pages || []).map(p => [p.id, p]));
  return (data?.list?.refs || []).map(ref => ({ ...ref, item: ref.kind === "page" ? pages.get(ref.id) : by[ref.kind]?.find(x => x.id === ref.id) })).filter(x => x.item);
}
export const labelOf = (opts = [], v) => opts.find(o => o.value === v)?.label || v;

// páginas: anterior, números (com reticências) e próxima
export function Pagination({ page, pages, onPage, loading }) {
  if (pages <= 1) return null;
  const nums = [...new Set([1, page - 1, page, page + 1, pages].filter(n => n >= 1 && n <= pages))].sort((a, b) => a - b);
  const go = (n) => { onPage(n); document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <nav className={"pager" + (loading ? " is-loading" : "")} aria-label="Páginas">
      <button type="button" className="pager-btn" disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Página anterior"><Icon name="chevron" size={16} /></button>
      {nums.map((n, i) => (
        <span key={n} className="pager-item">
          {i > 0 && n - nums[i - 1] > 1 && <span className="pager-gap">…</span>}
          <button type="button" className={"pager-btn" + (n === page ? " on" : "")} aria-current={n === page ? "page" : undefined} onClick={() => go(n)}>{n}</button>
        </span>
      ))}
      <button type="button" className="pager-btn" disabled={page >= pages} onClick={() => go(page + 1)} aria-label="Próxima página"><Icon name="chevron" size={16} /></button>
    </nav>
  );
}
