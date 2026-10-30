# Prévia V2 — teste de movimento

Trecho de 7,4 segundos, correspondente a 10,7–18,1 s da narração original. Este é um teste de direção de movimento e composição, não uma entrega final do filme.

Quatro ações: abertura da escuridão pela luz; subida da câmera entre nuvens; descida sobre a água com ondulação procedural; terreno emergindo com crescimento de vegetação. As palavras LUZ, CÉUS, ÁGUAS e VIDA usam os tempos da fala. Sem trilha adicionada nesta prévia.

A composição usa Three.js/WebGL: terreno e água com geometria animada, elementos ilustrados posicionados em profundidade, câmera móvel e tipografia em Canvas. Árvores e nuvens usam recortes ilustrados; o crescimento das árvores é uma transformação de escala, não uma simulação botânica.

## Marcas da narração

| Palavra | Tempo no áudio original | Tempo na prévia |
|---|---:|---:|
| LUZ | 11,22 s | 0,52 s |
| CÉUS | 13,66 s | 2,96 s |
| ÁGUAS | 15,12 s | 4,42 s |
| VIDA | 17,14 s | 6,44 s |

Tempos derivados do alinhamento automático da narração.

## Executar

Requer Node.js, FFmpeg e Chromium em `/usr/bin/chromium` (ajuste o caminho em `render.mjs` se necessário).

```sh
npm install
node render.mjs
```

Para gerar quadros de inspeção: `node render.mjs --stills`.

O MP3 original deve estar no diretório superior. A exportação usa somente o trecho indicado, sem mudança de velocidade. O filme completo anterior não é substituído por esta prévia.

Ilustrações geradas para o projeto. Montserrat sob SIL Open Font License, incluída nesta pasta. Bibliotecas com suas licenças próprias, instaladas via npm. Narração fornecida pelo usuário.
