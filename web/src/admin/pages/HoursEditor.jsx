// Horário de funcionamento do lugar: dias da semana abertos, horário padrão (1 ou 2 turnos)
// e dias com horário diferente — no modelo do cadastro de eventos.
import { useState } from "react";
import { AIcon, Btn, Field, Input, Toggle } from "../kit.jsx";
import { WEEK, WEEK_SHORT, WEEK_ORDER, blankHours, normalizeHours, hasHours, hoursLabel, dayShiftsLabel, parseOpen } from "../../hours.js";

function ShiftInputs({ shifts, onChange, label = "", compact }) {
  const list = shifts.length ? shifts : [["", ""]];
  const upd = (i, k, v) => onChange(list.map((s, j) => (j === i ? (k === 0 ? [v, s[1]] : [s[0], v]) : s)));
  return (
    <div className={"a-hours-shifts" + (compact ? " compact" : "")}>
      {list.map((s, i) => (
        <div className="a-hours-shift" key={i}>
          {!compact && list.length > 1 && <span className="a-hours-turn">{i + 1}º horário</span>}
          <input className="a-input" type="time" value={s[0]} aria-label={`Abre às${label}${list.length > 1 ? ` (${i + 1}º horário)` : ""}`} onChange={(e) => upd(i, 0, e.target.value)} />
          <span className="a-muted">às</span>
          <input className="a-input" type="time" value={s[1]} aria-label={`Fecha às${label}${list.length > 1 ? ` (${i + 1}º horário)` : ""}`} onChange={(e) => upd(i, 1, e.target.value)} />
          {list.length > 1 && <button type="button" className="a-icon-btn" aria-label={`Remover ${i + 1}º horário${label}`} onClick={() => onChange(list.filter((_, j) => j !== i))}><AIcon name="x" size={14} /></button>}
        </div>
      ))}
      {list.length < 2 && <button type="button" className="a-link a-hours-add" onClick={() => onChange([...list, ["", ""]])}>+ {compact ? "2º horário" : "Segundo horário (ex.: almoço e jantar)"}</button>}
    </div>
  );
}

// erros: turno pela metade ou dia aberto sem horário
export function hoursErrors(h) {
  if (!h) return null;
  const n = h;
  const bad = (list) => (list || []).some(([a, b]) => (!!a) !== (!!b));
  if (bad(n.shifts) || Object.values(n.own || {}).some(bad)) return "Preencha a abertura e o fechamento de cada horário.";
  if ((n.days || []).length && !hasHours(n)) return "Informe o horário dos dias abertos.";
  return null;
}

export function HoursEditor({ value, legacy, onChange, error }) {
  // lugar antigo: começa com os horários convertidos do texto de funcionamento
  const [converted] = useState(() => !value && legacy ? parseOpen(legacy) : null);
  const h = value || converted || blankHours();
  const [perDay, setPerDay] = useState(() => Object.keys(h.own || {}).length > 0);
  const set = (patch) => onChange({ ...h, ...patch });
  const toggleDay = (d) => {
    const days = h.days.includes(d) ? h.days.filter(x => x !== d) : [...h.days, d];
    const own = { ...h.own }; if (!days.includes(d)) delete own[d];
    set({ days, own });
  };
  const allDay = h.shifts.length === 1 && h.shifts[0][0] === "00:00" && h.shifts[0][1] === "23:59";
  const ordered = WEEK_ORDER.filter(d => h.days.includes(d));
  const preview = hoursLabel(h);
  return (
    <Field label="Funcionamento" error={error}>
      {() => (
        <div className="a-hours">
          {!value && converted && <p className="a-hours-note"><AIcon name="info" size={14} /> Convertido do texto antigo “{legacy}”. Confira; ao mudar qualquer horário, ele passa a valer como cadastrado.</p>}
          {!value && !converted && legacy && <p className="a-hours-note"><AIcon name="info" size={14} /> Texto atual: “{legacy}”. Cadastre os horários abaixo para mostrar a semana e o “aberto agora” no site.</p>}
          <div className="a-hours-days" role="group" aria-label="Dias abertos">
            {WEEK_ORDER.map(d => (
              <button key={d} type="button" className={"a-hours-day" + (h.days.includes(d) ? " on" : "")} aria-pressed={h.days.includes(d)} title={WEEK[d]} onClick={() => toggleDay(d)}>{WEEK_SHORT[d]}</button>
            ))}
            <span className="a-hours-quick">
              <button type="button" className="a-link" onClick={() => set({ days: [0, 1, 2, 3, 4, 5, 6] })}>Todos</button>
              <button type="button" className="a-link" onClick={() => set({ days: [1, 2, 3, 4, 5] , own: {} })}>Seg a sex</button>
              {h.days.length > 0 && <button type="button" className="a-link" onClick={() => set({ days: [], own: {} })}>Limpar</button>}
            </span>
          </div>
          {h.days.length > 0 && (<>
            <div className="a-hours-std">
              <span className="a-hours-label">{perDay ? "Horário padrão" : "Horário"}</span>
              {allDay ? <span className="a-hours-24">Aberto 24 horas</span> : <ShiftInputs shifts={h.shifts} onChange={(shifts) => set({ shifts })} />}
            </div>
            <div className="a-hours-toggles">
              <Toggle label="Aberto 24 horas" checked={allDay} onChange={(on) => set({ shifts: on ? [["00:00", "23:59"]] : [["", ""]] })} />
              {ordered.length > 1 && (
                <Toggle label="Dias com horários diferentes" checked={perDay} onChange={(on) => { setPerDay(on); if (!on) set({ own: {} }); }}
                  hint={perDay ? "Ajuste os dias abaixo. Os que você não mudar seguem o horário padrão." : "Ex.: sábado abre mais cedo, domingo fecha antes."} />
              )}
            </div>
            {perDay && ordered.length > 1 && (
              <ul className="a-day-hours a-hours-perday" aria-label="Horário de cada dia">
                {ordered.map(d => {
                  const own = h.own[d];
                  return (
                    <li key={d} className={own ? "is-own" : ""}>
                      <span className="a-day-name">{WEEK[d]}</span>
                      <ShiftInputs compact shifts={own || h.shifts} label={` · ${WEEK[d]}`} onChange={(s) => set({ own: { ...h.own, [d]: s } })} />
                      {own
                        ? <button type="button" className="a-link" onClick={() => { const { [d]: _, ...rest } = h.own; set({ own: rest }); }}>Usar o padrão</button>
                        : <span className="a-muted a-day-std">Padrão</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </>)}
          <Input label="Observação" value={h.note || ""} onChange={(note) => set({ note })} maxCount={140} placeholder="Ex.: Feriados: confira no Instagram · Cozinha fecha às 22h" />
          {preview
            ? <p className="a-hint">No site: <strong>{preview}</strong>{h.note ? ` · ${h.note}` : ""}</p>
            : <p className="a-hint">Marque os dias em que o lugar abre e o horário. Sem dias marcados, a página não mostra o funcionamento.</p>}
          {ordered.length > 0 && perDay && <p className="a-hint a-hours-week">{WEEK_ORDER.map(d => `${WEEK_SHORT[d]}: ${dayShiftsLabel(h.days.includes(d) ? (h.own[d] || h.shifts).filter(([a, b]) => a && b) : [])}`).join(" · ")}</p>}
        </div>
      )}
    </Field>
  );
}
export { normalizeHours };
