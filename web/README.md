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

## App Android

O app (`android/`, Capacitor) abre o site de produção (`server.url` em `capacitor.config.json`).
O GitHub Actions (`.github/workflows/android-apk.yml`) gera o APK a cada push em `web/` e o publica
na branch `apk`: https://github.com/rwcasarin/onde-sair/raw/apk/onde-sair.apk

### Push no celular

Toda notificação enviada pelo painel (Notificações › Enviar agora) vira push em quem tem o app,
respeitando o público (Todos, Cidade, Vibe). Configuração, uma vez:

1. No [Firebase](https://console.firebase.google.com), crie um projeto e adicione um app Android com o pacote `br.com.ondesair.app`.
2. Baixe o `google-services.json` e cole o conteúdo no secret `GOOGLE_SERVICES_JSON` do repositório (GitHub › Settings › Secrets and variables › Actions). Sem ele, o APK sai sem push.
3. Em Configurações do projeto › Contas de serviço, gere uma chave privada e cole o JSON na variável de ambiente `FIREBASE_SERVICE_ACCOUNT` da Vercel.
