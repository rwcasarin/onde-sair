// Roteiros criados pelo usuário (guardados na conta). Usado pelo site e pela API.
export const LIMITS = { roteiros: 50, steps: 20 };
export const INVEST_LABELS = ["Grátis", "Econômico", "Moderado", "Especial"];

const str = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const text = (v, max) => String(v ?? "").replace(/\r/g, "").trim().slice(0, max);
const list = (v, n, max) => (Array.isArray(v) ? v : []).map(x => str(x, max)).filter(Boolean).slice(0, n);

export const blankStep = (over = {}) => ({ time: "", title: "", sub: "", place: "", optional: false, desc: "", ...over });
export const blankRoteiro = () => ({
  id: "", title: "", vibes: [], vibesAuto: true, desc: "", about: "",
  stats: { tempo: "", invest: 1, ideal: "" },
  steps: [blankStep()],
  tips: { dica: "", horario: "", comoChegar: "", lembrete: "" },
  from: null, createdAt: "", updatedAt: "",
});
export const newRoteiroId = () => "ur" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function cleanRoteiro(r = {}) {
  const invest = Number.isInteger(r.stats?.invest) && r.stats.invest >= 0 && r.stats.invest <= 3 ? r.stats.invest : 1;
  return {
    id: /^ur[a-z0-9]{4,24}$/.test(r.id || "") ? r.id : newRoteiroId(),
    title: str(r.title, 90),
    // sem "vibe principal": a antiga (aff) entra como primeira da lista
    vibes: [...new Set(list([r.aff, ...(Array.isArray(r.vibes) ? r.vibes : [])], 8, 20))],
    vibesAuto: r.vibesAuto === true,   // true: vibes seguem as paradas até a pessoa editar
    desc: text(r.desc, 240),
    about: text(r.about, 1500),
    stats: { tempo: str(r.stats?.tempo, 40), invest, ideal: str(r.stats?.ideal, 60) },
    steps: (Array.isArray(r.steps) ? r.steps : []).slice(0, LIMITS.steps).map(s => ({
      time: str(s?.time, 30), title: str(s?.title, 90), sub: str(s?.sub, 90),
      place: str(s?.place, 20), optional: !!s?.optional, desc: text(s?.desc, 400),
    })),
    tips: { dica: text(r.tips?.dica, 300), horario: str(r.tips?.horario, 60), comoChegar: str(r.tips?.comoChegar, 120), lembrete: text(r.tips?.lembrete, 200) },
    from: r.from && r.from.id ? { id: str(r.from.id, 30), title: str(r.from.title, 90), mine: !!r.from.mine } : null,
    createdAt: str(r.createdAt, 30), updatedAt: str(r.updatedAt, 30),
  };
}
export const cleanRoteiros = (arr) => (Array.isArray(arr) ? arr : []).slice(0, LIMITS.roteiros).map(cleanRoteiro);

// Problemas que impedem salvar (mensagens para o formulário)
export function roteiroErrors(r) {
  const e = {};
  if (r.title.trim().length < 3) e.title = "Dê um nome ao roteiro.";
  if (!r.vibes.length) e.vibes = "Escolha pelo menos uma vibe.";
  if (!r.steps.length) e.steps = "Inclua pelo menos uma parada.";
  else if (r.steps.some(s => !s.title.trim())) e.steps = "Toda parada precisa de um título (ou de um lugar escolhido).";
  return e;
}
