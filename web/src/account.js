// Conta do visitante (cadastro, login, login social, favoritos e vibes)
// Nuvem: /api/account + /api/oauth. Offline: localStorage (social simulado).
import { REMOTE, api } from "./admin/store.js";

const LOCAL_USERS = "onde-sair-users";
const LOCAL_SESSION = "onde-sair-user";
const listeners = new Set();

export const account = { user: null, providers: { google: false, instagram: false, tiktok: false }, ready: false };
const emit = () => listeners.forEach(fn => fn({ ...account }));
export const subscribeAccount = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export const PROVIDER_LABEL = { google: "Google", instagram: "Instagram", tiktok: "TikTok" };

// ---------- modo offline ----------
const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_USERS) || "[]"); } catch { return []; } };
const writeLocal = (users) => { try { localStorage.setItem(LOCAL_USERS, JSON.stringify(users)); } catch { /* */ } };
const pub = ({ password, ...u }) => ({ ...u, hasPassword: !!password });
async function hash(text) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("os:" + text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  } catch { return "x" + text.length + btoa(unescape(encodeURIComponent(text))).split("").reverse().join(""); }
}
const localId = () => "u" + Math.random().toString(36).slice(2, 10);

export async function loadAccount() {
  if (REMOTE) {
    try { const r = await api("account?action=me"); account.user = r.user; account.providers = r.providers; } catch { /* */ }
  } else {
    try {
      const id = localStorage.getItem(LOCAL_SESSION);
      const u = id && readLocal().find(x => x.id === id);
      account.user = u ? pub(u) : null;
    } catch { account.user = null; }
    account.providers = { google: true, instagram: true, tiktok: true }; // simulados
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
  const u = { id: localId(), name: name.trim(), email: email.toLowerCase().trim(), password: await hash(password), providers: [], city, vibes: [], faves: [], plan: "Grátis", status: "ativo", marketing: !!marketing, onboarded: false, joined: new Date().toISOString() };
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
      if (code === "social") return { message: `Essa conta entra com ${PROVIDER_LABEL[e.data.provider] || e.data.provider}. Use o botão acima.` };
      if (code === "invalid") return { message: "E-mail ou senha incorretos." };
      return { message: "Não foi possível entrar agora. Verifique a conexão." };
    }
  }
  const u = readLocal().find(x => x.email === (email || "").toLowerCase().trim());
  if (!u || u.password !== await hash(password || "")) return { message: "E-mail ou senha incorretos." };
  localStorage.setItem(LOCAL_SESSION, u.id);
  return { user: setUser(pub(u)) };
}

// Login social: na nuvem redireciona para o provedor; offline, simula
export async function socialLogin(provider, next = "") {
  if (REMOTE) {
    if (!account.providers[provider]) return { message: `O login com ${PROVIDER_LABEL[provider]} ainda não foi ativado. Use o e-mail por enquanto.` };
    window.location.href = `/api/oauth/${provider}${next ? "?next=" + encodeURIComponent(next) : ""}`;
    return { redirecting: true };
  }
  const users = readLocal();
  let u = users.find(x => (x.providers || []).includes(provider));
  const isNew = !u;
  if (!u) {
    u = { id: localId(), name: { google: "Visitante Google", instagram: "Visitante Instagram", tiktok: "Visitante TikTok" }[provider], email: provider === "google" ? `visitante.${Date.now().toString(36)}@gmail.com` : null,
      password: null, providers: [provider], city: "sp", vibes: [], faves: [], plan: "Grátis", status: "ativo", marketing: false, onboarded: false, joined: new Date().toISOString() };
    writeLocal([...users, u]);
  }
  localStorage.setItem(LOCAL_SESSION, u.id);
  return { user: setUser(pub(u)), isNew, simulated: true };
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
  if (u.password && u.password !== await hash(current)) throw new Error("A senha atual não confere.");
  if (next.length < 8) throw new Error("A nova senha precisa de pelo menos 8 caracteres.");
  u.password = await hash(next);
  writeLocal(users);
}
