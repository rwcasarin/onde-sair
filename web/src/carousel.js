// Carrossel de destaques da home: cadastro manual (imagem, título, descrição, data/horário e link).
// O topo da home alterna entre o modo "fixo" (título + foto) e o "carrossel".
import { cardWhen, parseLocal } from "./events.js";

export const CAROUSEL_DEFAULT = { autoplay: true, interval: 6, showPause: false, showSearch: true, slides: [] };
export const SLIDE_INTERVALS = [4, 5, 6, 8, 10, 12];
export const FOCUS = [["center", "Centro"], ["top", "Topo"], ["bottom", "Base"], ["left", "Esquerda"], ["right", "Direita"]];

export const slideImg = (id) => `images/home/destaque-${id}.jpg`;
export const newSlide = () => {
  const id = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  return { id, active: true, tag: "", title: "", desc: "", dateFrom: "", dateTo: "", timeFrom: "", timeTo: "", link: "", linkLabel: "", alt: "", focus: "center", showFrom: "", showUntil: "", hideAfter: true };
};
export const carouselOf = (home = {}) => ({ ...CAROUSEL_DEFAULT, ...(home.carousel || {}), slides: (home.carousel?.slides || []).map(s => ({ ...newSlide(), ...s })) });

// fim do que a data do slide descreve (último dia, até o horário de término ou o fim do dia)
function slideEnd(s) {
  const last = s.dateTo || s.dateFrom;
  if (!last) return null;
  const end = parseLocal(`${last}T${s.timeTo || "23:59"}`);
  if (end && s.timeTo && s.timeFrom && s.timeTo <= s.timeFrom) return new Date(end.getTime() + 864e5);   // passa da meia-noite
  return end;
}

// aparece no site agora? (ativo, com título, dentro da janela de exibição e, se pedido, antes de a data passar)
export function slideVisible(s, now = new Date()) {
  if (!s || s.active === false || !String(s.title || "").trim()) return false;
  const from = parseLocal(s.showFrom), until = parseLocal(s.showUntil);
  if (from && now < from) return false;
  if (until && now > until) return false;
  if (s.hideAfter !== false) { const end = slideEnd(s); if (end && now > end) return false; }
  return true;
}
export const visibleSlides = (car, now = new Date()) => (car?.slides || []).filter(s => slideVisible(s, now));

// por que um slide não aparece (para o painel)
export function slideStatus(s, now = new Date()) {
  if (s.active === false) return ["gray", "Desativado"];
  if (!String(s.title || "").trim()) return ["amber", "Sem título"];
  const from = parseLocal(s.showFrom), until = parseLocal(s.showUntil);
  if (from && now < from) return ["blue", "Agendado"];
  if (until && now > until) return ["gray", "Fora do período"];
  if (s.hideAfter !== false) { const end = slideEnd(s); if (end && now > end) return ["gray", "Data já passou"]; }
  return ["green", "No ar"];
}

// selo de data no mesmo formato dos cards de eventos (dia da semana, dia, mês e horário)
export function slideWhen(s, now = new Date()) {
  if (!s.dateFrom) return null;
  const b = cardWhen({ dateFrom: s.dateFrom, dateTo: s.dateTo || s.dateFrom, timeFrom: s.timeFrom || "", timeTo: s.timeTo || "" }, now);
  if (!b) return null;
  if (!s.timeFrom) {           // sem horário: sem a faixa "às …" e sem o "AGORA" do dia inteiro
    const today = b.kind === "live" || b.kind === "today";
    return { ...b, kind: today ? "today" : b.kind, top: today ? "HOJE" : b.top, hour: "", text: b.text.replace(/ às.*$/, "").replace(/^Acontecendo.*$/, "Hoje") };
  }
  return b;
}

// link: endereço do site ("/eventos/…") ou externo ("https://…", "www.…")
export const isExternal = (link = "") => /^(https?:)?\/\//i.test(link) || /^www\./i.test(link) || /^(mailto|tel):/i.test(link);
export function normLink(link = "") {
  const l = String(link).trim();
  if (!l) return "";
  if (/^www\./i.test(l)) return "https://" + l;
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(l)) return l;
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(l)) return "https://" + l;          // dominio.com.br/...
  return "/" + l.replace(/^#?\/?/, "");
}
export function linkError(link = "") {
  const l = String(link).trim();
  if (!l) return null;
  if (/\s/.test(l)) return "O link não pode ter espaços.";
  if (/^javascript:/i.test(l)) return "Link inválido.";
  return null;
}
