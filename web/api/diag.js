// TEMPORÁRIO: apaga os arquivos de teste do diagnóstico (será removido)
import crypto from "node:crypto";
const H = "cd170a3bb5c3f5c778e073bd8f6a1f319f74d097a4110a01b2ab613309d084d9";
const FILES = ["cms/_diag.json", "cms/_diag2.json", "cms/_diag_content.json"];
export async function GET(request) {
  const t = new URL(request.url).searchParams.get("t") || "";
  if (crypto.createHash("sha256").update(t).digest("hex") !== H) return new Response("no", { status: 404 });
  const { del, head, list } = await import("@vercel/blob");
  const before = (await list({ prefix: "cms/" })).blobs.map(b => b.pathname);
  for (const f of FILES) await del(f).catch(() => {});
  const after = (await list({ prefix: "cms/" })).blobs.map(b => b.pathname);
  return Response.json({ before, after });
}
