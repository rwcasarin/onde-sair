// Onde Sair · CMS — aplicação do painel administrativo (rota /admin)
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { OSLogo, OSIcon } from "../components/brand.jsx";
import { AdminCtx, AIcon, Btn, Input, Modal, useDialogs, useToasts } from "./kit.jsx";
import { getDB, subscribe, currentUser, logout, can, ROLES, REMOTE, sync, reloadFromServer, forceSave, retrySave, whenSynced, changePassword, relTime } from "./store.js";
import { Login } from "./pages/Login.jsx";
import { Dashboard, ActivityPage } from "./pages/Dashboard.jsx";
import { PlacesList, PlaceEditor } from "./pages/Places.jsx";
import { RoteirosList, RoteiroEditor } from "./pages/Roteiros.jsx";
import { StoriesList, StoryEditor } from "./pages/Stories.jsx";
import { RadarCategoriesPage } from "./pages/RadarCategories.jsx";
import { TypesPage } from "./pages/Types.jsx";
import { PagesList, PageEditor } from "./pages/Pages.jsx";
import { MenusPage } from "./pages/Menus.jsx";
import { VibesPage } from "./pages/Vibes.jsx";
import { HomePage } from "./pages/HomeEditor.jsx";
import { MediaPage } from "./pages/Media.jsx";
import { CampaignsPage } from "./pages/Campaigns.jsx";
import { MembersPage, TeamPage } from "./pages/People.jsx";
import { CitiesPage } from "./pages/Cities.jsx";
import { SettingsPage } from "./pages/Settings.jsx";
import { currentPath, go as goPath, href, onPathChange } from "../router.js";
import "./admin.css";

const parse = () => currentPath().split("?")[0].split("/").filter(Boolean).slice(1); // remove "admin"

// Estrutura de navegação (grupo → itens). perm = permissão necessária
const NAV = [
  ["Visão geral", [
    { path: "", label: "Painel", icon: "dashboard" },
    { path: "atividade", label: "Atividade", icon: "clock" },
  ]],
  ["Conteúdo", [
    { path: "lugares", label: "Lugares", icon: "pin", perm: "content.edit", badge: (db) => db.places.filter(p => p.status === "revisao").length },
    { path: "roteiros", label: "Roteiros", icon: "route", perm: "content.edit", badge: (db) => db.roteiros.filter(p => p.status === "revisao").length },
    { path: "radar", label: "Radar", icon: "file", perm: "content.edit", badge: (db) => db.stories.filter(p => p.status === "revisao").length },
    { path: "paginas", label: "Páginas", icon: "page", perm: "content.edit", badge: (db) => (db.pages || []).filter(p => p.status === "revisao").length },
    { path: "home", label: "Home", icon: "layout", perm: "home.edit" },
    { path: "menus", label: "Menus", icon: "menu", perm: "home.edit" },
    { path: "vibes", label: "Vibes", icon: "palette", perm: "home.edit" },
    { path: "midia", label: "Mídia", icon: "image", perm: "media.manage" },
  ]],
  ["Comunidade", [
    { path: "usuarios", label: "Usuários", icon: "users", perm: "members.manage" },
    { path: "notificacoes", label: "Notificações", icon: "bell", perm: "notify.send" },
  ]],
  ["Configurações", [
    { path: "cidades", label: "Cidades e bairros", icon: "globe", perm: "settings.edit" },
    { path: "equipe", label: "Equipe e permissões", icon: "shield", perm: "team.manage" },
    { path: "configuracoes", label: "Configurações", icon: "settings", perm: "settings.edit" },
  ]],
];
const ALL_ITEMS = NAV.flatMap(([, items]) => items);

export default function AdminApp() {
  const db = useSyncExternalStore(subscribe, getDB);
  const [route, setRoute] = useState(parse);
  const [user, setUser] = useState(undefined);        // undefined = verificando sessão
  const [pwOpen, setPwOpen] = useState(false);
  useEffect(() => { currentUser().then(u => setUser(u || null)); }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const dirtyRef = useRef(false);
  const { toast, node: toasts } = useToasts();
  const { confirm, node: dialog } = useDialogs();

  useEffect(() => {
    const on = () => { setRoute(parse()); setMenuOpen(false); window.scrollTo(0, 0); };
    return onPathChange(on);
  }, []);
  useEffect(() => {
    const warn = (e) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  useEffect(() => { document.title = "Onde Sair · Painel"; }, []);

  // navegação com proteção de alterações não salvas
  const go = useCallback(async (path) => {
    if (dirtyRef.current) {
      const ok = await confirm({ title: "Descartar alterações?", text: "Há alterações não salvas nesta página. Se sair agora, elas serão perdidas.", ok: "Sair sem salvar", danger: true });
      if (!ok) return;
      dirtyRef.current = false;
    }
    goPath("/admin" + (path ? "/" + path.replace(/^\//, "") : ""));
  }, [confirm]);
  const setDirty = useCallback((v) => { dirtyRef.current = v; }, []);

  // aviso de sucesso só depois que o servidor confirmar a gravação
  const saved = useCallback(async (msg) => {
    const ok = await whenSynced();
    if (ok) toast(msg, "success");
    else toast("Não foi salvo no servidor. Veja o aviso no topo da página.", "error");
    return ok;
  }, [toast]);
  const ctx = useMemo(() => ({ user, db, go, toast, saved, confirm, setDirty }), [user, db, go, toast, saved, confirm, setDirty]);

  if (user === undefined) return <div className="a-loading">Carregando painel…</div>;

  if (!user || route[0] === "login") {
    return (
      <AdminCtx.Provider value={ctx}>
        <Login onLogin={(u) => { setUser(u); goPath("/admin"); toast(`Bem-vinda(o), ${u.name.split(" ")[0]}!`, "success"); }} />
        {toasts}
      </AdminCtx.Provider>
    );
  }

  const [section = "", id] = route;
  const item = ALL_ITEMS.find(i => i.path === section);
  const allowed = !item?.perm || can(user, item.perm);

  let page;
  if (!item) page = <NotFound />;
  else if (!allowed) page = <Forbidden />;
  else page = {
    "": <Dashboard />,
    atividade: <ActivityPage />,
    lugares: id === "tipos" ? <TypesPage /> : id ? <PlaceEditor key={id} id={id} /> : <PlacesList />,
    roteiros: id ? <RoteiroEditor key={id} id={id} /> : <RoteirosList />,
    radar: id === "categorias" ? <RadarCategoriesPage /> : id ? <StoryEditor key={id} id={id} /> : <StoriesList />,
    historias: id ? <StoryEditor key={id} id={id} /> : <StoriesList />,   // endereço antigo
    paginas: id ? <PageEditor key={id} id={id} /> : <PagesList />,
    menus: <MenusPage />,
    home: <HomePage />,
    vibes: <VibesPage />,
    midia: <MediaPage />,
    usuarios: <MembersPage />,
    notificacoes: <CampaignsPage />,
    cidades: <CitiesPage />,
    equipe: <TeamPage />,
    configuracoes: <SettingsPage key={id || "geral"} initialTab={id} />,
  }[section];

  async function doLogout() {
    setUserMenu(false);
    const ok = await confirm({ title: "Sair do painel?", text: "Você precisará entrar novamente para editar o conteúdo.", ok: "Sair" });
    if (!ok) return;
    await logout(); setUser(null); goPath("/admin/login");
  }

  return (
    <AdminCtx.Provider value={ctx}>
      <div className={"adm" + (menuOpen ? " menu-open" : "")}>
        <a className="a-skip" href="#a-main" onClick={(e) => { e.preventDefault(); document.getElementById("a-main")?.focus(); }}>Pular para o conteúdo</a>

        <aside className="a-side" aria-label="Menu do painel">
          <a className="a-side-brand" href={href("/admin")} onClick={(e) => { e.preventDefault(); go(""); }}>
            <span className="a-side-logo"><OSLogo /></span>
            <span className="a-side-tag">Painel</span>
          </a>
          <nav>
            {NAV.map(([group, items]) => {
              const vis = items.filter(i => !i.perm || can(user, i.perm));
              if (!vis.length) return null;
              return (
                <div key={group} className="a-nav-group">
                  <span className="a-nav-title">{group}</span>
                  {vis.map(i => {
                    const n = i.badge?.(db);
                    return (
                      <a key={i.path} href={href("/admin/" + i.path)} aria-current={section === i.path ? "page" : undefined}
                        className={"a-nav-item" + (section === i.path ? " on" : "")}
                        onClick={(e) => { e.preventDefault(); go(i.path); }}>
                        <AIcon name={i.icon} size={18} /> <span>{i.label}</span>
                        {n > 0 && <em className="a-nav-badge" aria-label={`${n} pendentes`}>{n}</em>}
                      </a>
                    );
                  })}
                </div>
              );
            })}
          </nav>
          <a className="a-side-site" href="#" onClick={(e) => { e.preventDefault(); goPath("/"); }}>
            <AIcon name="ext" size={16} /> Ver o site
          </a>
        </aside>
        <div className="a-scrim" onClick={() => setMenuOpen(false)} />

        <div className="a-shell">
          <header className="a-top">
            <button type="button" className="a-burger" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><AIcon name="menu" size={20} /></button>
            <span className="a-top-mark" aria-hidden="true"><OSIcon /></span>
            <QuickSearch db={db} go={go} />
            <div className="a-top-right">
              {db.settings.accounts?.paused && (
                <a className="a-sync tone-amber a-paused-pill" href={href("/admin/configuracoes/contas")} onClick={(e) => { e.preventDefault(); go("configuracoes/contas"); }}
                  title="Login, cadastro e interações dos usuários estão pausados"><i /> Contas pausadas</a>
              )}
              <SyncPill />
              <a className="a-btn a-btn-ghost a-btn-sm a-hide-sm" href="#" onClick={(e) => { e.preventDefault(); goPath("/"); }}><AIcon name="ext" size={15} /> Ver site</a>
              <div className="a-user">
                <button type="button" className="a-user-btn" aria-haspopup="menu" aria-expanded={userMenu} onClick={() => setUserMenu(!userMenu)}>
                  <span className="a-avatar">{user.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span>
                  <span className="a-user-text a-hide-sm"><strong>{user.name}</strong><em>{ROLES[user.role].label}</em></span>
                  <AIcon name="chevron" size={14} />
                </button>
                {userMenu && (
                  <div className="a-user-menu" role="menu" onMouseLeave={() => setUserMenu(false)}>
                    <div className="a-user-menu-head"><strong>{user.name}</strong><span>{user.email}</span></div>
                    {can(user, "team.manage") && <button role="menuitem" type="button" onClick={() => { setUserMenu(false); go("equipe"); }}><AIcon name="shield" size={16} /> Equipe e permissões</button>}
                    <button role="menuitem" type="button" onClick={() => { setUserMenu(false); setPwOpen(true); }}><AIcon name="lock" size={16} /> Alterar senha</button>
                    <button role="menuitem" type="button" onClick={() => { setUserMenu(false); goPath("/"); }}><AIcon name="ext" size={16} /> Ver o site</button>
                    <button role="menuitem" type="button" onClick={doLogout}><AIcon name="logout" size={16} /> Sair</button>
                  </div>
                )}
              </div>
            </div>
          </header>
          {(sync.status === "conflict" || sync.status === "error") && (
            <div className={"a-sync-banner tone-" + (sync.status === "conflict" ? "amber" : "red")} role="alert">
              <AIcon name="alert" size={16} />
              <span>{sync.status === "conflict"
                ? <>{sync.error} {can(user, "settings.edit") ? "Você pode sobrescrever com a sua versão ou recarregar a do servidor." : "Recarregue para ver a versão atual (suas alterações não salvas serão descartadas)."}</>
                : `Não foi possível salvar na nuvem: ${sync.error}`}</span>
              {sync.status === "conflict" && can(user, "settings.edit") && (
                <Btn size="sm" kind="primary" icon="check" onClick={async () => {
                  const ok = await confirm({ title: "Sobrescrever com a sua versão?", text: "As suas alterações serão gravadas por cima das que foram feitas na outra sessão nos mesmos itens. Itens que só a outra sessão alterou são mantidos.", ok: "Sobrescrever" });
                  if (ok) toast(await forceSave() ? "Sua versão foi salva." : "Não foi possível sobrescrever: " + (sync.error || "tente de novo."), sync.status === "saved" ? "success" : "error");
                }}>Sobrescrever com a minha versão</Btn>
              )}
              {sync.status === "error" && <Btn size="sm" icon="refresh" onClick={() => retrySave()}>Tentar de novo</Btn>}
              <Btn size="sm" icon="refresh" onClick={async () => { await reloadFromServer(); toast("Conteúdo recarregado do servidor.", "success"); }}>Recarregar do servidor</Btn>
            </div>
          )}
          <main id="a-main" className="a-main" tabIndex={-1}>{page}</main>
        </div>
      </div>
      {pwOpen && <PasswordModal user={user} onClose={() => setPwOpen(false)} toast={toast} />}
      {dialog}
      {toasts}
    </AdminCtx.Provider>
  );
}

// Situação da gravação (modo nuvem)
function SyncPill() {
  if (!REMOTE) return <span className="a-sync tone-gray a-hide-sm" title="Versão offline: dados salvos neste navegador"><i /> Offline</span>;
  const map = { idle: ["green", "Na nuvem"], saved: ["green", "Salvo"], saving: ["amber", "Salvando…"], error: ["red", "Erro ao salvar"], conflict: ["red", "Conflito"] };
  const [tone, label] = map[sync.status] || map.idle;
  return <span className={"a-sync tone-" + tone} role="status" title={sync.at ? "Última gravação " + relTime(sync.at) : "Conectado ao banco no Vercel"}><i /> {label}</span>;
}

function PasswordModal({ user, onClose, toast }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    if (f.next.length < 8) return setErr("A nova senha precisa de pelo menos 8 caracteres.");
    if (f.next !== f.confirm) return setErr("A confirmação não confere.");
    setBusy(true);
    try { await changePassword(user, f.current, f.next); toast("Senha alterada.", "success"); onClose(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }
  return (
    <Modal title="Alterar senha" size="sm" onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn kind="primary" disabled={busy} onClick={save}>{busy ? "Salvando…" : "Salvar senha"}</Btn></>}>
      {err && <div className="a-alert tone-error" role="alert"><AIcon name="alert" size={16} /> {err}</div>}
      <Input label="Senha atual" type="password" autoComplete="current-password" value={f.current} onChange={(current) => setF({ ...f, current })} />
      <Input label="Nova senha" type="password" autoComplete="new-password" value={f.next} onChange={(next) => setF({ ...f, next })} hint="Mínimo de 8 caracteres." />
      <Input label="Confirme a nova senha" type="password" autoComplete="new-password" value={f.confirm} onChange={(confirm) => setF({ ...f, confirm })} />
    </Modal>
  );
}

// Busca rápida por qualquer conteúdo (Ctrl/⌘ + K)
function QuickSearch({ db, go }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const on = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  const results = q.trim().length < 2 ? [] : [
    ...db.places.map(p => ({ t: p.name, s: `Lugar · ${p.bairro}`, path: "lugares/" + p.id })),
    ...db.roteiros.map(r => ({ t: r.title, s: "Roteiro", path: "roteiros/" + r.id })),
    ...db.stories.map(s => ({ t: s.title, s: "Post do Radar", path: "radar/" + s.id })),
    ...db.members.map(m => ({ t: m.name, s: "Usuário · " + m.email, path: "usuarios" })),
  ].filter(r => (r.t + " " + r.s).toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  return (
    <div className="a-qs">
      <AIcon name="search" size={16} />
      <input ref={ref} value={q} placeholder="Buscar lugares, roteiros, histórias…" aria-label="Busca rápida"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { go(results[0].path); setQ(""); } if (e.key === "Escape") { setQ(""); e.target.blur(); } }} />
      <kbd className="a-hide-sm">Ctrl K</kbd>
      {open && results.length > 0 && (
        <ul className="a-qs-results" role="listbox">
          {results.map(r => (
            <li key={r.path + r.t}><button type="button" onMouseDown={() => { go(r.path); setQ(""); }}><strong>{r.t}</strong><span>{r.s}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotFound() {
  return <div className="a-empty a-empty-page"><strong>Página não encontrada</strong><p>Esse endereço não existe no painel.</p><a href={href("/admin")}>Voltar ao painel</a></div>;
}
function Forbidden() {
  return <div className="a-empty a-empty-page"><span className="a-empty-icon"><AIcon name="lock" size={24} /></span><strong>Acesso restrito</strong><p>Seu perfil não tem permissão para esta área. Fale com um administrador.</p><a href={href("/admin")}>Voltar ao painel</a></div>;
}
