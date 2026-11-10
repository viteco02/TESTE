#!/usr/bin/env python3
"""Transcreve um áudio em pt-BR com Whisper (medium, offline via sherpa-onnx).
Uso: python3 transcrever.py arquivo.mp3  →  gera arquivo.txt, arquivo.srt e arquivo.json ao lado."""
import sys, re, json, subprocess, tempfile, os, sherpa_onnx, soundfile as sf
import os.path as _p
D = _p.expanduser('~/video-tools/asr/sherpa-onnx-whisper-medium') if _p.exists(_p.expanduser('~/video-tools/asr/sherpa-onnx-whisper-medium')) else '/home/claude/asr/sherpa-onnx-whisper-medium'
src = sys.argv[1]; base = os.path.splitext(src)[0]
wav = tempfile.mktemp(suffix='.wav'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '16000', wav], check=True)
r = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{D}/medium-encoder.int8.onnx', decoder=f'{D}/medium-decoder.int8.onnx', tokens=f'{D}/medium-tokens.txt', language='pt', task='transcribe', num_threads=2)
x, sr = sf.read(wav); T = len(x) / sr
o = subprocess.run(['ffmpeg', '-i', wav, '-af', 'silencedetect=noise=-38dB:d=0.35', '-f', 'null', '-'], capture_output=True, text=True).stderr
ss = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', o)]; se = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', o)]
segs, t = [], 0.0
for a, b in zip(ss, se):
    if a - t > 0.15: segs.append((t, a))
    t = b
if T - t > 0.15: segs.append((t, T))
# trechos longos (>25 s) são cortados para caber no Whisper
out = []
for a, b in segs:
    while b - a > 25: segs_ = (a, a + 25); a += 25; out.append(segs_)
    out.append((a, b))
res = []
for a, b in out:
    s = r.create_stream(); s.accept_waveform(sr, x[int(max(0, a - 0.1) * sr):int(min(T, b + 0.1) * sr)]); r.decode_stream(s)
    res.append({'start': round(a, 2), 'end': round(b, 2), 'text': s.result.text.strip()}); print(f"{a:7.2f}-{b:7.2f}  {res[-1]['text']}", flush=True)
ts = lambda v: f"{int(v//3600):02d}:{int(v%3600//60):02d}:{int(v%60):02d},{min(999,int(round((v%1)*1000))):03d}"
open(base + '.srt', 'w').write('\n'.join(f"{i}\n{ts(s['start'])} --> {ts(s['end'])}\n{s['text']}\n" for i, s in enumerate(res, 1)))
open(base + '.txt', 'w').write('\n'.join(s['text'] for s in res) + '\n'); json.dump(res, open(base + '.json', 'w'), ensure_ascii=False, indent=1)
os.remove(wav); print(f'duração {T:.2f}s · {len(res)} trechos')
