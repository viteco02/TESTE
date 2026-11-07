# A última dança — motion ilustrado

Fan film não oficial de The Mentalist. Episódio 1: O dia seguinte.

- **60 segundos • 1080 × 1920 • 9:16 • 30 fps**
- [Vídeo com legendas](output/A_ULTIMA_DANCA_LEGENDADO.mp4)
- [Vídeo sem legendas](output/A_ULTIMA_DANCA.mp4)
- [Legendas SRT](output/A_ULTIMA_DANCA.srt)
- [Capa](output/capa.jpg)

Ilustrações em camadas, animação corporal estilizada, deslocamento de câmera, dança de Wylie, convite e abraço final. Os cinco blocos narrativos e as dez falas do roteiro foram preservados. As bocas têm animação simplificada por intensidade do áudio, não sincronização fonética realista. Vozes sintéticas em português; não são gravações ou clones das vozes dos atores. Trilha instrumental e ambiente sintetizados para esta produção, sem músicas da série.

## Reprodução

Node.js com `@napi-rs/canvas` 1.0.13, Python 3 com NumPy, SciPy e edge-tts, FFmpeg com libx264 e libass. Os áudios e as ilustrações finais estão incluídos; não é preciso gerar novamente as vozes.

```sh
npm install
python src/export.py
```

`src/render.mjs` renderiza 1.800 quadros; `src/export.py` exporta blocos de quatro segundos, monta o MP4 e aplica as legendas. Apague os blocos em `.cache/` antes de renderizar alterações. `src/audio.py` sintetiza a música, mixa as falas e gera o SRT. As fontes incluem suas licenças OFL.
