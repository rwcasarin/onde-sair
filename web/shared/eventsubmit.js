// Eventos enviados por usuários do site: limpeza e validação (usado pelo formulário e pela API).
// O evento entra como "revisao" e só aparece no site depois que a equipe aprova no painel.
export const SUBMIT_LIMITS = { pending: 5, imageBytes: 4 * 1024 * 1024 };
export const AGE_VALUES = ["livre", "10", "12", "14", "16", "18"];

const str = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const text = (v, max) => String(v ?? "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
const list = (v, n, max) => [...new Set((Array.isArray(v) ? v : []).map(x => str(x, max)).filter(Boolean))].slice(0, n);
const DATE = /^\d{4}-\d{2}-\d{2}$/, TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const money = (v) => { const n = Number(String(v ?? "").replace(",", ".")); return v === "" || v == null || !isFinite(n) || n < 0 ? "" : Math.round(n * 100) / 100; };
const addDays = (date, n) => { const [y, m, d] = date.split("-").map(Number); const t = new Date(y, m - 1, d + n); const p = (x) => String(x).padStart(2, "0"); return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`; };

export const blankSubmission = () => ({
  title: "", tagline: "", desc: "", category: "", affs: [], tags: [],
  dateFrom: "", dateTo: "", timeFrom: "", timeTo: "", perDay: false, days: {}, doors: "",
  price: { free: false, from: "", to: "", note: "" }, ticket: { required: false, url: "", label: "" },
  age: "livre", insta: "", whatsapp: "",
  venue: "", venueName: "", end: "", bairro: "", city: "", cep: "",
  contact: "",
});

// dias do período com o horário de cada um
export function submissionDays(e) {
  if (!DATE.test(e.dateFrom || "") || !DATE.test(e.dateTo || "") || e.dateTo < e.dateFrom) return [];
  const out = [];
  for (let d = e.dateFrom, i = 0; d <= e.dateTo && i < 62; d = addDays(d, 1), i++) {
    const own = e.perDay && e.days?.[d];
    out.push({ date: d, from: own?.from || e.timeFrom, to: own?.to || e.timeTo });
  }
  return out;
}
export function rangeOf(e) {
  const days = submissionDays(e);
  if (!days.length) return { startAt: "", endAt: "" };
  const a = days[0], z = days[days.length - 1];
  const endDate = z.to && z.from && z.to <= z.from ? addDays(z.date, 1) : z.date;
  return { startAt: `${a.date}T${a.from || "00:00"}`, endAt: `${endDate}T${z.to || "23:59"}` };
}

// Limpa o que veio do formulário e devolve { event, errors } (errors vazio = pode enviar)
export function cleanSubmission(raw = {}, { categories = [], vibes = [], places = [], cities = [], today = "" } = {}) {
  const e = {
    title: str(raw.title, 70), tagline: str(raw.tagline, 120), desc: text(raw.desc, 900),
    category: str(raw.category, 40), affs: list(raw.affs, 6, 20), tags: list(raw.tags, 8, 30),
    dateFrom: str(raw.dateFrom, 10), dateTo: str(raw.dateTo || raw.dateFrom, 10),
    timeFrom: str(raw.timeFrom, 5), timeTo: str(raw.timeTo, 5), perDay: !!raw.perDay, days: {}, doors: str(raw.doors, 20),
    price: { free: !!raw.price?.free, from: raw.price?.free ? "" : money(raw.price?.from), to: raw.price?.free ? "" : money(raw.price?.to), note: str(raw.price?.note, 90) },
    ticket: { required: !!raw.ticket?.required, url: str(raw.ticket?.url, 300), label: str(raw.ticket?.label, 28) },
    age: AGE_VALUES.includes(raw.age) ? raw.age : "livre",
    insta: str(raw.insta, 40), whatsapp: str(raw.whatsapp, 20),
    venue: str(raw.venue, 40), venueName: str(raw.venueName, 80), end: str(raw.end, 160), bairro: str(raw.bairro, 60), city: str(raw.city, 20), cep: str(raw.cep, 9),
    contact: str(raw.contact, 120),
  };
  if (e.insta && !e.insta.startsWith("@")) e.insta = "@" + e.insta;
  if (categories.length && !categories.some(c => c.id === e.category)) e.category = "";
  if (vibes.length) e.affs = e.affs.filter(a => vibes.some(v => v.id === a));
  if (cities.length && !cities.some(c => c.id === e.city)) e.city = "";
  // lugar do catálogo: o endereço vem dele quando o usuário não preencheu
  const p = e.venue && places.find(x => x.id === e.venue);
  if (e.venue && !p) e.venue = "";
  if (p) { e.end = e.end || p.end || ""; e.bairro = e.bairro || p.bairro || ""; e.city = e.city || p.city || ""; e.cep = e.cep || p.cep || ""; }
  // horários de cada dia (só os dias dentro do período, e só se ligado)
  if (e.perDay && raw.days && typeof raw.days === "object") {
    for (const d of submissionDays({ ...e, perDay: false })) {
      const own = raw.days[d.date];
      if (own && TIME.test(own.from || "") && (!own.to || TIME.test(own.to))) e.days[d.date] = { from: own.from, to: own.to || "" };
    }
  }

  const errors = {};
  if (e.title.length < 3) errors.title = "Dê um nome ao evento.";
  if (e.desc.length < 40) errors.desc = "Conte mais sobre o evento (pelo menos 40 caracteres).";
  if (!e.category) errors.category = "Escolha a categoria.";
  if (!e.affs.length) errors.affs = "Marque ao menos uma vibe.";
  if (!DATE.test(e.dateFrom)) errors.dateFrom = "Informe o primeiro dia.";
  else if (today && e.dateFrom < today) errors.dateFrom = "O evento precisa ser de hoje em diante.";
  if (!DATE.test(e.dateTo) || e.dateTo < e.dateFrom) errors.dateTo = "O último dia não pode ser antes do primeiro.";
  else if (submissionDays(e).length > 31) errors.dateTo = "Envie eventos de até 31 dias.";
  if (!TIME.test(e.timeFrom)) errors.timeFrom = "Informe o horário de início.";
  if (e.timeTo && !TIME.test(e.timeTo)) errors.timeTo = "Horário inválido.";
  if (e.perDay) {
    const ds = submissionDays(e);
    if (ds.length < 2 || ds.every(d => d.from === ds[0].from && d.to === ds[0].to)) errors.perDay = "Com “Dias com horários diferentes” ligado, ao menos um dia precisa ter horário diferente.";
  }
  if (!e.price.free && e.price.from === "") errors.price = "Informe o valor ou marque como gratuito.";
  if (e.ticket.url && !/^https?:\/\/\S+\.\S+/.test(e.ticket.url)) errors.ticketUrl = "Use o link completo da venda (https://…).";
  if (e.whatsapp && !/^(55)?\d{10,11}$/.test(e.whatsapp.replace(/\D/g, ""))) errors.whatsapp = "Use o número com DDD.";
  if (!e.venue && e.venueName.length < 2) errors.venueName = "Informe o nome do local.";
  if (e.end.length < 5) errors.end = "Informe o endereço.";
  if (!e.city) errors.city = "Escolha a cidade.";
  if (e.contact.length < 5) errors.contact = "Deixe um contato para a equipe falar com você (e-mail ou telefone).";
  return { event: { ...e, ...rangeOf(e) }, errors };
}
