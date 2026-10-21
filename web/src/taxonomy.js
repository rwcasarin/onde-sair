// Vibes e tipos de lugar oficiais (out/2026). Usados nos dados iniciais e na atualização
// única que aplica a lista no site já publicado (admin/updates.js: 2026-10-vibes-e-tipos).

// [id, nome, frase curta, ícone, cor, fundo, página da vibe]
export const VIBES = [
  ["dates", "Para dates", "Pra começar bem", "heart", "vibe-pink", "tint-date",
    { lede: "Lugares com clima certo pra começar bem — e pra conversa render.", note: "boas conversas começam com um bom lugar.", features: [["wine", "Jantares a dois"], ["music", "Boa música"], ["sun", "Pôr do sol"], ["heart", "Clima romântico"]] }],
  ["impress", "Para impressionar", "Reunião, sogra, BFF", "cheers", "vibe-yellow", "tint-impress",
    { lede: "Lugares especiais para criar boas primeiras impressões e viver momentos que ficam na memória.", note: "boas histórias começam aqui.", features: [["cheers", "Jantares especiais"], ["diamond", "Ocasiões especiais"], ["users", "Encontros românticos"], ["star", "Experiências únicas"]] }],
  ["relax", "Para relaxar", "Domingo sem pressa", "leaf", "vibe-mint", "tint-relax",
    { lede: "Lugares sem pressa, pra quando a semana foi pesada.", note: "domingo sem pressa também é programa.", features: [["leaf", "Natureza"], ["sun", "Luz boa"], ["clock", "Sem pressa"], ["heart", "Bem-estar"]] }],
  ["turist", "Para turistar", "Chegou agora", "camera", "vibe-lavender", "tint-turist",
    { lede: "Chegou agora? O essencial da cidade, do jeito de quem mora aqui.", note: "conhecer a cidade pelos olhos de quem vive nela.", features: [["camera", "Cartões-postais"], ["landmark", "Cultura"], ["star", "Clássicos locais"], ["pin", "Bairros históricos"]] }],
  ["eco", "Para economizar", "Vale cada real", "coins", "vibe-orange", "tint-eco",
    { lede: "Programas que cabem no bolso e não cabem no esquecimento.", note: "vale cada real, e sobra história pra contar.", features: [["coins", "Preço justo"], ["star", "Grátis e bons"], ["users", "Pra ir em turma"], ["heart", "Achados locais"]] }],
  ["crianca", "Para a criançada", "Família toda feliz", "smile", "vibe-sky", "tint-crianca",
    { lede: "Lugares testados com criança de verdade: espaço, sombra e diversão.", note: "a família toda feliz no mesmo rolê.", features: [["smile", "Diversão"], ["leaf", "Ao ar livre"], ["star", "Estrutura boa"], ["heart", "Família toda"]] }],
  ["amigos", "Para curtir com amigos", "Rolê em turma", "users", "vibe-coral", "tint-turist",
    { lede: "Mesa grande, petisco pra dividir e lugar pra conversa render com a turma toda.", note: "os melhores rolês têm mais de duas cadeiras.", features: [["users", "Mesas grandes"], ["cheers", "Pra brindar"], ["music", "Boa trilha"], ["coins", "Conta que divide bem"]] }],
  ["comemorar", "Para comemorar", "Tem motivo pra brindar", "sparkle", "vibe-violet", "tint-impress",
    { lede: "Aniversário, promoção ou só porque sim: lugares que transformam a data em festa.", note: "toda conquista merece um brinde.", features: [["cheers", "Brindes"], ["star", "Ocasiões especiais"], ["users", "Mesa pra galera"], ["sparkle", "Clima de festa"]] }],
  ["dancar", "Para dançar", "Pista cheia", "music", "vibe-lime", "tint-date",
    { lede: "Pistas, festas e música boa pra dançar até o corpo pedir arrego.", note: "a noite só acaba quando a música para.", features: [["music", "Boa música"], ["sparkle", "Pista cheia"], ["clock", "Até tarde"], ["users", "Galera animada"]] }],
];

// [id, nome, endereço, cor, ícone]
export const PLACE_TYPES = [
  ["restaurantes", "Restaurantes", "restaurantes", "vibe-orange", "utensils"],
  ["bares", "Bares", "bares", "vibe-pink", "cheers"],
  ["cafes-padarias", "Cafés e padarias", "cafes-e-padarias", "vibe-yellow", "coffee"],
  ["parques", "Parques", "parques", "vibe-mint", "tree"],
  ["musica-ao-vivo", "Música ao vivo", "musica-ao-vivo", "vibe-lavender", "music"],
  ["baladas-festas", "Baladas e festas", "baladas-e-festas", "vibe-violet", "sparkle"],
  ["cultura", "Cultura", "cultura", "vibe-sky", "landmark"],
  ["lazer", "Lazer", "lazer", "vibe-coral", "smile"],
  ["natureza-aventura", "Natureza e aventura", "natureza-e-aventura", "vibe-lime", "leaf"],
  ["bem-estar", "Bem-estar", "bem-estar", "vibe-mint", "sun"],
  ["passeios", "Passeios e pontos turísticos", "passeios-e-pontos-turisticos", "vibe-sky", "camera"],
  ["feiras-mercados", "Feiras e mercados", "feiras-e-mercados", "vibe-orange", "basket"],
].map(([id, label, slug, cls, icon]) => ({ id, label, slug, cls, icon }));

export const vibeRecord = ([id, label, sub, icon, cls, tint, page]) => ({ id, label, sub, slug: "para-" + ({ dates: "dates", crianca: "a-criancada", amigos: "curtir-com-amigos" }[id] || label.replace(/^Para /, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  tint, icon, cls, active: true, count: 0, ...page });

// Tipos que saíram: para onde vai cada lugar (pelo texto do cadastro)
export function newTypeFor(p) {
  const txt = [p.name, p.sub, p.cuisine, p.tagline, String(p.desc || "").replace(/<[^>]+>/g, " ")].join(" ").toLowerCase();
  if (p.type === "Shows e baladas") return /show|ao vivo|samba|banda|palco|jazz|mpb|forr[oó]|pagode|sertanej/.test(txt) ? "Música ao vivo" : "Baladas e festas";
  if (p.type === "Eventos") return /feira|mercad/.test(txt) ? "Feiras e mercados" : "Cultura";
  return p.type;
}
