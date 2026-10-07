import { useState, useCallback } from "react";
import { NOTIFICATIONS, USER, cityName } from "./data.js";
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

export default function App() {
  // rota = tela + parâmetros (id, aff, q, anchor)
  // "Ver no site" a partir do painel abre direto na tela certa
  const [route, setRoute] = useState(() => {
    try {
      const goto = JSON.parse(sessionStorage.getItem("os-goto") || "null");
      sessionStorage.removeItem("os-goto");
      if (goto) return { screen: goto.screen, params: goto.params || {}, n: 0 };
    } catch { /* */ }
    return { screen: "home", params: {}, n: 0 };
  });
  const [city, setCity] = useState("sp");
  const [unread, setUnread] = useState(NOTIFICATIONS.filter(n => n.unread).length);
  const [faves, setFaves] = useState(new Set(["p2", "p10", "p3", "r4"]));

  // nav("lista", { aff: "dates" }) · nav("home", { anchor: "vibes" })
  const nav = useCallback((screen, params = {}) => {
    setRoute(r => ({ screen, params, n: r.n + 1 }));
    if (!params.anchor) { window.scrollTo(0, 0); return; }
    setTimeout(() => document.getElementById(params.anchor)?.scrollIntoView({ behavior: "smooth" }), 30);
  }, []);

  const toggleFave = useCallback((id) => setFaves(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }), []);

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
        <TopNav current={screen} params={params} city={cityName(city)} unread={unread} onCityClick={() => nav("onboarding")} />
        {screen === "home"         && <Home />}
        {screen === "lista"        && <Lista key={key} aff={params.aff} q={params.q} />}
        {screen === "detalhe"      && <Detalhe key={key} id={params.id} />}
        {screen === "roteiros"     && <Roteiros />}
        {screen === "roteiro"      && <Roteiro key={key} id={params.id} />}
        {screen === "mapa"         && <Mapa key={key} id={params.id} />}
        {screen === "favoritos"    && <Favoritos />}
        {screen === "perfil"       && <Perfil user={USER} />}
        {screen === "notificacoes" && <Notificacoes onMarkAllRead={() => setUnread(0)} />}
      </div>
    </FavContext.Provider>
    </CityContext.Provider>
    </NavContext.Provider>
  );
}
