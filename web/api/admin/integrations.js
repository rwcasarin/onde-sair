// GET/POST /api/admin/integrations — credenciais do Instagram (só administradores).
// O token nunca volta para o navegador: o painel vê só os 4 últimos caracteres.
import { requireUser } from "../_lib/auth.js";
import { readJSON, writeJSON } from "../_lib/storage.js";
import { json, fail, body, handle, isCmsCall } from "../_lib/http.js";
import { can } from "../../shared/roles.js";
import { instagramCreds, forgetSecrets } from "../_lib/secrets.js";
import { verify } from "../_lib/instagram.js";

async function admin(request) {
  const user = await requireUser(request);
  if (!can(user, "settings.edit")) throw Object.assign(new Error("Só administradores mexem nas integrações."), { status: 403 });
  return user;
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
  // com credenciais salvas, confere se continuam funcionando (token expirado, permissão retirada…)
  const c = await instagramCreds();
  if (!c) return json(await status());
  const v = await verify(c.token, c.businessId);
  // ID salvo era o da Página do Facebook: corrige para o da conta do Instagram
  if (v.ok && v.fixedFrom && c.source === "painel") {
    const s = await readJSON("secrets");
    await writeJSON("secrets", { ...s.data, instagram: { ...s.data.instagram, businessId: v.businessId } });
    forgetSecrets();
    return json(await status({ health: { ok: true, username: v.username, warn: "O ID salvo era o da Página do Facebook; trocamos pelo da conta do Instagram." } }));
  }
  return json(await status(v.ok ? { health: { ok: true, username: v.username, ...(v.fixedFrom ? { warn: "O ID salvo é o da Página do Facebook; salve de novo para usar o da conta do Instagram (" + v.businessId + ")." } : {}) } } : { health: { ok: false, error: v.error } }));
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
  const t = await verify(token, businessId);
  if (!t.ok) return fail(400, t.error);
  data.instagram = { token, businessId: t.businessId, updatedAt: new Date().toISOString(), updatedBy: user.name || user.email };
  await writeJSON("secrets", data);
  forgetSecrets();
  return json(await status({ username: t.username, fixedFrom: t.fixedFrom, health: { ok: true, username: t.username } }));
});
