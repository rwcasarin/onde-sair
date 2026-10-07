// Armazenamento do CMS.
// Produção: Vercel Blob (store privado). Desenvolvimento: pasta local .data/
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = path.join(process.cwd(), ".data");

export class Conflict extends Error {}

async function blobLib() { return import("@vercel/blob"); }

// ---------- JSON com controle de concorrência (ETag) ----------
export async function readJSON(name) {
  if (useBlob) {
    const { get } = await blobLib();
    const r = await get(`cms/${name}.json`, { access: "private", useCache: false });
    if (!r || !r.stream) return null;
    const text = await new Response(r.stream).text();
    return { data: JSON.parse(text), etag: r.blob.etag };
  }
  try {
    const text = await fs.readFile(path.join(LOCAL, "cms", name + ".json"), "utf8");
    return { data: JSON.parse(text), etag: crypto.createHash("md5").update(text).digest("hex") };
  } catch (e) { if (e.code === "ENOENT") return null; throw e; }
}

// etag: string (precisa bater) | null (o arquivo não pode existir) | undefined (sem checagem)
export async function writeJSON(name, data, etag) {
  const body = JSON.stringify(data);
  if (useBlob) {
    const { put } = await blobLib();
    try {
      const r = await put(`cms/${name}.json`, body, {
        access: "private", contentType: "application/json", addRandomSuffix: false, cacheControlMaxAge: 60,
        allowOverwrite: etag !== null, ...(etag ? { ifMatch: etag } : {}),
      });
      return r.etag;
    } catch (e) {
      if (/precondition|already exists|412|409/i.test(String(e?.message) + e?.name)) throw new Conflict("conflict");
      throw e;
    }
  }
  const file = path.join(LOCAL, "cms", name + ".json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  const cur = await readJSON(name);
  if (etag === null && cur) throw new Conflict("exists");
  if (etag && cur && cur.etag !== etag) throw new Conflict("stale");
  await fs.writeFile(file, body);
  return crypto.createHash("md5").update(body).digest("hex");
}

// ---------- Arquivos de mídia ----------
const mediaKey = (p) => "media/" + p.replace(/^\/+/, "");

export async function writeFile(p, buffer, contentType) {
  if (useBlob) {
    const { put } = await blobLib();
    await put(mediaKey(p), buffer, { access: "private", contentType, addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000 });
    return;
  }
  const file = path.join(LOCAL, mediaKey(p));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);
}

export async function readFile(p) {
  if (useBlob) {
    const { get } = await blobLib();
    const r = await get(mediaKey(p), { access: "private" });
    if (!r || !r.stream) return null;
    return { stream: r.stream, contentType: r.blob.contentType || "image/jpeg" };
  }
  try {
    const buf = await fs.readFile(path.join(LOCAL, mediaKey(p)));
    return { stream: buf, contentType: "image/jpeg" };
  } catch { return null; }
}

export async function deleteFile(p) {
  if (useBlob) {
    const { del } = await blobLib();
    await del(mediaKey(p)).catch(() => {});
    return;
  }
  await fs.rm(path.join(LOCAL, mediaKey(p)), { force: true });
}
