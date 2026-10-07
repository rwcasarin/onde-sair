// TEMPORÁRIO: diagnóstico do Vercel Blob (será removido)
import crypto from "node:crypto";
const H = "cd170a3bb5c3f5c778e073bd8f6a1f319f74d097a4110a01b2ab613309d084d9";
export async function GET(request) {
  const t = new URL(request.url).searchParams.get("t") || "";
  if (crypto.createHash("sha256").update(t).digest("hex") !== H) return new Response("no", { status: 404 });
  const { put, get, head } = await import("@vercel/blob");
  const P = "cms/_diag.json", out = [];
  const log = (k, v) => out.push([k, v]);
  const opts = { access: "private", contentType: "application/json", addRandomSuffix: false, cacheControlMaxAge: 60, allowOverwrite: true };
  const err = (e) => "ERR " + e?.name + ": " + e?.message;
  const rd = async (useCache) => { const r = await get(P, { access: "private", useCache }); const txt = r ? await new Response(r.stream).text() : null; return { n: txt && JSON.parse(txt).n, etag: r?.blob.etag, cc: r?.headers.get("cache-control"), age: r?.headers.get("age"), xc: r?.headers.get("x-vercel-cache") }; };
  try {
    const cur = await get("cms/content.json", { access: "private", useCache: false });
    const text = await new Response(cur.stream).text();
    const data = JSON.parse(text);
    log("content.json bytes", text.length);
    log("content.json etag", cur.blob.etag);
    log("chaves", Object.keys(data).map(k => k + ":" + JSON.stringify(data[k]).length));
    log("atividade recente", (data.activity || []).slice(0, 25).map(x => [x.at, x.who, x.action, x.target]));
    const K = "cms/_diag_content.json";
    await put(K, text, opts);
    const g = await get(K, { access: "private", useCache: false }); await new Response(g.stream).text();
    const h = await head(K);
    log("etag get vs head", [g.blob.etag, h.etag]);
    log("ifMatch=head", await put(K, text, { ...opts, ifMatch: h.etag }).then(() => "ok", err));
    const g2 = await get(K, { access: "private", useCache: false }); await new Response(g2.stream).text();
    log("ifMatch=get sem W/", await put(K, text, { ...opts, ifMatch: g2.blob.etag.replace(/^W\//, "") }).then(() => "ok", err));
    // fluxo novo (storage.js) com o tamanho real
    const { readJSON, writeJSON } = await import("./_lib/storage.js");
    let v = await writeJSON("_diag_content", data, undefined);
    for (let i = 1; i <= 3; i++) {
      const t0 = Date.now(); data.version = i;
      try { v = await writeJSON("_diag_content", data, v); log("novo #" + i, "ok " + (Date.now() - t0) + "ms"); }
      catch (e) { log("novo #" + i, err(e)); v = (await readJSON("_diag_content"))?.etag; }
    }
    try { await writeJSON("_diag_content", data, "versao-errada"); log("conflito real", "NÃO detectado"); } catch (e) { log("conflito real", "detectado (" + e.message + ")"); }
    // contas: simula signup → delete com as funções reais
    const { updateUsers, loadUsers } = await import("./_lib/users.js");
    const id = "udiag" + Date.now();
    try { await updateUsers(u => { u.push({ id, name: "diag", email: id + "@x.com", status: "ativo" }); }); log("users add", "ok"); } catch (e) { log("users add", err(e) + " " + (e.stack || "").split("\n").slice(0, 4).join(" | ")); }
    try { await updateUsers(u => { const i = u.findIndex(y => y.id === id); if (i >= 0) u.splice(i, 1); }); log("users delete", "ok"); } catch (e) { log("users delete", err(e) + " " + (e.stack || "").split("\n").slice(0, 4).join(" | ")); }
    const lu = await loadUsers(); log("users.json", { n: lu.data.length, testes: lu.data.filter(x => /teste\.|udiag/.test(x.email || "")).map(x => x.email) });
  } catch (e) { log("fatal", err(e)); }
  return Response.json(out);
}
