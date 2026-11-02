# Verdade e Desafio — filme editável

Reels para a Semana de Oração Jovem 2026 do Ministério Jovem Ágape Teen. A aventura começa com a rotina, o cansaço e a chuva, passa por uma decisão e chega ao convite para conhecer a Palavra e viver a verdade.

**Formato:** 1080 × 1920, 9:16, 60 fps constantes, H.264 progressivo/yuv420p/BT.709, áudio AAC estéreo a 48 kHz. **Duração:** 77,35 s de vídeo (aproximadamente 77,4 s no contêiner MP4), determinada pela narração recebida. **Saída:** `../verdade_e_desafio_reels.mp4`.

## Editar

- `film.mjs`: direção de câmera, cenários, composição e ações das 16 cenas, calculadas por tempo absoluto. Funções `boot`, `early`, `difficulty`, `portal`, `event`, `titleScene`, `bookScene`, `perspective`, `decision`, `community`, `groupRun`, `final`.
- `scenes/art.mjs`: personagem articulado, paleta, plataformas, árvores, objetos, tipografia, interfaces e partículas.
- `timeline_cenas.json`: início, fim e ação narrativa de cada cena.
- `timeline_palavras.json`: transcrição local com marcação de palavras do áudio real.
- `audio.py`: composição instrumental e efeitos originais, gerados em WAV estéreo.
- `normalizar.py`: normalização de loudness em duas passagens para -16 LUFS, com alvo de true peak -1,5 dBTP.
- `assets/`: fontes OFL, licenças, título derivado do cartaz e áudio original programático.
- `BRIEFING.md`, `AUDITORIA.md`, `FONTES_E_LICENCAS.md`: solicitação, análise dos materiais e procedência.

O personagem é original e mantém cabelo, roupa e proporções em todas as cenas; colegas têm variações de roupa/pele. Não é um asset extraído dos jogos de referência. As referências orientam saltos, parallax, perspectiva e causa/efeito; suas trilhas e personagens não são incorporados.

## Preparar e renderizar

Requer Node.js 22+, Python 3, FFmpeg/FFprobe. Chromium é usado apenas pelo teste de reprodução. Dependências Python: numpy, scipy e Pillow. Os MP4 de referência e a voz original permanecem um nível acima desta pasta.

```bash
npm ci
python -m pip install -r requirements.txt
python audio.py
npm run stills
RENDER_CACHE=/caminho/para/cache node render.mjs
python verificar.py
node verificar_reproducao.mjs
```

`npm run stills` produz quadros de revisão em `revisao/`. `render.mjs` usa chunks de 600 frames e cache de JPEGs, retomando após interrupção. **Após editar imagem/animação, remova o cache ou use um diretório novo**, para não reutilizar quadros antigos. Edições de áudio não exigem redesenhar os frames. A normalização é aplicada ao final; não é preciso executá-la novamente em um render já normalizado.

A voz é usada integralmente, sem troca de palavras ou velocidade. Música abaixada automaticamente pela presença da voz com sidechain; efeitos pontuais; controle de pico e loudness na mixagem. A faixa final é mixada e normalizada, portanto não é binariamente idêntica ao MP3 da narração.

## Revisão e limites

A validação inclui resolução/cadência/codec, contagem de todos os quadros, decodificação integral, ausência de intervalos pretos, comparação de sincronismo da voz, inspeção visual de quadros de todas as cenas e reprodução automática integral no Chromium. Esses procedimentos não são descritos como uma sessão humana contínua de audição. As marcações de fala vieram de alinhamento automático e podem apresentar pequena margem de erro.

A data aprovada é **8 a 14 de novembro de 2026**. Não foi acrescentado horário, endereço, palestrante nem logomarca não fornecida. O encerramento do dia 14 não é anunciado como noturno. A placa final mantém informações em tela até o fim da voz; o cenário desacelera e a música termina suavemente.

A arte é 2D vetorial original com planos em profundidade e corredor projetado; não se apresenta como um jogo 3D interativo. O título foi separado/reconstruído por ferramenta de imagem a partir do cartaz, preservando seu tratamento visual; não é uma extração vetorial pixel a pixel.
