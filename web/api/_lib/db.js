// Banco no Supabase (Postgres). Mesmo contrato do armazenamento em JSON (readJSON/writeJSON com versão),
// mas cada item vive numa linha das tabelas de supabase/migrations/.
// Conexão: DATABASE_URL (pooler do Supabase em modo transação, porta 6543).
import postgres from "postgres";
import { Conflict } from "./errors.js";

let client = null;
export const useDb = () => !!process.env.DATABASE_URL;
function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    client = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10, ssl: local ? false : "require", onnotice: () => {} });
  }
  return client;
}

// Listas do conteúdo que viram tabelas (o resto do conteúdo fica em site_config)
const CONTENT_TABLES = {
  places: "places", roteiros: "roteiros", stories: "stories", events: "events", pages: "pages", campaigns: "campaigns",
  cities: "cities", vibes: "vibes", types: "place_types", eventCategories: "event_categories", radarCategories: "radar_categories", backups: "backups",
};
const LIST_TABLES = { team: "team", users: "site_users" };
const KEYS = "__keys";        // quais partes o conteúdo tem (uma lista vazia é diferente de uma parte ausente)

// JSON com chaves em ordem: o jsonb reordena as chaves, então comparamos sempre assim
const canon = (v) => JSON.stringify(v, (k, x) => x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(key => [key, x[key]])) : x);
// lista de objetos com id único (texto): pode ir para uma tabela
const isIdList = (v) => Array.isArray(v) && v.every(x => x && typeof x === "object" && typeof x.id === "string" && x.id) && new Set(v.map(x => x.id)).size === v.length;

async function rows(tx, table) {
  return tx`select id, position, data from ${tx(table)} order by position`;
}

// Deixa a tabela igual à lista: grava só o que mudou e apaga o que saiu
async function syncTable(tx, table, list) {
  const cur = new Map((await rows(tx, table)).map(r => [r.id, r]));
  const changed = list.map((data, position) => ({ id: data.id, position, data }))
    .filter(r => { const c = cur.get(r.id); return !c || c.position !== r.position || canon(c.data) !== canon(r.data); });
  const keep = new Set(list.map(x => x.id));
  const gone = [...cur.keys()].filter(id => !keep.has(id));
  if (gone.length) await tx`delete from ${tx(table)} where id = any(${gone})`;
  for (let i = 0; i < changed.length; i += 500) {
    await tx`insert into ${tx(table)} (id, position, data)
      select id, position, data from jsonb_to_recordset(${tx.json(changed.slice(i, i + 500))}) as x(id text, position int, data jsonb)
      on conflict (id) do update set position = excluded.position, data = excluded.data, updated_at = now()`;
  }
}

async function readContent(tx) {
  const cfg = Object.fromEntries((await tx`select key, value from site_config`).map(r => [r.key, r.value]));
  if (!Array.isArray(cfg[KEYS])) return null;
  const out = {};
  for (const key of cfg[KEYS]) {
    if (key in cfg) out[key] = cfg[key];
    else if (CONTENT_TABLES[key]) out[key] = (await rows(tx, CONTENT_TABLES[key])).map(r => r.data);
  }
  return out;
}

async function writeContent(tx, data) {
  const keys = Object.keys(data);
  for (const [key, table] of Object.entries(CONTENT_TABLES)) {
    if (key in data && isIdList(data[key])) await syncTable(tx, table, data[key]);
    else await tx`delete from ${tx(table)}`;        // ausente, ou lista fora do padrão (vai inteira para site_config)
  }
  const cfg = keys.filter(k => k !== KEYS && !(CONTENT_TABLES[k] && isIdList(data[k])));
  await tx`delete from site_config where key <> all(${cfg})`;
  const entries = [...cfg.map(key => ({ key, value: data[key] })), { key: KEYS, value: keys }].filter(e => e.value !== undefined);
  const cur = new Map((await tx`select key, value from site_config`).map(r => [r.key, r.value]));
  const changed = entries.filter(e => !cur.has(e.key) || canon(cur.get(e.key)) !== canon(e.value));
  if (changed.length) await tx`insert into site_config (key, value)
    select key, value from jsonb_to_recordset(${tx.json(changed)}) as x(key text, value jsonb)
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

async function readSet(tx, name) {
  if (name === "content") return readContent(tx);
  if (LIST_TABLES[name]) return (await rows(tx, LIST_TABLES[name])).map(r => r.data);
  if (name === "media") return Object.fromEntries((await tx`select path, version from media`).map(r => [r.path, r.version]));
  const [r] = await tx`select data from kv where name = ${name}`;
  return r ? r.data : null;
}

async function writeSet(tx, name, data) {
  if (name === "content") return writeContent(tx, data);
  if (LIST_TABLES[name]) {
    if (!isIdList(data)) throw new Error(`${name}: lista sem ids únicos`);
    return syncTable(tx, LIST_TABLES[name], data);
  }
  if (name === "media") {
    const list = Object.entries(data || {}).map(([path, version]) => ({ path, version: String(version) }));
    await tx`delete from media where path <> all(${list.map(m => m.path)})`;
    if (list.length) await tx`insert into media (path, version)
      select path, version from jsonb_to_recordset(${tx.json(list)}) as x(path text, version text)
      on conflict (path) do update set version = excluded.version, updated_at = now() where media.version <> excluded.version`;
    return;
  }
  await tx`insert into kv (name, data) values (${name}, ${tx.json(data)}) on conflict (name) do update set data = excluded.data, updated_at = now()`;
}

const tag = (v) => "v" + v;

// { data, etag } ou null
export async function dbRead(name) {
  await ensureMigrated();
  // uma foto só do banco: a versão e os dados lidos no mesmo instante
  return sql().begin("isolation level repeatable read read only", async (tx) => {
    const [v] = await tx`select version from versions where name = ${name}`;
    if (!v || v.version < 1) return null;
    const data = await readSet(tx, name);
    return data == null ? null : { data, etag: tag(v.version) };
  });
}

// etag: versão esperada (precisa bater) | null (o conjunto não pode existir) | undefined (sem checagem)
export async function dbWrite(name, data, etag) {
  await ensureMigrated();
  return sql().begin(async (tx) => {
    await tx`insert into versions (name, version) values (${name}, 0) on conflict do nothing`;
    const [v] = await tx`select version from versions where name = ${name} for update`;
    const exists = v.version > 0;
    if (etag === null && exists) throw new Conflict("exists");
    if (etag && (!exists || tag(v.version) !== etag)) throw new Conflict("stale");
    await writeSet(tx, name, data);
    const [n] = await tx`update versions set version = version + 1, updated_at = now() where name = ${name} returning version`;
    return tag(n.version);
  });
}

export async function dbDelete(name) {
  await ensureMigrated();
  await sql().begin(async (tx) => {
    if (name === "content") { for (const t of Object.values(CONTENT_TABLES)) await tx`delete from ${tx(t)}`; await tx`delete from site_config`; }
    else if (LIST_TABLES[name]) await tx`delete from ${tx(LIST_TABLES[name])}`;
    else if (name === "media") await tx`delete from media`;
    else await tx`delete from kv where name = ${name}`;
    await tx`delete from versions where name = ${name}`;
  });
}

// ---------- migração única: traz os JSON antigos (Vercel Blob ou .data/) para o banco ----------
const LEGACY = ["content", "team", "users", "media"];
const MIGRATED = "_migrated_from_json";
let migrated = null;
let legacyReader = null;
export const setLegacyReader = (fn) => { legacyReader = fn; };

function ensureMigrated() {
  if (!migrated) migrated = migrate().catch(e => { migrated = null; throw e; });
  return migrated;
}
async function migrate() {
  const [done] = await sql()`select 1 from versions where name = ${MIGRATED}`;
  if (done) return;
  // lê os arquivos antes de abrir a transação (pode demorar); grava tudo de uma vez
  const legacy = {};
  if (legacyReader) for (const name of LEGACY) legacy[name] = await legacyReader(name).catch(() => null);
  await sql().begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(4242)`;                 // outra função pode estar migrando ao mesmo tempo
    const [again] = await tx`select 1 from versions where name = ${MIGRATED}`;
    if (again) return;
    for (const name of LEGACY) {
      const data = legacy[name]?.data;
      if (data == null) continue;
      const [v] = await tx`select version from versions where name = ${name}`;
      if (v && v.version > 0) continue;                           // já há dados no banco: não sobrescreve
      await writeSet(tx, name, data);
      await tx`insert into versions (name, version) values (${name}, 1) on conflict (name) do update set version = 1, updated_at = now()`;
    }
    await tx`insert into versions (name, version) values (${MIGRATED}, 1)`;
  });
}
