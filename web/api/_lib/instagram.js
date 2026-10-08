// Chamadas à API do Instagram (Graph API) e tradução dos erros para o painel.
const GRAPH = () => process.env.INSTAGRAM_GRAPH_URL || "https://graph.facebook.com/v23.0";

// GET na Graph API: devolve { data } ou { error } (nunca lança)
export async function graph(path, fields, token) {
  try {
    const r = await fetch(`${GRAPH()}/${path}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
    const j = await r.json().catch(() => ({}));
    if (j && !j.error && r.ok) return { data: j };
    return { error: j.error || { message: "HTTP " + r.status } };
  } catch (e) {
    return { error: { message: "Não foi possível falar com o Instagram (" + (e.message || "rede") + ")." } };
  }
}

// Perfil consultado que não pode ser lido (privado, pessoal ou inexistente)
export const isUnavailable = (e) => e && (e.error_subcode === 2207013 || e.code === 110 || /cannot be found|cannot find user|not a business|is not an instagram business/i.test(e.message || ""));

// Erro da Graph API → explicação em português (para quem administra)
export function explain(e = {}) {
  const msg = e.message || "", code = e.code;
  if (code === 190 || /access token/i.test(msg)) return "O token de acesso é inválido ou expirou. Gere um novo (de preferência de um usuário do sistema, com expiração “Nunca”) e salve em Configurações › Integrações.";
  if (code === 100 && /business_discovery|nonexisting field/i.test(msg) && /Page|User\b/i.test(msg)) return "O ID salvo não é o da conta do Instagram: parece ser o de uma Página ou de um usuário do Facebook. Use o instagram_business_account (o painel tenta descobrir sozinho ao salvar).";
  if (code === 100 && /does not exist|cannot be loaded|missing permissions/i.test(msg)) return "O ID não existe ou o token não tem acesso a essa conta. Confira se a conta do Instagram está atribuída ao usuário do sistema que gerou o token.";
  if ([10, 3].includes(code) || (code >= 200 && code < 300) || /permission/i.test(msg)) return "O app da Meta não tem permissão para consultar outros perfis. Confira as permissões instagram_basic, pages_show_list e pages_read_engagement no token e, se o app estiver em modo ao vivo, o acesso avançado a elas na revisão do app.";
  if ([4, 17, 32, 613].includes(code) || e.error_subcode === 2207051 || /limit/i.test(msg)) return "O Instagram limitou as consultas por agora. Tente de novo em alguns minutos.";
  return "O Instagram respondeu com erro: " + (msg || "sem detalhes") + (code ? ` (código ${code})` : "");
}

// Confere as credenciais. Se o ID for de uma Página do Facebook, troca pela conta do Instagram ligada a ela.
// → { ok: true, businessId, username, fixedFrom? } | { ok: false, error }
export async function verify(token, id) {
  // token do "login do Instagram" (IGAA…) não serve para o Business Discovery, que exige o login do Facebook (EAA…)
  if (/^IG/.test(token)) return { ok: false, error: "Esse token é do “login do Instagram” (começa com IG). Para buscar posts de outros perfis é preciso um token do login do Facebook (começa com EAA): no app da Meta, use o produto Instagram com login do Facebook e gere o token por um usuário do sistema." };
  let businessId = id, fixedFrom = null;
  const page = await graph(id, "instagram_business_account{id,username}", token);
  if (page.data) {
    const iba = page.data.instagram_business_account;
    if (!iba?.id) return { ok: false, error: "Esse ID é de uma Página do Facebook sem conta do Instagram profissional vinculada. Vincule o Instagram do Onde Sair à Página ou use o ID da conta do Instagram." };
    businessId = iba.id; fixedFrom = id;
  } else if (page.error?.code === 190) return { ok: false, error: explain(page.error) };
  const me = await graph(businessId, "username", token);
  if (me.error) return { ok: false, error: explain(me.error) };
  // teste real: o Business Discovery da própria conta
  const bd = await graph(businessId, `business_discovery.username(${me.data.username}){username,media_count}`, token);
  if (bd.error) return { ok: false, error: explain(bd.error) };
  return { ok: true, businessId, username: me.data.username, fixedFrom };
}
