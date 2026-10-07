import { useState, useCallback, useEffect, useRef } from "react";
import { NOTIFICATIONS, PLACES, ROTEIROS, AFFINITIES, ALL_STORIES, cityName } from "./data.js";
import { SITE } from "./admin/store.js";
import { NavContext, CityContext, FavContext } from "./nav.js";
import { usePath, go, toPath, fromPath } from "./router.js";
import { TopNav } from "./components/ui.jsx";
import { Onboarding } from "./screens/onboarding.jsx";
import { Home } from "./screens/home.jsx";
import { Lista } from "./screens/lista.jsx";
import { Detalhe } from "./screens/detalhe.jsx";
import { Roteiro, Roteiros } from "./screens/roteiro.jsx";
import { Historia, Historias } from "./screens/historia.jsx";
import { Mapa } from "./screens/mapa.jsx";
import { Favoritos } from "./screens/favoritos.jsx";
import { Perfil } from "./screens/perfil.jsx";
import { Notificacoes } from "./screens/notificacoes.jsx";
import { Entrar } from "./screens/entrar.jsx";
import { NotFound } from "./screens/notfound.jsx";
import { account, loadAccount, subscribeAccount, updateAccount } from "./account.js";

// telas que exigem conta (sem sessão, levam para /entrar)
const PRIVATE = new Set(["perfil", "notificacoes"]);

function titleFor(screen, params) {
  const t = (s) => s + " · Onde Sair";
  switch (screen) {
    case "home": return "Onde Sair · O lugar certo pra cada vibe";
    case "lista": {
      const v = AFFINITIES.find(a => a.id === params.aff);
      return t(params.q ? `Busca: ${params.q}` : v ? v.label : "Lugares");
    }
    case "detalhe": { const p = PLACES.find(x => x.id === params.id); return t(p ? `${p.name} · ${p.bairro}` : "Lugar"); }
    case "roteiro": { const r = ROTEIROS.find(x => x.id === params.id); return t(r ? r.title : "Roteiro"); }
    case "historia": { const s = ALL_STORIES.find(x => x.id === params.id); return t(s ? s.title : "História"); }
    case "entrar": return t({ cadastro: "Criar conta", "boas-vindas": "Boas-vindas" }[params.mode] || "Entrar");
    case "404": return t("Página não encontrada");
    default: return t({ roteiros: "Roteiros", historias: "Histórias", mapa: "Guia da cidade", favoritos: "Favoritos", perfil: "Meu perfil", notificacoes: "Notificações", onboarding: "Escolha sua cidade" }[screen] || "");
  }
}

export default function App() {
  const path = usePath();
  const { screen, params } = fromPath(path);

  const [city, setCity] = useState("sp");
  const [unread, setUnread] = useState(NOTIFICATIONS.filter(n => n.unread).length);
  const [faves, setFaves] = useState(new Set(["p2", "p10", "p3", "r4"]));
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

  const toggleFave = useCallback((id) => {
    const next = new Set(favesRef.current);
    next.has(id) ? next.delete(id) : next.add(id);
    setFaves(next);
    if (account.user) updateAccount({ faves: [...next] }).catch(() => {});
  }, []);

  // páginas da conta exigem login; quem já entrou não vê /entrar
  const blocked = ready && !user && PRIVATE.has(screen);
  useEffect(() => { if (blocked) go("/entrar", { replace: true }); }, [blocked]);
  useEffect(() => { document.title = titleFor(screen, params); }, [path]); // eslint-disable-line

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
    <CityContext.Provider value={{ name: cityName(city), onCityClick: () => nav("onboarding") }}>
    <FavContext.Provider value={{ faves, toggle: toggleFave }}>
      <div className="app">
        {SITE.announcement?.enabled && SITE.announcement.text && (
          <div className={"site-announce tone-" + (SITE.announcement.tone || "primary")} role="status">{SITE.announcement.text}</div>
        )}
        <TopNav current={screen} params={params} city={cityName(city)} unread={unread} user={user} onCityClick={() => nav("onboarding")} />
        {screen === "home"         && <Home />}
        {screen === "lista"        && <Lista key={key} aff={params.aff} q={params.q} />}
        {screen === "detalhe"      && <Detalhe key={key} id={params.id} />}
        {screen === "roteiros"     && <Roteiros />}
        {screen === "roteiro"      && <Roteiro key={key} id={params.id} />}
        {screen === "historias"    && <Historias />}
        {screen === "historia"     && <Historia key={key} id={params.id} />}
        {screen === "mapa"         && <Mapa key={key} id={params.id} />}
        {screen === "favoritos"    && <Favoritos />}
        {screen === "perfil"       && user && <Perfil user={user} />}
        {screen === "notificacoes" && user && <Notificacoes onMarkAllRead={() => setUnread(0)} />}
        {screen === "entrar"       && <Entrar key={key} mode={params.mode} onDone={(u, isNew) => { if (u?.city) setCity(u.city); nav(isNew ? "home" : "perfil"); }} />}
        {screen === "404"          && <NotFound />}
      </div>
    </FavContext.Provider>
    </CityContext.Provider>
    </NavContext.Provider>
  );
}
