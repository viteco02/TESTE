#!/usr/bin/env bash
# Instala as skills e ferramentas de vídeo/mídia na sua máquina (macOS ou Linux).
# Uso: abra o Terminal nesta pasta e rode:  bash instalar-mac-linux.sh
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"
SK="$HOME/.claude/skills"
TOOLS="$HOME/claude-tools"
TMP="$(mktemp -d)"
ok(){ printf "  \033[32m✓\033[0m %s\n" "$1"; }
falta(){ printf "  \033[31m✗\033[0m %s\n" "$1"; FALTOU=1; }
FALTOU=0

echo "1/7 · Conferindo programas necessários"
for p in git node npm python3 ffmpeg; do command -v $p >/dev/null && ok "$p" || falta "$p não encontrado"; done
if [ "$FALTOU" = 1 ]; then
  echo
  echo "Instale o que faltou e rode de novo:"
  echo "  macOS:  brew install git node python ffmpeg      (Homebrew: https://brew.sh)"
  echo "  Linux:  sudo apt install git nodejs npm python3 python3-pip ffmpeg"
  exit 1
fi

echo "2/7 · Copiando as skills para $SK"
mkdir -p "$SK"
cp -R "$AQUI/skills/." "$SK/"
ok "$(ls "$AQUI/skills" | wc -l | tr -d ' ') skills copiadas"

echo "3/7 · OneTake (motion 'uma tomada só')"
rm -rf "$SK/onetake" && git clone -q --depth 1 https://github.com/feitangyuan/onetake.git "$SK/onetake" && ok "onetake"

echo "4/7 · Stickman Video Director"
git clone -q --depth 1 https://github.com/kaomei/stickman-video-director.git "$TMP/stick" \
  && rm -rf "$SK/directing-stickman-videos" && cp -R "$TMP/stick/skills/directing-stickman-videos" "$SK/" \
  && (cd "$SK/directing-stickman-videos" && npm ci --no-audit --no-fund >/dev/null) && ok "directing-stickman-videos"

echo "5/7 · Hypit (programa) e Claude Animation Base"
npm install --global @hypit/hypit >/dev/null 2>&1 && ok "hypit $(hypit version 2>/dev/null | head -1)" || falta "hypit (tente: sudo npm install -g @hypit/hypit)"
mkdir -p "$TOOLS"; rm -rf "$TOOLS/ClaudeAnimationBase"
git clone -q --depth 1 https://github.com/JohnHeibel/ClaudeAnimationBase.git "$TOOLS/ClaudeAnimationBase" \
  && (cd "$TOOLS/ClaudeAnimationBase" && npm install --no-audit --no-fund >/dev/null) && ok "ClaudeAnimationBase em $TOOLS"

echo "6/7 · Pacotes Python (earshot, voz Kokoro, renderizador)"
PIP="python3 -m pip install --user --quiet"
$PIP "git+https://github.com/Leonxlnx/earshot" && ok "earshot" || falta "earshot"
$PIP kokoro-onnx soundfile scipy numpy playwright && ok "kokoro-onnx, soundfile, scipy, numpy, playwright"
python3 -m playwright install chromium >/dev/null 2>&1 && ok "navegador do playwright"
mkdir -p "$TOOLS/kokoro"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -f "$TOOLS/kokoro/$f" ] || curl -sL -o "$TOOLS/kokoro/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done; ok "modelos de voz Kokoro em $TOOLS/kokoro"

echo "7/7 · Preferências (CLAUDE.md)"
if [ -f "$HOME/.claude/CLAUDE.md" ]; then
  cp "$AQUI/CLAUDE.md" "$HOME/.claude/CLAUDE.casadoja.md"
  ok "você já tinha um CLAUDE.md; as preferências foram salvas em ~/.claude/CLAUDE.casadoja.md (junte manualmente)"
else
  cp "$AQUI/CLAUDE.md" "$HOME/.claude/CLAUDE.md"; ok "~/.claude/CLAUDE.md criado"
fi
rm -rf "$TMP"
echo
echo "Pronto. Abra o Claude Code (ou o app Claude no modo Code) e as skills já aparecem."
echo "Para os recursos do Gemini: crie a chave em https://aistudio.google.com/apikey e adicione"
echo "  export GEMINI_API_KEY=\"sua-chave\"   ao final do arquivo ~/.zshrc (Mac) ou ~/.bashrc (Linux)."
