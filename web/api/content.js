// GET /api/content — conteúdo publicado (lido pelo site público)
import { readJSON } from "./_lib/storage.js";
import { json, handle } from "./_lib/http.js";
import { publicView } from "../shared/roles.js";

export const GET = handle(async () => {
  const [content, media] = await Promise.all([readJSON("content"), readJSON("media")]);
  if (!content) return json({ empty: true }, 200, { "cache-control": "no-store" });
  return json({ db: { ...publicView(content.data), media: media?.data || {} } }, 200, {
    "cache-control": "public, s-maxage=5, stale-while-revalidate=60",
  });
});
