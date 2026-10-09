import { useState, useCallback, useEffect, useRef } from "react";
import { NOTIFICATIONS, PLACES, ROTEIROS, AFFINITIES, ALL_STORIES, PAGES, TYPES, cityName } from "./data.js";
import { SITE } from "./admin/store.js";
import { NavContext, CityContext, FavContext, AccountContext } from "./nav.js";
import { usePath, go, toPath, fromPath, currentPath } from "./router.js";
import { TopNav } from "./components/ui.jsx";
import { Onboarding } from "./screens/onboarding.jsx";
import { Home } from "./screens/home.jsx";
import { Lista } from "./screens/lista.jsx";
import { Detalhe } from "./screens/detalhe.jsx";
import { Roteiro, Roteiros, MeuRoteiro } from "./screens/roteiro.jsx";
import { MeuRoteiroEditor } from "./screens/meuroteiro.jsx";
import { Historia, Historias } from "./screens/historia.jsx";
import { Mapa } from "./screens/mapa.jsx";
import { Perfil } from "./screens/perfil.jsx";
import { Notificacoes } from "./screens/notificacoes.jsx";
import { Entrar } from "./screens/entrar.jsx";
import { NotFound } from "./screens/notfound.jsx";
import { Pagina } from "./screens/pagina.jsx";
import { htmlToText } from "./richtext.js";
import { account, loadAccount, subscribeAccount, updateAccount, setIntent, takeIntent, findMyRoteiro } from "./account.js";

// telas que exigem conta (sem sessão, levam para /entrar)
const PRIVATE = new Set(["perfil", "notificacoes", "meuRoteiro", "meuRoteiroEditar"]);

function titleFor(screen, params) {
  const t = (s) => s + " · Onde Sair";
  switch (screen) {
    case "home": return SITE.seoTitle || "Onde Sair · O lugar certo pra cada vibe";
    case "lista": {
      const v = AFFINITIES.find(a => a.id === params.aff);
      const tp = TYPES.find(x => x.slug === params.tipo);
      return t(params.q ? `Busca: ${params.q}` : v ? v.label : tp ? tp.label : "Lugares");
    }
    case "detalhe": { const p = PLACES.find(x => x.id === params.id); return p?.seo?.title || t(p ? `${p.name} · ${p.bairro}` : "Lugar"); }
    case "roteiro": { const r = ROTEIROS.find(x => x.id === params.id); return r?.seo?.title || t(r ? r.title : "Roteiro"); }
    case "historia": { const s = ALL_STORIES.find(x => x.id === params.id); return s?.seo?.title || t(s ? `${s.title} · Radar` : "Radar"); }
    case "perfil": return t({ favoritos: "Lugares favoritos", favRoteiros: "Roteiros favoritos", meus: "Meus roteiros", conta: "Dados da conta" }[params.tab] || "Meu perfil");
    case "meuRoteiro": return t(findMyRoteiro(params.id)?.title || "Meu roteiro");
    case "meuRoteiroEditar": return t(params.id === "novo" ? "Novo roteiro" : "Editar roteiro");
    case "entrar": return t({ cadastro: "Criar conta", "boas-vindas": "Boas-vindas" }[params.mode] || "Entrar");
    case "pagina": { const pg = PAGES.find(x => x.id === params.id); return pg?.seo?.title || t(pg ? pg.title : "Página"); }
    case "404": return t("Página não encontrada");
    default: return t({ roteiros: "Roteiros", historias: "Radar · Novidades e listas", mapa: "Guia da cidade", favoritos: "Favoritos", perfil: "Meu perfil", notificacoes: "Notificações", onboarding: "Escolha sua cidade" }[screen] || "");
  }
}

// Descrição e indexação de cada tela (SEO preenchido no painel; senão, o padrão do site)
function metaFor(screen, params) {
  const item = { detalhe: PLACES, roteiro: ROTEIROS, historia: ALL_STORIES, pagina: PAGES }[screen]?.find(x => x.id === params.id);
  const desc = item?.seo?.desc || (screen === "pagina" && item ? item.excerpt || htmlToText(item.body).slice(0, 160) : "") ||
    (screen === "historias" ? "Radar Onde Sair: novidades, atualizações e listas de lugares da cidade, por quem vive ela." : "") ||
    (screen === "detalhe" ? item?.tagline : screen === "historia" ? item?.desc : "") || SITE.seoDesc || "";
  return { desc, noindex: !!item?.seo?.noindex || screen === "404" || PRIVATE.has(screen) || screen === "entrar" };
}
function setTag(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null) { el?.remove(); return; }
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function applyMeta({ title, desc, noindex }) {
  setTag("name", "description", desc || null);
  setTag("property", "og:title", title);
  setTag("property", "og:description", desc || null);
  setTag("name", "robots", noindex ? "noindex, nofollow" : null);
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = location.origin + location.pathname;
}

export default function App() {
  const path = usePath();
  const { screen, params } = fromPath(path);

  const [city, setCity] = useState(SITE.defaultCity);
  const [unread, setUnread] = useState(NOTIFICATIONS.filter(n => n.unread).length);
  const [faves, setFaves] = useState(new Set());
  const [user, setUser] = useState(account.user);
  const [ready, setReady] = useState(account.ready);
  const favesRef = useRef(faves);
  favesRef.current = faves;

  // conta do visitante: carrega a sessão e une os salvos locais aos da conta
  useEffect(() => {
    let prevId = account.user?.id;
    const off = subscribeAccount((a) => {
      setUser(a.user); setReady(a.ready);
      const id = a.user?.id;
      if (id && id !== prevId) {
        const merged = new Set([...(a.user.faves || []), ...favesRef.current]);
        setFaves(merged);
        if (merged.size !== (a.user.faves || []).length) updateAccount({ faves: [...merged] }).catch(() => {});
        if (a.user.city) setCity(a.user.city);
      }
      if (!id && prevId) setFaves(new Set());          // saiu da conta
      prevId = id;
    });
    if (!account.ready) loadAccount(); else prevId = null;
    return off;
  }, []);

  // nav("lista", { aff: "dates" }) → /vibes/para-dates · nav("home", { anchor: "vibes" })
  const nav = useCallback((s, p = {}) => {
    go(toPath(s, p));
    if (!p.anchor) { window.scrollTo(0, 0); return; }
    setTimeout(() => document.getElementById(p.anchor)?.scrollIntoView({ behavior: "smooth" }), 30);
  }, []);

  // links internos com href real: clique normal navega sem recarregar
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.("a[data-route]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(a.dataset.route); window.scrollTo(0, 0);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // troca de cidade (menu, rodapé, busca, filtros): vale na hora e fica salva na conta
  const changeCity = useCallback((id) => {
    if (!id) return;
    setCity(id);
    if (account.user && account.user.city !== id) updateAccount({ city: id }).catch(() => {});
  }, []);

  // ação que exige conta: guarda a intenção, leva ao login e volta para onde estava
  const ask = useCallback((intent) => { setIntent({ ...intent, back: currentPath() }); go("/entrar"); window.scrollTo(0, 0); }, []);

  const toggleFave = useCallback((id) => {
    if (!account.user) return ask({ type: "fave", id });
    const next = new Set(favesRef.current);
    next.has(id) ? next.delete(id) : next.add(id);
    setFaves(next);
    if (account.user) updateAccount({ faves: [...next] }).catch(() => {});
  }, []);

  // páginas da conta exigem login; quem já entrou não vê /entrar
  const blocked = ready && !user && PRIVATE.has(screen);
  useEffect(() => { if (blocked) { setIntent({ type: "voltar", back: path }); go("/entrar", { replace: true }); } }, [blocked]); // eslint-disable-line

  // depois de entrar: conclui o que a pessoa tentou fazer sem conta
  function afterLogin(u, isNew) {
    if (u?.city) setCity(u.city);
    const i = takeIntent();
    if (i?.type === "fave" && i.id) {
      const f = new Set([...(account.user?.faves || []), ...favesRef.current, i.id]);
      setFaves(f); updateAccount({ faves: [...f] }).catch(() => {});
    }
    if (i?.type === "copiar") return nav("meuRoteiroEditar", { id: "novo", copiar: i.id });
    if (i?.back && !/^\/(entrar|cadastro|boas-vindas)/.test(i.back)) { go(i.back); window.scrollTo(0, 0); return; }
    nav(isNew ? "home" : "perfil");
  }
  // endereço antigo do blog (/historias/…) passa a ser /radar/…
  useEffect(() => { if (/^\/historias(\/|$|\?)/.test(path)) go(path.replace(/^\/historias/, "/radar"), { replace: true }); }, [path]);
  useEffect(() => {
    const title = titleFor(screen, params);
    document.title = title;
    applyMeta({ title, ...metaFor(screen, params) });
  }, [path]); // eslint-disable-line

  if (SITE.maintenance) {
    return (
      <main className="maintenance">
        <h1>Voltamos já.</h1>
        <p>Estamos ajustando a curadoria. Enquanto isso, siga a gente nas redes.</p>
      </main>
    );
  }

  if (screen === "onboarding") {
    return <NavContext.Provider value={nav}><Onboarding onDone={(state) => { setCity(state.city); nav("home"); }} /></NavContext.Provider>;
  }

  // telas com parâmetros remontam ao mudar de rota (estado limpo)
  const key = path;

  return (
    <NavContext.Provider value={nav}>
    <CityContext.Provider value={{ id: city, name: cityName(city), set: changeCity, onCityClick: () => nav("onboarding") }}>
    <FavContext.Provider value={{ faves, toggle: toggleFave }}>
    <AccountContext.Provider value={{ user, ask }}>
      <div className="app">
        {SITE.announcement?.enabled && SITE.announcement.text && (
          <div className={"site-announce tone-" + (SITE.announcement.tone || "primary")} role="status">{SITE.announcement.text}</div>
        )}
        <TopNav current={screen} params={params} unread={unread} user={user} />
        {screen === "home"         && <Home />}
        {screen === "lista"        && <Lista key={key} aff={params.aff} q={params.q} tipo={params.tipo} />}
        {screen === "detalhe"      && <Detalhe key={key} id={params.id} />}
        {screen === "roteiros"     && <Roteiros />}
        {screen === "roteiro"      && <Roteiro key={key} id={params.id} />}
        {screen === "historias"    && <Historias />}
        {screen === "historia"     && <Historia key={key} id={params.id} />}
        {screen === "mapa"         && <Mapa key={key} id={params.id} />}
        {screen === "perfil"       && user && <Perfil key={params.tab} user={user} tab={params.tab} />}
        {screen === "meuRoteiro"   && user && <MeuRoteiro key={key} id={params.id} />}
        {screen === "meuRoteiroEditar" && user && <MeuRoteiroEditor key={key} id={params.id} lugar={params.lugar} copiar={params.copiar} />}
        {screen === "notificacoes" && user && <Notificacoes onMarkAllRead={() => setUnread(0)} />}
        {screen === "entrar"       && <Entrar key={key} mode={params.mode} onDone={afterLogin} />}
        {screen === "pagina"       && <Pagina key={key} id={params.id} />}
        {screen === "404"          && <NotFound />}
      </div>
    </AccountContext.Provider>
    </FavContext.Provider>
    </CityContext.Provider>
    </NavContext.Provider>
  );
}
