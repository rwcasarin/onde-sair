// Login com Google (Google Identity Services): o navegador recebe um ID token (JWT) do Google
// e o servidor confere com o próprio Google antes de abrir a sessão.
// Configuração: variável de ambiente GOOGLE_CLIENT_ID (ID do cliente OAuth "Aplicativo da Web").
export const googleClientId = () => (process.env.GOOGLE_CLIENT_ID || "").trim();

const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const bad = (msg = "google-invalid") => Object.assign(new Error(msg), { status: 401 });

// Só no ambiente de testes local (nunca na Vercel): aceita "test.<json em base64url>" no lugar do token
function testPayload(credential) {
  if (process.env.GOOGLE_TEST_MODE !== "1" || process.env.VERCEL || !String(credential).startsWith("test.")) return null;
  try { return { aud: googleClientId(), iss: "accounts.google.com", email_verified: "true", exp: String(Math.floor(Date.now() / 1000) + 600), ...JSON.parse(Buffer.from(credential.slice(5), "base64url").toString()) }; }
  catch { throw bad(); }
}

// Devolve { sub, email, name, picture } de um token válido emitido para este site
export async function verifyGoogle(credential) {
  const clientId = googleClientId();
  if (!clientId) throw Object.assign(new Error("google-off"), { status: 503 });
  if (!credential || typeof credential !== "string" || credential.length > 4096) throw bad();
  let info = testPayload(credential);
  if (!info) {
    // o tokeninfo do Google confere a assinatura e a validade do token
    const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential)).catch(() => null);
    if (!r) throw Object.assign(new Error("google-unreachable"), { status: 502 });
    if (!r.ok) throw bad();
    info = await r.json().catch(() => null);
    if (!info) throw bad();
  }
  if (info.aud !== clientId) throw bad();                                  // token emitido para outro site
  if (!ISSUERS.has(info.iss)) throw bad();
  if (Number(info.exp) * 1000 < Date.now()) throw bad("google-expired");
  if (String(info.email_verified) !== "true" || !info.email) throw bad("google-unverified");
  return {
    sub: String(info.sub || ""),
    email: String(info.email).toLowerCase().trim(),
    name: String(info.name || info.given_name || "").trim().slice(0, 80),
    picture: /^https:\/\//.test(info.picture || "") ? String(info.picture).slice(0, 500) : null,
  };
}
