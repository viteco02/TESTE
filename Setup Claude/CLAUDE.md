# Preferências do usuário (mídia — IASD Parque Vitória e Casa do JA)

Instruções que o Claude deve seguir em qualquer projeto desta máquina.

## Idioma e escrita
- Responder sempre em português do Brasil.
- Escrever "Deus", "Jesus", "Espírito Santo", "Ele" (referindo-se a Deus) com inicial maiúscula.
- Legendas de redes sociais: curtas, sem repetir o que o vídeo já mostra; 5 hashtags que mais engajam no nicho.
- Designs criativos, nada básico. Nada de ilustração infantil/estilo "Ministério Kids".

## Entregas
- Arquivos finais vão para o repositório GitHub `viteco02/TESTE` (fazer pull/rebase antes de push).
- Sempre entregar o link direto (raw.githubusercontent.com) e uma prévia leve do vídeo.

## Identidades visuais (nunca misturar)
- **Cortes da Semana Jovem:** estilo verde-limão.
- **Cortes da igreja:** azul-marinho, com o encerramento "Adventistas Parque Vitória".
- **Casa do JA (identidade nova):** azul-marinho #0B2A5B, azul profundo #061A3A, amarelo #FFC72C,
  gelo #E3ECFA, turquesa #1BB5C9 (hover/destaques), fonte Barlow Condensed itálico; script Kaushan Script.
- Posts com arte oficial (ex.: Tema JA 2027 "Reconectados", Dia Mundial "Chamados para a Missão"): usar a arte oficial, não capas inventadas.

## Site Casa do JA (Wix)
- Site: www.casadoja.com — Wix siteId 7c4cc597-7568-4d39-b54c-cce93ce59ed1.
- Publicar ou alterar conteúdo público só com o "pode publicar" explícito.
- Nunca clicar em "Publicar" no editor do Wix sem perguntar (pode colocar o design novo inteiro no ar).
- Botões nos posts: amarelo com hover turquesa (#1BB5C9) e texto #061A3A no hover; links do texto em turquesa.

## Rotinas
- Fachadômetro (toda sexta à noite): o usuário manda o valor arrecadado → editar `semana.json`
  (data, anterior, atual, meta 10000) no projeto `fachada-remotion` e renderizar a versão azul (FachadaAzul).

## Ferramentas de vídeo instaladas
- Motion "uma tomada só": skill `onetake` (projetos `casaja-teaser` e `casaja-site-no-ar` são exemplos do estilo aprovado).
- Remotion para vídeos da igreja; narração pt-BR com Kokoro (voz pm_alex); trilhas Open Bars (CC0) cortadas nos compassos.
- Também: hyperframes, hypit, directing-stickman-videos, gbro-collage-broll, lemo-opuscar, claude-animation-base, earshot.
