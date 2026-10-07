// Seleção de cidade com busca (mesma usabilidade do combobox do admin, sem cadastro).
// Usa as cidades ativas da base (CITIES, sincronizadas com o painel).
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CITIES } from "../data.js";
import { Icon } from "./icons.jsx";

const plain = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function useOptions(q, { allLabel, counts }) {
  return useMemo(() => {
    const t = plain(q);
    const list = CITIES.filter(c => !t || plain(`${c.name} ${c.sub || ""}`).includes(t))
      .map(c => ({ value: c.id, label: c.name, note: [c.sub, counts && `${counts[c.id] || 0} lugar${counts[c.id] === 1 ? "" : "es"}`].filter(Boolean).join(" · ") }));
    return allLabel && (!t || plain(allLabel).includes(t)) ? [{ value: "", label: allLabel, note: counts ? `${Object.values(counts).reduce((a, b) => a + b, 0)} lugares` : "" }, ...list] : list;
  }, [q, allLabel, counts]);
}

function OptionList({ id, options, value, active, setActive, onPick }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.querySelector("li.on")?.scrollIntoView({ block: "nearest" }); }, [active]);
  if (!options.length) return <ul className="city-list" id={id} role="listbox" ref={ref}><li className="city-empty">Nenhuma cidade encontrada.</li></ul>;
  return (
    <ul className="city-list" id={id} role="listbox" ref={ref}>
      {options.map((o, i) => (
        <li key={o.value || "all"} id={`${id}-${i}`} role="option" aria-selected={o.value === value}
          className={(i === active ? "on" : "") + (o.value === value ? " sel" : "")}
          onMouseDown={(e) => { e.preventDefault(); onPick(o.value); }} onMouseEnter={() => setActive(i)}>
          <span><strong>{o.label}</strong>{o.note && <em>{o.note}</em>}</span>
          {o.value === value && <Icon name="check" size={16} />}
        </li>
      ))}
    </ul>
  );
}

function keyNav(e, { options, active, setActive, onPick, onClose }) {
  if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(active + 1, options.length - 1)); }
  else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
  else if (e.key === "Enter") { e.preventDefault(); if (options[active]) onPick(options[active].value); }
  else if (e.key === "Escape") { e.preventDefault(); onClose(); }
}

// Botão (menu, rodapé, busca da home) que abre um painel com busca
export function CitySelect({ value, onChange, className = "", children, align = "left", placement = "bottom", label = "Escolher cidade" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const box = useRef(null), btn = useRef(null);
  const id = useId();
  const options = useOptions(q, {});

  useEffect(() => {
    if (!open) return;
    setQ(""); setActive(Math.max(0, CITIES.findIndex(c => c.id === value)));
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]); // eslint-disable-line
  useEffect(() => { setActive(0); }, [q]);

  const pick = (v) => { setOpen(false); btn.current?.focus(); if (v !== value) onChange(v); };
  return (
    <div className={"city-select align-" + align + " place-" + placement} ref={box}>
      <button type="button" ref={btn} className={className} aria-haspopup="listbox" aria-expanded={open} aria-label={label}
        onClick={() => setOpen(!open)}>{children}</button>
      {open && (
        <div className="city-pop" role="dialog" aria-label={label}>
          <div className="city-search">
            <Icon name="search" size={16} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cidade…" aria-label="Buscar cidade"
              role="combobox" aria-expanded="true" aria-controls={id} aria-activedescendant={options[active] ? `${id}-${active}` : undefined}
              onKeyDown={(e) => keyNav(e, { options, active, setActive, onPick: pick, onClose: () => { setOpen(false); btn.current?.focus(); } })} />
          </div>
          <OptionList id={id} options={options} value={value} active={active} setActive={setActive} onPick={pick} />
        </div>
      )}
    </div>
  );
}

// Campo com busca (filtro da lista de lugares) — digita para filtrar, como no admin
export function CityField({ value, onChange, allLabel = "Todas as cidades", counts, label = "Cidade" }) {
  const cur = CITIES.find(c => c.id === value);
  const [text, setText] = useState(cur?.name || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [typing, setTyping] = useState(false);
  const id = useId();
  useEffect(() => { setText(cur?.name || ""); }, [value]); // eslint-disable-line
  const options = useOptions(typing ? text : "", { allLabel, counts });

  const pick = (v) => { setOpen(false); setTyping(false); setText(CITIES.find(c => c.id === v)?.name || ""); if (v !== value) onChange(v); };
  return (
    <div className="city-field">
      <div className="city-field-box">
        <Icon name="pin" size={16} />
        <input value={text} placeholder={allLabel} autoComplete="off" aria-label={label}
          role="combobox" aria-expanded={open} aria-controls={id} aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-${active}` : undefined}
          onFocus={(e) => { setOpen(true); setActive(Math.max(0, options.findIndex(o => o.value === (value || "")))); e.target.select(); }}
          onChange={(e) => { setText(e.target.value); setTyping(true); setOpen(true); setActive(0); }}
          onBlur={() => setTimeout(() => { setOpen(false); setTyping(false); setText(cur?.name || ""); }, 120)}
          onKeyDown={(e) => keyNav(e, { options, active, setActive, onPick: pick, onClose: () => { setOpen(false); setTyping(false); setText(cur?.name || ""); } })} />
        <Icon name="chevron" size={16} />
      </div>
      {open && <div className="city-pop city-pop-field"><OptionList id={id} options={options} value={value || ""} active={active} setActive={setActive} onPick={pick} /></div>}
    </div>
  );
}
