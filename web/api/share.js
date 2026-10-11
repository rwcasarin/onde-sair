// GET /api/share?path=/lugares/x — index.html com as meta tags da página (para os robôs de
// pré-visualização de links: WhatsApp, Instagram, Facebook, X, LinkedIn… ver vercel.json)
import { readJSON } from "./_lib/storage.js";
import { handle } from "./_lib/http.js";
import { publicView } from "../shared/roles.js";
import { shareMeta, injectMeta } from "../shared/share.js";

export const GET = handle(async (request) => {
  const u = new URL(request.url);
  const origin = `${request.headers.get("x-forwarded-proto") || u.protocol.replace(":", "")}://${request.headers.get("x-forwarded-host") || request.headers.get("host") || u.host}`;
  const path = (u.searchParams.get("path") || "/").replace(/^([^/])/, "/$1");
  const [content, media, page] = await Promise.all([
    readJSON("content"), readJSON("media"),
    fetch(origin + "/index.html").then(r => r.ok ? r.text() : null).catch(() => null),
  ]);
  const html = page || `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Onde Sair</title></head><body></body></html>`;
  const meta = content ? shareMeta(publicView(content.data), media?.data || {}, path, origin) : { title: "Onde Sair", desc: "", image: "", type: "website" };
  return new Response(injectMeta(html, meta, origin + path), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
});
