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
    // repete o fluxo antigo (ler → comparar → gravar com ifMatch) com um corpo do mesmo tamanho
    const K = "cms/_diag_content.json";
    let r = await put(K, text, opts); let et = r.etag; log("cópia put", [et, r.size]);
    for (let i = 1; i <= 3; i++) {
      const t0 = Date.now();
      const g = await get(K, { access: "private", useCache: false }); await new Response(g.stream).text();
      const same = g.blob.etag === et;
      const w = await put(K, text.replace(/"_n":\d+|^\{/, (m) => m === "{" ? '{"_n":' + i + "," : '"_n":' + i), { ...opts, ifMatch: g.blob.etag }).then(x => (et = x.etag, "ok"), err);
      log("fluxo antigo #" + i + " (" + (Date.now() - t0) + "ms)", { getEtagIgualAoUltimoPut: same, gravacao: w });
    }
  } catch (e) { log("fatal", err(e)); }
  return Response.json(out);
}
