// Contas do site — uma função, várias ações (limite de funções do plano Hobby)
// GET  ?action=me            → usuário da sessão
// POST ?action=signup        { name, email, password, city, marketing }
// POST ?action=login         { email, password }
// POST ?action=logout
// PATCH ?action=update       { name?, city?, vibes?, faves?, roteiros?, marketing?, onboarded? }
// POST ?action=password      { current, next }
// DELETE ?action=delete      → exclui a conta (LGPD)
import { hashPassword, verifyPassword } from "./_lib/auth.js";
import { loadUsers, updateUsers, publicUser, userCookie, clearUserCookie, currentUser, newUserId } from "./_lib/users.js";
import { json, fail, body, handle, isCmsCall } from "./_lib/http.js";
import { cleanRoteiros } from "../shared/myroteiros.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const attempts = new Map();
const action = (request) => new URL(request.url).searchParams.get("action");
const clean = (s, max = 80) => String(s || "").trim().slice(0, max);

export const GET = handle(async (request) => {
  if (action(request) !== "me") return fail(404, "Ação desconhecida");
  const u = await currentUser(request);
  return json({ user: u ? publicUser(u) : null });
});

export const POST = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const a = action(request);

  if (a === "signup") {
    const { name, email, password, city, marketing } = await body(request);
    const e = {};
    if (clean(name).length < 2) e.name = "Conte como você quer ser chamada(o).";
    if (!EMAIL.test(email || "")) e.email = "Esse e-mail não parece válido.";
    if (!password || password.length < 8) e.password = "Use pelo menos 8 caracteres.";
    if (Object.keys(e).length) return fail(400, "invalid", { fields: e });
    const user = await updateUsers((users) => {
      if (users.some(u => u.email && u.email === email.toLowerCase().trim()))
        throw Object.assign(new Error("exists"), { status: 409 });
      const u = {
        id: newUserId(), name: clean(name), email: email.toLowerCase().trim(), hash: hashPassword(password),
        avatar: null, city: clean(city, 12) || "sp", vibes: [], faves: [], status: "ativo",
        marketing: !!marketing, onboarded: false, joined: new Date().toISOString(), lastSeen: new Date().toISOString(), sessionVersion: 0,
      };
      users.push(u);
      return u;
    }).catch(err => { if (err.message === "exists") return null; throw err; });
    if (!user) return fail(409, "exists", { fields: { email: "Já existe uma conta com esse e-mail. Que tal entrar?" } });
    return json({ user: publicUser(user) }, 200, { "set-cookie": userCookie(user) });
  }

  if (a === "login") {
    const { email = "", password = "" } = await body(request);
    const key = (request.headers.get("x-forwarded-for") || "").split(",")[0] + "|" + email.toLowerCase();
    const at = attempts.get(key) || { n: 0, until: 0 };
    if (Date.now() < at.until) return fail(429, "locked", { wait: Math.ceil((at.until - Date.now()) / 1000) });
    const { data } = await loadUsers();
    const u = data.find(x => x.email === email.toLowerCase().trim());
    if (!u || !u.hash || !verifyPassword(password, u.hash)) {
      at.n += 1;
      if (at.n >= 5) { at.n = 0; at.until = Date.now() + 30000; }
      attempts.set(key, at);
      return fail(401, "invalid");
    }
    if (u.status === "bloqueado") return fail(403, "blocked");
    attempts.delete(key);
    await updateUsers(users => { const x = users.find(y => y.id === u.id); if (x) x.lastSeen = new Date().toISOString(); });
    return json({ user: publicUser(u) }, 200, { "set-cookie": userCookie(u) });
  }

  if (a === "logout") return json({ ok: true }, 200, { "set-cookie": clearUserCookie() });

  if (a === "password") {
    const me = await currentUser(request);
    if (!me) return fail(401, "Entre na sua conta.");
    const { current = "", next = "" } = await body(request);
    if (next.length < 8) return fail(400, "A nova senha precisa de pelo menos 8 caracteres.");
    if (!verifyPassword(current, me.hash || "")) return fail(400, "A senha atual não confere.");
    const u = await updateUsers(users => { const x = users.find(y => y.id === me.id); x.hash = hashPassword(next); x.sessionVersion = (x.sessionVersion || 0) + 1; return x; });
    return json({ ok: true }, 200, { "set-cookie": userCookie(u) });
  }
  return fail(404, "Ação desconhecida");
});

export const PATCH = handle(async (request) => {
  if (!isCmsCall(request) || action(request) !== "update") return fail(403, "Requisição inválida");
  const me = await currentUser(request);
  if (!me) return fail(401, "Entre na sua conta.");
  const p = await body(request);
  const u = await updateUsers(users => {
    const x = users.find(y => y.id === me.id);
    if (p.name !== undefined && clean(p.name).length >= 2) x.name = clean(p.name);
    if (p.city !== undefined) x.city = clean(p.city, 12);
    if (Array.isArray(p.vibes)) x.vibes = p.vibes.slice(0, 12).map(v => clean(v, 20));
    if (Array.isArray(p.faves)) x.faves = p.faves.slice(0, 500).map(v => clean(v, 20));
    if (Array.isArray(p.roteiros)) x.roteiros = cleanRoteiros(p.roteiros);
    if (p.marketing !== undefined) x.marketing = !!p.marketing;
    if (p.onboarded !== undefined) x.onboarded = !!p.onboarded;
    x.lastSeen = new Date().toISOString();
    return x;
  });
  return json({ user: publicUser(u) });
});

export const DELETE = handle(async (request) => {
  if (!isCmsCall(request) || action(request) !== "delete") return fail(403, "Requisição inválida");
  const me = await currentUser(request);
  if (!me) return fail(401, "Entre na sua conta.");
  await updateUsers(users => { const i = users.findIndex(y => y.id === me.id); if (i >= 0) users.splice(i, 1); });
  return json({ ok: true }, 200, { "set-cookie": clearUserCookie() });
});
