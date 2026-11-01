-- Onde Sair · banco no Supabase (Postgres)
-- Cada item fica numa linha; o objeto completo vai em `data` (jsonb) e as colunas
-- principais são geradas a partir dele para consulta e índices.
-- Acesso só pelo servidor (Vercel, conexão direta): RLS ligada e sem políticas,
-- então a API pública do Supabase (anon/authenticated) não lê nem grava nada.

-- versão de cada conjunto (controle de edição simultânea, o antigo "etag" dos JSON)
create table versions (
  name text primary key,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- partes do conteúdo que não são listas de itens (home, settings, menus, atividade...)
create table site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table places (
  id text primary key,
  position int not null,
  data jsonb not null,
  slug text generated always as (data->>'slug') stored,
  name text generated always as (data->>'name') stored,
  status text generated always as (data->>'status') stored,
  city text generated always as (data->>'city') stored,
  type text generated always as (data->>'type') stored,
  bairro text generated always as (data->>'bairro') stored,
  updated_at timestamptz not null default now()
);
create index places_slug on places (slug);
create index places_city_status on places (city, status);

create table roteiros (
  id text primary key, position int not null, data jsonb not null,
  slug text generated always as (data->>'slug') stored,
  title text generated always as (data->>'title') stored,
  status text generated always as (data->>'status') stored,
  updated_at timestamptz not null default now()
);
create table stories (
  id text primary key, position int not null, data jsonb not null,
  slug text generated always as (data->>'slug') stored,
  title text generated always as (data->>'title') stored,
  status text generated always as (data->>'status') stored,
  updated_at timestamptz not null default now()
);
create table events (
  id text primary key, position int not null, data jsonb not null,
  slug text generated always as (data->>'slug') stored,
  title text generated always as (data->>'title') stored,
  status text generated always as (data->>'status') stored,
  start_at text generated always as (data->>'startAt') stored,
  updated_at timestamptz not null default now()
);
create table pages (
  id text primary key, position int not null, data jsonb not null,
  slug text generated always as (data->>'slug') stored,
  title text generated always as (data->>'title') stored,
  status text generated always as (data->>'status') stored,
  updated_at timestamptz not null default now()
);
create table campaigns (
  id text primary key, position int not null, data jsonb not null,
  title text generated always as (data->>'title') stored,
  status text generated always as (data->>'status') stored,
  updated_at timestamptz not null default now()
);
create table cities (
  id text primary key, position int not null, data jsonb not null,
  name text generated always as (data->>'name') stored,
  updated_at timestamptz not null default now()
);
create table vibes (
  id text primary key, position int not null, data jsonb not null,
  label text generated always as (data->>'label') stored,
  updated_at timestamptz not null default now()
);
create table place_types (
  id text primary key, position int not null, data jsonb not null,
  label text generated always as (data->>'label') stored,
  updated_at timestamptz not null default now()
);
create table event_categories (
  id text primary key, position int not null, data jsonb not null,
  label text generated always as (data->>'label') stored,
  updated_at timestamptz not null default now()
);
create table radar_categories (
  id text primary key, position int not null, data jsonb not null,
  label text generated always as (data->>'label') stored,
  updated_at timestamptz not null default now()
);
-- cópias de segurança feitas pelas atualizações de conteúdo (fora do site público)
create table backups (
  id text primary key, position int not null, data jsonb not null,
  label text generated always as (data->>'label') stored,
  updated_at timestamptz not null default now()
);

-- equipe do painel
create table team (
  id text primary key, position int not null, data jsonb not null,
  email text generated always as (lower(data->>'email')) stored,
  role text generated always as (data->>'role') stored,
  status text generated always as (data->>'status') stored,
  updated_at timestamptz not null default now()
);
create index team_email on team (email);

-- contas de visitantes do site
create table site_users (
  id text primary key, position int not null, data jsonb not null,
  email text generated always as (lower(data->>'email')) stored,
  status text generated always as (data->>'status') stored,
  city text generated always as (data->>'city') stored,
  updated_at timestamptz not null default now()
);
create index site_users_email on site_users (email);

-- índice da mídia: caminho do arquivo → versão (os arquivos continuam no Vercel Blob)
create table media (
  path text primary key,
  version text not null,
  updated_at timestamptz not null default now()
);

-- qualquer outro conjunto guardado pelo servidor
create table kv (
  name text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['versions','site_config','places','roteiros','stories','events','pages','campaigns','cities','vibes','place_types','event_categories','radar_categories','backups','team','site_users','media','kv'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from anon, authenticated', t);
  end loop;
end $$;
