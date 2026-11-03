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

// "Sáb, 18 out · 20h – 23h30" | "Sáb, 18 out 12h – Dom, 19 out 22h"
export function whenLabel(e) {
  // recorrente: "Toda quinta · 20h – 23h"
  if (isRecurring(e)) { const t = e.timeFrom ? (e.timeTo ? `${hmLabel(e.timeFrom)} – ${hmLabel(e.timeTo)}` : hmLabel(e.timeFrom)) : ""; return [repeatLabel(e), t].filter(Boolean).join(" · "); }
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

// "Sempre ativo" (ligado no painel): o evento nunca encerra e vale para qualquer dia e horário
// Recorrente sem data final nunca encerra; com data final, encerra depois da última vez.
export const isPast = (e, now = new Date()) => {
  if (e.alwaysOn) return false;
  if (isRecurring(e)) return !!e.dateTo && !sessions(e, now).some(x => x.end > now);
  const f = parseLocal(e.endAt) || parseLocal(e.startAt); return !!f && f < now;
};
export const isHappening = (e, now = new Date()) => {
  if (isRecurring(e)) return sessions(e, now).some(x => x.start <= now && now < x.end);
  const s = parseLocal(e.startAt), f = parseLocal(e.endAt); return !!s && !!f && s <= now && now <= f;
};
export const byDate = (a, b) => (parseLocal(a.startAt) || 0) - (parseLocal(b.startAt) || 0);
// Ordem da agenda: acontecendo agora → sempre ativo → acontece hoje → vai acontecer → já aconteceu.
// Usa os mesmos horários do selo do card (AGORA / HOJE / dia da semana). Em cada grupo, pelo horário
// (o mais próximo primeiro; nos que já aconteceram, o mais recente primeiro).
function agendaInfo(e, now) {
  const list = sessions(e, now);
  const live = list.find(s => s.start <= now && now < s.end);
  if (live) return { rank: 0, at: live.start };
  if (e.alwaysOn) return { rank: 1, at: list[0]?.start || 0 };
  const next = list.find(s => s.start > now);
  if (next) return { rank: next.date === ymd(now) ? 2 : 3, at: next.start };
  return { rank: 4, at: list[list.length - 1]?.start || 0 };
}
export const agendaRank = (e, now = new Date()) => agendaInfo(e, now).rank;
export const byAgenda = (now = new Date()) => (a, b) => {
  const x = agendaInfo(a, now), y = agendaInfo(b, now);
  return x.rank - y.rank || (x.rank === 4 ? y.at - x.at : x.at - y.at);
};
export const upcoming = (list, now = new Date()) => list.filter(e => !isPast(e, now)).sort(byAgenda(now));
export const eventCategory = (id) => EVENT_CATEGORIES.find(c => c.id === id);
export const eventVenue = (e) => (e.venue && PLACES.find(p => p.id === e.venue)) || null;
export const venueName = (e) => eventVenue(e)?.name || e.venueName || "";
// tipo do local: o do lugar do catálogo; em outro local, o escolhido no painel (lista de tipos de lugares)
export const venueType = (e) => (e.venue ? eventVenue(e)?.type : e.venueType) || "";
// categorias do evento (várias; eventos antigos têm só `category`)
export const eventCatIds = (e) => [...new Set([...(e?.categories || []), e?.category].filter(Boolean))];
export const eventCats = (e) => eventCatIds(e).map(id => EVENT_CATEGORIES.find(c => c.id === id)).filter(Boolean);

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
  if (e.alwaysOn) return true;
  // recorrente: alguma das vezes cai no intervalo
  if (isRecurring(e)) return sessions(e, from).some(x => x.start < to && x.end >= from);
  const s = parseLocal(e.startAt), f = parseLocal(e.endAt) || s;
  return !!s && s < to && f >= from;
}

// Agenda: Google Agenda e arquivo .ics
const gcal = (s) => s.replace(/[-:]/g, "") + "00";
// Cada dia do evento vira um compromisso com o próprio horário (dia sem horário = dia inteiro;
// término antes do início = passa da meia-noite). Eventos antigos sem dias: startAt/endAt.
const ymdC = (d) => d.replace(/-/g, "");
function calSlots(e) {
  const days = eventDays(e);
  if (!days.length) return e.startAt ? [{ start: gcal(e.startAt), end: gcal(e.endAt || e.startAt) }] : [];
  return days.map(d => {
    if (!d.from) return { allDay: true, start: ymdC(d.date), end: ymdC(addDays(d.date, 1)) };
    const endDate = d.to && d.to <= d.from ? addDays(d.date, 1) : d.date;
    const to = d.to || `${String(Math.min(+d.from.slice(0, 2) + 2, 23)).padStart(2, "0")}:${d.from.slice(3, 5)}`;   // sem término: 2 horas
    return { start: gcal(`${d.date}T${d.from}`), end: gcal(`${endDate}T${to}`) };
  });
}
// texto com os horários de cada dia (vai na descrição quando os dias têm horários diferentes)
const hoursText = (e) => eventDays(e).map(d => `${dayLabel(d.date)}: ${hoursLabel(d)}`).join("\n");

// Google Agenda: um link cria um compromisso só. Mesmo horário todo dia → repetição diária;
// horários diferentes → o próximo dia do evento, com os horários de todos os dias na descrição.
export function googleCalendarUrl(e, where, url = "") {
  if (isRecurring(e)) {
    // recorrente: a próxima vez, repetindo pela regra do evento
    const slot = calSlots(e).find(sl => sl.end >= gcal(toLocal(new Date()))) || calSlots(e)[0];
    const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: slot ? `${slot.start}/${slot.end}` : "", details: [e.tagline || "", url].filter(Boolean).join("\n\n"), location: where || "", ctz: "America/Sao_Paulo" });
    const r = rrule(e); if (r) q.set("recur", "RRULE:" + r);
    return "https://calendar.google.com/calendar/render?" + q;
  }
  const slots = calSlots(e), days = eventDays(e);
  const same = days.length <= 1 || sameHoursAllDays(days);
  const idx = same ? 0 : Math.max(0, days.indexOf(defaultDay(days)));
  const slot = slots[idx];
  const details = [e.tagline || "", !same ? "Horários:\n" + hoursText(e) : "", url].filter(Boolean).join("\n\n");
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: slot ? `${slot.start}/${slot.end}` : "", details, location: where || "", ctz: "America/Sao_Paulo" });
  if (same && slots.length > 1) q.set("recur", `RRULE:FREQ=DAILY;COUNT=${slots.length}`);
  return "https://calendar.google.com/calendar/render?" + q;
}
// o link do Google cobre todos os dias? (senão, a página avisa que o arquivo traz todos)
export const googleCoversAll = (e) => { if (isRecurring(e)) return true; const d = eventDays(e); return d.length <= 1 || sameHoursAllDays(d); };

// Arquivo .ics (Apple, Outlook, Google por importação): um compromisso por dia, cada um com o seu horário
export function icsText(e, where, url = "", now = new Date()) {
  const esc = (t = "") => String(t).replace(/[,;\\]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const tz = ["BEGIN:VTIMEZONE", "TZID:America/Sao_Paulo", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:-0300", "TZOFFSETTO:-0300", "TZNAME:-03", "END:STANDARD", "END:VTIMEZONE"];
  let slots = calSlots(e), days = eventDays(e);
  // recorrente: um compromisso só, com a regra de repetição e as datas em que não acontece
  const rec = isRecurring(e) && rrule(e);
  if (rec) { const i = Math.max(0, slots.findIndex(sl => sl.end >= gcal(toLocal(now)))); slots = slots.slice(i, i + 1); days = days.slice(i, i + 1); }
  const extra = rec ? [`RRULE:${rec}`, ...(e.skip || []).filter(Boolean).map(d => `EXDATE;TZID=America/Sao_Paulo:${ymdC(d)}T${(e.timeFrom || "00:00").replace(":", "")}00`)] : [];
  const events = slots.flatMap((sl, i) => ["BEGIN:VEVENT",
    `UID:${e.id}${days[i] ? "-" + days[i].date : ""}@ondesair.com.br`, `DTSTAMP:${stamp}`,
    ...(sl.allDay ? [`DTSTART;VALUE=DATE:${sl.start}`, `DTEND;VALUE=DATE:${sl.end}`]
      : [`DTSTART;TZID=America/Sao_Paulo:${sl.start}`, `DTEND;TZID=America/Sao_Paulo:${sl.end}`]), ...extra,
    `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc([e.tagline || "", url].filter(Boolean).join("\n\n"))}`, `LOCATION:${esc(where)}`,
    ...(url ? [`URL:${url}`] : []), "END:VEVENT"]);
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Onde Sair//Eventos//PT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...tz, ...events, "END:VCALENDAR"].join("\r\n");
}
export const icsHref = (e, where, url) => "data:text/calendar;charset=utf-8," + encodeURIComponent(icsText(e, where, url));

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
  const rec = { repeat: REPEATS.includes(e.repeat) ? e.repeat : "", weekdays: e.weekdays || [], monthWeek: e.monthWeek || 1, skip: e.skip || [] };
  // recorrente: dateTo vazio = sem data para terminar; não há horários por dia
  if (rec.repeat && e.dateFrom) return { dateFrom: e.dateFrom, dateTo: e.dateTo || "", timeFrom: e.timeFrom || "", timeTo: e.timeTo || "", perDay: false, days: {}, ...rec };
  if (e.dateFrom) return { dateFrom: e.dateFrom, dateTo: e.dateTo || e.dateFrom, timeFrom: e.timeFrom || "", timeTo: e.timeTo || "", perDay: !!e.perDay, days: e.days || {}, ...rec, repeat: "" };
  const s = e.startAt || "", f = e.endAt || s;
  let dateFrom = s.slice(0, 10), dateTo = f.slice(0, 10);
  const timeFrom = hm(s), timeTo = hm(f);
  // termina no dia seguinte antes do horário de início: é um dia só, que passa da meia-noite
  if (dateTo > dateFrom && addDays(dateFrom, 1) === dateTo && timeTo <= timeFrom) dateTo = dateFrom;
  return { dateFrom, dateTo, timeFrom, timeTo, perDay: false, days: {}, repeat: "", weekdays: [], monthWeek: 1, skip: [] };
}

// ---------------------------------------------------------------------
// Eventos recorrentes (ex.: quiz toda terça, jazz toda quinta, feira todo 1º domingo)
// repeat: "weekly" (toda semana) | "biweekly" (a cada 2 semanas) | "monthly" (uma vez por mês)
// weekdays: dias da semana (0 = domingo); no mensal, um só. monthWeek: 1–4 ou -1 (último) no mensal.
// dateFrom: começa em; dateTo: termina em (vazio = sem data final); skip: datas em que não acontece.
// ---------------------------------------------------------------------
export const REPEATS = ["weekly", "biweekly", "monthly"];
export const isRecurring = (e) => REPEATS.includes(e?.repeat) && !!e.dateFrom && (e.weekdays || []).length > 0;
const WEEK_PLURAL = ["domingos", "segundas", "terças", "quartas", "quintas", "sextas", "sábados"];
const masc = (d) => d === 0 || d === 6;      // domingo e sábado
const listPt = (a) => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " e " + a[a.length - 1];
const ORD = { 1: "1ª", 2: "2ª", 3: "3ª", 4: "4ª" };
// "Toda quinta" · "Quintas e sextas" · "A cada 2 semanas, às quintas" · "Toda 1ª sexta do mês" · "Todo último sábado do mês"
export function repeatLabel(e) {
  const w = [...(e.weekdays || [])].map(Number).sort((a, b) => a - b);
  if (!w.length) return "";
  if (e.repeat === "monthly") {
    const d = w[0], n = +e.monthWeek || 1;
    const ord = n === -1 ? (masc(d) ? "último" : "última") : (masc(d) ? ORD[n].replace("ª", "º") : ORD[n]);
    return `${masc(d) ? "Todo" : "Toda"} ${ord} ${WEEK_LONG[d]} do mês`;
  }
  if (e.repeat === "biweekly") return `A cada 2 semanas, às ${listPt(w.map(d => WEEK_PLURAL[d]))}`.replace("às domingos", "aos domingos").replace("às sábados", "aos sábados");
  if (w.length === 7) return "Todos os dias";
  if (w.length === 1) return `${masc(w[0]) ? "Todo" : "Toda"} ${WEEK_LONG[w[0]]}`;
  return cap(listPt(w.map(d => WEEK_PLURAL[d])));
}
// o dia `date` (AAAA-MM-DD) é uma das vezes do evento?
function occursOn(e, date) {
  const d = parseLocal(date), dow = d.getDay();
  if (!(e.weekdays || []).map(Number).includes(dow) || (e.skip || []).includes(date)) return false;
  if (e.repeat === "biweekly") {
    const a = parseLocal(e.dateFrom); a.setDate(a.getDate() - a.getDay());      // domingo da 1ª semana
    return Math.round((d - a) / (7 * 864e5) - 0.5) % 2 === 0;
  }
  if (e.repeat === "monthly") {
    const n = +e.monthWeek || 1, day = d.getDate();
    if (n === -1) return day + 7 > new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Math.ceil(day / 7) === n;
  }
  return true;
}
// as vezes do evento numa janela em volta de hoje (3 semanas para trás, ~6 meses para frente)
function recurringDays(e, now) {
  const today = ymd(now);
  let end = addDays(e.dateFrom > today ? e.dateFrom : today, 190);
  if (e.dateTo && e.dateTo < end) end = e.dateTo;
  let start = addDays(end < today ? end : today, -21);
  if (start < e.dateFrom) start = e.dateFrom;
  const out = [];
  for (let d = start, i = 0; d <= end && i < 400; d = addDays(d, 1), i++) if (occursOn(e, d)) out.push({ date: d, from: e.timeFrom || "", to: e.timeTo || "" });
  return out;
}
// primeira e última vez de todas (para início/término gravados)
function firstOccurrence(e) { for (let d = e.dateFrom, i = 0; i < 400; d = addDays(d, 1), i++) if (occursOn(e, d)) return d; return e.dateFrom; }
function lastOccurrence(e) { if (!e.dateTo) return ""; for (let d = e.dateTo, i = 0; d >= e.dateFrom && i < 400; d = addDays(d, -1), i++) if (occursOn(e, d)) return d; return e.dateTo; }
// regra de repetição para Google Agenda e .ics
const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
function rrule(e) {
  if (!isRecurring(e)) return "";
  const w = [...e.weekdays].map(Number).sort((a, b) => a - b);
  const last = lastOccurrence(e);
  const until = last ? `;UNTIL=${last.replace(/-/g, "")}T235959` : "";
  if (e.repeat === "monthly") return `FREQ=MONTHLY;BYDAY=${+e.monthWeek || 1}${BYDAY[w[0]]}${until}`;
  return `FREQ=WEEKLY${e.repeat === "biweekly" ? ";INTERVAL=2" : ""};BYDAY=${w.map(d => BYDAY[d]).join(",")}${until}`;
}
// lista dos dias do evento, com o horário de cada um
export function eventDays(e, now = new Date()) {
  if (isRecurring(e)) return recurringDays(e, now);
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
  if (isRecurring(e)) {
    // recorrente: da 1ª vez até a última (sem data final, o término fica vazio)
    const a = firstOccurrence(e), z = lastOccurrence(e);
    const endDate = z && e.timeTo && e.timeFrom && e.timeTo <= e.timeFrom ? addDays(z, 1) : z;
    return { startAt: `${a}T${e.timeFrom || "00:00"}`, endAt: z ? `${endDate}T${e.timeTo || "23:59"}` : "" };
  }
  const days = eventDays(e);
  if (!days.length) return { startAt: e.startAt || "", endAt: e.endAt || "" };
  const a = days[0], z = days[days.length - 1];
  const endDate = z.to && z.from && z.to <= z.from ? addDays(z.date, 1) : z.date;
  return { startAt: `${a.date}T${a.from || "00:00"}`, endAt: `${endDate}T${z.to || "23:59"}` };
}
// "17 out - 2026" e "17 out - 2026 até 18 out - 2026"
export const fmtDateYear = (date) => { const d = parseLocal(date); return d ? `${d.getDate()} ${MONTH[d.getMonth()]} - ${d.getFullYear()}` : ""; };
export function periodLabel(e) {
  if (isRecurring(e)) return [repeatLabel(e), e.dateTo ? `até ${fmtDateYear(e.dateTo)}` : "sem data para terminar"].join(", ");
  const s = schedOf(e);
  return s.dateTo && s.dateTo !== s.dateFrom ? `${fmtDateYear(s.dateFrom)} até ${fmtDateYear(s.dateTo)}` : fmtDateYear(s.dateFrom);
}
export const dayLabel = (date) => fmtDay(parseLocal(date));
const hmLabel = (t) => { if (!t) return ""; const [h, m] = t.split(":"); return +m ? `${+h}h${m}` : `${+h}h`; };
export const hoursLabel = (day) => day.from && day.to ? `Das ${hmLabel(day.from)} às ${hmLabel(day.to)}` : hmLabel(day.from) ? `A partir das ${hmLabel(day.from)}` : "Horário a confirmar";
// dia mostrado por padrão: hoje (se o evento acontece hoje), senão o próximo dia, senão o primeiro
export function defaultDay(days, now = new Date()) {
  const today = ymd(now);
  return days.find(d => d.date === today) || days.find(d => d.date > today) || days[0];
}
export const todayYmd = (now = new Date()) => ymd(now);
// "De sexta, 11/12" / "até domingo, 13/12" (um dia só: "Sexta, 11/12")
const WEEK_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const pad2 = (n) => String(n).padStart(2, "0");
export const fmtWeekDayMonth = (date) => { const d = parseLocal(date); return d ? `${WEEK_LONG[d.getDay()]}, ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}` : ""; };
export function periodLines(e) {
  // recorrente: só a regra ("Toda terça"); início e fim ficam só no painel
  if (isRecurring(e)) return [repeatLabel(e)];
  const s = schedOf(e);
  if (!s.dateFrom) return [];
  return s.dateTo && s.dateTo !== s.dateFrom ? [`De ${fmtWeekDayMonth(s.dateFrom)}`, `até ${fmtWeekDayMonth(s.dateTo)}`] : [cap(fmtWeekDayMonth(s.dateFrom))];
}
// todos os dias do período com o mesmo horário?
export const sameHoursAllDays = (days) => days.every(d => d.from === days[0]?.from && d.to === days[0]?.to);

// Selo de data do card: { kind: "future" | "today" | "live" | "past", text }
//  futuro: "Sáb, 10/10 às 10h" · hoje (ainda vai começar): "Hoje, 10/10 às 10h"
//  acontecendo: "Acontecendo até as 10h" · encerrado: "Sáb, 10/10/26 às 10h"
const WEEK_CAP = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const ddmm = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
// sessões reais de cada dia (o fim passa para o dia seguinte quando fecha depois da meia-noite)
function sessions(e, now = new Date()) {
  return eventDays(e, now).map(d => {
    const start = parseLocal(`${d.date}T${d.from || "00:00"}`);
    let end = parseLocal(`${d.date}T${d.to || "23:59"}`);
    if (d.to && d.from && d.to <= d.from) end = new Date(end.getTime() + 864e5);
    return { ...d, start, end };
  });
}
export function cardWhen(e, now = new Date()) {
  const list = sessions(e, now);
  if (!list.length) return null;
  // bloco do calendário: dia da semana (ou HOJE/AGORA), dia, mês (com o ano se já passou) e a faixa do horário
  const block = (d, kind, top, hour, text) => ({ kind, top, day: pad2(d.getDate()), month: MONTH[d.getMonth()].toUpperCase() + (kind === "past" ? " " + String(d.getFullYear()).slice(2) : ""), hour, text });
  const live = list.find(s => s.start <= now && now < s.end);
  if (live) return block(now, "live", "AGORA", `até ${hmLabel(live.to) || fmtTime(live.end)}`, `Acontecendo até as ${hmLabel(live.to) || fmtTime(live.end)}`);
  const next = list.find(s => s.start > now);
  if (next) {
    const today = next.date === ymd(now);
    return block(next.start, today ? "today" : "future", today ? "HOJE" : WEEK_CAP[next.start.getDay()].toUpperCase(), `às ${hmLabel(next.from)}`,
      `${today ? "Hoje" : WEEK_CAP[next.start.getDay()]}, ${ddmm(next.start)} às ${hmLabel(next.from)}`);
  }
  const first = isRecurring(e) ? list[list.length - 1] : list[0];   // recorrente encerrado: a última vez
  return block(first.start, "past", WEEK_CAP[first.start.getDay()].toUpperCase(), `às ${hmLabel(first.from)}`,
    `${WEEK_CAP[first.start.getDay()]}, ${ddmm(first.start)}/${String(first.start.getFullYear()).slice(2)} às ${hmLabel(first.from)}`);
}
