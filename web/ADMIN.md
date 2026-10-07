# Onde Sair · Painel administrativo (CMS)

Painel para a equipe gerenciar todo o conteúdo do site. Acesso: **`/admin`** (no arquivo offline `onde-sair.html`: `#/admin`) (ou o link "Área administrativa" no rodapé do site).

## Dois modos de funcionamento

| | **Nuvem** (site publicado no Vercel) | **Offline** (`onde-sair.html` / sem servidor) |
|---|---|---|
| Banco | Vercel Blob (store privado) via `/api/*` | `localStorage` do navegador |
| Login | Real: senha com hash (scrypt), sessão em cookie HttpOnly assinado | Demonstração (acessos na tela de login) |
| Site × painel | Todo visitante vê o que foi publicado | Só no mesmo navegador |

O modo é escolhido sozinho na carga: se `/api/content` responde, é nuvem.

## Banco de dados (Vercel Blob)

Store **privado** `onde-sair-cms`, ligado ao projeto pela variável `BLOB_READ_WRITE_TOKEN`:

| Arquivo | Conteúdo | Quem grava |
|---|---|---|
| `cms/content.json` | lugares, roteiros, histórias, vibes, home, avaliações, usuários, cidades, notificações, configurações, atividade | `PUT /api/admin/db` |
| `cms/team.json` | equipe do painel (com hash de senha — nunca sai do servidor) | `/api/auth/*`, `/api/admin/team` |
| `cms/media.json` | mapa caminho → versão das imagens enviadas | `/api/admin/media` |
| `media/images/...` | arquivos de imagem | `/api/admin/media` |

Gravações usam **ETag** (controle de concorrência). Se duas pessoas salvarem ao mesmo tempo, o painel mescla automaticamente as alterações (campo a campo / item a item); só avisa se não conseguir.

### Conteúdo novo vindo do código

O banco publicado não é recriado a partir da semente. Para incluir conteúdo pelo código (ex.: os lugares de Sorocaba, `dados/lugares-sorocaba.xlsx`), registre uma atualização em `src/admin/updates.js` com um `id` novo:

- o site já mostra o conteúdo novo aos visitantes (aplicado só na memória);
- na primeira vez que um **administrador** abre o painel, a atualização é gravada no banco e aparece em Atividade ("Sistema adicionou …");
- o `id` fica salvo em `updates` no banco, então a atualização não roda de novo: o que a equipe editar ou excluir depois não volta.

## API

| Rota | Acesso | Função |
|---|---|---|
| `GET /api/content` | público | conteúdo publicado (sem rascunhos, equipe ou usuários) |
| `GET /api/media?p=` | público | imagens enviadas pelo painel (cache de 1 ano, versionadas) |
| `POST /api/auth/login` · `logout` · `GET me` · `POST password` | — | sessão; 5 erros → bloqueio de 30 s |
| `GET/PUT /api/admin/db` | equipe | banco completo; o servidor valida as permissões do perfil a cada gravação |
| `POST/DELETE /api/admin/media` | mídia | envio/remoção de imagens (JPEG/PNG/WebP, até 4 MB) |
| `POST/PATCH/DELETE /api/admin/team` | admin | criar acesso (senha provisória), mudar perfil, desativar, nova senha, remover |

Proteções: cookie `HttpOnly` + `Secure` + `SameSite=Lax`, cabeçalho `x-cms` obrigatório nas escritas (CSRF), validação de caminhos de imagem, permissões checadas no servidor.

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | criada pelo Vercel ao conectar o store |
| `SESSION_SECRET` | assinatura dos cookies de sessão |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | criam o primeiro administrador quando a equipe ainda não existe |

### Desenvolvimento local

```bash
cd web
ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD=uma-senha SESSION_SECRET=dev npm run dev
```
Sem `BLOB_READ_WRITE_TOKEN`, a API grava em `web/.data/` (ignorada pelo git).

## Acessos de demonstração (somente modo offline)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@ondesair.com.br | admin123 |
| Editor | editora@ondesair.com.br | editor123 |
| Curador | curador@ondesair.com.br | curador123 |

## Mapa de telas

| Rota | Tela | O que faz |
|---|---|---|
| `/admin/login` | Login | E-mail e senha, mostrar senha, manter conectado, recuperar senha, bloqueio de 30 s após 5 tentativas |
| `/admin` | Painel | Indicadores, visitas (exemplo), lugares por vibe, fila de revisão, avaliações pendentes, conteúdo incompleto, atividade |
| `/admin/atividade` | Atividade | Registro de todas as ações da equipe, com busca e filtro |
| `/admin/lugares` | Lugares | Lista com abas de status, busca, filtros (tipo, vibe, bairro), ordenação, paginação, ações em lote |
| `/admin/lugares/:id` · `/novo` | Editor de lugar | Abas Conteúdo · Detalhes práticos · Vibes e tags · Imagens · Localização (endereço com autocompletar do Google Maps, cidade e bairro preenchidos e cadastráveis na hora, CEP, coordenadas, pino) · SEO; prévia do card ao vivo; checklist de qualidade |
| `/admin/roteiros` · `/:id` | Roteiros | Lista + editor com construtor de paradas (ordenar, vincular lugar, opcional), dicas, mapa do trajeto |
| `/admin/historias` · `/:id` | Histórias | Lista + editor de texto (Markdown com barra de formatação e pré-visualização), categoria, cor, capa |
| `/admin/home` | Home | Topo (título, texto, foto), 6 "Dicas para hoje", histórias em destaque, cards "Roteiros por vibe", valores da marca |
| `/admin/vibes` | Vibes | Nome, cor, ícone, textos e foto de cada vibe; ordem; ativar/desativar |
| `/admin/midia` | Mídia | Todos os espaços de imagem do site, situação (no servidor / enviada / faltando), envio com compressão |
| `/admin/avaliacoes` | Avaliações | Moderação: aprovar, rejeitar, destacar, denúncias, ações em lote |
| `/admin/usuarios` | Usuários | Pessoas cadastradas: filtros, detalhes, bloquear, exportar CSV |
| `/admin/notificacoes` | Notificações | Criar, enviar ou agendar avisos com público e prévia no celular; métricas |
| `/admin/cidades` | Cidades e bairros | Ativar cidades, cadastrar bairros |
| `/admin/equipe` | Equipe e permissões | Convidar, trocar perfil, remover; matriz de permissões |
| `/admin/configuracoes` | Configurações | Geral, SEO padrão, aviso no topo, redes, integrações (chave do Google Maps), modo manutenção, backup/restauração |

## Fluxo editorial

`Rascunho → Em revisão → Publicado` (ou **Agendado** para data futura, ou **Arquivado**).

- **Curador** cria e edita; só consegue *enviar para revisão*.
- **Editor** e **Administrador** publicam, agendam, despublicam, arquivam e excluem.
- Só conteúdo **publicado** (ou agendado cuja data já chegou) aparece no site.
- Sair de um editor com alterações não salvas pede confirmação.

## Permissões

| Permissão | Admin | Editor | Curador |
|---|:-:|:-:|:-:|
| Criar e editar conteúdo | ✓ | ✓ | ✓ |
| Publicar / despublicar | ✓ | ✓ | |
| Excluir conteúdo | ✓ | ✓ | |
| Editar home e vibes | ✓ | ✓ | |
| Moderar avaliações | ✓ | ✓ | |
| Gerenciar mídia | ✓ | ✓ | ✓ |
| Gerenciar usuários do site | ✓ | ✓ | |
| Enviar notificações | ✓ | ✓ | |
| Equipe e permissões | ✓ | | |
| Configurações do site | ✓ | | |

## Endereços do site

Toda página tem URL própria. Conteúdos usam o **slug** definido no painel (único por coleção; se repetir, ganha `-2`, `-3`…):

| URL | Página |
|---|---|
| `/` | Home |
| `/lugares` · `/lugares?busca=…` | Lugares (busca) |
| `/lugares/{slug}` | Página do lugar |
| `/vibes/{slug}` | Lugares de uma vibe |
| `/roteiros` · `/roteiros/{slug}` | Roteiros |
| `/historias` · `/historias/{slug}` | Histórias |
| `/guia` · `/guia/{slug}` | Guia da cidade (mapa) |
| `/entrar` · `/cadastro` · `/boas-vindas` | Conta do visitante |
| `/perfil/favoritos` · `/perfil/favoritos/roteiros` | Lugares e roteiros favoritos, com filtro por vibe (só com login) |
| `/perfil/roteiros` | Meus roteiros: lista, editar, duplicar, excluir (só com login) |
| `/perfil/roteiros/novo` · `?lugar={slug}` · `?copiar={slug}` | Criar roteiro do zero, a partir de um lugar ou copiando outro |
| `/perfil/roteiros/{id}` · `/editar` | Ver e editar um roteiro meu |
| `/perfil/conta` · `/notificacoes` | Dados da conta e notificações (só com login) |
| `/cidade` | Escolha de cidade |

`vercel.json` devolve o `index.html` para qualquer caminho fora de `/api`, `/assets` e `/images`. Endereços inexistentes mostram a página 404. Links antigos `#/admin/...` são redirecionados para `/admin/...`; `/favoritos` leva a `/perfil/favoritos`.

Ações que exigem conta (favoritar, montar ou copiar roteiro, abrir páginas do perfil) levam ao login com uma mensagem do motivo e, depois de entrar, voltam para onde a pessoa estava (o favorito já fica salvo).

### Roteiros do usuário

Ficam na conta (`users.json`, campo `roteiros`), visíveis só para o dono. Formato e validação em `shared/myroteiros.js` (usado pelo site e pela API): até 50 roteiros e 20 paradas cada. O editor segue a dinâmica do admin (abas Informações · Paradas · Dicas, paradas com lugar vinculado ou livres, reordenar, opcional, prévia no mapa). Na página do lugar, **Adicionar a um roteiro** inclui o lugar num roteiro existente (sem duplicar) ou cria um novo com ele. Nos roteiros da curadoria, **Copiar e adaptar** cria uma cópia editável (“baseado em…”); nos próprios, **Duplicar**.

## Endereço com Google Maps

O campo de endereço do lugar usa o autocompletar da **Places API (New)**. Para ativar:

1. No Google Cloud Console, ative **Maps JavaScript API** e **Places API (New)** e crie uma chave.
2. Restrinja a chave a *Referenciadores HTTP* (`https://www.ondesair.com.br/*`, `https://ondesair.com.br/*`) e a essas duas APIs.
3. Cole a chave em **Configurações › Integrações** (ou defina `VITE_GOOGLE_MAPS_API_KEY` no build). A chave fica só no painel; `/api/content` não a expõe.

Ao escolher um endereço, o painel preenche rua e número, CEP, coordenadas, **cidade** e **bairro**. Se a cidade ou o bairro ainda não existem, um aviso oferece cadastrá-los com um clique. Os campos Cidade e Bairro também aceitam cadastro direto (a cidade pede a UF). Não há duplicidade: a comparação ignora acentos, maiúsculas e espaços. Cidades novas entram **inativas** no site. O Bairro só lista os bairros da cidade escolhida. Sem chave, o endereço é digitado à mão.

## Como o painel conversa com o site

Ao salvar, `syncPublic()` copia o conteúdo publicado para os mesmos arrays que o site já lê (`PLACES`, `ROTEIROS`, `STORIES`, `AFFINITIES`, `HERO`…). Assim o site reflete na hora: nomes, lugares novos, home, vibes, cidades, notificações, avaliações em destaque, aviso no topo e modo manutenção.

Imagens enviadas no painel são comprimidas (máx. 1600 px, JPEG) e sobrepõem o arquivo `images/…` correspondente em qualquer `ImageSlot` do site.

## Arquivos

```
web/api/                # funções do Vercel (backend)
├── _lib/storage.js     # Vercel Blob (produção) ou .data/ (local)
├── _lib/auth.js        # senhas, sessão, equipe
├── _lib/users.js       # contas de visitantes (cookie os_user)
├── content.js · media.js
├── account.js          # cadastro, login, dados, senha e exclusão de conta do visitante
├── auth/  login · logout · me · password
└── admin/ db · media · team
web/shared/roles.js     # perfis/permissões usados pelo front e pela API
web/src/admin/
├── AdminApp.jsx        # rotas /admin/*, login obrigatório, menu lateral por permissão, busca rápida (Ctrl K)
├── store.js            # dados, persistência, sincronização com o site, papéis/permissões, autenticação, atividade
├── kit.jsx             # componentes: botões, campos, tabela, abas, modal, toasts, upload de imagem…
├── admin.css           # estilos do painel (prefixo .a-)
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx   # painel + atividade
    ├── content.jsx     # lista e painel de publicação compartilhados (lugares, roteiros, histórias)
    ├── Places.jsx
    ├── Roteiros.jsx
    ├── Stories.jsx
    ├── HomeEditor.jsx
    ├── Vibes.jsx
    ├── Media.jsx
    ├── Reviews.jsx
    ├── Campaigns.jsx   # notificações
    ├── People.jsx      # usuários + equipe
    ├── Cities.jsx
    └── Settings.jsx
```

## Próximos passos sugeridos

1. **E-mail transacional** (convites e “esqueci minha senha” automáticos; hoje o admin gera a senha provisória).
2. **2FA** para administradores.
3. **Banco relacional** (Neon/Postgres pelo Marketplace do Vercel) se o volume crescer muito — a API isola o armazenamento em `api/_lib/storage.js`.
4. **Agendamento** de notificações por Cron Job (publicações agendadas já entram no ar sozinhas pela data).
5. **Analytics real** no gráfico de visitas do painel (Vercel Web Analytics).
