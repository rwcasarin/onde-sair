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
import { readJSON, writeJSON, writeFile, Conflict } from "./_lib/storage.js";
import { cleanSubmission, SUBMIT_LIMITS } from "../shared/eventsubmit.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const attempts = new Map();
const action = (request) => new URL(request.url).searchParams.get("action");
const clean = (s, max = 80) => String(s || "").trim().slice(0, max);
// pausa de contas e interações (Configurações › Contas e interações): só sair continua liberado
async function siteSettings() {
  const c = await readJSON("content").catch(() => null);
  return c?.data?.settings || {};
}
const accountsPaused = async () => !!(await siteSettings()).accounts?.paused;
const pausedFail = () => fail(503, "paused", { message: "Contas e interações estão pausadas por alguns instantes." });
// pausa de roteiros (Configurações › Pausas): criar, editar e excluir roteiros fica bloqueado
const roteirosPausedFail = () => fail(503, "roteiros-paused", { message: "Os roteiros estão pausados por alguns instantes." });

// ---------- eventos enviados pelo site (entram em revisão; a equipe aprova no painel) ----------
const todaySP = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
const slugify = (s = "") => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['’]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const mineView = (e) => ({ id: e.id, slug: e.slug, title: e.title, status: e.status, startAt: e.startAt, endAt: e.endAt, submittedAt: e.submittedBy?.at || e.createdAt });
const IMG = /^data:(image\/(jpeg|png|webp));base64,(.+)$/;

async function updateContent(fn) {
  for (let i = 0; i < 4; i++) {                // outra gravação no meio: lê de novo e tenta outra vez
    const cur = await readJSON("content");
    if (!cur) throw Object.assign(new Error("O conteúdo do site ainda não foi criado."), { status: 503 });
    const res = fn(cur.data);
    if (res?.fail) return res;
    try { await writeJSON("content", cur.data, cur.etag); return res; }
    catch (e) { if (!(e instanceof Conflict)) throw e; }
  }
  throw Object.assign(new Error("Muitas gravações ao mesmo tempo, tente de novo."), { status: 409 });
}
async function saveImage(path, dataUrl) {
  const m = String(dataUrl || "").match(IMG);
  if (!m) return false;
  const buf = Buffer.from(m[3], "base64");
  if (buf.length > SUBMIT_LIMITS.imageBytes) return false;
  await writeFile(path, buf, m[1]);
  const version = Date.now().toString(36);
  for (let i = 0; i < 4; i++) {
    const cur = await readJSON("media");
    try { await writeJSON("media", { ...(cur?.data || {}), [path]: version }, cur ? cur.etag : null); return true; }
    catch (e) { if (!(e instanceof Conflict)) throw e; }
  }
  return false;
}

async function submitEvent(request, me) {
  const raw = await body(request);
  if (raw.image && !IMG.test(raw.image)) return fail(400, "invalid", { fields: { image: "Use uma imagem JPG, PNG ou WebP." } });
  const id = "eu" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const res = await updateContent((data) => {
    const events = data.events || [];
    if (events.filter(e => e.submittedBy?.id === me.id && e.status === "revisao").length >= SUBMIT_LIMITS.pending)
      return { fail: fail(429, "Você já tem eventos aguardando aprovação. Espere a equipe analisar antes de enviar outros.") };
    const live = (data.places || []).filter(p => p.status === "publicado");
    const { event, errors } = cleanSubmission(raw, { categories: data.eventCategories || [], vibes: (data.vibes || []).filter(v => v.active !== false), places: live, cities: data.cities || [], today: todaySP() });
    if (Object.keys(errors).length) return { fail: fail(400, "invalid", { fields: errors }) };
    const p = event.venue && live.find(x => x.id === event.venue);
    const base = slugify(event.title) || id;
    const slug = events.some(e => e.slug === base) ? `${base}-${id.slice(-4)}` : base;
    const at = new Date().toISOString();
    const ev = {
      ...event, id, slug, status: "revisao",
      geo: p?.geo || null, placeId: p?.placeId || "", map: p?.map || { x: 50, y: 50, label: "" }, tint: p?.tint || "tint-eco",
      reasons: [], showGallery: false, note: "", seo: { title: "", desc: "" },
      submittedBy: { id: me.id, name: me.name, email: me.email || "", at },
      createdAt: at, updatedAt: at, updatedBy: `${me.name} (enviado pelo site)`,
    };
    data.events = [ev, ...events];
    data.activity = [{ at, who: me.name, action: "enviou para revisão", target: ev.title, type: "evento" }, ...(data.activity || [])].slice(0, 200);
    return { ev };
  });
  if (res.fail) return res.fail;
  if (raw.image) await saveImage(`images/eventos/${id}.jpg`, raw.image).catch(() => false);
  return json({ event: mineView(res.ev) });
}

export const GET = handle(async (request) => {
  if (action(request) === "my-events") {
    const me = await currentUser(request);
    if (!me) return fail(401, "Entre na sua conta.");
    const c = await readJSON("content");
    return json({ events: (c?.data?.events || []).filter(e => e.submittedBy?.id === me.id).map(mineView) });
  }
  if (action(request) !== "me") return fail(404, "Ação desconhecida");
  const [u, paused] = await Promise.all([currentUser(request), accountsPaused()]);
  return json({ user: u && !paused ? publicUser(u) : null, paused });
});

export const POST = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const a = action(request);
  if (a !== "logout" && await accountsPaused()) return pausedFail();

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
        avatar: null, city: clean(city, 12) || "sorocaba", vibes: [], faves: [], status: "ativo",
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

  if (a === "event") {
    const me = await currentUser(request);
    if (!me) return fail(401, "Entre na sua conta para enviar um evento.");
    if ((await siteSettings()).eventsPause?.paused) return fail(503, "events-paused", { message: "O envio de eventos está pausado por alguns instantes." });
    return submitEvent(request, me);
  }

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
  const settings = await siteSettings();
  if (settings.accounts?.paused) return pausedFail();
  const me = await currentUser(request);
  if (!me) return fail(401, "Entre na sua conta.");
  const p = await body(request);
  if (p.roteiros !== undefined && settings.roteirosPause?.paused) return roteirosPausedFail();
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
  if (await accountsPaused()) return pausedFail();
  const me = await currentUser(request);
  if (!me) return fail(401, "Entre na sua conta.");
  await updateUsers(users => { const i = users.findIndex(y => y.id === me.id); if (i >= 0) users.splice(i, 1); });
  return json({ ok: true }, 200, { "set-cookie": clearUserCookie() });
});
