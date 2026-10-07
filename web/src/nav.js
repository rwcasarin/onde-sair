import { createContext, useContext } from "react";

// Navegação entre telas — substitui o window.OS_NAV global do protótipo
export const NavContext = createContext(() => {});
export const useNav = () => useContext(NavContext);

// Cidade ativa — usada pelo rodapé em qualquer tela
export const CityContext = createContext({ name: "", onCityClick: undefined });
export const useCity = () => useContext(CityContext);

// Favoritos — compartilhados entre todas as telas
export const FavContext = createContext({ faves: new Set(), toggle: () => {} });
export const useFaves = () => useContext(FavContext);
