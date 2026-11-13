#!/usr/bin/env bash
# Prepara uma sessão nova de nuvem para edição de vídeo (motion e não-motion).
# Uso:  bash tools/setup-video.sh        (≈ 5–10 min na primeira vez; seguro rodar de novo)
set -u
say() { printf '\n▶ %s\n' "$*"; }
T=$HOME/video-tools; mkdir -p "$T" "$HOME/.claude/skills"
REPO=$(cd "$(dirname "$0")/.." && pwd)

say "Skills do repositório → ~/.claude/skills"
cp -r "$REPO/.claude/skills/"* "$HOME/.claude/skills/" 2>/dev/null || true

say "OneTake (feitangyuan/onetake, 114 MB — fica fora do git)"
[ -f "$HOME/.claude/skills/onetake/SKILL.md" ] || { git clone -q --depth 1 https://github.com/feitangyuan/onetake "$T/onetake" && cp -r "$T/onetake" "$HOME/.claude/skills/onetake" && rm -rf "$HOME/.claude/skills/onetake/.git"; }

say "FFmpeg 7+ estático (Lemo-Opuscar exige ≥ 7)"
if [ ! -x "$T/ffmpeg7/bin/ffmpeg" ]; then
  mkdir -p "$T/ffmpeg7" && curl -sSL -o "$T/ffmpeg7/ff.tar.xz" https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz \
  && tar xJf "$T/ffmpeg7/ff.tar.xz" -C "$T/ffmpeg7" && rm "$T/ffmpeg7/ff.tar.xz" && ln -sfn "$(ls -d "$T"/ffmpeg7/ffmpeg-*/ | head -1)bin" "$T/ffmpeg7/bin"
fi

say "Remotion 4.0.540 (projeto base em ~/motion-kit)"
if [ ! -d "$HOME/motion-kit/node_modules/remotion" ]; then
  mkdir -p "$HOME/motion-kit" && cp "$REPO/tools/motion-kit.package.json" "$HOME/motion-kit/package.json" && (cd "$HOME/motion-kit" && npm install --no-audit --no-fund >/dev/null)
fi

say "HyperFrames CLI"
command -v hyperframes >/dev/null || npm i -g hyperframes@0.9.27 --no-audit --no-fund >/dev/null

say "Claude Animation Base (JohnHeibel) em ~/video-tools/ClaudeAnimationBase"
[ -d "$T/ClaudeAnimationBase/node_modules" ] || { git clone -q --depth 1 https://github.com/JohnHeibel/ClaudeAnimationBase "$T/ClaudeAnimationBase" && (cd "$T/ClaudeAnimationBase" && npm install --no-audit --no-fund >/dev/null); }

say "p5.js 2 + p5.brush 3 (pincéis, aquarela e hachuras desenhados à mão) em ~/video-tools/p5brush"
[ -d "$T/p5brush/node_modules/p5.brush" ] || { mkdir -p "$T/p5brush" && (cd "$T/p5brush" && npm init -y >/dev/null && npm install --no-audit --no-fund p5@2.3.4 p5.brush@3.0.0 >/dev/null); }
cp "$REPO/tools/p5brush-exemplo.html" "$T/p5brush/exemplo.html" 2>/dev/null || true

say "Lemo-Opuscar: biblioteca de estilos + dependências"
PATH="$T/ffmpeg7/bin:$PATH" sh "$HOME/.claude/skills/lemo-opuscar/scripts/setup.sh" >/dev/null 2>&1
PATH="$T/ffmpeg7/bin:$PATH" sh "$HOME/.claude/skills/lemo-opuscar/scripts/setup.sh" deps 2>&1 | tail -1

say "Whisper pt-BR offline (sherpa-onnx + modelo medium, ~1 GB, do GitHub)"
pip install -q --break-system-packages --root-user-action=ignore sherpa-onnx soundfile 2>/dev/null
if [ ! -f "$T/asr/sherpa-onnx-whisper-medium/medium-tokens.txt" ]; then
  mkdir -p "$T/asr" && curl -sSL -o "$T/asr/w.tar.bz2" https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-medium.tar.bz2 \
  && tar xjf "$T/asr/w.tar.bz2" -C "$T/asr" && rm "$T/asr/w.tar.bz2" && rm -f "$T"/asr/sherpa-onnx-whisper-medium/medium-{encoder,decoder}.onnx
fi
cp "$REPO/tools/transcrever.py" "$T/transcrever.py"

say "Earshot (banco de 252 efeitos + medições; a 'escuta' por IA precisa do HuggingFace)"
command -v earshot >/dev/null || { pip install -q --break-system-packages --root-user-action=ignore soxr librosa pyloudnorm scikit-learn matplotlib \
  && git clone -q --depth 1 https://github.com/Leonxlnx/earshot "$T/earshot" && pip install -q --break-system-packages --root-user-action=ignore --no-deps "$T/earshot"; }

say "Pronto. Use FFmpeg 7 com: export PATH=$T/ffmpeg7/bin:\$PATH  ·  transcrever: python3 $T/transcrever.py audio.mp3"
