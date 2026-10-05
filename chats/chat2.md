# Templates de posts para redes sociais

_Started 2026-05-25 20:16 UTC_

---

## User

crie 5 templates de posts para redes sociais. Considere que terá fotos dos locaois e espaços nas imagens para receber o branding

## Assistant

_[tool: read_file]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: grep]_

_[tool: copy_starter_component]_

Building the 5 templates now.

_[tool: write_file]_

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

5 templates de 1080×1080 no canvas, cada um com slot de foto arrastável (image-slot) e área de branding fixa (logo, chips, texto) sobre a imagem: destaque de lugar, roteiro (grade 2×2), VIP/promo, dica do dia, e capa de afinidade.

## User

um carrossel de um lugar com os conteúdos:

- nome do lugar + endereço + horário de funcionamento

## Assistant



## User

um carrossel de um lugar com os conteúdos:

- nome do lugar + endereço + horário de funcionamento
- Tipo de galera que  cola (público alvo)
- Para dates, para impressionar, categorias
- Melhor dia pra colar (diferencia) - Happy hour toda quarta-feira, metade do preço na breja
- Próximo evento - jogo da copa dia 15/07, não perca.
- encerrmento - salve o post, envie pra alguém, curta.

## Assistant

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

Carrossel de 6 slides adicionado (linha abaixo dos templates), usando o lugar "Quintal do Centro": capa com endereço/horário, público-alvo, categorias/afinidades, melhor dia (happy hour quarta), próximo evento (jogo dia 15/07) e encerramento com CTA de salvar/enviar/curtir.

## User

no hero, inclua um banner slide com uma imagem, título e linha fina. o CTA deve levar para uma página de detalhe de um evento.

## Assistant

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

Adicionado um banner slide no hero (imagem, título e linha fina de destaque) com CTA "Ver evento →" que leva para a página de detalhe do evento "Feira do Largo".

## User

Found issues — fixing…

## Assistant

_[tool: show_html]_

_[tool: ready_for_verification]_

Re-submitted for verification.

## User

suba o banner para depois do menu

## Assistant

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

Banner movido para logo abaixo do menu, antes do título do hero.

