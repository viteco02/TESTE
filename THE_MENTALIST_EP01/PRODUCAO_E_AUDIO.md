# Produção, vozes, som e finalização

## Ordem de execução

1. Selecionar referências de identidade, cabelo e figurino para os seis personagens. Aprovar um enquadramento de Jane e Lisbon juntos para estabelecer escala, luz e aparência. Esta etapa ainda não foi gerada no pacote.
2. Criar uma referência vertical do jardim vazio, à noite, e conservar a posição da casa, árvores e lâmpadas. Ela será a base de todas as tomadas.
3. Gravar/sintetizar as dez falas em vozes brasileiras originais e consistentes. Usar os mesmos identificadores de voz em todas as aparições de cada personagem. Não utilizar uma única voz apenas com mudança de velocidade para representar todos.
4. Editar as falas nas janelas da timeline. Preservar respirações, pausas e reação; não ocupar o espaço inteiro com fala.
5. Gerar as 13 tomadas com os arquivos independentes de `prompts/`. Cada arquivo já contém o cenário, os personagens presentes, a ação, a câmera, o diálogo local, a continuidade e as restrições.
6. Quando houver suporte, fornecer o áudio aprovado ao mecanismo de atuação/lipsync. Caso o gerador produza áudio nativo, revisar a transcrição e a pronúncia antes de aceitar; não sobrepor outra voz a uma boca fora de sincronia.
7. Usar o último quadro da tomada anterior nas ações contínuas; nos contraplanos, manter referências de identidade e cenário, sem forçar o gerador a transformar um rosto em outro.
8. Se o gerador não oferecer durações de 2,5 ou 3,5 segundos, gerar uma janela um pouco maior e selecionar o trecho útil. Não esticar o vídeo nem aplicar câmera lenta. Em ferramentas que permitem handles, deixar aproximadamente 0,5 s de margem antes e depois da ação para edição.
9. Montar os cortes conforme `timeline.csv`. Não usar dissolvências entre os diálogos, zoom digital contínuo, interpolação que deforme rostos ou transições de redes sociais.
10. Aplicar música, ambiente, título e legendas na edição. Exportar o master vertical e uma versão legendada, ambos com áudio integrado.

## Direção de voz

| Personagem | Registro e interpretação |
|---|---|
| Wylie | Jovem-adulto, leve, um pouco sem fôlego pela dança. A pergunta é espontânea, sem tom de locução. |
| Cho | Calmo, baixo, articulação precisa. Pausa após “Estava.”; restante impassível. Não imitar uma voz robótica. |
| Rigsby | Médio-grave, sorriso audível, calor humano. A última resposta é direta e sincera. |
| Van Pelt | Médio, seguro e afetuoso. A pergunta brinca com Rigsby, não o repreende. |
| Lisbon | Firme, íntima, com curiosidade e humor delicado. Não usar uma interpretação infantil ou excessivamente melosa. |
| Jane | Quente, registro médio. O convite tem um sorriso; “Pelo resto da vida” perde a ironia e fica simples. |

As vozes propostas são performances brasileiras originais dos personagens. Não se pressupõe acesso às gravações, à voz dos atores ou à dublagem oficial. Sem narrador, falas de fundo inteligíveis ou frases acrescentadas.

`DIALOGOS_GUIA.srt` contém tempos planejados, não alinhamento extraído de uma gravação pronta. Reajustar após a gravação para que cada legenda acompanhe a fala real, mantendo a cena com 60 segundos.

## Prompt de música original

> Componha um instrumental original de 60 segundos para o fim de uma pequena festa de casamento ao ar livre. Jazz acústico muito discreto, cerca de 76 BPM, piano macio, contrabaixo leve e escovas quase imperceptíveis. Atmosfera calorosa, adulta e intimista. Começo com leveza para uma conversa bem-humorada; depois de 22 segundos, reduzir a atividade rítmica e deixar espaço para um momento de afeto. Entre 49 e 60 segundos, sustentar uma resolução harmônica suave, com término delicado exatamente no fim. Sem voz, sem coro, sem fanfarra, sem suspense, sem efeito de trailer. Criar melodia inteiramente nova; não reproduzir nem imitar o tema ou gravações de The Mentalist ou de outra obra. Deixar espaço espectral para diálogos naturais.

Gerar ou compor e revisar a música como camada separada. Não presumir que o prompt, por si só, comprova a originalidade de qualquer resultado.

## Ambiente e mixagem

- Camada contínua e baixa de jardim noturno, convidados distantes sem palavras reconhecíveis, tecido e passos leves sobre grama.
- Nenhum efeito cômico, risada gravada, impacto de trailer ou som que anuncie perigo.
- No movimento de mãos e abraço, foley de tecido discreto; não usar ruídos exagerados.
- Diálogos no centro, estáveis em volume. A música recua sob a fala e sobe apenas um pouco durante os silêncios finais.
- Como ponto de partida, música aproximadamente 18–24 dB abaixo do diálogo; ajustar por escuta, sem tratar esse intervalo como regra fixa para todo material.
- Master a 48 kHz, estéreo, alvo aproximado de −16 LUFS integrado e pico verdadeiro até −1 dBTP. Verificar inteligibilidade em alto-falante de celular e compatibilidade mono.
- O ambiente deve atravessar os cortes para unir os trechos gerados. Final sem corte seco de reverberação.

## Título e identificação

Não gerar as letras dentro das imagens. Aplicar texto real na pós-produção.

**00:00–00:03:** identificação discreta “FAN FILM • NÃO OFICIAL”, fora dos rostos.

**00:54,5–01:00:** entrada suave de aproximadamente 0,3 s, mantendo o abraço visível:

THE MENTALIST  
TEMPORADA 8  
O DIA SEGUINTE

Abaixo, em menor corpo: **FAN FILM • NÃO OFICIAL**.

Sugestão: título branco em serifada sóbria licenciada; subtítulos em sans-serif. Sem logotipo da CBS e sem cartão que alegue estreia oficial. Manter o título na área superior deixada vazia pela composição: aproximadamente x=100–900 e y=230–520. Rostos abaixo dessa região, sem afastar os personagens até ficarem pequenos. Conferir as áreas de interface na prévia real do Reels.

Legendas opcionais em português brasileiro, com contraste e no máximo duas linhas, aproximadamente y=1380–1530. Não cobrir mãos importantes, rostos ou o título. Reposicionar por tomada quando necessário.

## Exportação e revisão

- 1080 × 1920, pixels quadrados, progressivo, 30 fps constantes, 60,000 s, 1.800 quadros.
- H.264 em MP4, Rec.709, yuv420p, bitrate de trabalho aproximado de 10–16 Mb/s ou qualidade equivalente; AAC estéreo a 48 kHz, 192–256 kb/s; fast start.
- Gerar vertical desde a composição. Não usar barras para disfarçar um vídeo horizontal ou cortar os personagens de uma composição panorâmica.
- Se uma ferramenta não gerar 30 fps nativos, essa limitação precisa ser considerada na escolha da ferramenta; apenas alterar metadados não cria movimento a 30 fps. Evitar interpolação que deforme rostos e lábios.
- Conferir todas as falas, identidades, mudanças de figurino, posição das mãos e aliança, continuidade dos olhares, contato no abraço e luminância entre tomadas.
- Revisar a sincronização labial em velocidade normal e quadro a quadro nas consoantes mais visíveis. Aceitar a tomada apenas depois dessa revisão, sem afirmar sincronismo a partir do prompt.
- Verificar que só existem as dez falas solicitadas e que nenhum novo mistério foi introduzido.

## Legenda sugerida para a publicação

THE MENTALIST — Temporada 8: O dia seguinte.  
Cena piloto: A última dança.  
Uma continuação fictícia feita por fã, não oficial.

Se o vídeo final usar geração de imagem/voz, acrescentar: “Cena produzida com recursos de inteligência artificial.”
