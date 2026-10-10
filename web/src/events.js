// Eventos: datas, preço e agenda. Datas guardadas como "AAAA-MM-DDTHH:MM" no horário local.
import { EVENT_CATEGORIES, PLACES } from "./data.js";

export const parseLocal = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(s || "");
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : null;
};
export const toLocal = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTH = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTH_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();

export const fmtTime = (d) => d ? (d.getMinutes() ? `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}` : `${d.getHours()}h`) : "";
export const fmtDay = (d) => d ? `${cap(WEEK[d.getDay()])}, ${d.getDate()} ${MONTH[d.getMonth()]}` : "";
export const fmtDayLong = (d) => d ? `${cap(WEEK[d.getDay()])}, ${d.getDate()} de ${MONTH_LONG[d.getMonth()]} de ${d.getFullYear()}` : "";
// selo da data na foto do card: { week: "SÁB", day: "18", month: "OUT" }
export const dateBadge = (e) => { const d = parseLocal(e.startAt); return d ? { week: WEEK[d.getDay()].toUpperCase(), day: String(d.getDate()), month: MONTH[d.getMonth()].toUpperCase() } : null; };

// "Sáb, 18 out · 20h – 23h30" | "Sáb, 18 out 12h – Dom, 19 out 22h"
export function whenLabel(e) {
  const s = parseLocal(e.startAt), f = parseLocal(e.endAt);
  if (!s) return "Data a confirmar";
  if (!f) return `${fmtDay(s)} · ${fmtTime(s)}`;
  if (sameDay(s, f)) return `${fmtDay(s)} · ${fmtTime(s)} – ${fmtTime(f)}`;
  return `${fmtDay(s)} ${fmtTime(s)} – ${fmtDay(f)} ${fmtTime(f)}`;
}

const money = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
export function priceLabel(e) {
  const p = e.price || {};
  if (p.free) return "Gratuito";
  if (p.from && p.to && +p.to > +p.from) return `${money(p.from)} a ${money(p.to)}`;
  if (p.from) return p.to === undefined || p.to === null || p.to === "" ? `A partir de ${money(p.from)}` : money(p.from);
  return "Consulte valores";
}

export const isPast = (e, now = new Date()) => { const f = parseLocal(e.endAt) || parseLocal(e.startAt); return !!f && f < now; };
export const isHappening = (e, now = new Date()) => { const s = parseLocal(e.startAt), f = parseLocal(e.endAt); return !!s && !!f && s <= now && now <= f; };
export const byDate = (a, b) => (parseLocal(a.startAt) || 0) - (parseLocal(b.startAt) || 0);
export const upcoming = (list, now = new Date()) => list.filter(e => !isPast(e, now)).sort(byDate);
export const eventCategory = (id) => EVENT_CATEGORIES.find(c => c.id === id);
export const eventVenue = (e) => (e.venue && PLACES.find(p => p.id === e.venue)) || null;
export const venueName = (e) => eventVenue(e)?.name || e.venueName || "";

// filtros de "Quando" (a semana começa no domingo; fim de semana = sex 18h a dom)
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const WHEN = [
  ["hoje", "Hoje", (now) => [startOfDay(now), new Date(startOfDay(now).getTime() + 864e5)]],
  ["amanha", "Amanhã", (now) => { const a = new Date(startOfDay(now).getTime() + 864e5); return [a, new Date(a.getTime() + 864e5)]; }],
  ["fds", "Este fim de semana", (now) => {
    const d = startOfDay(now), dow = d.getDay(), day = (n) => new Date(d.getTime() + n * 864e5);
    const from = dow === 0 || dow === 6 ? d : new Date(day(5 - dow).getTime() + 18 * 36e5);   // sexta 18h (ou hoje, se já é fim de semana)
    return [from, day((7 - dow) % 7 + 1)];                                                     // até o fim do domingo
  }],
  ["semana", "Próximos 7 dias", (now) => [startOfDay(now), new Date(startOfDay(now).getTime() + 7 * 864e5)]],
  ["mes", "Este mês", (now) => [startOfDay(now), new Date(now.getFullYear(), now.getMonth() + 1, 1)]],
];
// o evento acontece (ao menos em parte) dentro do intervalo
export function inRange(e, [from, to]) {
  const s = parseLocal(e.startAt), f = parseLocal(e.endAt) || s;
  return !!s && s < to && f >= from;
}

// Agenda: Google Agenda e arquivo .ics
const gcal = (s) => s.replace(/[-:]/g, "") + "00";
export function googleCalendarUrl(e, where) {
  const s = e.startAt, f = e.endAt || e.startAt;
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${gcal(s)}/${gcal(f)}`, details: e.tagline || "", location: where || "", ctz: "America/Sao_Paulo" });
  return "https://calendar.google.com/calendar/render?" + q;
}
export function icsHref(e, where) {
  const esc = (t = "") => String(t).replace(/[,;\\]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Onde Sair//Eventos//PT", "BEGIN:VEVENT",
    `UID:${e.id}@ondesair.com.br`, `DTSTART;TZID=America/Sao_Paulo:${gcal(e.startAt)}`, `DTEND;TZID=America/Sao_Paulo:${gcal(e.endAt || e.startAt)}`,
    `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.tagline)}`, `LOCATION:${esc(where)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
}

// ---------------------------------------------------------------------
// Período e horários por dia
// O cadastro guarda: dateFrom/dateTo (AAAA-MM-DD), timeFrom/timeTo (HH:MM) e, se perDay,
// days = { "AAAA-MM-DD": { from, to } } com os dias de horário diferente.
// startAt/endAt continuam sendo gravados (derivados) para cards, filtros e agenda.
// ---------------------------------------------------------------------
const ymd = (d) => toLocal(d).slice(0, 10);
const addDays = (date, n) => { const d = parseLocal(date); d.setDate(d.getDate() + n); return ymd(d); };
const hm = (s) => (s || "").slice(11, 16);

// normaliza o agendamento (eventos antigos só têm startAt/endAt)
export function schedOf(e) {
  if (e.dateFrom) return { dateFrom: e.dateFrom, dateTo: e.dateTo || e.dateFrom, timeFrom: e.timeFrom || "", timeTo: e.timeTo || "", perDay: !!e.perDay, days: e.days || {} };
  const s = e.startAt || "", f = e.endAt || s;
  let dateFrom = s.slice(0, 10), dateTo = f.slice(0, 10);
  const timeFrom = hm(s), timeTo = hm(f);
  // termina no dia seguinte antes do horário de início: é um dia só, que passa da meia-noite
  if (dateTo > dateFrom && addDays(dateFrom, 1) === dateTo && timeTo <= timeFrom) dateTo = dateFrom;
  return { dateFrom, dateTo, timeFrom, timeTo, perDay: false, days: {} };
}
// lista dos dias do evento, com o horário de cada um
export function eventDays(e) {
  const s = schedOf(e);
  if (!s.dateFrom || !parseLocal(s.dateFrom)) return [];
  const out = [];
  for (let d = s.dateFrom, i = 0; d <= s.dateTo && i < 62; d = addDays(d, 1), i++) {
    const own = s.perDay && s.days[d];
    out.push({ date: d, from: own?.from || s.timeFrom, to: own?.to || s.timeTo });
  }
  return out;
}
// início e término reais (o último dia pode passar da meia-noite)
export function deriveRange(e) {
  const days = eventDays(e);
  if (!days.length) return { startAt: e.startAt || "", endAt: e.endAt || "" };
  const a = days[0], z = days[days.length - 1];
  const endDate = z.to && z.from && z.to <= z.from ? addDays(z.date, 1) : z.date;
  return { startAt: `${a.date}T${a.from || "00:00"}`, endAt: `${endDate}T${z.to || "23:59"}` };
}
// "17 out - 2026" e "17 out - 2026 até 18 out - 2026"
export const fmtDateYear = (date) => { const d = parseLocal(date); return d ? `${d.getDate()} ${MONTH[d.getMonth()]} - ${d.getFullYear()}` : ""; };
export function periodLabel(e) {
  const s = schedOf(e);
  return s.dateTo && s.dateTo !== s.dateFrom ? `${fmtDateYear(s.dateFrom)} até ${fmtDateYear(s.dateTo)}` : fmtDateYear(s.dateFrom);
}
export const dayLabel = (date) => fmtDay(parseLocal(date));
const hmLabel = (t) => { if (!t) return ""; const [h, m] = t.split(":"); return +m ? `${+h}h${m}` : `${+h}h`; };
export const hoursLabel = (day) => day.from && day.to ? `${hmLabel(day.from)} às ${hmLabel(day.to)}` : hmLabel(day.from) ? `a partir das ${hmLabel(day.from)}` : "Horário a confirmar";
// dia mostrado por padrão: hoje (se o evento acontece hoje), senão o próximo dia, senão o primeiro
export function defaultDay(days, now = new Date()) {
  const today = ymd(now);
  return days.find(d => d.date === today) || days.find(d => d.date > today) || days[0];
}
export const todayYmd = (now = new Date()) => ymd(now);
