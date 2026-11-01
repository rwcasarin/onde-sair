-- Usuário do banco que o site (funções da Vercel) usa: acesso só às tabelas do site.
-- O papel é criado à parte, com a senha fora do repositório:
--   create role ondesair_app login noinherit password '...';
-- A senha fica só na variável DATABASE_URL da Vercel.
grant usage on schema public to ondesair_app;
do $$
declare t text;
begin
  foreach t in array array['versions','site_config','places','roteiros','stories','events','pages','campaigns','cities','vibes','place_types','event_categories','radar_categories','backups','team','site_users','media','kv'] loop
    execute format('grant select, insert, update, delete on table %I to ondesair_app', t);
    execute format('create policy site_app on %I for all to ondesair_app using (true) with check (true)', t);
  end loop;
end $$;
