# Auditoria e direção

Inspeção realizada antes da criação do projeto. Base: commits 3d80cf7 e bfc8f85 do repositório viteco02/TESTE, branch main. Não há infraestrutura de aplicação ativa, arquivos AGENTS.md ou convenções de projeto. Há histórico de filmes anteriores, apagados por solicitação do usuário; nenhum conteúdo do evento anterior foi restaurado.

## Materiais recebidos

- `../NARRAÇUDA.MP3`: voz original, MP3 estéreo, 44,1 kHz, 77,348542 s. Prioridade temporal. O nome incomum foi identificado por conteúdo e formato.
- `../REFERENCIA 01.mp4`: 42,041667 s, 720 × 1280, 24 fps. Saltos entre plataformas, preparação, parábola, pouso, erro e tentativa; personagem constante. Humor causado por obstáculos e pelo clima. Cenário lateral e skyline em camadas.
- `../REFERENCIA 02.mp4`: 27,238005 s, 360 × 640, 30 fps. Pixel art, deslocamento horizontal, paisagens com camadas, alternância do horizonte e céu/lua, texto espacial. Inspiração para câmera e parallax, sem reutilizar personagem, música ou arte da referência.
- `../REFERENCIA 03.mp4`: 40,233333 s, 720 × 1280, 30 fps. Corredor em perspectiva, saltos e mudanças de faixa, passagem de cânion a gelo, obstáculos próximos à câmera, interface e virada cromática. Inspiração para o trecho de distrações/pressões; sem copiar o jogo.
- `../90a2dd50-1014-49ef-b2c9-f00efcb9cc3e.png`: cartaz aprovado, 941 × 1672. Azul intenso, preto, lima fluorescente, amarelo, branco. Título volumoso e irregular, contorno preto e azul; elementos de plataforma, Bíblia, calendário e botões pixelados.

## Ausências

Não há logomarca vetorial/separada do Ágape Teen, fontes, sprites, trilha licenciada separada, horário ou endereço aprovados. O ministério é identificado por texto. Nenhuma informação de local, horário, palestrante ou programação de cada noite é inventada. A data é 8 a 14 de novembro de 2026; o filme não representa as sete datas como noites.

## Método de análise

Referências inspecionadas por sequências de quadros ao longo de toda a duração, incluindo o final, e verificadas tecnicamente por FFmpeg. Esta análise por quadros não é apresentada como uma sessão humana de audição/visionamento audiovisual contínuo. A voz foi transcrita localmente com faster-whisper e alinhamento por palavras; os marcos da narrativa foram revisados para a composição. Alinhamento automático tem margem de erro e não constitui sincronização fonética certificada.

## Implementação

Canvas 2D com Skia via @napi-rs/canvas; cada frame é calculado por tempo absoluto a 60 fps. Personagem articulado original, poses distintas, salto parabólico, cenários procedurais em camadas, câmera lateral e corredor em perspectiva. Esta escolha permite renderização determinística sem depender de captura de tela/WebGL e facilita edição por cenas. O título foi isolado com ferramenta de imagem a partir do cartaz fornecido; demais ilustrações e áudio instrumental/efeitos são originais e programáticos. As três fontes adicionais são distribuídas sob OFL.

O filme segue os 77,35 segundos da narração, e não o alvo inicial de 45–50 s. Nenhuma aceleração da voz.
