// Autenticação do painel: senhas com scrypt, sessão em cookie HttpOnly assinado (HMAC)
import crypto from "node:crypto";
import { readJSON, writeJSON } from "./storage.js";
import { fail } from "./http.js";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE = "os_session";
const WEEK = 7 * 24 * 3600;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}
export function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith("scrypt:")) return false;
  const [, salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 64);
  const ref = Buffer.from(hash, "hex");
  return ref.length === test.length && crypto.timingSafeEqual(ref, test);
}

const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (data) => crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

export function sessionCookie(user, remember) {
  const payload = b64(JSON.stringify({ id: user.id, v: user.sessionVersion || 0, exp: Math.floor(Date.now() / 1000) + WEEK }));
  const token = `${payload}.${sign(payload)}`;
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}${remember ? `; Max-Age=${WEEK}` : ""}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

function readSession(request) {
  const raw = (request.headers.get("cookie") || "").split(/;\s*/).find(c => c.startsWith(COOKIE + "="));
  if (!raw) return null;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (data.exp < Date.now() / 1000) return null;
  return data;
}

// Equipe (com bootstrap do primeiro administrador via variáveis de ambiente)
export async function loadTeam() {
  const cur = await readJSON("team");
  if (cur) return cur;
  const email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return { data: [], etag: null };
  const team = [{ id: "t1", name: process.env.ADMIN_NAME || "Administrador", email: email.toLowerCase(), role: "admin", status: "ativo", hash: hashPassword(password), lastLogin: null, sessionVersion: 0 }];
  try { const etag = await writeJSON("team", team, null); return { data: team, etag }; }
  catch { return readJSON("team"); }
}
export const publicMember = ({ hash, sessionVersion, ...m }) => m;

export async function currentUser(request) {
  const s = readSession(request);
  if (!s) return null;
  const { data: team } = await loadTeam();
  const u = team.find(t => t.id === s.id && t.status === "ativo" && (t.sessionVersion || 0) === s.v);
  return u ? publicMember(u) : null;
}

export async function requireUser(request) {
  const user = await currentUser(request);
  if (!user) throw Object.assign(new Error("Sessão expirada. Entre novamente."), { status: 401 });
  return user;
}
export { fail };
