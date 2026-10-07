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
    let a = await put(P, JSON.stringify({ n: 1 }), opts); log("put n=1 etag", a.etag);
    for (let k = 2; k <= 4; k++) {
      const t0 = Date.now();
      a = await put(P, JSON.stringify({ n: k }), opts).catch(e => ({ etag: err(e) })); log("put n=" + k + " (" + (Date.now() - t0) + "ms)", a.etag);
      const seen = [];
      for (let i = 0; i < 12; i++) { const g = await rd(false); const h = await head(P).catch(e => ({ etag: err(e) })); seen.push([Date.now() - t0, g.n, g.etag === a.etag, h.etag === a.etag, g.xc, g.age]); if (g.n === k && i > 2) break; await new Promise(r => setTimeout(r, 150)); }
      log("leituras após put n=" + k + " [ms, n lido, getEtag==put, headEtag==put, x-vercel-cache, age]", seen);
    }
    const g = await rd(false), h = await head(P);
    log("etags", { put: a.etag, get: g.etag, head: h.etag });
    log("ifMatch=put", await put(P, JSON.stringify({ n: 10 }), { ...opts, ifMatch: a.etag }).then(r => (a = r, "ok"), err));
    log("ifMatch=get(fresco)", await (async () => { await new Promise(r => setTimeout(r, 1500)); const g2 = await rd(false); return put(P, JSON.stringify({ n: 11 }), { ...opts, ifMatch: g2.etag }).then(r => (a = r, "ok"), err); })());
    log("ifMatch=head", await (async () => { const h2 = await head(P); return put(P, JSON.stringify({ n: 12 }), { ...opts, ifMatch: h2.etag }).then(r => (a = r, "ok"), err); })());
    log("ifMatch=errado", await put(P, JSON.stringify({ n: 13 }), { ...opts, ifMatch: '"nao-existe"' }).then(() => "ok (!)", err));
    const t1 = Date.now(); const rapid = [];
    for (let i = 0; i < 4; i++) rapid.push(await put(P, JSON.stringify({ n: 20 + i }), opts).then(() => "ok " + (Date.now() - t1) + "ms", err));
    log("4 puts seguidos", rapid);
  } catch (e) { log("fatal", err(e)); }
  return Response.json(out);
}
