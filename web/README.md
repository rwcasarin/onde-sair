# Onde Sair — web

Implementação do protótipo `project/index.html` (export do Claude Design) em React 18 + Vite.

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/
```

- `src/styles.css` — design system (cópia fiel de `project/styles.css`)
- `src/data.js` — dados mock (cidades, afinidades, lugares, roteiros…)
- `src/components/` — logo vetorial e componentes compartilhados (nav, chips, cards)
- `src/screens/` — onboarding, home, mapa, detalhe, busca, favoritos, perfil, notificações
- `src/nav.js` — contexto de navegação entre telas (substitui o `window.OS_NAV` do protótipo)
