// Armazenamento do CMS.
// Produção: Vercel Blob (store privado). Desenvolvimento: pasta local .data/
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = path.join(process.cwd(), ".data");

export class Conflict extends Error {}

async function blobLib() { return import("@vercel/blob"); }

// ---------- JSON com controle de versão ----------
// A "versão" de um arquivo é o hash do próprio conteúdo, igual em qualquer leitura.
// Não usamos a ETag do get(): em arquivos maiores a resposta vem compactada e a ETag
// chega "fraca" (W/"…"), que o Blob recusa no ifMatch. Para o ifMatch usamos a do head().
const version = (text) => crypto.createHash("md5").update(text).digest("hex");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function readRaw(name) {
  if (useBlob) {
    const { get, head } = await blobLib();
    const key = `cms/${name}.json`;
    const [r, h] = await Promise.all([
      get(key, { access: "private", useCache: false }),
      head(key).catch(() => null),
    ]);
    if (!r || !r.stream) return null;
    const text = await new Response(r.stream).text();
    // ETag do head() é a indicada pela documentação para o ifMatch
    return { text, blobEtag: h?.etag || r.blob.etag };
  }
  try { return { text: await fs.readFile(path.join(LOCAL, "cms", name + ".json"), "utf8") }; }
  catch (e) { if (e.code === "ENOENT") return null; throw e; }
}

// Lê { data, etag }. Com `expect`, tolera leitura atrasada logo após uma gravação
// (relê algumas vezes antes de concluir que outra pessoa alterou o arquivo).
export async function readJSON(name, expect) {
  let raw;
  for (let i = 0; i < 4; i++) {
    raw = await readRaw(name);
    if (!expect || !raw || version(raw.text) === expect) break;
    await sleep(250 * (i + 1));
  }
  if (!raw) return null;
  return { data: JSON.parse(raw.text), etag: version(raw.text), blobEtag: raw.blobEtag };
}

// etag: versão esperada (precisa bater) | null (o arquivo não pode existir) | undefined (sem checagem)
export async function writeJSON(name, data, etag) {
  const body = JSON.stringify(data);
  if (etag !== undefined) {
    const cur = await readJSON(name, etag || undefined);
    if (etag === null && cur) throw new Conflict("exists");
    if (etag && (!cur || cur.etag !== etag)) throw new Conflict("stale");
    if (useBlob && cur?.blobEtag) {
      const { put } = await blobLib();
      try {
        await put(`cms/${name}.json`, body, { ...PUT_OPTS, allowOverwrite: true, ifMatch: cur.blobEtag });
        return version(body);
      } catch (e) {
        if (!isPrecondition(e)) throw e;
        // o Blob recusou o ifMatch: só é conflito se o conteúdo realmente mudou
        const again = await readJSON(name);
        if (!again || again.etag !== cur.etag) throw new Conflict("changed");
      }
    }
  }
  if (useBlob) {
    const { put } = await blobLib();
    try { await put(`cms/${name}.json`, body, { ...PUT_OPTS, allowOverwrite: etag !== null }); }
    catch (e) { if (isPrecondition(e)) throw new Conflict("conflict"); throw e; }
    return version(body);
  }
  const file = path.join(LOCAL, "cms", name + ".json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
  return version(body);
}

const PUT_OPTS = { access: "private", contentType: "application/json", addRandomSuffix: false, cacheControlMaxAge: 60 };
const isPrecondition = (e) => /precondition|already exists|412|409/i.test(String(e?.message) + e?.name);

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
