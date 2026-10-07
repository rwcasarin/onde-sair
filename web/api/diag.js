// TEMPORÁRIO: diagnóstico de ETag do Vercel Blob (será removido)
import crypto from "node:crypto";
const H = "cd170a3bb5c3f5c778e073bd8f6a1f319f74d097a4110a01b2ab613309d084d9";
export async function GET(request) {
  const t = new URL(request.url).searchParams.get("t") || "";
  if (crypto.createHash("sha256").update(t).digest("hex") !== H) return new Response("no", { status: 404 });
  const { put, get, head } = await import("@vercel/blob");
  const P = "cms/_diag.json", out = [];
  const log = (k, v) => out.push([k, v]);
  const rd = async () => { const r = await get(P, { access: "private", useCache: false }); const txt = r ? await new Response(r.stream).text() : null; return { etag: r?.blob.etag, n: txt && JSON.parse(txt).n }; };
  try {
    const a = await put(P, JSON.stringify({ n: 1 }), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
    log("put1.etag", a.etag);
    const g1 = await rd(); log("get1", g1);
    const h1 = await head(P); log("head1.etag", h1.etag);
    const b = await put(P, JSON.stringify({ n: 2 }), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60, ifMatch: a.etag }).then(r => "ok " + r.etag, e => "ERR " + e.name + ": " + e.message);
    log("put2 ifMatch=put1", b);
    for (let i = 0; i < 4; i++) { log("get after put2 #" + i, await rd()); }
    const h2 = await head(P); log("head2.etag", h2.etag);
    const g2 = await rd();
    const c = await put(P, JSON.stringify({ n: 3 }), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60, ifMatch: g2.etag }).then(r => "ok " + r.etag, e => "ERR " + e.name + ": " + e.message);
    log("put3 ifMatch=get", c);
    const h3 = await head(P);
    const d = await put(P, JSON.stringify({ n: 4 }), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60, ifMatch: h3.etag }).then(r => "ok " + r.etag, e => "ERR " + e.name + ": " + e.message);
    log("put4 ifMatch=head (" + h3.etag + ")", d);
    log("get final", await rd());
    const cur = await get("cms/content.json", { access: "private", useCache: false }); const hc = await head("cms/content.json").catch(e => ({ etag: "ERR " + e.message }));
    log("content.json get/head etag", [cur?.blob.etag, hc.etag]);
  } catch (e) { log("fatal", e.name + ": " + e.message); }
  return Response.json(out);
}
