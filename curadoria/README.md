# Curadoria · ranking de lugares por cidade

Primeiro passo para popular uma cidade: buscar candidatos no Google, ranquear e
gerar uma planilha para a curadoria decidir **Sim / Não / Talvez**.

```bash
python3 curadoria/ranking.py sorocaba --simular   # quantas buscas serão feitas
python3 curadoria/ranking.py sorocaba             # gera curadoria/saida/ranking-sorocaba.xlsx
python3 -m unittest curadoria/test_ranking.py     # testes (dados fictícios)
```

Requer a variável `GOOGLE_PLACES_API_KEY`: chave do Google Cloud com a
**Places API (New)** ativada, restrita a essa API e **sem** restrição de site
(a chave do painel não serve). Dependências: Python 3.9+ e `openpyxl`.

## Como funciona

1. **Busca** — cada tipo do site tem uma lista de buscas (`cidades/<cidade>.json`),
   feitas como "restaurante japonês em Sorocaba SP", com até 60 resultados cada.
   As respostas ficam em `.cache/` por até 30 dias (limite dos termos do Google),
   então rodar de novo não gera custo.
2. **Consolidação** — um registro por lugar (`placeId`). Se o mesmo lugar aparece
   em buscas de tipos diferentes, vale o tipo principal informado pelo Google.
3. **Descartes** — outra cidade, fechado, sem nota ou já publicado no site
   (lista `ja_no_site`).
4. **Corte** — nota mínima (`nota_minima`) e avaliações mínimas por tipo.
5. **Pontuação** — média ponderada (bayesiana) por tipo:
   `v/(v+m)·nota + m/(v+m)·C`, onde `v` = avaliações do lugar, `m` = mediana de
   avaliações do tipo na cidade e `C` = nota média do tipo. Lugares com poucas
   avaliações são puxados para a média, então 4,6 com 2.000 avaliações costuma
   ficar à frente de 4,9 com 30.
6. **Cotas** — os primeiros de cada tipo são **Selecionados** (`cota`); os demais
   aprovados viram **Reserva** (substitutos para recusas).
7. **Apostas** — nota alta com poucas avaliações (entre `apostas.min_avaliacoes`
   e o mínimo do tipo): até `apostas.maximo` lugares, marcados à parte.

## Planilha

- **Resumo**: parâmetros e números por tipo.
- **Ranking**: selecionados, reservas e apostas, com a coluna **Decisão**.
- **Descartados**: o resto, com o motivo.

**Uso interno.** As notas do Google não podem ser publicadas no site nem guardadas
por mais de 30 dias, por isso `saida/` e `.cache/` não são versionadas. No site
entram só o `placeId` e os textos da curadoria.

## Nova cidade

Copie `cidades/sorocaba.json`, ajuste centro, raio, cotas e mínimos (cidades
maiores pedem mínimos de avaliações maiores) e rode com o nome do arquivo.

## Sem API: dados públicos da web

`ranking_web.py` faz o mesmo ranking a partir de uma coleta manual feita por
busca na web (`web/<cidade>.py`): notas e nº de avaliações do Tripadvisor, do
Google (como aparecem no Wanderlog e no Restaurant Guru) e do Foursquare.

```bash
python3 curadoria/ranking_web.py sorocaba        # curadoria/saida/ranking-sorocaba-web.xlsx
python3 -m unittest curadoria/test_ranking_web.py
```

- Como cada fonte tem um volume diferente (o Tripadvisor tem uma fração das
  avaliações do Google), a média ponderada é calculada **por fonte** e
  combinada com peso pela confiança `v/(v+m)` de cada uma.
- Corte: nota mínima do tipo em alguma fonte, com volume mínimo nessa fonte
  (Tripadvisor 50, Google 200). Parques e Eventos usam nota mínima 4,0, porque
  atrações têm notas mais baixas no Tripadvisor.
- A aba **Sem nota** traz lugares citados em guias, mas sem nota encontrada:
  ficam para a curadoria avaliar pelo conhecimento local.
- Limitação: os dados vêm de resumos de busca, com datas diferentes por fonte.
