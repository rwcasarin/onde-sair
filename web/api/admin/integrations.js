// GET/POST /api/admin/integrations — credenciais do Instagram (só administradores).
// O token nunca volta para o navegador: o painel vê só os 4 últimos caracteres.
import { requireUser } from "../_lib/auth.js";
import { readJSON, writeJSON } from "../_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "../_lib/http.js";
import { can } from "../../shared/roles.js";
import { instagramCreds, forgetSecrets } from "../_lib/secrets.js";

const GRAPH = () => process.env.INSTAGRAM_GRAPH_URL || "https://graph.facebook.com/v23.0";

async function admin(request) {
  const user = await requireUser(request);
  if (!can(user, "settings.edit")) throw Object.assign(new Error("Só administradores mexem nas integrações."), { status: 403 });
  return user;
}

// Testa as credenciais lendo a própria conta do Instagram
async function test(token, businessId) {
  try {
    const r = await fetch(`${GRAPH()}/${businessId}?fields=username&access_token=${encodeURIComponent(token)}`);
    const j = await r.json().catch(() => ({}));
    if (j.username) return { ok: true, username: j.username };
    return { ok: false, error: j.error?.message || "Resposta inesperada do Instagram (" + r.status + ")" };
  } catch { return { ok: false, error: "Não foi possível falar com o Instagram." }; }
}

async function status(extra = {}) {
  const s = await readJSON("secrets");
  const ig = s?.data?.instagram;
  const c = await instagramCreds();
  return {
    instagram: {
      configured: !!c, source: c?.source || null,
      businessId: c?.businessId || "", tokenHint: c ? "••••" + c.token.slice(-4) : "",
      updatedAt: c?.source === "painel" ? ig.updatedAt : null, updatedBy: c?.source === "painel" ? ig.updatedBy : null,
      ...extra,
    },
  };
}

export const GET = handle(async (request) => {
  await admin(request);
  return json(await status());
});

export const POST = handle(async (request) => {
  if (!isCmsCall(request)) return fail(403, "Requisição inválida");
  const user = await admin(request);
  const { instagram = {} } = await body(request, 64 * 1024);
  const s = await readJSON("secrets");
  const data = { ...(s?.data || {}) };

  if (instagram.remove) {
    delete data.instagram;
    await writeJSON("secrets", data);
    forgetSecrets();
    return json(await status());
  }
  const businessId = String(instagram.businessId || "").trim();
  const token = String(instagram.token || "").trim() || data.instagram?.token || "";   // token vazio = mantém o atual
  if (!/^\d{5,25}$/.test(businessId)) return fail(400, "O ID da conta do Instagram tem só números.");
  if (token.length < 20 || /\s/.test(token)) return fail(400, "Cole o token de acesso completo.");
  const t = await test(token, businessId);
  if (!t.ok) return fail(400, "O Instagram recusou essas credenciais: " + t.error);
  data.instagram = { token, businessId, updatedAt: new Date().toISOString(), updatedBy: user.name || user.email };
  await writeJSON("secrets", data);
  forgetSecrets();
  return json(await status({ username: t.username }));
});
