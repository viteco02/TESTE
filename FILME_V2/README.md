# Sábado da Criação — filme completo V2

1080 × 1920, 60 fps, H.264 / AAC; duração original da narração: aproximadamente 57,652 segundos.

A V2 desenvolve a direção aprovada na prévia: câmera em movimento por um ambiente com profundidade, água e terreno animados, ilustrações em camadas, planos próximos, tipografia cinética e evolução da luz até o pôr do sol. O trecho aprovado de 10,7 a 18,1 s é reutilizado sem nova geração ou mudanças de animação. A consolidação final padroniza a faixa de cor para yuv420p / BT.709 e recodifica o MP4 de entrega.

## Arquivos

- `index.html`: composição WebGL/Canvas, câmeras e animações por tempo.
- `render.mjs`: exportação em trechos, com cache de quadros para retomada.
- `trilha.py`: trilha instrumental e efeitos de ar/pulsos sintetizados para este projeto.
- `trilha.wav`: trilha gerada, com redução nos intervalos de fala.
- `timeline_eventos.json`: início/fim dos textos e tratamentos.
- `timeline_palavras.json`: alinhamento automático da narração, com timestamps por palavra.
- `VALIDACAO.json`: medições do arquivo final.
- `elementos.png`, `relevo.png`, `texturas.png`: atlas de ilustrações usados no ambiente.

## Renderizar

Requer Node.js, FFmpeg, Chromium e Python 3 com NumPy para regenerar a trilha. Instale dependências com `npm install`. O Chromium padrão é `/usr/bin/chromium`; use `CHROMIUM_PATH` para outro caminho.

No diretório superior devem estar `NARRAÇÃO.MP3` e `sabado_da_criacao_teste_v2.mp4`.

```sh
python trilha.py
npm run render
```

O filme é exportado para `../sabado_da_criacao_reel_v2.mp4`. `npm run stills` produz quadros para revisão. `RENDER_CACHE` permite escolher a pasta intermediária; o padrão é `work/`. Se alterar a animação, remova o cache dos trechos afetados antes de renderizar novamente.

## Narração e revisão

A narração original é usada integralmente, sem cortar, acelerar, regravar ou mudar palavras. A exportação recodifica a voz para AAC e mistura uma trilha discreta. A marcação dos textos deriva de alinhamento automático; não se afirma precisão fonética certificada inferior a 100 ms.

A verificação inclui decodificação integral, reprodução automática do início ao fim no Chromium e inspeção de quadros distribuídos pelas cenas. Não equivale a uma sessão humana de reprodução audiovisual integral. Árvores, nuvens e montanhas incluem recortes ilustrados em profundidade; o crescimento das árvores é animado por escala, e não por simulação botânica.

## Verificação reproduzível

Depois de exportar: `python verificar.py` confere formato, decodificação, áudio e um quadro do trecho aprovado. `node verificar_reproducao.mjs` reproduz automaticamente o arquivo completo no Chromium e registra a conclusão.

## Procedência

Ilustrações geradas para o projeto com orientação estética da referência fornecida. Composição, animação e trilha criadas para este trabalho. Montserrat sob SIL Open Font License, incluída nesta pasta. Narração e referências fornecidas pelo usuário; direitos permanecem com seus titulares. Nenhuma localização, data ou logotipo adicional foi inventado.
