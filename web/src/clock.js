// Relógio do site: dia e hora vêm do servidor e sempre no fuso de São Paulo,
// não do computador do usuário (que pode estar com a hora errada ou em outro fuso).
//
// - syncClock(resposta, enviadoEm): acerta a diferença para o servidor pelo cabeçalho Date
//   das respostas da API (chamado nos fetch de /api/…).
// - nowMs(): o instante atual do servidor (milissegundos, para comparar com datas ISO).
// - nowSP(): o "agora" em horário de parede de São Paulo, como Date cujos getters locais
//   (getDay, getHours…) dão o horário de lá — o mesmo formato das datas do cadastro
//   ("AAAA-MM-DDTHH:MM", lidas com parseLocal). Use para "hoje", "aberto agora", agenda etc.
const TZ = "America/Sao_Paulo";
let skew = 0;                 // servidor − aparelho, em ms

export function syncClock(res, sentAt = Date.now()) {
  try {
    const d = Date.parse(res?.headers?.get?.("date") || "");
    if (!d) return;
    const age = +(res.headers.get("age") || 0);                    // resposta guardada na CDN
    const server = d + age * 1000 + 500;                           // o cabeçalho tem resolução de 1 s
    const est = server - (sentAt + Date.now()) / 2;                // meio do caminho da requisição
    if (Math.abs(est - skew) > 1500) { skew = est; cache = null; } // ignora o tremor de 1 s do cabeçalho
  } catch { /* sem cabeçalho: segue com o que tem */ }
}

export const nowMs = () => Date.now() + skew;

const fmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
let cache = null;             // { ms, date } — recalcula no máximo a cada 250 ms
export function nowSP() {
  const ms = nowMs();
  if (!cache || Math.abs(ms - cache.ms) > 250) {
    const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
    cache = { ms, date: new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second, ms % 1000) };
  }
  return new Date(cache.date.getTime());
}
// "AAAA-MM-DD" de hoje em São Paulo
export const todaySP = () => { const d = nowSP(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
