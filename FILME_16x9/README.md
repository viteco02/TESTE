# Sábado da Criação — versão para projeção 16:9

Saída: `../sabado_da_criacao_16x9.mp4`, 1920 × 1080, 60 fps, H.264/AAC.

Adaptação do filme V2 aprovado: câmera 3D com campo horizontal ampliado, composição e textos adaptados ao formato horizontal, letras sem deformação e margens de segurança. O trecho da criação também é renderizado novamente em 16:9. Cenário distante ampliado para cobrir o campo horizontal; ramo de primeiro plano retirado para evitar uma borda visível nesse enquadramento.

A faixa de áudio é copiada integralmente do MP4 V2, mantendo narração, música e sincronismo, sem nova compressão de áudio.

## Reprodução

Baixe o MP4 e abra em tela cheia no computador conectado ao projetor. O arquivo não depende de internet para reproduzir. Use a proporção 16:9 na saída do computador/projetor.

## Renderização

Este diretório usa os assets, a fonte e as dependências de `../FILME_V2/`. Os arquivos de assets são links relativos. Execute `npm ci` em `FILME_V2` e crie `node_modules` aqui como link para `../FILME_V2/node_modules`, se necessário. Requer Node.js, FFmpeg e Chromium.

```bash
RENDER_CACHE=/caminho/para/cache-horizontal node render.mjs
```

Use um cache exclusivo desta versão. `--stills` exporta quadros de revisão. Os tempos e a narração seguem a timeline de `../FILME_V2/TIMELINE.md`. A validação técnica fica em `VALIDACAO.json`.
