// Horário de funcionamento dos lugares: dias da semana abertos, até dois turnos por dia
// (ex.: almoço e jantar) e dias com horário próprio — no modelo do cadastro de eventos.
//
// place.hours = {
//   days:   [2, 3, 4, 5, 6],                 // dias abertos (0 = domingo … 6 = sábado)
//   shifts: [["17:00", "22:00"]],            // horário padrão dos dias abertos (1 ou 2 turnos)
//   own:    { "6": [["12:00", "22:00"]] },   // dias com horário diferente
//   note:   "Feriados: confira no Instagram"  // observação (opcional)
// }
// place.open continua guardando o texto resumido (cards, posts do Radar e versões antigas).

export const WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const WEEK_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];              // a semana começa na segunda
const HM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const blankHours = () => ({ days: [], shifts: [["", ""]], own: {}, note: "" });
const cleanShifts = (list) => (Array.isArray(list) ? list : []).filter(s => Array.isArray(s) && HM.test(s[0] || "") && HM.test(s[1] || "")).slice(0, 2).map(([a, b]) => [a, b]).sort((x, y) => x[0].localeCompare(y[0]));   // em ordem do dia

export function normalizeHours(h) {
  if (!h || typeof h !== "object") return null;
  const days = [...new Set((h.days || []).map(Number).filter(d => d >= 0 && d <= 6))].sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b));
  const shifts = cleanShifts(h.shifts);
  const own = {};
  Object.entries(h.own || {}).forEach(([d, s]) => { if (days.includes(+d) && cleanShifts(s).length) own[d] = cleanShifts(s); });
  return { days, shifts, own, note: String(h.note || "").trim().slice(0, 140) };
}
export const hasHours = (h) => { const n = normalizeHours(h); return !!n && n.days.length > 0 && n.days.every(d => (n.own[d] || n.shifts).length > 0); };

// turnos de cada dia da semana (índice 0 = domingo); [] = fechado
export function weekShifts(h) {
  const n = normalizeHours(h);
  return Array.from({ length: 7 }, (_, d) => (n && n.days.includes(d) ? n.own[d] || n.shifts : []));
}

// "18h", "18h30"; "00:00" vira "0h" e "23:59" vira "24h"
export const hmLabel = (t = "") => { if (t === "23:59") return "24h"; const [h, m] = t.split(":").map(Number); return `${h}h${m ? String(m).padStart(2, "0") : ""}`; };
const shiftLabel = ([a, b]) => (a === "00:00" && b === "23:59" ? "24 horas" : `${hmLabel(a)}–${hmLabel(b)}`);
export const dayShiftsLabel = (list) => (list.length ? list.map(shiftLabel).join(" e ") : "Fechado");

// texto resumido: dias seguidos com o mesmo horário viram uma faixa ("Ter–Sex · 17h–22h · Sáb 12h–22h")
export function hoursLabel(h) {
  const week = weekShifts(h);
  if (!week.some(s => s.length)) return "";
  const key = (s) => s.map(x => x.join("-")).join("|");
  if (week.every(s => s.length && key(s) === key(week[0]))) return `Todos os dias · ${dayShiftsLabel(week[0])}`;
  const groups = [];
  WEEK_ORDER.forEach(d => {
    const s = week[d];
    if (!s.length) return;
    const last = groups[groups.length - 1];
    const prev = WEEK_ORDER[WEEK_ORDER.indexOf(d) - 1];
    if (last && key(last.s) === key(s) && last.to === prev) last.to = d; else groups.push({ from: d, to: d, s });
  });
  const days = (g) => g.from === g.to ? WEEK_SHORT[g.from] : `${WEEK_SHORT[g.from]}${WEEK_ORDER.indexOf(g.to) - WEEK_ORDER.indexOf(g.from) === 1 ? " e " : "–"}${WEEK_SHORT[g.to]}`;
  return groups.map((g, i) => `${days(g)}${i === 0 ? " · " : " "}${dayShiftsLabel(g.s)}`).join(" · ");
}

// aberto agora? { open, text } — turnos que passam da meia-noite valem até o dia seguinte
const mins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m + (t === "23:59" ? 1 : 0); };
export function hoursStatus(h, now = new Date()) {
  const week = weekShifts(h);
  if (!week.some(s => s.length)) return null;
  const d = now.getDay(), t = now.getHours() * 60 + now.getMinutes();
  const spans = (day, offset) => week[day].map(([a, b]) => { const s = mins(a), e = mins(b) <= s ? mins(b) + 1440 : mins(b); return [s + offset, e + offset, b]; });
  const cur = [...spans((d + 6) % 7, -1440), ...spans(d, 0)].find(([s, e]) => t >= s && t < e);
  if (cur) return { open: true, text: cur[1] - t <= 60 ? `Fecha em breve · às ${hmLabel(cur[2])}` : `Aberto agora · fecha às ${hmLabel(cur[2])}` };
  for (let i = 0; i < 8; i++) {
    const day = (d + i) % 7;
    const next = spans(day, i * 1440).filter(([s]) => s > t).sort((a, b) => a[0] - b[0])[0];
    if (next) {
      const when = i === 0 ? "hoje" : i === 1 ? "amanhã" : WEEK[day].toLowerCase();
      return { open: false, text: `Fechado · abre ${when} às ${hmLabel(week[day].find(([a]) => mins(a) + i * 1440 === next[0])[0])}` };
    }
  }
  return { open: false, text: "Fechado" };
}

// ---------------------------------------------------------------------
// Texto antigo ("Seg–Sex · 16h–23h · Sáb 10h–22h · Dom e feriados 10h–15h") → horários.
// Só converte quando entende o texto inteiro; senão devolve null (o site mostra o texto).
// ---------------------------------------------------------------------
const DAY_RE = { dom: 0, domingo: 0, seg: 1, segunda: 1, ter: 2, terca: 2, qua: 3, quarta: 3, qui: 4, quinta: 4, sex: 5, sexta: 5, sab: 6, sabado: 6 };
const plain = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const toHM = (h, m) => `${String(h % 24).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
const range = (a, b) => { const out = []; for (let i = WEEK_ORDER.indexOf(a); ; i++) { const d = WEEK_ORDER[i % 7]; out.push(d); if (d === b || out.length > 7) break; } return out; };

export function parseOpen(text) {
  // observações entre parênteses viram a nota do horário: "(entrada até 16h30)"
  const paren = (String(text || "").match(/\(([^)]+)\)/g) || []).map(x => x.slice(1, -1).trim()).join(" · ");
  const src = plain(String(text || "").replace(/\([^)]*\)/g, " ")).replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  if (!src) return null;
  const tokens = src.match(/todos os dias|diariamente|todo dia|24 ?horas|24h(?!\d)|\d{1,2}h\d{0,2}\s*(?:-|as|a)\s*\d{1,2}h?\d{0,2}|\d{1,2}:\d{2}\s*(?:-|as|a)\s*\d{1,2}:\d{2}|fechad[oa]|feriados?|(?:dom|seg|ter|qua|qui|sex|sab)[a-z-]*(?:\s*(?:-|a|ate)\s*(?:dom|seg|ter|qua|qui|sex|sab)[a-z-]*)?|[;·,|]|\be\b/g) || [];
  const week = Array.from({ length: 7 }, () => null);
  let cur = [], pendingAnd = false, freshDays = false, understood = 0, note = "";
  const dayOf = (w) => DAY_RE[w.replace(/-feira/, "").replace(/s$/, "")] ?? DAY_RE[w.slice(0, 3)];
  for (const tk of tokens) {
    if (/^[;·,|]$/.test(tk)) { pendingAnd = false; freshDays = false; continue; }
    if (tk === "e") { pendingAnd = true; continue; }
    if (/^feriado/.test(tk)) { note = "Feriados: confira com o lugar"; understood++; continue; }
    if (/^(todos os dias|diariamente|todo dia)$/.test(tk)) { cur = [0, 1, 2, 3, 4, 5, 6]; freshDays = true; understood++; continue; }
    const dm = tk.match(/^([a-z]+)(?:-feira)?(?:\s*(?:-|a|ate)\s*([a-z]+))?/);
    if (dm && dayOf(dm[1]) !== undefined) {
      const a = dayOf(dm[1]), b = dm[2] ? dayOf(dm[2]) : undefined;
      const list = b !== undefined ? range(a, b) : [a];
      cur = pendingAnd && freshDays ? [...new Set([...cur, ...list])] : list;
      pendingAnd = false; freshDays = true; understood++; continue;
    }
    if (/^fechad/.test(tk)) { cur.forEach(d => { week[d] = []; }); freshDays = false; understood++; continue; }
    let shift = null;
    if (/^24 ?h/.test(tk)) shift = ["00:00", "23:59"];
    const tm = tk.match(/^(\d{1,2})(?:h|:)(\d{0,2})\s*(?:-|as|a)\s*(\d{1,2})(?:h|:)?(\d{0,2})$/);
    if (tm) shift = [toHM(+tm[1], +tm[2] || 0), +tm[3] === 24 && !+tm[4] ? "23:59" : toHM(+tm[3], +tm[4] || 0)];
    if (shift) {
      const days = cur.length ? cur : [0, 1, 2, 3, 4, 5, 6];
      days.forEach(d => { if (!week[d]) week[d] = []; if (week[d].length < 2) week[d].push(shift); });
      freshDays = false; pendingAnd = false; understood++; continue;
    }
  }
  if (!understood || !week.some(s => s && s.length)) return null;
  // texto com palavras que não reconhecemos (além de rótulos como "almoço"/"jantar") não é convertido
  const leftover = src.replace(/todos os dias|diariamente|todo dia|24 ?horas|24h|\d{1,2}(h|:)\d{0,2}|feriados?|fechad[oa]|almoco|jantar|brunch|cafe da manha|atendimento|funcionamento|horario|(dom|seg|ter|qua|qui|sex|sab)[a-z-]*|\b(e|a|as|ate|das|de|aos?|e)\b|[-;·,|()\s.:]/g, "");
  if (leftover.length > 3) return null;
  // horário padrão = o mais comum; os outros dias ficam com horário próprio
  const open = WEEK_ORDER.filter(d => week[d] && week[d].length);
  const key = (s) => JSON.stringify(s);
  const count = {}; open.forEach(d => { count[key(week[d])] = (count[key(week[d])] || 0) + 1; });
  const std = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
  const own = {}; open.forEach(d => { if (key(week[d]) !== std) own[d] = week[d]; });
  return normalizeHours({ days: open, shifts: JSON.parse(std), own, note: [paren && paren[0].toUpperCase() + paren.slice(1), note].filter(Boolean).join(" · ") });
}

// horários do lugar: os cadastrados ou, para lugares antigos, os convertidos do texto
export const placeHours = (p) => (hasHours(p?.hours) ? normalizeHours(p.hours) : parseOpen(p?.open));
