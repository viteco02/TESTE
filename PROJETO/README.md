# Sábado da Criação — projeto editável

Filme vertical 1080×1920, 60 fps, H.264/AAC, 57,652 segundos.

## Renderização

Requer Node.js 20+, Python 3 com NumPy e FFmpeg no PATH.

```sh
npm install
python trilha.py
npm run render
```

O vídeo é salvo no diretório superior. `node render.mjs --stills` gera quadros para revisão.

## Edição

- `render.mjs`: composição Canvas, cenários, câmera, máscaras, tipografia, partículas, água, árvores e flores; eventos com tempos em segundos.
- `timeline_palavras.json`: alinhamento automático da narração portuguesa com faster-whisper small; tempos de início e fim por palavra. Não constitui certificação de erro inferior a 100 ms.
- `timeline_eventos.json`: entradas e saídas dos textos e estilo de animação.
- `trilha.py`: composição instrumental sintetizada original, com redução de volume nos trechos de voz.
- `assets/narracao.mp3`: cópia integral do áudio fornecido, sem cortes, alteração de velocidade ou regravação. A exportação final recodifica e mistura em AAC, conforme o briefing.
- `briefing.json`: especificação original fornecida pelo usuário.

## Procedência dos assets

Ilustrações geradas para este projeto com referência estética no vídeo fornecido. Animação, composição, partículas e música criadas programaticamente. Montserrat distribuída sob SIL Open Font License, incluída em `assets/OFL-Montserrat.txt`. Narração e referências fornecidas pelo usuário; direitos permanecem com os respectivos titulares. Nenhuma música de banco ou logotipo inventado foi utilizado.

## Limites da produção

Animação programática de recortes ilustrados, com cenário em camadas e efeitos de luz. A flor é revelada por transformação de escala; não há simulação botânica de pétalas individuais. Os timestamps vêm de reconhecimento automático e não de alinhamento fonético revisado palavra por palavra. A verificação técnica cobre decodificação integral, duração, formato e amostragem visual de quadros; não equivale a uma sessão humana de reprodução audiovisual integral.
