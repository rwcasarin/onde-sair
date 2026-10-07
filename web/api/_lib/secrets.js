// Credenciais de integrações guardadas pelo painel (store privado; nunca vão para o site).
// As variáveis de ambiente continuam valendo como alternativa.
import { readJSON } from "./storage.js";

let cached = null, at = 0;
export async function instagramCreds() {
  if (!cached || Date.now() - at > 30_000) {
    const s = await readJSON("secrets").catch(() => null);
    cached = s?.data || {}; at = Date.now();
  }
  const ig = cached.instagram;
  if (ig?.token && ig?.businessId) return { token: ig.token, businessId: ig.businessId, source: "painel" };
  if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ID)
    return { token: process.env.INSTAGRAM_ACCESS_TOKEN, businessId: process.env.INSTAGRAM_BUSINESS_ID, source: "vercel" };
  return null;
}
export const forgetSecrets = () => { cached = null; };
