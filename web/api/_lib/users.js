// Contas de visitantes do site (separadas da equipe do painel)
import crypto from "node:crypto";
import { readJSON, writeJSON, Conflict } from "./storage.js";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE = "os_user";
const DAYS_30 = 30 * 24 * 3600;

export const publicUser = ({ hash, sessionVersion, providers, plan, ...u }) => u;

export async function loadUsers() {
  const cur = await readJSON("users");
  return cur || { data: [], etag: null };
}

// Lê, altera e grava com nova tentativa em caso de gravação simultânea
export async function updateUsers(fn) {
  for (let i = 0; i < 4; i++) {
    const { data, etag } = await loadUsers();
    const users = [...data];
    const result = await fn(users);
    try { await writeJSON("users", users, etag); return result; }
    catch (e) { if (!(e instanceof Conflict)) throw e; }
  }
  throw Object.assign(new Error("Muitas gravações ao mesmo tempo. Tente de novo."), { status: 409 });
}

const sign = (data) => crypto.createHmac("sha256", SECRET).update("user:" + data).digest("base64url");
export function userCookie(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, v: user.sessionVersion || 0, exp: Math.floor(Date.now() / 1000) + DAYS_30 })).toString("base64url");
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS_30}${secure}`;
}
export const clearUserCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export async function currentUser(request) {
  const raw = (request.headers.get("cookie") || "").split(/;\s*/).find(c => c.startsWith(COOKIE + "="));
  if (!raw) return null;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  const s = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (s.exp < Date.now() / 1000) return null;
  const { data } = await loadUsers();
  const u = data.find(x => x.id === s.id && (x.sessionVersion || 0) === s.v && x.status !== "bloqueado");
  return u || null;
}

export const newUserId = () => "u" + crypto.randomBytes(6).toString("hex");
