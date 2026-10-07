import { useState, useCallback, useEffect, useRef } from "react";
import { NOTIFICATIONS, cityName } from "./data.js";
import { SITE } from "./admin/store.js";
import { NavContext, CityContext, FavContext } from "./nav.js";
import { TopNav } from "./components/ui.jsx";
import { Onboarding } from "./screens/onboarding.jsx";
import { Home } from "./screens/home.jsx";
import { Lista } from "./screens/lista.jsx";
import { Detalhe } from "./screens/detalhe.jsx";
import { Roteiro, Roteiros } from "./screens/roteiro.jsx";
import { Mapa } from "./screens/mapa.jsx";
import { Favoritos } from "./screens/favoritos.jsx";
import { Perfil } from "./screens/perfil.jsx";
import { Notificacoes } from "./screens/notificacoes.jsx";
import { Entrar } from "./screens/entrar.jsx";
import { account, loadAccount, subscribeAccount, updateAccount } from "./account.js";

// Links diretos vindos do login social: #/entrar?erro=..., #/boas-vindas, #/conta
function routeFromHash() {
  const m = (location.hash || "").match(/^#\/(entrar|cadastro|boas-vindas|conta)(?:\?(.*))?$/);
  if (!m) return null;
  const q = Object.fromEntries(new URLSearchParams(m[2] || ""));
  try { history.replaceState(null, "", location.pathname + location.search); } catch { /* */ }
  if (m[1] === "conta") return { screen: "perfil", params: {} };
  if (m[1] === "boas-vindas") return { screen: "entrar", params: { mode: "boas-vindas" } };
  return { screen: "entrar", params: { mode: m[1], erro: q.erro, provedor: q.provedor } };
}

export default function App() {
  // rota = tela + parâmetros (id, aff, q, anchor)
  // "Ver no site" a partir do painel abre direto na tela certa
  const [route, setRoute] = useState(() => {
    try {
      const goto = JSON.parse(sessionStorage.getItem("os-goto") || "null");
      sessionStorage.removeItem("os-goto");
      if (goto) return { screen: goto.screen, params: goto.params || {}, n: 0 };
    } catch { /* */ }
    const fromHash = routeFromHash();
    if (fromHash) return { ...fromHash, n: 0 };
    return { screen: "home", params: {}, n: 0 };
  });
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

  // nav("lista", { aff: "dates" }) · nav("home", { anchor: "vibes" })
  const nav = useCallback((screen, params = {}) => {
    setRoute(r => ({ screen, params, n: r.n + 1 }));
    if (!params.anchor) { window.scrollTo(0, 0); return; }
    setTimeout(() => document.getElementById(params.anchor)?.scrollIntoView({ behavior: "smooth" }), 30);
  }, []);

  const toggleFave = useCallback((id) => {
    const next = new Set(favesRef.current);
    next.has(id) ? next.delete(id) : next.add(id);
    setFaves(next);
    if (account.user) updateAccount({ faves: [...next] }).catch(() => {});
  }, []);

  // perfil exige conta: sem sessão, leva para o login
  useEffect(() => {
    if (ready && !user && route.screen === "perfil") setRoute(r => ({ screen: "entrar", params: { mode: "entrar" }, n: r.n + 1 }));
  }, [ready, user, route.screen]);

  const { screen, params } = route;

  if (SITE.maintenance) {
    return (
      <main className="maintenance">
        <h1>Voltamos já.</h1>
        <p>Estamos ajustando a curadoria. Enquanto isso, siga a gente nas redes.</p>
      </main>
    );
  }

  if (screen === "onboarding") {
    return <Onboarding onDone={(state) => { setCity(state.city); nav("home"); }} />;
  }

  // telas com parâmetros remontam ao mudar de rota (estado limpo)
  const key = screen + JSON.stringify({ ...params, anchor: undefined });

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
        {screen === "mapa"         && <Mapa key={key} id={params.id} />}
        {screen === "favoritos"    && <Favoritos />}
        {screen === "perfil"       && user && <Perfil user={user} />}
        {screen === "entrar"       && <Entrar key={key} mode={params.mode} erro={params.erro} provedor={params.provedor}
                                        onDone={(u, isNew) => { if (u?.city) setCity(u.city); nav(isNew ? "home" : "perfil"); }} />}
        {screen === "notificacoes" && <Notificacoes onMarkAllRead={() => setUnread(0)} />}
      </div>
    </FavContext.Provider>
    </CityContext.Provider>
    </NavContext.Provider>
  );
}
