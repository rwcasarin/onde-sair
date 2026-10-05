/* global React, ReactDOM */
const { useState: useStateApp, useEffect: useEffectApp } = React;

function App() {
  const [screen, setScreen] = useStateApp("onboarding");
  const [city, setCity] = useStateApp("sp");
  const [placeId, setPlaceId] = useStateApp("p1");
  const [unread, setUnread] = useStateApp(window.OS_DATA.NOTIFICATIONS.filter(n => n.unread).length);

  const cityName = (window.OS_DATA.CITIES.find(c => c.id === city) || { name: "São Paulo" }).name;

  // expose nav globally so children can call without prop drilling
  useEffectApp(() => {
    window.OS_NAV = (s) => { setScreen(s); window.scrollTo(0, 0); };
  }, []);

  function openPlace(id) { setPlaceId(id); setScreen("detalhe"); window.scrollTo(0, 0); }
  function openRoteiro(_id) { /* roteiros share UI w/ detalhe in this proto */ setScreen("home"); }

  if (screen === "onboarding") {
    return <Onboarding onDone={(state) => { setCity(state.city); setScreen("home"); }} />;
  }

  return (
    <div className="app">
      <TopNav
        current={screen}
        user={USER}
        city={cityName}
        unread={unread}
        onCityClick={() => setScreen("onboarding")}
      />
      {screen === "home"          && <Home          city={city} onOpenPlace={openPlace} onOpenRoteiro={openRoteiro} />}
      {screen === "mapa"          && <Mapa          onOpenPlace={openPlace} />}
      {screen === "detalhe"       && <Detalhe       placeId={placeId} onOpenPlace={openPlace} />}
      {screen === "busca"         && <Busca         onOpenPlace={openPlace} />}
      {screen === "favoritos"     && <Favoritos     onOpenPlace={openPlace} />}
      {screen === "perfil"        && <Perfil        user={USER} onOpenPlace={openPlace} />}
      {screen === "notificacoes"  && <Notificacoes  onMarkAllRead={() => setUnread(0)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
