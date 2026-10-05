# Onde Sair · tema WordPress

Tema oficial do **Onde Sair** — curadoria por afinidade. Acompanha a arquitetura SEO local descrita no Documento Master.

## O que tem dentro

```
theme/onde-sair/
├── style.css                  # cabeçalho do tema (WordPress)
├── functions.php              # CPTs, taxonomias, meta boxes, enqueue
├── header.php                 # nav global (logo, links, city pill)
├── footer.php
├── front-page.php             # Home com curadoria
├── single-lugar.php           # Detalhe de um lugar
├── single-roteiro.php         # Detalhe de um roteiro
├── taxonomy-afinidade.php     # /para-dates, /pra-impressionar, etc.
├── archive.php                # /lugares, /roteiros, busca
├── page.php                   # páginas estáticas (VIP, Parceiros, Sobre)
├── 404.php
├── searchform.php
├── index.php                  # fallback obrigatório do WP
└── assets/
    ├── css/onde-sair.css      # design system completo
    └── js/app.js              # favoritar + estado local
```

## Custom Post Types

- **`lugar`** — restaurantes, bares, parques, cinemas, eventos
- **`roteiro`** — sequência curada de lugares

## Taxonomias (a arquitetura SEO)

| Taxonomia      | Slug raiz       | URLs geradas                                |
|----------------|-----------------|---------------------------------------------|
| `afinidade`    | (nenhum)        | `/para-dates`, `/pra-impressionar`…         |
| `tipo`         | `/tipo/`        | `/tipo/restaurantes`, `/tipo/bares`…        |
| `cidade`       | `/cidade/`      | `/cidade/sao-paulo`, `/cidade/recife`…     |

A taxonomia `afinidade` usa slug raiz vazio para gerar URLs limpas de SEO. Cria os termos manualmente em **Lugares → Afinidades** com estes slugs:

- `para-dates`
- `para-impressionar`
- `para-turistar`
- `para-relaxar`
- `para-economizar`
- `para-a-criancada`

## Instalação

1. Compacte a pasta `onde-sair/` como `.zip`
2. WordPress → Aparência → Temas → Adicionar nova → Enviar tema
3. Ative o tema
4. Vá em **Configurações → Links permanentes** e clique **Salvar** (regenera as rewrites das taxonomias)
5. Crie os termos das taxonomias `afinidade`, `tipo`, `cidade`
6. Crie alguns **Lugares** e **Roteiros**
7. Defina uma página estática como Home: **Configurações → Leitura → Página estática**

## Meta fields disponíveis

### Lugar
- `_os_bairro` (text)
- `_os_endereco` (text)
- `_os_horario` (text)
- `_os_price_level` (0–3)
- `_os_vip` (boolean)
- `_os_dica` (textarea) — "A dica que importa"
- `_os_dica_by` (text) — assinatura do curador
- `_os_rating`, `_os_reviews` (opcionais, livres)

### Roteiro
- `_os_paradas` (number)
- `_os_bairros` (text)
- `_os_vip` (boolean)

## Tokens de design

Toda a customização visual fica em `assets/css/onde-sair.css` usando CSS Custom Properties:

```css
--primary:        #673de6;
--primary-dark:   #4d22cc;
--primary-soft:   #ede8fd;
--vip:            #1a6e45;
--cta:            #d94f1a;
--bg:             #f7f5ff;
--ink:            #1a1625;
```

Para criar uma variante de marca regional (ex: Onde Sair Campinas com paleta diferente), basta sobrescrever esses tokens com um plugin ou child theme.

## Próximos passos sugeridos

- Integração de pagamento para o fluxo VIP (Pagar.me / Mercado Pago)
- Plugin de afiliados para tracking de partners
- Newsletter via `admin-post.php` → Mailerlite / RD
- Schema.org Restaurant + Event para SEO local rico
