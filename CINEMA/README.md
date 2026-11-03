# Verdade e Desafio — Semana de Oração Jovem 2026

Reels editorial de 72,17 segundos, 1080 × 1920, 60 fps. Ministério Jovem Ágape Teen, 8 a 14 de novembro de 2026.

## Entregas

- `output/VERDADE_E_DESAFIO.mp4`: filme com narração, trilha e efeitos.
- `output/VERDADE_E_DESAFIO_LEGENDADO.mp4`: mesmo filme com legendas incorporadas.
- `output/VERDADE_E_DESAFIO.srt`: legendas separadas, com o texto integral.
- `output/CAPA.jpg`: composição final da campanha.
- `assets/`: filmagens, imagens, fontes e áudio editáveis.
- `src/`: animação, locução, trilha, sincronismo, legendas e exportação.

O roteiro completo pede aproximadamente 70 segundos de voz natural; a duração final inclui a leitura da composição de encerramento. Não foi acelerada a gravação para atingir 65 segundos.

## Direção visual

As quatro referências recebidas estão preservadas na raiz do repositório. A referência 1 orientou as interferências urbanas; a 2, o movimento aéreo e a escala da cidade; a 3, as máscaras de dupla exposição; a 4, as faixas de papel, a colagem e a tipografia cinética. Os vídeos de referência não foram incorporados ao filme.

Não havia cartaz oficial separado, narração, fotografias institucionais ou logotipo no repositório. A identidade foi construída a partir da paleta e dos elementos descritos no briefing. O retrato é um personagem fictício gerado, e as filmagens são ilustrativas de banco. Não representam registros reais do ministério. Consulte `docs/ASSETS.md`.

## Reproduzir

Requer Node.js 22+, Python 3.12+, FFmpeg/FFprobe com libx264 e libass.

```bash
npm ci
python -m pip install -r requirements.txt
python src/prepare.py
python src/render_blocks.py
python src/captions.py
python src/export.py
```

A narração e os stems já estão incluídos. Não é necessário chamar serviços externos para renderizar. Para recriar a voz: `python src/voice.py` (requer conexão com o serviço TTS), depois `python src/audio.py` e `python src/captions.py`. Uma nova síntese pode alterar os tempos: revise `src/timeline.json` e os cortes da animação.

`npm run preview` gera quadros de revisão. `src/render_blocks.py` renderiza em blocos de quatro segundos e retoma os blocos já concluídos. `FRAME_CACHE` permite indicar outro diretório de quadros. A composição é feita em Canvas 2D com máscaras, recortes, profundidade simulada e filmagens; não é um projeto de After Effects nem uma cena 3D volumétrica.

A animação gráfica é calculada a 60 fps. As filmagens são amostradas a 30 fps; não foi aplicada interpolação óptica. A trilha e os efeitos foram sintetizados originalmente em código, com stems separados. Fontes Anton e Barlow Condensed sob SIL OFL.
