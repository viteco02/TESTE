# Recursos e procedência

## Materiais fornecidos pelo usuário

Preservados sem alteração na raiz: `NARRAÇUDA.MP3`, `REFERENCIA 01.mp4`, `REFERENCIA 02.mp4`, `REFERENCIA 03.mp4`, `90a2dd50-1014-49ef-b2c9-f00efcb9cc3e.png`.

Os três vídeos servem somente como referência de linguagem. Nenhum frame, personagem, interface identificável, trilha ou efeito desses jogos é usado no filme final. A narração é usada para este projeto conforme o briefing. O cartaz fornece a identidade do evento.

## Fontes

Distribuídas sob SIL Open Font License, com o texto de cada licença em `assets/`:

- Lilita One, títulos secundários: https://github.com/google/fonts/tree/main/ofl/lilitaone
- Pixelify Sans, interfaces: https://github.com/google/fonts/tree/main/ofl/pixelifysans
- Space Grotesk, informação complementar: https://github.com/google/fonts/tree/main/ofl/spacegrotesk

Arquivos obtidos do repositório Google Fonts em 1 de novembro de 2026.

## Arte original e derivada

- Personagem articulado, colegas, cenários, árvores, prédios, plataformas, interfaces, partículas, calendário, relógio e Bíblia: desenho programático original em `scenes/art.mjs` e `film.mjs`.
- `assets/titulo.png`: recorte/reconstrução com ferramenta de geração/edição de imagem a partir do cartaz do usuário. Texto VERDADE E DESAFIO, contornos preto/azul, branco e verde-limão. Transparência verdadeira. Sem marca d'água.
- Paleta do filme: azul elétrico, azul profundo, lima, ciano, branco e amarelo. Medianas indicativas extraídas de pixels saturados do cartaz: lima `#a7fb03`, azul `#1511d2`, dourado `#fdc002`. A arte mantém pequenas variações para contraste e iluminação.

## Áudio

`assets/trilha.wav` e `assets/efeitos.wav` são sintetizados originalmente pelo código `audio.py`: osciladores, harmonia, percussão, ruído filtrado, envelope e panorâmica. Não contêm amostras de músicas comerciais, sons identificáveis de jogos ou áudio das referências. O código permite regenerá-los e editá-los.

## Bibliotecas

- @napi-rs/canvas: renderização Canvas/Skia, licença MIT, dependências registradas em package-lock.json.
- puppeteer-core: teste de reprodução, Apache-2.0.
- NumPy, SciPy e Pillow: síntese e validação, licenças dos respectivos projetos.
- FFmpeg e Chromium: ferramentas externas necessárias para exportação e teste, não redistribuídas neste projeto.
