import { SEED_EVENT_CATEGORIES } from "../data.js";
import { VIBES as TAX_VIBES, PLACE_TYPES, vibeRecord, newTypeFor } from "../taxonomy.js";
// =====================================================================
// Onde Sair · atualizações de conteúdo
//
// O banco publicado fica no servidor (Vercel Blob) e não é recriado a partir
// da semente. Conteúdo novo entra aqui como uma atualização com id próprio:
// ela é aplicada uma única vez (fica registrada em db.updates), então o que a
// equipe editar ou excluir depois no painel não volta.
//
// Fonte dos dados: dados/lugares-sorocaba.xlsx
// =====================================================================

const SOROCABA = { id: "sorocaba", name: "Sorocaba", sub: "SP", active: true, bairros: ["Centro", "Jardim Abaeté", "Jardim Europa", "Jardim Paulistano", "Vila Florinda", "Vila Santana"] };

const SOROCABA_PLACES = [
  {"id": "rino-beer", "slug": "rino-beer-growler-craft", "status": "publicado", "city": "sorocaba", "name": "Rino Beer Growler & Craft", "sub": "Growleria de chope artesanal", "cuisine": "Cervejas artesanais e growlers", "tagline": "Chope artesanal fresquinho pra beber no balcão ou levar pra casa no growler.", "desc": "Aquele lugar pra passar depois do trampo, encher o growler e levar cerveja boa pra casa. São 6 torneiras de chope artesanal que trocam o tempo todo, então cada visita tem novidade. Bateu vontade? Encosta no balcão e toma ali mesmo. Bar de bairro na Vila Santana, sem frescura nenhuma.", "dica": "Confira o que está engatado na aba On Tap do site antes de ir. Sábado e domingo abre às 10h: bom pra encher o growler antes do almoço de família.", "by": "Curadoria · Onde Sair", "note": "volta cheio, volta feliz", "reasons": [["wine", "6 torneiras com rótulos que mudam sempre"], ["coins", "Chope fresco pra levar no vidro, na porcelana ou na bag"], ["clock", "Abre sábado e domingo de manhã"], ["users", "Clima de bar de bairro, pra ir com amigos"]], "type": "Bares", "open": "Seg–Sex · 16h–23h · Sáb 10h–22h · Dom e feriados 10h–15h", "phone": "(15) 3411-9908", "site": "www.rinobeer.com.br", "insta": "@rinobeergrowler", "priceLevel": 1, "momento": ["Happy hour", "Noite"], "ambiente": ["Ambiente interno"], "affs": ["eco", "relax"], "tags": ["Chope artesanal", "Growler", "Happy hour"], "extras": ["Para ir com amigos", "Sem pressa"], "tint": "tint-eco", "bairro": "Vila Santana", "end": "R. Mascarenhas Camelo, 1070 · Vila Santana", "cep": "18080-692", "geo": null, "placeId": "", "map": {"x": 62, "y": 46, "label": "RB"}, "rating": 0, "reviews": 0, "seo": {"title": "Rino Beer · Chope artesanal e growler em Sorocaba", "desc": "Growleria na Vila Santana com 6 torneiras de chope artesanal que mudam sempre. Beba no balcão ou leve pra casa no growler."}},
  {"id": "fraters-pub", "slug": "fraters-pub", "status": "publicado", "city": "sorocaba", "name": "Frater's Pub", "sub": "Pub de chope artesanal", "cuisine": "Hambúrgueres, defumados e porções", "tagline": "12 torneiras de chope artesanal e cozinha de pub caprichada no Centro.", "desc": "Pub de verdade no meio do Centro, com 12 torneiras de chope artesanal que vão mudando de estilo. E a cozinha não é coadjuvante: tem hambúrguer no brioche, defumados e até charcutaria. Rola som ao vivo em algumas noites e, no sábado, abre pro almoço. Daqueles lugares em que você chega pra um chope e sai horas depois.", "dica": "Sábado tem almoço: chegue no começo da tarde e peça o Double West Coast Burger com a IPA da vez. Gostou de um chope? Eles enchem growler de 500 ml ou 1 litro.", "by": "Curadoria · Onde Sair", "note": "12 torneiras, zero pressa", "reasons": [["wine", "12 torneiras de chope artesanal"], ["star", "Cozinha que vai muito além da porção de fritas"], ["music", "Som ao vivo em algumas noites"], ["sun", "Almoço aos sábados"]], "type": "Bares", "open": "Ter–Sex · 17h–22h · Sáb 12h–22h", "phone": "(15) 99168-4529", "site": "www.fraterspub.com.br", "insta": "@fraterspub", "priceLevel": 2, "momento": ["Happy hour", "Noite", "Almoço"], "ambiente": ["Ambiente interno"], "affs": ["eco", "dates"], "tags": ["Chope artesanal", "Hambúrguer", "Música ao vivo"], "extras": ["Para ir com amigos", "Boa música"], "tint": "tint-eco", "bairro": "Centro", "end": "R. Prof. Toledo, 648 · Centro", "cep": "18035-110", "geo": null, "placeId": "", "map": {"x": 48, "y": 50, "label": "FP"}, "rating": 0, "reviews": 0, "seo": {"title": "Frater's Pub · Pub de chope artesanal no Centro de Sorocaba", "desc": "12 torneiras de chope artesanal, hambúrguer, defumados e som ao vivo num pub aconchegante no Centro de Sorocaba."}},
  {"id": "carneada", "slug": "carneada", "status": "publicado", "city": "sorocaba", "name": "Carneada", "sub": "Bar y parrilla", "cuisine": "Parrilla e carnes na brasa", "tagline": "Churrasco de amigos levado a sério, com sotaque argentino, no Centro.", "desc": "Sabe aquele churrasco de amigo que ninguém quer que acabe? O Carneada levou essa ideia pra parrilla, com sotaque argentino. O churrasqueiro Felipe Botti comanda a brasa, a parrillada chega pra dividir na mesa e as empanadas seguram a fome enquanto a carne fica pronta. Fica no Centro, num espaço moderno que não pesa no clima.", "dica": "Vá em turma e divida a parrillada mista. Abra com empanadas enquanto a brasa trabalha. Domingo fecha às 16h: não deixe pra ir tarde.", "by": "Curadoria · Onde Sair", "note": "brasa, amigos e empanada", "reasons": [["star", "Cortes na brasa no ponto certo"], ["users", "Parrillada mista feita pra dividir"], ["heart", "Empanadas que abrem bem a refeição"], ["clock", "Abre pro almoço de segunda a domingo"]], "type": "Restaurantes", "open": "Almoço Seg–Sex 11h30–15h30 · Jantar Ter–Sex 18h–23h · Sáb 12h–16h e 18h–23h · Dom 12h–16h", "phone": "(11) 95465-6507", "site": "", "insta": "@carneada_", "priceLevel": 2, "momento": ["Almoço", "Jantar", "Happy hour"], "ambiente": ["Ambiente interno"], "affs": ["impress", "dates"], "tags": ["Parrilla", "Carnes na brasa", "Empanadas"], "extras": ["Para ir com amigos", "Experiência única"], "tint": "tint-impress", "bairro": "Centro", "end": "R. da Penha, 1147 · Centro", "cep": "18010-004", "geo": null, "placeId": "", "map": {"x": 52, "y": 47, "label": "CA"}, "rating": 0, "reviews": 0, "seo": {"title": "Carneada · Bar y parrilla no Centro de Sorocaba", "desc": "Churrasco de amigo com sotaque argentino: parrillada pra dividir, empanadas e brasa comandada por Felipe Botti, no Centro de Sorocaba."}},
  {"id": "sophies-bbq", "slug": "sophies-bbq", "status": "publicado", "city": "sorocaba", "name": "Sophie's BBQ", "sub": "Churrasco americano", "cuisine": "Barbecue texano e café da manhã americano", "tagline": "Brisket, costela e pulled pork defumados por horas, no melhor estilo Texas.", "desc": "Churrasco americano raiz em Sorocaba, coisa que não se acha em qualquer esquina. A carne passa horas no defumador com lenha de árvore frutífera até ficar macia e com aquele gosto de fumaça. Vem com molho da casa, coleslaw e cornbread. E no fim de semana tem café da manhã americano, com panqueca, bacon e ovo.", "dica": "Sábado ou domingo, chegue às 9h pro café da manhã com panquecas e emende no almoço. A costela é a estrela da casa; o brisket é o pedido de quem já conhece.", "by": "Curadoria · Onde Sair", "note": "cheiro de lenha desde cedo", "reasons": [["star", "Brisket e costela defumados por horas na lenha"], ["sun", "Café da manhã americano no fim de semana"], ["sparkle", "Barbecue americano de verdade, raro na cidade"], ["users", "Programa que agrada a família toda"]], "type": "Restaurantes", "open": "Qua–Sex · 11h30–14h30 e 18h–22h · Sáb 9h–11h30, 12h–16h e 18h–22h · Dom 9h–11h30 e 12h–15h", "phone": "(15) 99188-5273", "site": "", "insta": "@sophiesbbq", "priceLevel": 2, "momento": ["Almoço", "Jantar", "Brunch"], "ambiente": ["Ambiente interno"], "affs": ["turist", "crianca", "relax"], "tags": ["Barbecue americano", "Defumados", "Café da manhã"], "extras": ["Experiência única", "Para ir com crianças"], "tint": "tint-turist", "bairro": "Jardim Paulistano", "end": "R. Mooca, 35 · Jardim Paulistano", "cep": "18040-700", "geo": null, "placeId": "", "map": {"x": 50, "y": 66, "label": "SB"}, "rating": 0, "reviews": 0, "seo": {"title": "Sophie's BBQ · Churrasco americano em Sorocaba", "desc": "Brisket, costela e pulled pork defumados na lenha, além de café da manhã americano no fim de semana. No Jardim Paulistano, em Sorocaba."}},
  {"id": "parque-agua-vermelha", "slug": "parque-da-agua-vermelha", "status": "publicado", "city": "sorocaba", "name": "Parque da Água Vermelha", "sub": "Parque natural com lagos", "cuisine": "Natureza, trilha e educação ambiental", "tagline": "Garça, cágado e trilha em volta do lago, de graça, no meio do Jardim Europa.", "desc": "Um respiro verde no Jardim Europa, onde dá pra ver garça, cágado e pica-pau sem sair da cidade. A trilha contorna os lagos sem pressa, a criançada se diverte entre aquário, playground e jardim sensorial, e as mesas de piquenique esperam o lanche que você trouxer. E a entrada é de graça.", "dica": "Vá de manhã, quando os bichos estão mais ativos, e leve lanche pras mesas de piquenique. Fecha às segundas e a entrada vai só até 16h30.", "by": "Curadoria · Onde Sair", "note": "as garças chegam antes de você", "reasons": [["heart", "Garça, cágado e pica-pau de pertinho"], ["leaf", "Trilha tranquila em volta dos lagos"], ["coins", "Entrada gratuita"], ["smile", "Aquário, playground e jardim sensorial"]], "type": "Parques", "open": "Ter–Dom · 8h–17h (entrada até 16h30)", "phone": "(15) 3221-6643", "site": "meioambiente.sorocaba.sp.gov.br/educacaoambiental/parque-natural-agua-vermelha/", "insta": "", "priceLevel": 0, "momento": ["Experiência cultural"], "ambiente": ["Ambiente externo"], "affs": ["crianca", "relax", "eco"], "tags": ["Natureza", "Lagos", "Piquenique"], "extras": ["Para ir com crianças", "Sem pressa"], "tint": "tint-crianca", "bairro": "Jardim Europa", "end": "R. România, 150 · Jardim Europa", "cep": "18045-040", "geo": {"lat": -23.521002, "lng": -47.48693}, "placeId": "", "map": {"x": 30, "y": 58, "label": "AV"}, "rating": 0, "reviews": 0, "seo": {"title": "Parque da Água Vermelha · Natureza grátis em Sorocaba", "desc": "Garça, cágado, trilha em volta do lago e aquário pra criançada no Jardim Europa. De graça, de terça a domingo."}},
  {"id": "parque-das-aguas", "slug": "parque-das-aguas", "status": "publicado", "city": "sorocaba", "name": "Parque das Águas", "sub": "Parque urbano à beira do rio", "cuisine": "Lazer ao ar livre e esporte", "tagline": "Lago, ciclovia, skate e gramado pra perder a hora. Aberto 24 horas e de graça.", "desc": "É pra cá que Sorocaba vem quando quer se mexer. O parque nasceu numa antiga área de enchente na beira do rio e virou um quintal gigante, com lagos, deck de madeira, ciclovia, pista de skate e muito gramado. Fica aberto dia e noite, todo dia, sem pagar nada. Quando tem show ou evento grande na cidade, é bem capaz de ser aqui.", "dica": "Fim de tarde é a melhor hora: luz bonita sobre os lagos e pista cheia de gente. Leve bike ou skate e uma canga pro gramado.", "by": "Curadoria · Onde Sair", "note": "pôr do sol no deck", "reasons": [["sun", "Fim de tarde no deck, de frente pro lago"], ["clock", "Aberto dia e noite, todo dia"], ["users", "Pista de skate, ciclovia e quadras"], ["coins", "Programa de graça pra família toda"]], "type": "Parques", "open": "Todos os dias · 24 horas", "phone": "(15) 3227-1173", "site": "", "insta": "", "priceLevel": 0, "momento": ["Experiência cultural"], "ambiente": ["Ambiente externo"], "affs": ["crianca", "eco", "relax"], "tags": ["Ciclovia", "Skate", "Lagos"], "extras": ["Para ir com crianças", "Boa luz"], "tint": "tint-crianca", "bairro": "Jardim Abaeté", "end": "R. Antônio Joaquim Santana, 714 · Jardim Abaeté", "cep": "18081-295", "geo": null, "placeId": "", "map": {"x": 46, "y": 28, "label": "PA"}, "rating": 0, "reviews": 0, "seo": {"title": "Parque das Águas · Lagos, ciclovia e skate em Sorocaba", "desc": "Lago, ciclovia, skate e gramado à beira do rio Sorocaba. Aberto 24 horas, todo dia, e de graça. Programa certo pro fim de tarde."}},
  {"id": "drink-me", "slug": "drink-me-speakeasy-bar", "status": "publicado", "city": "sorocaba", "name": "Drink Me Speakeasy Bar", "sub": "Speakeasy de drinques autorais", "cuisine": "Coquetelaria autoral e clássicos", "tagline": "O único speakeasy de Sorocaba: luz baixa, jazz e coquetel feito com capricho.", "desc": "Clima de bar clandestino dos anos 20, só que em Sorocaba: o Drink Me é o único speakeasy da cidade. Luz baixa, jazz e blues no som e gente que leva coquetel a sério, dos clássicos aos autorais da casa. Pra beliscar, schiacciata feita ali mesmo. Só entra com reserva, então se programe.", "dica": "Sem reserva não rola, então garanta a sua antes. Peça o Garden Mule e pergunte a história dele. Divida uma schiacciata.", "by": "Curadoria · Onde Sair", "note": "fale baixo, beba bem", "reasons": [["sparkle", "O único speakeasy da cidade"], ["wine", "Coquetel levado a sério, do clássico ao autoral"], ["music", "Jazz e blues no som ambiente"], ["heart", "Clima intimista, perfeito pra date"]], "type": "Bares", "open": "Qua–Sáb · 19h–00h", "phone": "(15) 99141-5420", "site": "drinkmespeakeasybar.com.br", "insta": "@drinkmespeakeasybar", "priceLevel": 2, "momento": ["Noite", "Happy hour"], "ambiente": ["Ambiente interno"], "affs": ["dates", "impress"], "tags": ["Coquetelaria", "Speakeasy", "Drinques autorais"], "extras": ["Programa a dois", "Experiência única", "Boa música"], "tint": "tint-date", "bairro": "Vila Florinda", "end": "Av. Barão de Tatuí, 448 · Vila Florinda", "cep": "18030-000", "geo": null, "placeId": "", "map": {"x": 56, "y": 54, "label": "DM"}, "rating": 0, "reviews": 0, "seo": {"title": "Drink Me · O speakeasy de Sorocaba", "desc": "O único speakeasy de Sorocaba: luz baixa, jazz, coquetel caprichado e schiacciata da casa. Só com reserva, então se programe."}},
];

const norm = (s = "") => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// O Parque das Águas de exemplo (São Paulo, id p4) dá lugar ao real, de Sorocaba
const OLD_PARK = "p4", NEW_PARK = "parque-das-aguas";
function dropExamplePark(d) {
  const old = d.places.find(p => p.id === OLD_PARK && p.city !== SOROCABA.id);
  if (!old) return;
  d.places = d.places.filter(p => p !== old);
  d.reviews = (d.reviews || []).filter(r => r.place !== OLD_PARK);                       // avaliações eram do parque de exemplo
  d.roteiros = (d.roteiros || []).map(r => ({ ...r, steps: (r.steps || []).map(s => s.place === OLD_PARK ? { ...s, place: NEW_PARK } : s) }));
  if (d.home?.tips) d.home = { ...d.home, tips: d.home.tips.map(t => t.place === OLD_PARK ? { ...t, place: NEW_PARK } : t) };
}

function addSorocaba(d, at) {
  dropExamplePark(d);
  let city = d.cities.find(c => c.id === SOROCABA.id || (norm(c.name) === norm(SOROCABA.name) && (c.sub || "").toUpperCase() === SOROCABA.sub));
  if (city) {
    const missing = SOROCABA.bairros.filter(b => !city.bairros.some(x => norm(x) === norm(b)));
    if (missing.length) {
      const merged = { ...city, bairros: [...city.bairros, ...missing].sort((a, b) => a.localeCompare(b, "pt-BR")) };
      d.cities = d.cities.map(c => c.id === city.id ? merged : c);
    }
  } else {
    city = { ...SOROCABA, bairros: [...SOROCABA.bairros] };
    d.cities = [...d.cities, city];
  }
  const taken = (p) => d.places.some(x => x.id === p.id || x.slug === p.slug);
  const fresh = SOROCABA_PLACES.filter(p => !taken(p))
    .map(p => ({ ...JSON.parse(JSON.stringify(p)), city: city.id, createdAt: at, updatedAt: at, updatedBy: "Curadoria · Onde Sair" }));
  d.places = [...fresh, ...d.places];
  // Sorocaba é a cidade principal: primeira da lista e padrão do site
  d.cities = [d.cities.find(c => c.id === city.id), ...d.cities.filter(c => c.id !== city.id)];
  d.settings = { ...d.settings, defaultCity: city.id };
  return fresh.map(p => p.name);
}

// "Para parceiros" deixa de apontar para a faixa da home e vira uma página de conteúdo
const PARTNERS = {
  id: "pg-parceiros", slug: "para-parceiros", title: "Para parceiros", status: "publicado",
  excerpt: "Vamos juntos por uma cidade mais viva.",
  body: "<p>O Onde Sair é feito de <strong>lugares reais, pessoas reais e dicas de verdade</strong>. Se o seu lugar tem a cara da cidade, a gente quer conhecer.</p>"
    + "<h2>Como trabalhamos</h2><ul><li>Curadoria humana e independente</li><li>Lugares visitados e aprovados</li><li>Dicas de quem vive a cidade</li><li>Apoie o que é local e faça a cidade girar</li></ul>"
    + "<h2>Seja um parceiro</h2><p>Conte pra gente sobre o seu lugar ou a sua ideia de parceria: <a href=\"mailto:contato@ondesair.com.br\">contato@ondesair.com.br</a>.</p>",
  seo: { title: "Para parceiros · Onde Sair", desc: "Tem um lugar com a cara da cidade? Conheça como o Onde Sair trabalha e seja um parceiro da curadoria.", noindex: false },
};
function partnersPage(d, at) {
  d.pages = d.pages || [];
  let pg = d.pages.find(p => p.id === PARTNERS.id || p.slug === PARTNERS.slug);
  if (!pg) { pg = { ...JSON.parse(JSON.stringify(PARTNERS)), createdAt: at, updatedAt: at, updatedBy: "Curadoria · Onde Sair" }; d.pages = [...d.pages, pg]; }
  if (d.menus) {
    const toPage = (it) => it.type === "site" && it.target === "home#parceiros" ? { id: it.id, label: it.label, type: "page", page: pg.id } : it;
    d.menus = Object.fromEntries(Object.entries(d.menus).map(([k, items]) => [k, (items || []).map(toPage)]));
  }
  return [pg.title];
}

// "Dicas de quem já foi"/Histórias vira o blog "Radar": links do menu com o nome antigo passam a se chamar Radar
function renameBlog(d) {
  if (!d.menus) return [];
  d.menus = Object.fromEntries(Object.entries(d.menus).map(([k, items]) => [k, (items || []).map(it =>
    it.type === "site" && it.target === "historias" && /^hist[oó]rias$/i.test(it.label.trim()) ? { ...it, label: "Radar" } : it)]));
  return ["menus"];
}

// Categorias do Radar passam a ser gerenciadas no painel (nome + cor da etiqueta)
const RADAR_DEFAULTS = [["Novidades", "purple"], ["Listas", "pink"], ["Comer bem", "orange"], ["Vida noturna", "purple"], ["Ao ar livre", "green"], ["Agenda", "teal"], ["Cultura", "sky"], ["Guia do bairro", "yellow"]];
function radarCategories(d) {
  if (d.radarCategories?.length) return [];
  const slug = (t) => norm(t).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const cats = [];
  const add = (label, tone) => { if (label && !cats.some(c => norm(c.label) === norm(label))) cats.push({ id: "c-" + slug(label), label, tone: tone || "purple" }); };
  RADAR_DEFAULTS.forEach(([l, t]) => add(l, (d.stories || []).find(s => norm(s.tag || "") === norm(l))?.tone || t));
  (d.stories || []).forEach(s => add(s.tag, s.tone));                 // categorias já usadas nos posts
  d.radarCategories = cats;
  return cats.map(c => c.label);
}

// Avaliações saem do portal: apaga as avaliações e as notas dos lugares
function dropReviews(d) {
  delete d.reviews;
  (d.places || []).forEach(p => { delete p.rating; delete p.reviews; });
  (d.members || []).forEach(m => { delete m.reviews; });
  if (d.settings) delete d.settings.reviewsRequireApproval;
  return ["avaliações"];
}

// Sem "vibe principal": roteiros guardam só a lista ordenada de vibes; dicas da home sem vibe
function dropMainVibe(d) {
  (d.roteiros || []).forEach(r => {
    r.vibes = [...new Set([r.aff, ...(r.vibes || [])].filter(Boolean))];
    delete r.aff;
  });
  if (d.home?.tips) d.home.tips = d.home.tips.map(({ aff, ...t }) => t);
  (d.roteiros || []).forEach(r => (r.steps || []).forEach(s => { delete s.tags; delete s.sub; }));   // paradas sem tags e sem subtítulo
  (d.roteiros || []).forEach(r => { if (r.stats) delete r.stats.vibe; });   // sem "Vibe em palavras"
  return ["roteiros e dicas da home"];
}

// "Aceita reserva" sai do portal (filtro da lista e campo do lugar)
function dropReservations(d) {
  (d.places || []).forEach(p => { delete p.reserva; });
  return ["lugares"];
}

// Menu principal: sai "Vibes" (âncora da home) e entra "Radar" no mesmo lugar
function headerRadar(d) {
  const h = d.menus?.header;
  if (!h) return [];
  const i = h.findIndex(it => it.type === "site" && it.target === "home#vibes");
  const hasRadar = h.some(it => it.type === "site" && it.target === "historias");
  if (i < 0 && hasRadar) return [];
  const radar = { id: "m-radar", label: "Radar", type: "site", target: "historias" };
  if (i >= 0) h.splice(i, 1, ...(hasRadar ? [] : [radar]));
  else h.push(radar);
  return ["menu principal"];
}

// Página de Vibes (lugares e roteiros juntos) entra no menu principal, logo depois do Radar
function headerVibes(d) {
  const h = d.menus?.header;
  if (!h) return [];
  const old = h.filter(it => it.type === "site" && it.target === "home#vibes");
  old.forEach(it => { it.target = "vibes"; });                       // link antigo para a seção da home
  if (old.length || h.some(it => it.type === "site" && it.target === "vibes")) return old.length ? ["menu principal"] : [];
  const i = h.findIndex(it => it.type === "site" && it.target === "historias");
  h.splice(i >= 0 ? i + 1 : 1, 0, { id: "m-vibes", label: "Vibes", type: "site", target: "vibes" });
  return ["menu principal"];
}

// Eventos: categorias iniciais e uma agenda de exemplo nos lugares de Sorocaba (datas a partir do dia da atualização)
const EVENT_SAMPLES = [
  { id: "e1", title: "Noite de jazz no Frater's", category: "shows", venue: "fraters-pub", affs: ["dates", "eco"], tags: ["Jazz", "Música ao vivo", "Chope artesanal"],
    dow: 4, from: "20:00", to: "23:30", price: { free: false, from: 30, to: null, note: "Couvert artístico por pessoa" }, ticket: { required: false, url: "", label: "" }, age: "18",
    tagline: "Quarteto de jazz ao vivo, 12 torneiras de chope e cozinha de pub aberta até tarde.",
    desc: "Toda quinta o Frater's vira clube de jazz: um quarteto da cidade toca standards e autorais em dois sets, com intervalo pra pedir mais um chope. A cozinha fica aberta até o fim e a casa enche cedo, então chegue antes das 20h pra garantir mesa.",
    note: "o sax chega às 20h em ponto" },
  { id: "e2", title: "Festival de cervejas artesanais", category: "gastronomia", venue: "parque-das-aguas", affs: ["eco", "relax"], tags: ["Cerveja artesanal", "Food trucks", "Ao ar livre"],
    dow: 6, from: "12:00", to: "22:00", days: 1, price: { free: true }, ticket: { required: false, url: "", label: "" }, age: "livre",
    tagline: "Dois dias de cervejarias da região, food trucks e bandas no gramado do Parque das Águas.",
    desc: "As cervejarias artesanais da região ocupam o Parque das Águas por um fim de semana inteiro, com chope a preço de festival, food trucks e bandas no palco montado perto do lago. A entrada é gratuita; as fichas de consumo são vendidas no local.",
    note: "leve canga pro gramado" },
  { id: "e3", title: "Cinema e piquenique no parque", category: "infantil", venue: "parque-agua-vermelha", affs: ["crianca", "relax"], tags: ["Cinema ao ar livre", "Piquenique", "Família"],
    dow: 0, from: "16:00", to: "19:00", price: { free: true }, ticket: { required: true, url: "https://www.sympla.com.br", label: "Retirar ingresso grátis" }, age: "livre",
    tagline: "Animação na tela grande ao pôr do sol, com piquenique liberado no gramado.",
    desc: "Sessão de cinema ao ar livre pra família toda, com um clássico da animação na tela grande ao lado do lago. Leve sua canga e seu lanche: o piquenique é liberado. Os ingressos são gratuitos, mas limitados, e precisam ser retirados antes.",
    note: "chegue cedo pra pegar sombra" },
  { id: "e4", title: "Parrillada aberta com música ao vivo", category: "gastronomia", venue: "carneada", affs: ["impress", "dates"], tags: ["Parrilla", "Música ao vivo"],
    dow: 5, from: "19:00", to: "23:00", price: { free: false, from: 89, to: 129, note: "Rodízio de cortes; bebidas à parte" }, ticket: { required: true, url: "https://www.sympla.com.br", label: "Comprar ingresso" }, age: "livre",
    tagline: "Rodízio de cortes na brasa com som acústico, num jantar só com reserva antecipada.",
    desc: "Uma noite especial no Carneada: a brasa não para e os cortes chegam à mesa em sequência, da entraña ao bife de chorizo, com empanadas na entrada e som acústico ao fundo. As vagas são limitadas e vendidas antecipadamente.",
    note: "brasa acesa desde as 17h" },
  { id: "e5", title: "Workshop de coquetelaria clássica", category: "cursos", venue: "drink-me", affs: ["impress", "dates"], tags: ["Coquetelaria", "Workshop"],
    dow: 3, from: "19:30", to: "21:30", price: { free: false, from: 120, to: null, note: "Inclui os drinques preparados" }, ticket: { required: true, url: "https://www.sympla.com.br", label: "Comprar ingresso" }, age: "18",
    tagline: "Aprenda três clássicos com os bartenders do único speakeasy da cidade.",
    desc: "Em duas horas no balcão do Drink Me, você prepara um Negroni, um Old Fashioned e um Daiquiri com os bartenders da casa e entende o porquê de cada medida. Turma pequena, material incluído e, no fim, um drinque autoral da casa por conta.",
    note: "a senha é no balcão" },
  { id: "e6", title: "Feira de vinil e café", category: "feiras", venue: "", venueName: "Praça Coronel Fernando Prestes", end: "Praça Cel. Fernando Prestes · Centro", bairro: "Centro",
    affs: ["eco", "turist"], tags: ["Vinil", "Café especial", "Feira"], dow: 0, from: "09:00", to: "14:00", price: { free: true }, ticket: { required: false, url: "", label: "" }, age: "livre",
    tagline: "Sebos de discos, cafés especiais e DJ tocando só vinil, numa manhã de domingo no Centro.",
    desc: "Expositores de discos novos e usados, toca-discos à venda, cafeterias da cidade com métodos filtrados e um DJ discotecando só vinil no coreto. Programa de domingo de manhã, de graça e com a cara do Centro.",
    note: "garimpe cedo" },
];
function seedEvents(d, at) {
  if (!d.eventCategories?.length) d.eventCategories = JSON.parse(JSON.stringify(SEED_EVENT_CATEGORIES));
  if (d.events?.length) return [];
  const base = new Date(at); base.setHours(0, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  d.events = EVENT_SAMPLES.map(({ dow, from, to, days = 0, ...e }, i) => {
    const day = new Date(base); day.setDate(day.getDate() + ((dow - day.getDay() + 7) % 7 || 7));   // próximo dia da semana
    const last = new Date(day); last.setDate(last.getDate() + days);
    const p = (d.places || []).find(x => x.id === e.venue);
    return {
      slug: e.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['’]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      status: "publicado", city: p?.city || "sorocaba", venueName: "", end: "", bairro: "", cep: "", geo: null, placeId: "",
      ...(p ? { end: p.end, bairro: p.bairro, city: p.city, cep: p.cep || "", geo: p.geo || null, placeId: p.placeId || "", map: p.map } : { map: { x: 50, y: 50, label: "" } }),
      ...e, startAt: `${ymd(day)}T${from}`, endAt: `${ymd(last)}T${to}`,
      insta: p?.insta || "", whatsapp: p?.whatsapp || "", site: "", doors: "", showGallery: true,
      reasons: [], seo: { title: "", desc: "" }, tint: p?.tint || "tint-eco",
      createdAt: at, updatedAt: at, updatedBy: "Curadoria · Onde Sair",
    };
  });
  // menu superior ganha "Eventos" logo depois de Roteiros
  const h = d.menus?.header;
  if (h && !h.some(it => it.type === "site" && it.target === "eventos")) {
    const i = h.findIndex(it => it.type === "site" && it.target === "roteiros");
    h.splice(i >= 0 ? i + 1 : h.length, 0, { id: "m-eventos", label: "Eventos", type: "site", target: "eventos" });
  }
  return d.events.map(e => e.title);
}

// Tipos de lugar passam a ser cadastrados no painel (nome, cor e ícone)
const TYPE_DEFAULTS = [
  ["restaurantes", "Restaurantes", "restaurantes", "vibe-orange", "utensils"], ["bares", "Bares", "bares", "vibe-pink", "cheers"],
  ["parques", "Parques", "parques", "vibe-mint", "tree"], ["shows-baladas", "Shows e baladas", "shows-e-baladas", "vibe-lavender", "music"],
  ["eventos", "Eventos", "eventos", "vibe-sky", "calendar"],
];
function placeTypes(d) {
  if (d.types?.length) return [];
  const types = TYPE_DEFAULTS.map(([id, label, slug, cls, icon]) => ({ id, label, slug, cls, icon }));
  (d.places || []).forEach(p => {                      // tipos usados nos lugares que não estão na lista
    if (p.type && !types.some(t => norm(t.label) === norm(p.type))) {
      const slug = norm(p.type).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      types.push({ id: "t-" + slug, label: p.type, slug, cls: "vibe-lavender", icon: "pin" });
    }
  });
  d.types = types;
  return types.map(t => t.label);
}

// Vibes e tipos oficiais (out/2026): "Pra …" vira "Para …", entram 3 vibes novas e a lista
// nova de tipos; lugares dos tipos que saíram vão para o tipo novo mais próximo.
// Vibes e tipos criados no painel continuam (depois dos oficiais).
function taxonomy2026(d) {
  const out = [];
  const old = d.vibes || [];
  const official = TAX_VIBES.map(v => {
    const cur = old.find(x => x.id === v[0]);
    const rec = vibeRecord(v);
    if (!cur) out.push("vibe " + rec.label);
    return cur ? { ...cur, label: rec.label, ...(cur.slug ? {} : { slug: rec.slug }) } : rec;
  });
  d.vibes = [...official, ...old.filter(x => !TAX_VIBES.some(v => v[0] === x.id))];

  let moved = 0;
  (d.places || []).forEach(p => { const t = newTypeFor(p); if (t !== p.type) { p.type = t; moved++; } });
  const extra = (d.types || []).filter(t => !["shows e baladas", "eventos"].includes(norm(t.label)) && !PLACE_TYPES.some(x => norm(x.label) === norm(t.label))
    && (d.places || []).some(p => norm(p.type) === norm(t.label)));
  d.types = [...PLACE_TYPES.map(t => ({ ...t })), ...extra];
  if (moved) out.push(`${moved} lugar(es) com tipo novo`);
  return out.concat(PLACE_TYPES.map(t => t.label));
}

// Sem menção a preço (pedido dos estabelecimentos): textos de exemplo que citavam valores.
// Só troca o que ainda está igual ao texto original; o endereço do roteiro continua o mesmo.
function noPrices(d) {
  const out = [];
  (d.roteiros || []).forEach(r => {
    if (r.title === "Rolê completo por menos de R$ 80") {
      r.slug = r.slug || "role-completo-por-menos-de-r-80";
      r.title = "Rolê completo que cabe no bolso";
      out.push(r.title);
    }
    if (typeof r.about === "string" && r.about.includes("gastando menos de R$ 80")) r.about = r.about.replace("gastando menos de R$ 80", "gastando pouco");
  });
  (d.campaigns || []).forEach(c => { if (typeof c.body === "string") c.body = c.body.replace(/R\$\s0 de entrada/, "entrada livre"); });
  return out;
}

// Em ordem de aplicação. Nunca altere o id de uma atualização já publicada.

// ---------------------------------------------------------------------
// Cadastro novo de Sorocaba (public/data/cadastro-sorocaba-2026-10.json):
// troca todo o catálogo de lugares pelo do arquivo, mantendo só o Rino Beer.
// Os lugares apagados ficam guardados em db.backups (fora do site público).
// Lugares que já existiam e voltam no arquivo mantêm id, endereço na URL e fotos.
// ---------------------------------------------------------------------
const IMPORT_FILE = "/data/cadastro-sorocaba-2026-10.json";
const KEEP = ["rino-beer"];
const SAME_PLACE = {           // lugar atual → slug no arquivo
  "fraters-pub": "frater-s-pub",
  "carneada": "carneada-restaurante-bar-y-parrila",
  "sophies-bbq": "sophie-s-bbq",
  "parque-das-aguas": "parque-das-aguas",
  "parque-agua-vermelha": "parque-natural-da-agua-vermelha-joao-cancio-pereira",
};
// só no site oficial: as prévias usam o mesmo banco e o servidor de testes tem a semente
export const importAllowed = () => {
  try { if (sessionStorage.getItem("os-force-import") === "1") return true; } catch { /* sem storage */ }
  return typeof location !== "undefined" && /(^|\.)ondesair\.com\.br$/.test(location.hostname);
};

export function importSorocaba(d, at, rows) {
  const BY = "Importação · Onde Sair";
  const city = d.cities.find(c => c.id === "sorocaba");
  const bySlug = new Map(rows.map(r => [r.slug, r]));
  const reuse = new Map();       // slug do arquivo → lugar atual
  for (const [id, slug] of Object.entries(SAME_PLACE)) {
    const old = d.places.find(p => p.id === id);
    if (old && bySlug.has(slug)) reuse.set(slug, old);
  }
  const removed = d.places.filter(p => !KEEP.includes(p.id) && ![...reuse.values()].includes(p));
  const kept = d.places.filter(p => KEEP.includes(p.id));
  d.backups = [...(d.backups || []), { id: "lugares-" + at, at, label: "Lugares antes do cadastro novo de Sorocaba", places: clone(d.places.filter(p => !KEEP.includes(p.id))) }];

  const ids = new Set(kept.map(p => p.id)), slugs = new Set(kept.map(p => p.slug));
  const uniq = (set, v) => { let x = v, i = 2; while (set.has(x)) x = `${v}-${i++}`; set.add(x); return x; };
  const fresh = rows.map(r => {
    const old = reuse.get(r.slug);
    const id = old ? old.id : uniq(ids, r.slug);
    if (old) ids.add(id);
    const slug = old ? uniq(slugs, old.slug) : uniq(slugs, r.slug);
    const ok = !!(r.bairro && r.end);
    return {
      id, slug, name: r.name, sub: r.sub || "", cuisine: r.cuisine || "", tagline: r.tagline || "", desc: r.desc || "",
      dica: r.dica || "", by: r.by || "Equipe Onde Sair", note: r.note || "", reasons: clone(r.reasons || []),
      type: r.type, open: r.open || "", phone: r.phone || "", whatsapp: r.whatsapp || "", site: r.site || "", insta: r.insta || "",
      momento: [...(r.momento || [])], ambiente: [...(r.ambiente || [])], affs: [...(r.affs || [])], tags: [...(r.tags || [])],
      showGallery: old ? !!old.showGallery : !!r.showGallery, photos: old ? clone(old.photos || []) : [],
      end: r.end || "", city: r.city || "sorocaba", bairro: r.bairro || "", cep: r.cep || "", geo: r.geo ? { ...r.geo } : null, placeId: r.placeId || "",
      map: old?.map ? { ...old.map } : { x: 50, y: 50, label: "" },
      seo: { title: r.seo?.title || "", desc: r.seo?.desc || "" },
      status: ok ? "publicado" : "rascunho",
      createdAt: old?.createdAt || at, updatedAt: at, updatedBy: BY, ...(ok ? { publishedAt: old?.publishedAt || at } : {}),
    };
  });
  d.places = [...kept, ...fresh];

  // referências aos lugares apagados
  const gone = new Map(removed.map(p => [p.id, p]));
  if (d.home?.tips) d.home = { ...d.home, tips: d.home.tips.filter(t => !gone.has(t.place)) };
  const dropFig = (body = "") => body.replace(/<figure class="place" data-place="([\w-]+)"><\/figure>/g, (m, id) => gone.has(id) ? "" : m);
  d.stories = (d.stories || []).map(s => s.places?.some(id => gone.has(id)) || dropFig(s.body) !== (s.body || "")
    ? { ...s, places: (s.places || []).filter(id => !gone.has(id)), ...(s.body != null ? { body: dropFig(s.body) } : {}) } : s);
  d.roteiros = (d.roteiros || []).map(r => !(r.steps || []).some(s => gone.has(s.place)) ? r : {
    ...r, steps: r.steps.map(s => gone.has(s.place) ? { ...s, place: "", title: s.title || gone.get(s.place).name, bairro: s.bairro || gone.get(s.place).bairro || "" } : s),
  });
  d.events = (d.events || []).map(e => gone.has(e.venue) ? { ...e, venue: "", venueName: e.venueName || gone.get(e.venue).name } : e);

  // bairros novos na cidade
  if (city) {
    const missing = [...new Set(fresh.map(p => p.bairro).filter(Boolean))].filter(b => !city.bairros.some(x => norm(x) === norm(b)));
    if (missing.length) d.cities = d.cities.map(c => c === city ? { ...c, bairros: [...c.bairros, ...missing].sort((a, b) => a.localeCompare(b, "pt-BR")) } : c);
  }
  return [`${fresh.length} lugares`, `${removed.length} removidos (guardados no backup)`];
}
const clone = (x) => JSON.parse(JSON.stringify(x));

const UPDATES = [
  { id: "2026-10-lugares-sorocaba", label: "lugares de Sorocaba (cidade principal)", apply: addSorocaba },
  { id: "2026-10-pagina-parceiros", label: "página Para parceiros (menus apontam para ela)", apply: partnersPage },
  { id: "2026-10-blog-radar", label: "seção Radar (antigas Histórias)", apply: renameBlog },
  { id: "2026-10-radar-categorias", label: "categorias do Radar", apply: radarCategories },
  { id: "2026-10-sem-avaliacoes", label: "remoção das avaliações", apply: dropReviews },
  { id: "2026-10-sem-vibe-principal", label: "fim da vibe principal", apply: dropMainVibe },
  { id: "2026-10-tipos-de-lugar", label: "tipos de lugar", apply: placeTypes },
  { id: "2026-10-sem-reserva", label: "remoção do “Aceita reserva”", apply: dropReservations },
  { id: "2026-10-menu-radar", label: "Radar no menu principal no lugar de Vibes", apply: headerRadar },
  { id: "2026-10-menu-vibes", label: "página de Vibes no menu principal", apply: headerVibes },
  { id: "2026-10-eventos", label: "eventos: categorias e agenda de exemplo", apply: seedEvents },
  { id: "2026-10-vibes-e-tipos", label: "vibes e tipos de lugar oficiais", apply: taxonomy2026 },
  { id: "2026-10-sem-precos", label: "textos de exemplo sem menção a preço", apply: noPrices },
  // assíncrona: baixa o arquivo; só o painel aplica, e só no site oficial (ver importAllowed)
  { id: "2026-10-cadastro-sorocaba", label: "cadastro novo de lugares de Sorocaba", async: true, allowed: importAllowed,
    load: () => fetch(IMPORT_FILE, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("arquivo " + r.status); return r.json(); }),
    apply: importSorocaba },
];

// Aplica no banco `d` (mutável) as atualizações ainda não registradas.
// Devolve o que foi aplicado, para registrar na atividade.
export function applyUpdates(d, at = new Date().toISOString()) {
  const done = new Set(d.updates || []);
  const applied = [];
  for (const u of UPDATES) {
    if (done.has(u.id) || u.async) continue;
    const names = u.apply(d, at);
    d.updates = [...(d.updates || []), u.id];
    applied.push({ id: u.id, label: u.label, names });
  }
  return applied;
}

// Atualizações que dependem de baixar dados (só no painel do administrador)
export async function applyAsyncUpdates(d, at = new Date().toISOString()) {
  const done = new Set(d.updates || []);
  const applied = [];
  for (const u of UPDATES) {
    if (!u.async || done.has(u.id) || (u.allowed && !u.allowed())) continue;
    let data;
    try { data = await u.load(); } catch { continue; }      // tenta de novo na próxima abertura
    const names = u.apply(d, at, data);
    d.updates = [...(d.updates || []), u.id];
    applied.push({ id: u.id, label: u.label, names });
  }
  return applied;
}
