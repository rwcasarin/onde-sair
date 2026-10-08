// =====================================================================
// Onde Sair — mock data
// Cobertura nacional · cidade ativa definida pelo usuário
// Brief: 6 afinidades de contexto + 5 tipos de lugar (filtros)
// =====================================================================

const CITIES = [
  { id: "sorocaba", name: "Sorocaba",   sub: "SP", active: true },
  { id: "sp",   name: "São Paulo",      sub: "SP", active: true },
  { id: "rio",  name: "Rio de Janeiro", sub: "RJ", active: true },
  { id: "bh",   name: "Belo Horizonte", sub: "MG", active: true },
  { id: "cwb",  name: "Curitiba",       sub: "PR", active: true },
  { id: "poa",  name: "Porto Alegre",   sub: "RS", active: true },
  { id: "rec",  name: "Recife",         sub: "PE", active: true },
];

// Camada 1 — Contexto (chips roxos cheios · DESTAQUE)
const AFFINITIES = [
  { id: "dates",    label: "Para dates",       sub: "Pra começar bem",     slug: "para-dates",       tint: "tint-date",    count: 18 },
  { id: "impress",  label: "Pra impressionar", sub: "Reunião, sogra, BFF", slug: "para-impressionar",tint: "tint-impress", count: 12 },
  { id: "turist",   label: "Pra turistar",     sub: "Chegou agora",        slug: "para-turistar",    tint: "tint-turist",  count: 22 },
  { id: "relax",    label: "Pra relaxar",      sub: "Domingo sem pressa",  slug: "para-relaxar",     tint: "tint-relax",   count: 16 },
  { id: "eco",      label: "Pra economizar",   sub: "Vale cada real",      slug: "para-economizar",  tint: "tint-eco",     count: 19 },
  { id: "crianca",  label: "Pra criançada",    sub: "Família toda feliz",  slug: "para-a-criancada", tint: "tint-crianca", count: 11 },
];

// Camada 2 — Tipo (chips outline · FILTRO)
const TYPES = [
  { id: "restaurantes",   label: "Restaurantes",     slug: "restaurantes" },
  { id: "bares",          label: "Bares",            slug: "bares" },
  { id: "parques",        label: "Parques",          slug: "parques" },
  { id: "shows-baladas",  label: "Shows e baladas",  slug: "shows-e-baladas" },
  { id: "eventos",        label: "Eventos",          slug: "eventos" },
];

const ROTEIROS = [
  {
    id: "r1",
    aff: "dates", affLabel: "Para dates", tint: "tint-date",
    title: "Date sem clichê: do drinque ao último gole",
    desc: "Bar com pegada, jantar que rende conversa, sobremesa que ninguém esquece. Tudo a poucos passos um do outro.",
    paradas: 4,
    bairros: "Jardins · Vila Nova",
  },
  {
    id: "r2",
    aff: "turist", affLabel: "Pra turistar", tint: "tint-turist",
    title: "Chegou agora? Comece pelo Centro Histórico",
    desc: "Catedral, mercado municipal, parque histórico e os cafés que os locais mantêm em segredo.",
    paradas: 5,
    bairros: "Centro · Boa Vista",
  },
  {
    id: "r3",
    aff: "impress", affLabel: "Pra impressionar", tint: "tint-impress",
    title: "Lugares que pouca gente conhece (e que vão te fazer parecer entendido)",
    desc: "Endereços escondidos, atmosfera única. Pra chegar e já causar antes da carta sair.",
    paradas: 3,
    bairros: "Vila Nova · Santa Cecília",
  },
  {
    id: "r4",
    aff: "relax", affLabel: "Pra relaxar", tint: "tint-relax",
    title: "Domingo sem pressa: parque, café e pôr do sol",
    desc: "Quando a semana foi pesada, esse é o roteiro. Verde, calma e nada de pressa.",
    paradas: 3,
    bairros: "Parque Municipal · Centro",
  },
  {
    id: "r5",
    aff: "eco", affLabel: "Pra economizar", tint: "tint-eco",
    title: "Rolê completo por menos de R$ 80",
    desc: "Comida boa, programa de graça, drinque honesto. Cabe no bolso e não cabe no esquecimento.",
    paradas: 4,
    bairros: "Centro · Boa Vista",
  },
  {
    id: "r6",
    aff: "crianca", affLabel: "Pra criançada", tint: "tint-crianca",
    title: "Sábado com as crianças: do parque ao sorvete artesanal",
    desc: "Quatro paradas testadas com criança de verdade — todas com troca, banheiro decente e sombra.",
    paradas: 4,
    bairros: "Parque Municipal · Jardins",
  },
];

// Lugares fictícios · nomes, bairros e endereços plausíveis
const PLACES = [
  {
    id: "p1",
    name: "Quintal do Centro",
    type: "Bares",
    bairro: "Centro",
    desc: "Boteco com mesa na calçada, chope honesto e o melhor pastel da região. Conversa que dura até fechar.",
    dica: "Chega antes das 19h e pega a mesa do fundo. Peça o pastel de pernil — não tá no cardápio, tá no balcão.",
    by: "Curadoria · Marina F.",
    affs: ["dates", "eco"],
    tint: "tint-eco",
    rating: 4.7, reviews: 248,
    priceLevel: 1,
    open: "Ter–Sáb · 17h – 00h",
    end: "R. Padre Luiz, 84 · Centro",
    map: { x: 32, y: 56, label: "QC" },
  },
  {
    id: "p2",
    name: "Mesa 14",
    type: "Restaurantes",
    bairro: "Jardins",
    desc: "Cozinha autoral, balcão aberto pra cozinha, menu que muda toda semana. Sem reserva é loteria.",
    dica: "Mesa do balcão é a melhor da casa. Reserva com 1 semana, peça o degustação de 5 tempos.",
    by: "Curadoria · Lucas P.",
    affs: ["impress", "dates"],
    tint: "tint-impress",
    rating: 4.9, reviews: 312,
    priceLevel: 3,
    open: "Qua–Sáb · 19h – 23h",
    end: "Al. dos Ipês, 1024 · Jardins",
    map: { x: 56, y: 30, label: "M14" },
  },
  {
    id: "p3",
    name: "Florado Café",
    type: "Restaurantes",
    bairro: "Vila Nova",
    desc: "Especialidade, brunch de fim de semana, pão de fermentação natural. Luz da manhã imbatível.",
    dica: "Sábado 10h, mesa da janela. Coado do dia + pão na chapa = combinação assinada da casa.",
    by: "Curadoria · Ana C.",
    affs: ["relax", "eco"],
    tint: "tint-relax",
    rating: 4.8, reviews: 412,
    priceLevel: 2,
    open: "Diariamente · 8h – 19h",
    end: "R. Cesário Mota, 217 · Vila Nova",
    map: { x: 22, y: 38, label: "FC" },
  },
  {
    id: "p5",
    name: "Clube Aurora",
    type: "Shows e baladas",
    bairro: "Boa Vista",
    desc: "Pista boa, line-up que respeita house e disco. Atmosfera continua até o sol nascer.",
    dica: "Antes das 23h30 entra sem fila. Depois disso, só com lista — siga o perfil da casa.",
    by: "Curadoria · Rafael S.",
    affs: ["impress"],
    tint: "tint-impress",
    rating: 4.6, reviews: 184,
    priceLevel: 2,
    open: "Sex–Sáb · 23h – 5h",
    end: "R. Padre Anchieta, 412 · Boa Vista",
    map: { x: 80, y: 22, label: "AS" },
  },
  {
    id: "p6",
    name: "Cine Vitória",
    type: "Eventos",
    bairro: "Centro",
    desc: "Sala única, curadoria de cinema independente, pipocário gourmet. O cinema que a cidade estava devendo.",
    dica: "Sessão de quinta tem chope de cortesia. Filme cult + chope = combinação correta.",
    by: "Curadoria · Marina F.",
    affs: ["dates", "eco"],
    tint: "tint-eco",
    rating: 4.7, reviews: 296,
    priceLevel: 1,
    open: "Programação semanal",
    end: "R. da Penha, 165 · Centro",
    map: { x: 44, y: 70, label: "CV" },
  },
  {
    id: "p7",
    name: "Feira do Largo",
    type: "Eventos",
    bairro: "Centro",
    desc: "Chorinho ao vivo, antiguidades, pastel de feira de verdade. A cidade antiga inteira na rua.",
    dica: "Sábado às 13h. Pastel de queijo + caldo de cana — e depois quiosque do Seu Toninho.",
    by: "Curadoria · time Onde Sair",
    affs: ["crianca", "turist", "eco"],
    tint: "tint-crianca",
    rating: 4.7, reviews: 540,
    priceLevel: 0,
    open: "Sábados · 9h – 18h",
    end: "Largo do São Bento · Centro",
    map: { x: 12, y: 70, label: "LSB" },
  },
  {
    id: "p8",
    name: "Casa Komorebi",
    type: "Restaurantes",
    bairro: "Santa Cecília",
    desc: "Asiático contemporâneo. Bao de costela, drink de soju, atmosfera de jantar de amigos.",
    dica: "Reserva pra dois, mesa do balcão. Comece pelo bao e termine no bibimbap.",
    by: "Curadoria · Lucas P.",
    affs: ["dates", "impress"],
    tint: "tint-impress",
    rating: 4.8, reviews: 224,
    priceLevel: 2,
    open: "Ter–Sáb · 19h – 23h30",
    end: "R. Souza Pereira, 538 · Santa Cecília",
    map: { x: 62, y: 80, label: "KMR" },
  },
  {
    id: "p9",
    name: "Bar do Z'é",
    type: "Bares",
    bairro: "Boa Vista",
    desc: "Boteco de raiz, balcão de mármore, caipirinha forte. Roda de samba toda quinta.",
    dica: "Quinta 21h é roda. Chega cedo, peça a porção de torresmo — pra duas pessoas dá pra três.",
    by: "Curadoria · Carlos M.",
    affs: ["eco", "turist"],
    tint: "tint-turist",
    rating: 4.6, reviews: 178,
    priceLevel: 1,
    open: "Qua–Dom · 18h – 00h",
    end: "R. Aparecida, 312 · Boa Vista",
    map: { x: 50, y: 50, label: "Z" },
  },
];

const REVIEWS = [
  { name: "Bruna T.",  when: "há 3 dias",   text: "Segui o roteiro inteiro num sábado. Não precisei improvisar nem uma vez — chegou na hora certa, comeu bem, voltou rindo." },
  { name: "Caio R.",   when: "há 1 semana", text: "Dica do balcão antes das 19h salvou a noite. A fila depois disso é absurda, ninguém me avisou antes." },
  { name: "Helena M.", when: "há 2 semanas",text: "Atendimento atento sem ser exagerado. Conta saiu redonda, o lugar tem alma. Já voltei duas vezes." },
];

const NOTIFICATIONS = [
  { id: "n1", kind: "ROTEIRO NOVO", title: "Um rolê novo pro seu domingo", body: "Marina montou um circuito de cafés no centro. 4 paradas, R$ 0 de entrada.", when: "agora", unread: true },
  { id: "n3", kind: "FAVORITO",     title: "Florado Café liberou brunch aos sábados", body: "Você salvou. Agora rola coado especial das 10h às 14h.", when: "ontem", unread: false },
  { id: "n4", kind: "AGENDA",       title: "Sábado tem feira do Largo São Bento", body: "Chorinho começa às 13h, pastel de queijo é parada obrigatória.", when: "2 dias", unread: false },
  { id: "n5", kind: "AMIGO",        title: "Rafa salvou 3 lugares na sua lista 'aniversário'", body: "Aurora, Komorebi e Mesa 14. Que tal abrir um plano em grupo?", when: "3 dias", unread: false },
];

const FAV_LISTS = [
  { id: "l1", title: "Aniversário da Bia",       count: 6, when: "Sáb, 14 jun",       tint: "tint-impress", thumbs: ["tint-impress","tint-date","tint-impress"] },
  { id: "l2", title: "Quando meus pais vierem",  count: 9, when: "Pendente",          tint: "tint-turist",  thumbs: ["tint-turist","tint-relax","tint-crianca"] },
  { id: "l3", title: "Rolês de domingo",         count: 12,when: "Atualizado ontem",  tint: "tint-relax",   thumbs: ["tint-relax","tint-eco","tint-relax"] },
  { id: "l4", title: "Pra impressionar o chefe", count: 4, when: "Atualizado há 1 sem", tint: "tint-impress", thumbs: ["tint-impress","tint-date","tint-impress"] },
];

const USER = {
  name: "Maria Antônia",
  initials: "MA",
  city: "Sorocaba",
  joined: "Março 2026",
  saves: 32,
  done: 14,
  lists: 4,
};

const TAGLINES = {
  hero:     "Não é um guia.",
  heroEm:   "É uma dica.",
  sub:      "Curadoria por afinidade.",
  campaign: "Sua cidade tem mais do que você imagina.",
  about:    "O roteiro é nosso. A escolha é sua.",
};

export { CITIES, AFFINITIES, TYPES, ROTEIROS, PLACES, REVIEWS, NOTIFICATIONS, FAV_LISTS, USER, TAGLINES };

export const cityName = (id) => (CITIES.find(c => c.id === id) || CITIES[0] || { name: "Sorocaba" }).name;
export const priceLabel = (level) => level === 0 ? "Grátis" : "R$".repeat(level);

// =====================================================================
// Home v2 — "Qual é a vibe hoje?"
// Imagens: cada item aponta para um arquivo em public/images/…
// Enquanto o arquivo não existir, a área aparece demarcada (ImageSlot).
// =====================================================================

// Cor + ícone de cada afinidade (pílulas coloridas da home)
export const VIBE_STYLE = {
  dates:   { icon: "heart",  cls: "vibe-pink"     },
  impress: { icon: "cheers", cls: "vibe-yellow"   },
  relax:   { icon: "leaf",   cls: "vibe-mint"     },
  turist:  { icon: "camera", cls: "vibe-lavender" },
  eco:     { icon: "coins",  cls: "vibe-orange"   },
  crianca: { icon: "smile",  cls: "vibe-sky"      },
};
// Ordem das pílulas no hero (igual ao layout)
export const VIBE_ORDER = ["dates", "impress", "relax", "turist", "eco", "crianca"];

export const HERO = {
  img: "images/home/hero.jpg",
  note: "boas companhias também fazem parte do roteiro.",
  geoWords: ["Mais cultura", "Mais encontros", "Mais histórias"],
};

// "Dicas para hoje" — um lugar por afinidade
export const TIPS_TODAY = [
  { place: "p8", aff: "dates"   },
  { place: "p2", aff: "impress" },
  { place: "p3", aff: "relax"   },
  { place: "p7", aff: "turist"  },
  { place: "p9", aff: "eco"     },
  { place: "parque-das-aguas", aff: "crianca" },
];
export const placeImg = (id) => `images/lugares/${id}.jpg`;

// "Dicas de quem já foi" — conteúdos editoriais
export const STORIES = [
  {
    id: "s1", tag: "Vida noturna", tone: "purple", shape: "teal",
    title: "5 bares com música boa pra sair hoje",
    desc: "Do jazz ao eletrônico, uma seleção pra quem não dispensa uma boa trilha sonora.",
    img: "images/home/historia-1.jpg",
  },
  {
    id: "s2", tag: "Ao ar livre", tone: "green", shape: "purple",
    title: "Roteiro de um dia no parque",
    desc: "Arte, natureza, gastronomia e boas surpresas em um dos lugares mais queridos da cidade.",
    img: "images/home/historia-2.jpg",
  },
  {
    id: "s3", tag: "Comer bem", tone: "orange", shape: "lavender",
    title: "Onde comer bem (e sem gastar muito)",
    desc: "Lugares deliciosos, com preços justos e cheios de personalidade.",
    img: "images/home/historia-3.jpg",
  },
];

// Todas as histórias publicadas (cada uma tem página em /historias/{slug})
export const ALL_STORIES = STORIES.map(s => ({ ...s }));

// "Roteiros por vibe"
export const VIBE_ROTEIROS = [
  { id: "v1", title: "Vibe Romântica", desc: "Jantares, bares e lugares para se conectar.", icon: "heart",    cls: "vibe-pink",     img: "images/home/vibe-romantica.jpg" },
  { id: "v2", title: "Vibe Cultural",  desc: "Museus, exposições e arte pela cidade.",      icon: "landmark", cls: "vibe-yellow",   img: "images/home/vibe-cultural.jpg"  },
  { id: "v3", title: "Vibe Natureza",  desc: "Parques, trilhas e respiros urbanos.",        icon: "tree",     cls: "vibe-mint",     img: "images/home/vibe-natureza.jpg"  },
  { id: "v4", title: "Vibe Noturna",   desc: "Baladas, shows e noites inesquecíveis.",      icon: "martini",  cls: "vibe-lavender", img: "images/home/vibe-noturna.jpg"   },
];

export const BRAND_VALUES = [
  { icon: "users",  text: "Curadoria humana e independente" },
  { icon: "pin",    text: "Lugares visitados e aprovados" },
  { icon: "star",   text: "Dicas de quem vive a cidade" },
  { icon: "heart",  text: "Apoie o que é local e faça a cidade girar" },
];

// =====================================================================
// v3 — páginas de vibe, lugar e roteiro
// =====================================================================

// Lugares novos (mesmo formato dos anteriores)
PLACES.push(
  {
    id: "p10", name: "Mirante 360", type: "Restaurantes", bairro: "Jardins",
    desc: "Rooftop com vista panorâmica, gastronomia autoral e clima sofisticado. O pôr do sol aqui vira assunto.",
    dica: "Reserve a mesa do canto da varanda para 18h — você pega o pôr do sol inteiro e a cidade acendendo.",
    by: "Curadoria · Lucas P.", affs: ["impress", "dates"], tint: "tint-impress",
    rating: 4.8, reviews: 1200, priceLevel: 3,
    open: "Ter–Dom · 12h – 00h", end: "Al. das Palmeiras, 1800 · Jardins",
    map: { x: 60, y: 18, label: "M360" },
  },
  {
    id: "p11", name: "Museu da Cidade", type: "Eventos", bairro: "Centro",
    desc: "Arte, arquitetura e vistas icônicas. Um programa cultural que sempre impressiona.",
    dica: "Terça a entrada é gratuita. Termine no café do último andar, a vista do vão central é outra.",
    by: "Curadoria · Ana C.", affs: ["turist", "impress", "eco"], tint: "tint-turist",
    rating: 4.8, reviews: 1500, priceLevel: 1,
    open: "Ter–Dom · 10h – 18h", end: "Av. Central, 1578 · Centro",
    map: { x: 38, y: 62, label: "MC" },
  },
  {
    id: "p12", name: "Brasa & Lenha", type: "Restaurantes", bairro: "Vila Nova",
    desc: "Cozinha brasileira criativa, feita na brasa. Um dos endereços mais comentados da cidade.",
    dica: "Peça o menu do chef e deixe a sobremesa de rapadura chegar sem perguntar.",
    by: "Curadoria · Carlos M.", affs: ["impress", "dates"], tint: "tint-date",
    rating: 4.7, reviews: 2100, priceLevel: 3,
    open: "Seg–Sáb · 12h – 23h", end: "R. Cesário Mota, 90 · Vila Nova",
    map: { x: 26, y: 30, label: "B&L" },
  },
  {
    id: "p13", name: "Jardim Suspenso", type: "Bares", bairro: "Santa Cecília",
    desc: "Drinks autorais, comidinhas pra dividir e um jardim encantador no meio da cidade.",
    dica: "Quarta tem happy hour até 20h. Peça o drink de cajá e a porção de bolinho de mandioca.",
    by: "Curadoria · Marina F.", affs: ["dates", "relax"], tint: "tint-relax",
    rating: 4.6, reviews: 892, priceLevel: 2,
    open: "Ter–Dom · 17h – 01h", end: "R. das Acácias, 77 · Santa Cecília",
    map: { x: 72, y: 76, label: "JS" },
  },
  {
    id: "p14", name: "Sorveteria Polar", type: "Restaurantes", bairro: "Jardins",
    desc: "Sorvete artesanal com fruta da estação. Fila curta, sabor que fica na memória.",
    dica: "O sabor do mês sempre vale. Criança pode provar três antes de escolher.",
    by: "Curadoria · time Onde Sair", affs: ["crianca", "eco", "relax"], tint: "tint-crianca",
    rating: 4.9, reviews: 640, priceLevel: 1,
    open: "Diariamente · 11h – 22h", end: "R. dos Ipês, 412 · Jardins",
    map: { x: 48, y: 36, label: "SP" },
  },
  {
    id: "p15", name: "Galpão 22", type: "Shows e baladas", bairro: "Zona Norte",
    desc: "Shows ao vivo num galpão restaurado. Do samba ao indie, a agenda é sempre boa.",
    dica: "Compre antecipado: na porta é mais caro. Fique perto da mesa de som, o áudio é melhor.",
    by: "Curadoria · Rafael S.", affs: ["turist", "impress"], tint: "tint-turist",
    rating: 4.5, reviews: 780, priceLevel: 2,
    open: "Qui–Sáb · 20h – 03h", end: "Av. das Indústrias, 22 · Zona Norte",
    map: { x: 86, y: 48, label: "G22" },
  },
);

// Campos complementares por lugar
const PLACE_EXTRA = {
  p1:  { sub: "Boteco de calçada", cuisine: "Petiscos e chope", tagline: "Chope honesto, pastel lendário e conversa que só acaba quando fecha.", tags: ["Boteco", "Chope", "Ao ar livre"], momento: ["Happy hour", "Noite"], ambiente: ["Ambiente externo"], reserva: false, extras: ["Boa música", "Para ir com amigos"], note: "chope gelado e conversa sem hora pra acabar.", phone: "(00) 3200-1084", site: "quintaldocentro.com.br", insta: "@quintaldocentro",
         reasons: [["users", "Mesa na calçada e clima de encontro"], ["star", "O pastel de pernil mais famoso da região"], ["coins", "Preço justo do começo ao fim"], ["music", "Samba de vez em quando, sem aviso"], ["heart", "Ótimo pra um date sem pressão"]] },
  p2:  { sub: "Cozinha autoral", cuisine: "Contemporânea", tagline: "Balcão aberto pra cozinha e um menu que muda toda semana.", tags: ["Degustação", "Alta gastronomia", "Ocasiões especiais"], momento: ["Jantar"], ambiente: ["Ambiente interno"], reserva: true, extras: ["Experiência única"], note: "a melhor mesa da casa é no balcão.", phone: "(00) 3300-1024", site: "mesa14.com.br", insta: "@mesa14",
         reasons: [["eye", "Cozinha aberta: o jantar vira espetáculo"], ["star", "Menu degustação de 5 tempos"], ["sparkle", "Pratos que mudam toda semana"], ["users", "Serviço atento sem ser exagerado"], ["heart", "Perfeito para ocasiões especiais"]] },
  p3:  { sub: "Café de especialidade", cuisine: "Café e brunch", tagline: "Coado do dia, pão de fermentação natural e a melhor luz da manhã.", tags: ["Brunch", "Café especial", "Padaria"], momento: ["Brunch", "Almoço"], ambiente: ["Ambiente interno", "Ambiente externo"], reserva: false, extras: ["Boa luz", "Sem pressa"], note: "sábado de manhã tem outro gosto aqui.", phone: "(00) 3400-0217", site: "floradocafe.com.br", insta: "@floradocafe",
         reasons: [["sun", "Luz da manhã imbatível na janela"], ["star", "Pão de fermentação natural feito ali"], ["leaf", "Clima calmo, ninguém te apressa"], ["coins", "Brunch completo com preço honesto"], ["heart", "Ótimo pra começar o domingo"]] },
  p5:  { sub: "Clube de música", cuisine: "Bar e pista", tagline: "Line-up que respeita house e disco, até o sol nascer.", tags: ["Balada", "House", "Disco"], momento: ["Noite"], ambiente: ["Ambiente interno"], reserva: false, extras: ["Boa música", "Para ir com amigos"], note: "a pista só esquenta depois da meia-noite.", phone: "(00) 3500-0412", site: "clubeaurora.com.br", insta: "@clubeaurora",
         reasons: [["music", "Line-up de house e disco caprichado"], ["sparkle", "Som e luz de primeira"], ["users", "Público animado e sem pose"], ["star", "Entrada sem fila antes das 23h30"], ["heart", "Noite pra lembrar"]] },
  p6:  { sub: "Cinema de rua", cuisine: "Cinema e bar", tagline: "Sala única, cinema independente e pipoca que vale a ida.", tags: ["Cinema", "Cultura", "Programa a dois"], momento: ["Experiência cultural", "Noite"], ambiente: ["Ambiente interno"], reserva: true, extras: ["Programa a dois"], note: "filme cult e chope: combinação correta.", phone: "(00) 3600-0165", site: "cinevitoria.com.br", insta: "@cinevitoria",
         reasons: [["eye", "Curadoria de filmes independentes"], ["star", "Pipoca gourmet de verdade"], ["coins", "Ingresso com preço justo"], ["heart", "Programa perfeito a dois"], ["sparkle", "Chope de cortesia às quintas"]] },
  p7:  { sub: "Feira de rua", cuisine: "Comida de feira", tagline: "Chorinho ao vivo, antiguidades e pastel de feira de verdade.", tags: ["Feira", "Música ao vivo", "Grátis"], momento: ["Almoço", "Experiência cultural"], ambiente: ["Ambiente externo"], reserva: false, extras: ["Boa música", "Para ir com crianças"], note: "sábado de sol e chorinho na praça.", phone: "—", site: "feiradolargo.org", insta: "@feiradolargo",
         reasons: [["music", "Chorinho ao vivo a partir das 13h"], ["star", "Pastel de queijo e caldo de cana"], ["camera", "Antiguidades e achados únicos"], ["coins", "Entrada gratuita"], ["smile", "Programa para a família toda"]] },
  p8:  { sub: "Asiático contemporâneo", cuisine: "Asiática", tagline: "Bao de costela, drink de soju e clima de jantar entre amigos.", tags: ["Asiático", "Drinks", "Jantar"], momento: ["Jantar", "Happy hour"], ambiente: ["Ambiente interno"], reserva: true, extras: ["Para ir com amigos"], note: "comece pelo bao, termine no bibimbap.", phone: "(00) 3800-0538", site: "casakomorebi.com.br", insta: "@casakomorebi",
         reasons: [["star", "O bao de costela mais pedido da casa"], ["users", "Clima de jantar entre amigos"], ["wine", "Drinks de soju bem equilibrados"], ["heart", "Balcão perfeito pra dois"], ["sparkle", "Ambiente intimista e bonito"]] },
  p9:  { sub: "Boteco de raiz", cuisine: "Bar e petiscos", tagline: "Balcão de mármore, caipirinha forte e roda de samba toda quinta.", tags: ["Samba", "Boteco", "Petiscos"], momento: ["Happy hour", "Noite"], ambiente: ["Ambiente interno", "Ambiente externo"], reserva: false, extras: ["Boa música", "Para ir com amigos"], note: "quinta é dia de roda de samba.", phone: "(00) 3900-0312", site: "bardoze.com.br", insta: "@bardoze",
         reasons: [["music", "Roda de samba toda quinta"], ["star", "Torresmo que serve três"], ["coins", "Preço de boteco de verdade"], ["users", "Galera animada e acolhedora"], ["heart", "Alma de bar antigo"]] },
  p10: { sub: "Rooftop", cuisine: "Contemporânea", tagline: "Boa comida, drinks autorais e uma das vistas mais lindas da cidade.", tags: ["Rooftop", "Alta gastronomia", "Vista incrível"], momento: ["Jantar", "Happy hour"], ambiente: ["Ambiente externo"], reserva: true, extras: ["Vista linda", "Boa música", "Para ir com amigos"], note: "arte, boa comida e essa vista incrível.", phone: "(00) 2842-9120", site: "mirante360.com.br", insta: "@mirante360",
         reasons: [["eye", "Uma das melhores vistas da cidade"], ["star", "Gastronomia autoral contemporânea"], ["image", "Pertinho de exposições incríveis"], ["users", "Ambiente elegante e descontraído"], ["heart", "Perfeito para dates e encontros especiais"]] },
  p11: { sub: "Museu", cuisine: "Arte e cultura", tagline: "Arte, arquitetura e vistas icônicas num só programa.", tags: ["Cultura", "Arte", "Programa a dois"], momento: ["Experiência cultural"], ambiente: ["Ambiente interno"], reserva: false, extras: ["Experiência única"], note: "boas histórias começam aqui.", phone: "(00) 3011-1578", site: "museudacidade.org", insta: "@museudacidade",
         reasons: [["image", "Acervo que vale a visita sozinho"], ["eye", "Arquitetura icônica"], ["coins", "Gratuito às terças"], ["star", "Café com vista no último andar"], ["users", "Programa ótimo pra receber visitas"]] },
  p12: { sub: "Cozinha brasileira", cuisine: "Brasileira contemporânea", tagline: "Cozinha brasileira criativa, feita na brasa.", tags: ["Gastronomia", "Cozinha brasileira", "Experiência"], momento: ["Jantar", "Almoço"], ambiente: ["Ambiente interno"], reserva: true, extras: ["Experiência única"], note: "fogo, tempo e ingrediente bom.", phone: "(00) 3022-0090", site: "brasaelenha.com.br", insta: "@brasaelenha",
         reasons: [["star", "Menu do chef surpreendente"], ["leaf", "Ingredientes de pequenos produtores"], ["sparkle", "Tudo feito na brasa"], ["users", "Serviço caloroso"], ["heart", "Ótimo pra impressionar"]] },
  p13: { sub: "Bar de drinks", cuisine: "Drinks e petiscos", tagline: "Drinks autorais e um jardim escondido no meio da cidade.", tags: ["Jantar", "Ambiente externo", "Drinks"], momento: ["Happy hour", "Jantar"], ambiente: ["Ambiente externo"], reserva: true, extras: ["Vista linda", "Para ir com amigos"], note: "um respiro verde com drink na mão.", phone: "(00) 3033-0077", site: "jardimsuspenso.com.br", insta: "@jardimsuspenso",
         reasons: [["leaf", "Jardim encantador ao ar livre"], ["wine", "Drinks autorais com frutas brasileiras"], ["clock", "Happy hour às quartas"], ["users", "Bom pra grupo pequeno"], ["heart", "Clima perfeito pra date"]] },
  p14: { sub: "Sorvete artesanal", cuisine: "Sorveteria", tagline: "Fruta da estação, massa cremosa e fila que anda rápido.", tags: ["Doces", "Família", "Artesanal"], momento: ["Almoço", "Brunch"], ambiente: ["Ambiente interno"], reserva: false, extras: ["Para ir com crianças"], note: "a sobremesa que todo roteiro merece.", phone: "(00) 3044-0412", site: "polar.com.br", insta: "@sorveteriapolar",
         reasons: [["leaf", "Fruta da estação de verdade"], ["smile", "Criança prova antes de escolher"], ["coins", "Preço amigo"], ["clock", "Aberto todo dia até tarde"], ["heart", "Sabor que fica na memória"]] },
  p15: { sub: "Casa de shows", cuisine: "Bar e shows", tagline: "Shows ao vivo num galpão restaurado, do samba ao indie.", tags: ["Shows", "Música ao vivo", "Noite"], momento: ["Noite"], ambiente: ["Ambiente interno"], reserva: false, extras: ["Boa música", "Para ir com amigos"], note: "a noite começa quando a banda sobe.", phone: "(00) 3055-0022", site: "galpao22.com.br", insta: "@galpao22",
         reasons: [["music", "Agenda de shows sempre boa"], ["sparkle", "Galpão restaurado lindíssimo"], ["star", "Som muito bem resolvido"], ["users", "Público diverso e animado"], ["heart", "Noite pra lembrar"]] },
};
PLACES.forEach(p => Object.assign(p, PLACE_EXTRA[p.id]));

export const placeGallery = (id) => [1, 2, 3, 4].map(n => `images/lugares/${id}-${n}.jpg`);
export const PRICE_RANGE = ["Grátis", "R$ 30 – 60", "R$ 60 – 120", "R$ 150 – 300"];
export const PRICE_BUCKETS = [
  { level: 0, label: "Grátis" },
  { level: 1, label: "Até R$ 50" },
  { level: 2, label: "R$ 50 – 120" },
  { level: 3, label: "Acima de R$ 120" },
];
export const MOMENTOS = ["Jantar", "Almoço", "Happy hour", "Brunch", "Noite", "Experiência cultural"];
export const AMBIENTES = ["Ambiente interno", "Ambiente externo"];

// Conteúdo da página de cada vibe
export const VIBE_PAGE = {
  dates:   { lede: "Lugares com clima certo pra começar bem — e pra conversa render.", note: "boas conversas começam com um bom lugar.", features: [["wine", "Jantares a dois"], ["music", "Boa música"], ["sun", "Pôr do sol"], ["heart", "Clima romântico"]] },
  impress: { lede: "Lugares especiais para criar boas primeiras impressões e viver momentos que ficam na memória.", note: "boas histórias começam aqui.", features: [["cheers", "Jantares especiais"], ["diamond", "Ocasiões especiais"], ["users", "Encontros românticos"], ["star", "Experiências únicas"]] },
  turist:  { lede: "Chegou agora? O essencial da cidade, do jeito de quem mora aqui.", note: "conhecer a cidade pelos olhos de quem vive nela.", features: [["camera", "Cartões-postais"], ["landmark", "Cultura"], ["star", "Clássicos locais"], ["pin", "Bairros históricos"]] },
  relax:   { lede: "Lugares sem pressa, pra quando a semana foi pesada.", note: "domingo sem pressa também é programa.", features: [["leaf", "Natureza"], ["sun", "Luz boa"], ["clock", "Sem pressa"], ["heart", "Bem-estar"]] },
  eco:     { lede: "Programas que cabem no bolso e não cabem no esquecimento.", note: "vale cada real, e sobra história pra contar.", features: [["coins", "Preço justo"], ["star", "Grátis e bons"], ["users", "Pra ir em turma"], ["heart", "Achados locais"]] },
  crianca: { lede: "Lugares testados com criança de verdade: espaço, sombra e diversão.", note: "a família toda feliz no mesmo rolê.", features: [["smile", "Diversão"], ["leaf", "Ao ar livre"], ["star", "Estrutura boa"], ["heart", "Família toda"]] },
};
export const vibeImg = (aff) => `images/vibes/${aff}.jpg`;

// "Bom para…" — cartões da página de lugar
export const BOM_PARA = {
  dates:   { icon: "heart",   title: "Dates",        desc: "Clima perfeito para dois",        cls: "vibe-pink" },
  impress: { icon: "cheers",  title: "Impressionar", desc: "Um lugar que sempre surpreende",  cls: "vibe-yellow" },
  relax:   { icon: "leaf",    title: "Relaxar",      desc: "Sem pressa nenhuma",              cls: "vibe-mint" },
  turist:  { icon: "camera",  title: "Turistar",     desc: "Pra conhecer a cidade",           cls: "vibe-lavender" },
  eco:     { icon: "coins",   title: "Economizar",   desc: "Vale cada real",                  cls: "vibe-orange" },
  crianca: { icon: "smile",   title: "Criançada",    desc: "Família toda feliz",              cls: "vibe-sky" },
};

// Depoimentos e dicas da comunidade
export const TESTIMONIALS = [
  { name: "Marina S.", when: "Visitou em ago/2026", text: "O jantar no Mirante foi uma das melhores experiências da minha vida. Cada detalhe é pensado com muito cuidado." },
  { name: "Rafael T.", when: "Visitou em jul/2026", text: "Ver o pôr do sol com um bom vinho é simplesmente inesquecível. Vale cada momento." },
  { name: "Camila R.", when: "Visitou em jun/2026", text: "O lugar perfeito para impressionar. Ambiente lindo, comida incrível e atendimento impecável." },
];
export const PLACE_TIPS = [
  { name: "Marina Lopes", when: "2 semanas atrás", text: "O pôr do sol daqui é absurdo! Fui em um date e o clima foi perfeito. Atendimento super atencioso.", tags: [["Vista linda", "vibe-mint"], ["Para dates", "vibe-pink"], ["Comida incrível", "vibe-yellow"]] },
  { name: "Rafael N.",    when: "1 mês atrás",     text: "Além da comida ótima, é um lugar que respira cultura. Vale combinar o almoço com uma visita às exposições.", tags: [["Cultura", "vibe-lavender"], ["Boa música", "vibe-sky"], ["Programa completo", "vibe-yellow"]] },
  { name: "Camila R.",    when: "3 meses atrás",   text: "Adoro ir com amigos! Drinks ótimos, comida sempre criativa e a vista é de cinema. Já virei cliente fiel.", tags: [["Com amigos", "vibe-lavender"], ["Drinks", "vibe-mint"], ["Vista linda", "vibe-pink"]] },
];

// ----- Roteiros completos -----
const ROTEIRO_EXTRA = {
  r1: {
    stats: { tempo: "4 a 5 horas", invest: 3, investLabel: "Especial", ideal: "Casais", vibe: "Romance, boa mesa" },
    vibes: ["dates", "impress"], note: "o melhor date é o que ninguém precisa improvisar.",
    about: "Um roteiro pensado pra quem quer acertar sem parecer que se esforçou demais. Começa com drinque, segue para um jantar que rende conversa e termina com sobremesa e vista. Tudo a poucos passos, pra noite fluir sem carro e sem pressa.",
    quote: "Um bom date é feito de boas pausas.",
    steps: [
      { time: "19h – 20h", title: "Jardim Suspenso", sub: "Drinque pra começar", place: "p13", tags: [["Drinks", "vibe-mint"], ["Para dates", "vibe-pink"]], desc: "Comece no jardim, com um drink autoral e uma porção pra dividir. A conversa aquece aqui." },
      { time: "20h – 22h", title: "Casa Komorebi", sub: "Jantar que rende conversa", place: "p8", tags: [["Gastronomia", "vibe-orange"], ["Asiático", "vibe-yellow"]], desc: "Mesa do balcão, bao de costela pra começar e bibimbap pra fechar. Reserve antes." },
      { time: "22h – 23h", title: "Mirante 360", sub: "Sobremesa com vista", place: "p10", tags: [["Vista incrível", "vibe-lavender"], ["Sobremesa", "vibe-pink"]], desc: "Suba para a varanda: sobremesa, um último drinque e a cidade inteira acesa." },
      { time: "23h +", title: "Caminhada no boulevard", sub: "Pra esticar a noite", optional: true, tags: [["Ao ar livre", "vibe-mint"], ["Grátis", "vibe-sky"]], desc: "Se a noite pedir mais, uma volta a pé pelo boulevard iluminado fecha com chave de ouro." },
    ],
    tips: { dica: "Faça as reservas com uma semana de antecedência e combine o horário do jantar com o pôr do sol.", horario: "Noite, a partir das 19h", epoca: "O ano todo", comoChegar: "Tudo a pé — bairros vizinhos", lembrete: "Leve um casaco leve: na varanda do Mirante venta à noite." },
  },
  r2: {
    stats: { tempo: "6 a 8 horas", invest: 1, investLabel: "Econômico", ideal: "Turistas, família", vibe: "História, cultura" },
    vibes: ["turist", "eco", "crianca"], note: "toda cidade tem um começo — comece por ele.",
    about: "O jeito mais rápido de entender uma cidade é começar pelo centro. Catedral, mercado, praças e os cafés que os locais mantêm em segredo, num roteiro que dá pra fazer todo a pé e gastando pouco.",
    quote: "O centro é onde a cidade conta a própria história.",
    steps: [
      { time: "09h – 11h", title: "Museu da Cidade", sub: "Arte e arquitetura", place: "p11", tags: [["Cultura", "vibe-yellow"], ["Pra turistar", "vibe-lavender"]], desc: "Comece pelo museu: acervo que conta a história da cidade e um prédio que vale a visita sozinho." },
      { time: "11h – 13h", title: "Feira do Largo", sub: "Chorinho e pastel", place: "p7", tags: [["Música ao vivo", "vibe-sky"], ["Grátis", "vibe-mint"]], desc: "Pastel de queijo, caldo de cana e chorinho começando às 13h. Programa de sábado clássico." },
      { time: "13h – 15h", title: "Quintal do Centro", sub: "Almoço de boteco", place: "p1", tags: [["Comer bem", "vibe-orange"], ["Pra economizar", "vibe-yellow"]], desc: "Almoço sem frescura, chope gelado e o famoso pastel de pernil do balcão." },
      { time: "15h – 17h", title: "Cine Vitória", sub: "Sessão da tarde", place: "p6", optional: true, tags: [["Cinema", "vibe-lavender"], ["Cultura", "vibe-yellow"]], desc: "Feche o dia com um filme na sala de rua mais charmosa da cidade." },
    ],
    tips: { dica: "Vá de sábado para pegar a feira e o chorinho. Use sapato confortável — dá pra fazer tudo a pé.", horario: "Manhã e começo da tarde", epoca: "O ano todo", comoChegar: "Metrô · estação Centro", lembrete: "Terça o museu é gratuito, mas a feira só acontece aos sábados." },
  },
  r3: {
    stats: { tempo: "3 a 4 horas", invest: 3, investLabel: "Especial", ideal: "Casais, clientes", vibe: "Sofisticação" },
    vibes: ["impress", "dates"], note: "chegar e já causar antes da carta sair.",
    about: "Endereços escondidos, atmosfera única e aquela sensação de que você conhece a cidade por dentro. Um roteiro pra impressionar sem esforço — cliente, sogra ou aquele date importante.",
    quote: "Impressionar é mostrar o que pouca gente conhece.",
    steps: [
      { time: "19h – 20h", title: "Mesa 14", sub: "Balcão do chef", place: "p2", tags: [["Degustação", "vibe-yellow"], ["Alta gastronomia", "vibe-lavender"]], desc: "Degustação de 5 tempos com a cozinha aberta à sua frente. Reserve com uma semana." },
      { time: "21h – 23h", title: "Brasa & Lenha", sub: "Sobremesa na brasa", place: "p12", tags: [["Cozinha brasileira", "vibe-orange"], ["Experiência", "vibe-pink"]], desc: "A sobremesa de rapadura feita na brasa é o tipo de detalhe que vira assunto." },
      { time: "23h +", title: "Clube Aurora", sub: "Pra quem quer esticar", place: "p5", optional: true, tags: [["Boa música", "vibe-sky"], ["Noite", "vibe-lavender"]], desc: "Se a noite pedir, a pista de house e disco é a saideira perfeita." },
    ],
    tips: { dica: "Reserve tudo com antecedência e avise que é ocasião especial — as casas costumam caprichar.", horario: "Noite", epoca: "O ano todo", comoChegar: "Táxi ou app — bairros próximos", lembrete: "Traje esporte fino cai bem no Mesa 14." },
  },
  r4: {
    stats: { tempo: "6 a 8 horas", invest: 2, investLabel: "Moderado", ideal: "Casais, amigos e solo", vibe: "Natureza, cultura e bem-estar" },
    vibes: ["relax", "turist", "impress", "dates"], note: "mais que um parque, um jeito de viver a cidade.",
    about: "O parque é um convite pra viver várias cidades em uma só: tem arte, natureza, gastronomia, esporte e encontros. Neste roteiro reunimos nossas dicas favoritas para um dia completo, com paradas que equilibram cultura, bem-estar e boa comida. Você pode seguir tudo ou adaptar ao seu ritmo — o importante é sair e viver.",
    quote: "O parque é sempre uma boa ideia. É onde a cidade respira.",
    steps: [
      { time: "09h – 11h", title: "Florado Café", sub: "Café da manhã sem pressa", place: "p3", tags: [["Café", "vibe-yellow"], ["Para relaxar", "vibe-mint"]], desc: "Comece o dia com coado do dia e pão na chapa, na mesa da janela." },
      { time: "11h – 14h", title: "Parque das Águas", sub: "Natureza no meio da cidade", place: "parque-das-aguas", tags: [["Natureza", "vibe-mint"], ["Para relaxar", "vibe-mint"]], desc: "Caminhe pelo parque, faça uma pausa no lago e observe a cidade de outro ângulo. É o momento de respirar." },
      { time: "14h – 16h", title: "Almoço no entorno", sub: "Sabores para todos os gostos", place: "p13", tags: [["Gastronomia", "vibe-pink"], ["Para comer bem", "vibe-orange"]], desc: "Do casual ao sofisticado, o entorno do parque tem ótimas opções. Selecionamos lugares que combinam com o clima do dia." },
      { time: "16h – 18h", title: "Sorvete e pôr do sol", sub: "Pra fechar o dia", place: "p14", optional: true, tags: [["Doces", "vibe-lavender"], ["Para explorar", "vibe-sky"]], desc: "Finalize o dia com um sorvete artesanal e o pôr do sol na beira do lago." },
    ],
    tips: { dica: "Vá durante a semana para aproveitar com mais tranquilidade. E não esqueça de levar uma garrafa de água!", horario: "Manhã e fim de tarde", epoca: "O ano todo", comoChegar: "Metrô · estação Parque (linha verde)", lembrete: "O pôr do sol no lago é um dos cartões-postais mais bonitos da cidade." },
  },
  r5: {
    stats: { tempo: "5 a 6 horas", invest: 1, investLabel: "Econômico", ideal: "Amigos, solo", vibe: "Rolê raiz" },
    vibes: ["eco", "turist"], note: "cabe no bolso e não cabe no esquecimento.",
    about: "Comida boa, programa de graça e drinque honesto. Um rolê completo provando que dá pra sair bem gastando menos de R$ 80 — e voltar pra casa com história pra contar.",
    quote: "Bom programa não precisa ser caro. Precisa ser bem escolhido.",
    steps: [
      { time: "14h – 16h", title: "Feira do Largo", sub: "Pastel e chorinho", place: "p7", tags: [["Grátis", "vibe-mint"], ["Música ao vivo", "vibe-sky"]], desc: "Entrada livre, pastel de feira e música ao vivo na praça." },
      { time: "16h – 18h", title: "Museu da Cidade", sub: "Cultura de graça", place: "p11", tags: [["Cultura", "vibe-yellow"], ["Grátis às terças", "vibe-mint"]], desc: "Arte e arquitetura com ingresso camarada (ou de graça às terças)." },
      { time: "19h – 22h", title: "Bar do Z'é", sub: "Samba e torresmo", place: "p9", tags: [["Boteco", "vibe-orange"], ["Samba", "vibe-pink"]], desc: "Caipirinha forte, torresmo pra três e roda de samba às quintas." },
    ],
    tips: { dica: "Combine com os amigos e divida as porções — o torresmo do Z'é serve três pessoas.", horario: "Tarde e noite", epoca: "O ano todo", comoChegar: "Metrô · estação Centro", lembrete: "Leve dinheiro trocado: algumas barracas da feira não aceitam cartão." },
  },
  r6: {
    stats: { tempo: "5 a 6 horas", invest: 1, investLabel: "Econômico", ideal: "Família com crianças", vibe: "Diversão ao ar livre" },
    vibes: ["crianca", "relax", "eco"], note: "a família toda feliz no mesmo rolê.",
    about: "Quatro paradas testadas com criança de verdade — todas com troca, banheiro decente e sombra. Do parque ao sorvete artesanal, um sábado que agrada a família inteira.",
    quote: "Rolê bom com criança é rolê com sombra, espaço e sorvete.",
    steps: [
      { time: "09h – 12h", title: "Parque das Águas", sub: "Parquinho e lago", place: "parque-das-aguas", tags: [["Natureza", "vibe-mint"], ["Família", "vibe-sky"]], desc: "Parquinho, pista de bicicleta e o lago com patos. Chegue cedo pra pegar sombra." },
      { time: "12h – 14h", title: "Florado Café", sub: "Almoço tranquilo", place: "p3", tags: [["Brunch", "vibe-yellow"], ["Para relaxar", "vibe-mint"]], desc: "Brunch com opções pras crianças e mesa grande pra família." },
      { time: "14h – 15h", title: "Sorveteria Polar", sub: "Sobremesa obrigatória", place: "p14", tags: [["Doces", "vibe-pink"], ["Pra criançada", "vibe-sky"]], desc: "Criança prova três sabores antes de escolher. O sabor do mês sempre vale." },
      { time: "15h – 17h", title: "Feira do Largo", sub: "Música e brinquedos antigos", place: "p7", optional: true, tags: [["Música ao vivo", "vibe-lavender"], ["Grátis", "vibe-mint"]], desc: "Se ainda sobrar energia, a feira tem chorinho e brinquedos de antigamente." },
    ],
    tips: { dica: "Leve protetor solar, chapéu e uma muda de roupa — o lago é irresistível.", horario: "Manhã", epoca: "Primavera e verão", comoChegar: "Carro ou metrô · estação Parque", lembrete: "O parquinho tem área com sombra perto da entrada norte." },
  },
};
ROTEIROS.forEach(r => { Object.assign(r, ROTEIRO_EXTRA[r.id]); r.paradas = r.steps.length; });
export const roteiroImg = (id, n) => `images/roteiros/${id}${n ? "-" + n : ""}.jpg`;

// Roteiros por vibe (home) → roteiro correspondente
export const VIBE_TO_ROTEIRO = { v1: "r1", v2: "r2", v3: "r4", v4: "r3" };

// Tags dos roteiros na página "Continue explorando"
export const ROTEIRO_TAGS = {
  r1: [["Para dates", "vibe-pink"], ["Gastronomia", "vibe-orange"]],
  r2: [["Cultura", "vibe-sky"], ["História", "vibe-lavender"]],
  r3: [["Gastronomia", "vibe-yellow"], ["Vida noturna", "vibe-lavender"]],
  r4: [["Natureza", "vibe-mint"], ["Para relaxar", "vibe-mint"]],
  r5: [["Pra economizar", "vibe-orange"], ["Samba", "vibe-pink"]],
  r6: [["Família", "vibe-sky"], ["Ao ar livre", "vibe-mint"]],
};

// ---------- Páginas de conteúdo e menus (editáveis no painel) ----------
// PAGES/MENUS são preenchidos pelo painel (syncPublic) com o que está publicado.
export const PAGES = [];
// Categorias do Radar (blog), na ordem definida no painel: { id, label, tone }
export const RADAR_CATEGORIES = [];
export const MENUS = { header: [], footer: [], legal: [] };

// Páginas iniciais (rascunhos para a equipe completar e publicar)
export const SEED_PAGES = [
  { id: "pg1", slug: "sobre", title: "Sobre o Onde Sair", excerpt: "Curadoria por afinidade: lugares escolhidos por quem vive a cidade.",
    body: "<p>O Onde Sair nasceu pra responder a pergunta de todo fim de semana: <strong>onde a gente vai?</strong></p><h2>Como escolhemos os lugares</h2><p>Cada lugar passa pelo crivo de quem mora na cidade. Visitamos, provamos e só recomendamos o que indicaríamos pra um amigo.</p>" },
  { id: "pg2", slug: "fale-com-a-gente", title: "Fale com a gente", excerpt: "Dúvidas, sugestões de lugares ou parcerias.",
    body: "<p>Quer indicar um lugar, corrigir uma informação ou propor uma parceria? Escreva pra <a href=\"mailto:contato@ondesair.com.br\">contato@ondesair.com.br</a>.</p>" },
  { id: "pg3", slug: "trabalhe-conosco", title: "Trabalhe conosco", excerpt: "Venha fazer curadoria com a gente.",
    body: "<p>Estamos sempre de olho em gente que conhece a cidade e escreve bem. Mande seu portfólio pra <a href=\"mailto:contato@ondesair.com.br\">contato@ondesair.com.br</a>.</p>" },
  { id: "pg4", slug: "termos-de-uso", title: "Termos de uso", excerpt: "Regras de uso do site Onde Sair.",
    body: "<p>Escreva aqui os termos de uso do site.</p>" },
  { id: "pg5", slug: "privacidade", title: "Política de privacidade", excerpt: "Como tratamos os seus dados.",
    body: "<p>Escreva aqui a política de privacidade do site.</p>" },
];

// Menus iniciais (iguais aos fixos de antes). Tipos: site (tela do site), page (página de conteúdo), url (link)
export const SEED_MENUS = {
  header: [
    { id: "m1", label: "Hoje", type: "site", target: "home" },
    { id: "m2", label: "Vibes", type: "site", target: "home#vibes" },
    { id: "m3", label: "Lugares", type: "site", target: "lista" },
    { id: "m4", label: "Roteiros", type: "site", target: "roteiros" },
    { id: "m5", label: "Guia da cidade", type: "site", target: "mapa" },
    { id: "m6", label: "Para parceiros", type: "page", page: "pg-parceiros" },
  ],
  footer: [
    { id: "m7", label: "Sobre", type: "page", page: "pg1" },
    { id: "m8", label: "Radar", type: "site", target: "historias" },
    { id: "m9", label: "Para parceiros", type: "page", page: "pg-parceiros" },
    { id: "m10", label: "Fale com a gente", type: "page", page: "pg2" },
    { id: "m11", label: "Trabalhe conosco", type: "page", page: "pg3" },
  ],
  legal: [
    { id: "m12", label: "Termos de uso", type: "page", page: "pg4" },
    { id: "m13", label: "Privacidade", type: "page", page: "pg5" },
  ],
};
