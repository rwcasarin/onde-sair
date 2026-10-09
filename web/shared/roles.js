// Papéis e permissões — compartilhado entre o painel (front) e a API (servidor)
export const ROLES = {
  admin:   { label: "Administrador", desc: "Acesso total, inclusive equipe e configurações." },
  editor:  { label: "Editor",        desc: "Cria, edita, publica e modera todo o conteúdo." },
  curador: { label: "Curador",       desc: "Cria e edita lugares, roteiros e histórias; envia para revisão." },
};
export const PERMISSIONS = [
  ["content.edit",    "Criar e editar conteúdo"],
  ["content.publish", "Publicar e despublicar"],
  ["content.delete",  "Excluir conteúdo"],
  ["home.edit",       "Editar a home e as vibes"],
  ["media.manage",    "Gerenciar mídia"],
  ["members.manage",  "Gerenciar usuários do site"],
  ["notify.send",     "Enviar notificações"],
  ["team.manage",     "Gerenciar equipe e permissões"],
  ["settings.edit",   "Editar configurações do site"],
];
export const ROLE_PERMS = {
  admin:   PERMISSIONS.map(p => p[0]),
  editor:  ["content.edit", "content.publish", "content.delete", "home.edit", "media.manage", "members.manage", "notify.send"],
  curador: ["content.edit", "media.manage"],
};
export const can = (user, perm) => !!user && (ROLE_PERMS[user.role] || []).includes(perm);

export const isLive = (item, now = new Date()) =>
  item.status === "publicado" || (item.status === "agendado" && item.publishAt && new Date(item.publishAt) <= now);

// Recorte público do banco: só o que o site pode ver
export function publicView(db) {
  const live = (arr = []) => arr.filter(x => isLive(x));
  return {
    places: live(db.places),
    roteiros: live(db.roteiros),
    stories: live(db.stories),
    ...(db.pages ? { pages: live(db.pages) } : {}),   // sem páginas/menus salvos, o site usa os iniciais
    ...(db.menus ? { menus: db.menus } : {}),
    ...(db.radarCategories ? { radarCategories: db.radarCategories } : {}),
    ...(db.types ? { types: db.types } : {}),
    vibes: db.vibes || [],
    home: db.home,
    cities: db.cities || [],
    campaigns: (db.campaigns || []).filter(c => c.status === "enviada"),
    settings: db.settings,   // inclui a chave do Google Maps (chave de navegador: protegida pela restrição de domínio)
    updates: db.updates || [],   // atualizações de conteúdo já aplicadas (ver src/admin/updates.js)
    members: [], team: [], activity: [],
  };
}
