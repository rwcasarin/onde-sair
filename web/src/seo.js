// Título e descrição automáticos (quando o SEO do item não foi preenchido no painel).
// Usados pelo site e pela prévia do Google no painel: os dois mostram exatamente o mesmo texto.
import { whenLabel } from "./events.js";

export const withSite = (s) => s + " · Onde Sair";

export function autoTitle(kind, x = {}) {
  switch (kind) {
    case "places": return withSite(x.name ? [x.name, x.bairro].filter(Boolean).join(" · ") : "Lugar");
    case "events": return withSite(x.title ? `${x.title} · ${whenLabel(x)}` : "Evento");
    case "roteiros": return withSite(x.title || "Roteiro");
    case "stories": return withSite(x.title ? `${x.title} · Radar` : "Radar");
    case "pages": return withSite(x.title || "Página");
    default: return withSite(x.title || x.name || "");
  }
}

// a 1ª opção preenchida; sem nenhuma, o site usa a descrição padrão (Configurações › SEO)
export function autoDesc(kind, x = {}) {
  const pick = { places: [x.tagline, x.desc], events: [x.tagline, x.desc], roteiros: [x.desc, x.about], stories: [x.desc] }[kind] || [];
  return (pick.find(v => v && String(v).trim()) || "").trim();
}
