// Conta do visitante (cadastro, login, favoritos e vibes)
// Nuvem: /api/account. Offline: localStorage.
import { REMOTE, api, addEventSubmission, eventSubmissionsOf, dbForSubmission, setMedia, slugify, getDB } from "./admin/store.js";
import { cleanSubmission, SUBMIT_LIMITS } from "../shared/eventsubmit.js";
import { cleanRoteiro, cleanRoteiros, blankStep, LIMITS } from "../shared/myroteiros.js";

const LOCAL_USERS = "onde-sair-users";
const LOCAL_SESSION = "onde-sair-user";
const listeners = new Set();

export const account = { user: null, ready: false };
const emit = () => listeners.forEach(fn => fn({ ...account }));
export const subscribeAccount = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// ---------- modo offline ----------
const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_USERS) || "[]"); } catch { return []; } };
const writeLocal = (users) => { try { localStorage.setItem(LOCAL_USERS, JSON.stringify(users)); } catch { /* */ } };
const pub = ({ password, ...u }) => u;
async function hash(text) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("os:" + text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  } catch { return "x" + text.length + btoa(unescape(encodeURIComponent(text))).split("").reverse().join(""); }
}
const localId = () => "u" + Math.random().toString(36).slice(2, 10);

export async function loadAccount() {
  if (REMOTE) {
    try { const r = await api("account?action=me"); account.user = r.user; } catch { /* */ }
  } else {
    try {
      const id = localStorage.getItem(LOCAL_SESSION);
      const u = id && readLocal().find(x => x.id === id);
      account.user = u ? pub(u) : null;
    } catch { account.user = null; }
  }
  account.ready = true;
  emit();
  return account.user;
}

function setUser(u) { account.user = u; emit(); return u; }

// Erros devolvidos como objeto { fields?, message? } para o formulário
export async function signup({ name, email, password, city, marketing }) {
  if (REMOTE) {
    try { const r = await api("account?action=signup", { method: "POST", body: { name, email, password, city, marketing } }); return { user: setUser(r.user) }; }
    catch (e) { return { fields: e.data?.fields, message: e.data?.fields ? null : e.message }; }
  }
  const users = readLocal();
  const fields = {};
  if ((name || "").trim().length < 2) fields.name = "Conte como você quer ser chamada(o).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) fields.email = "Esse e-mail não parece válido.";
  else if (users.some(u => u.email === email.toLowerCase().trim())) fields.email = "Já existe uma conta com esse e-mail. Que tal entrar?";
  if (!password || password.length < 8) fields.password = "Use pelo menos 8 caracteres.";
  if (Object.keys(fields).length) return { fields };
  const u = { id: localId(), name: name.trim(), email: email.toLowerCase().trim(), password: await hash(password), city, vibes: [], faves: [], status: "ativo", marketing: !!marketing, onboarded: false, joined: new Date().toISOString() };
  writeLocal([...users, u]);
  localStorage.setItem(LOCAL_SESSION, u.id);
  return { user: setUser(pub(u)) };
}

export async function login(email, password) {
  if (REMOTE) {
    try { const r = await api("account?action=login", { method: "POST", body: { email, password } }); return { user: setUser(r.user) }; }
    catch (e) {
      const code = e.data?.error || e.message;
      if (code === "locked") return { message: `Muitas tentativas. Tente de novo em ${e.data.wait} segundos.` };
      if (code === "blocked") return { message: "Essa conta está suspensa. Fale com a gente pelo contato do site." };
      if (code === "invalid") return { message: "E-mail ou senha incorretos." };
      return { message: "Não foi possível entrar agora. Verifique a conexão." };
    }
  }
  const u = readLocal().find(x => x.email === (email || "").toLowerCase().trim());
  if (!u || u.password !== await hash(password || "")) return { message: "E-mail ou senha incorretos." };
  localStorage.setItem(LOCAL_SESSION, u.id);
  return { user: setUser(pub(u)) };
}

export async function updateAccount(patch) {
  if (!account.user) return;
  if (REMOTE) {
    const r = await api("account?action=update", { method: "PATCH", body: patch });
    return setUser(r.user);
  }
  const users = readLocal().map(u => u.id === account.user.id ? { ...u, ...patch } : u);
  writeLocal(users);
  return setUser(pub(users.find(u => u.id === account.user.id)));
}

// ---------- Meus roteiros ----------
export const myRoteiros = () => account.user?.roteiros || [];
export const findMyRoteiro = (id) => myRoteiros().find(r => r.id === id);
async function setRoteiros(list) { return updateAccount({ roteiros: cleanRoteiros(list) }); }

export async function saveMyRoteiro(r) {
  const now = new Date().toISOString();
  const item = cleanRoteiro({ ...r, createdAt: r.createdAt || now, updatedAt: now });
  const list = myRoteiros();
  if (!list.some(x => x.id === item.id) && list.length >= LIMITS.roteiros) throw new Error(`Você chegou ao limite de ${LIMITS.roteiros} roteiros. Exclua algum para criar outro.`);
  await setRoteiros(list.some(x => x.id === item.id) ? list.map(x => x.id === item.id ? item : x) : [item, ...list]);
  return item;
}
export async function deleteMyRoteiro(id) { await setRoteiros(myRoteiros().filter(r => r.id !== id)); }

// Coloca um lugar no fim de um roteiro meu (ou avisa que já está nele)
export async function addPlaceToRoteiro(id, place) {
  const r = findMyRoteiro(id);
  if (!r) throw new Error("Roteiro não encontrado.");
  if (r.steps.some(s => s.place === place.id)) return { already: true, roteiro: r };
  if (r.steps.length >= LIMITS.steps) throw new Error(`Um roteiro pode ter até ${LIMITS.steps} paradas.`);
  const steps = r.steps.length === 1 && !r.steps[0].title && !r.steps[0].place ? [] : r.steps;
  const saved = await saveMyRoteiro({ ...r, steps: [...steps, blankStep({ place: place.id, title: place.name })] });
  return { roteiro: saved };
}

// Cópia editável de um roteiro da curadoria ou meu
export function copyOf(src, { mine = false } = {}) {
  const c = cleanRoteiro({
    ...src, id: "", createdAt: "", updatedAt: "",
    title: mine ? `${src.title} (cópia)` : src.title,
    stats: { tempo: src.stats?.tempo, invest: src.stats?.invest, ideal: src.stats?.ideal },
    steps: (src.steps || []).map(s => blankStep({ time: s.time, title: s.title, place: s.place || "", optional: !!s.optional, desc: s.desc })),
    tips: { dica: src.tips?.dica, horario: src.tips?.horario, comoChegar: src.tips?.comoChegar, lembrete: src.tips?.lembrete },
    from: { id: src.id, title: src.title, mine },
  });
  c.id = "";
  return c;
}

// Ação pedida sem login (salvar favorito, montar roteiro): guardada até a pessoa entrar
const INTENT = "os-intent";
export function setIntent(intent) { try { sessionStorage.setItem(INTENT, JSON.stringify(intent)); } catch { /* */ } }
export function peekIntent() { try { return JSON.parse(sessionStorage.getItem(INTENT) || "null"); } catch { return null; } }
export function takeIntent() { const i = peekIntent(); try { sessionStorage.removeItem(INTENT); } catch { /* */ } return i; }

export async function logoutAccount() {
  if (REMOTE) await api("account?action=logout", { method: "POST" }).catch(() => {});
  else try { localStorage.removeItem(LOCAL_SESSION); } catch { /* */ }
  setUser(null);
}

export async function deleteAccount() {
  if (REMOTE) await api("account?action=delete", { method: "DELETE" });
  else { writeLocal(readLocal().filter(u => u.id !== account.user?.id)); localStorage.removeItem(LOCAL_SESSION); }
  setUser(null);
}

export async function changeAccountPassword(current, next) {
  if (REMOTE) { await api("account?action=password", { method: "POST", body: { current, next } }); return; }
  const users = readLocal();
  const u = users.find(x => x.id === account.user.id);
  if (u.password !== await hash(current)) throw new Error("A senha atual não confere.");
  if (next.length < 8) throw new Error("A nova senha precisa de pelo menos 8 caracteres.");
  u.password = await hash(next);
  writeLocal(users);
}

// ---------- eventos enviados pelo usuário (vão para revisão da equipe) ----------
const mineView = (e) => ({ id: e.id, slug: e.slug, title: e.title, status: e.status, startAt: e.startAt, endAt: e.endAt, submittedAt: e.submittedBy?.at || e.createdAt });
const todaySP = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

// Devolve { event } ou { fields, message }
export async function submitEvent(payload) {
  if (!account.user) return { message: "Entre na sua conta para enviar um evento." };
  if (REMOTE) {
    try { const r = await api("account?action=event", { method: "POST", body: payload }); return { event: r.event }; }
    catch (e) { return { fields: e.data?.fields, message: e.data?.fields ? null : e.message }; }
  }
  const me = account.user;
  if (eventSubmissionsOf(me.id).filter(e => e.status === "revisao").length >= SUBMIT_LIMITS.pending)
    return { message: "Você já tem eventos aguardando aprovação. Espere a equipe analisar antes de enviar outros." };
  const ctx = dbForSubmission();
  const { event, errors } = cleanSubmission(payload, { ...ctx, today: todaySP() });
  if (Object.keys(errors).length) return { fields: errors };
  const id = "eu" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const base = slugify(event.title) || id;
  const p = event.venue && ctx.places.find(x => x.id === event.venue);
  const at = new Date().toISOString();
  const ev = {
    ...event, id, slug: (getDB().events || []).some(e => e.slug === base) ? `${base}-${id.slice(-4)}` : base, status: "revisao",
    geo: p?.geo || null, placeId: p?.placeId || "", map: p?.map || { x: 50, y: 50, label: "" }, tint: p?.tint || "tint-eco",
    reasons: [], showGallery: false, note: "", seo: { title: "", desc: "" },
    submittedBy: { id: me.id, name: me.name, email: me.email || "", at }, createdAt: at, updatedAt: at, updatedBy: `${me.name} (enviado pelo site)`,
  };
  addEventSubmission(ev);
  if (payload.image) await setMedia(`images/eventos/${id}.jpg`, payload.image, { name: me.name }).catch(() => {});
  return { event: mineView(ev) };
}
export async function myEvents() {
  if (!account.user) return [];
  if (REMOTE) { try { return (await api("account?action=my-events")).events || []; } catch { return []; } }
  return eventSubmissionsOf(account.user.id).map(mineView);
}
