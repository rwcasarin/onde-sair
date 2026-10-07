export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
export const fail = (status, error, extra = {}) => json({ error, ...extra }, status);

export async function body(request, max = 6 * 1024 * 1024) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > max) throw Object.assign(new Error("too large"), { status: 413 });
  try { return await request.json(); } catch { throw Object.assign(new Error("invalid json"), { status: 400 }); }
}

// Proteção contra CSRF: chamadas que alteram dados exigem este cabeçalho
// (navegadores não o enviam de outros sites sem uma pré-checagem CORS, que não liberamos)
export const isCmsCall = (request) => request.headers.get("x-cms") === "1";

export function handle(fn) {
  return async (request) => {
    try { return await fn(request); }
    catch (e) {
      if (e.status) return fail(e.status, e.message);
      console.error(e);
      return fail(500, "Erro interno");
    }
  };
}
