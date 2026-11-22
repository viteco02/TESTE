# Levar a estrutura do Claude para a sua máquina

Este kit reinstala no seu computador o que foi montado no chat: as skills de vídeo, as ferramentas, as suas preferências e os projetos de exemplo.

## 1. Instale o Claude Code
- **Mais fácil:** baixe o app Claude para desktop em https://claude.ai/download e use a aba **Code**.
- **Pelo Terminal:** `npm install -g @anthropic-ai/claude-code` e depois rode `claude`.

## 2. Baixe este kit
No GitHub, abra o repositório `viteco02/TESTE` → botão **Code** → **Download ZIP**. Descompacte e entre na pasta `Setup Claude`.
(Ou, se tiver Git: `git clone https://github.com/viteco02/TESTE.git`.)

## 3. Rode o instalador
- **Windows:** dentro da pasta `Setup Claude`, clique com o botão direito → **Abrir no Terminal** e rode
  `powershell -ExecutionPolicy Bypass -File .\instalar-windows.ps1`
- **Mac / Linux:** abra o Terminal na pasta e rode `bash instalar-mac-linux.sh`

O instalador confere se você tem **Git, Node.js, Python e FFmpeg** e diz o comando para instalar o que faltar.
Depois copia as skills para `~/.claude/skills`, baixa as maiores direto do GitHub (OneTake e Stickman),
instala o Hypit, o Claude Animation Base, o earshot e a voz Kokoro, e cria o `~/.claude/CLAUDE.md` com as suas preferências.

## 4. Conecte as contas (uma vez, no claude.ai)
Em **Configurações → Conectores**, conecte **Wix** e **GitHub**. Eles ficam ligados à sua conta, então funcionam no app e no Claude Code.

## 5. Gemini (opcional)
Crie a chave em https://aistudio.google.com/apikey e salve como variável de ambiente `GEMINI_API_KEY`
(o instalador mostra o comando no final). Nunca cole a chave no chat.

## O que tem aqui
| pasta | conteúdo |
|---|---|
| `skills/` | 33 skills (HyperFrames, Remotion, Hypit, Lemo-Opuscar, Collage B-roll, earshot, motion-design, real-sound etc.) |
| `CLAUDE.md` | suas preferências: identidades visuais, regras do site, rotina do Fachadômetro |
| `projetos/fachada-remotion` | projeto Remotion do Fachadômetro e do vídeo de doação (rode `npm install` dentro dele) |
| `projetos/casaja-teaser`, `projetos/casaja-site-no-ar` | os dois motions da Casa do JA (estilo aprovado), com o script da trilha |
| `projetos/audio` | scripts de narração (Kokoro) e mixagem |

## O que não dá para levar
- **O histórico deste chat** fica no claude.ai e continua acessível por lá. Na máquina, quem carrega o contexto é o `CLAUDE.md`.
- **Arquivos pesados** (vídeos, fotos, músicas) não estão no kit. Os vídeos finais já estão no repositório. As trilhas Open Bars são gratuitas (CC0) e podem ser baixadas de novo.
- Na sua máquina, com placa de vídeo, as renderizações costumam ficar bem mais rápidas que aqui.
