import json, wave, io, numpy as np, soundfile as sf, subprocess
from piper import PiperVoice
from piper.config import SynthesisConfig
from roteiro import C
import sys
VOICE = sys.argv[1] if len(sys.argv) > 1 else 'jeff-medium'
V = PiperVoice.load(f'/home/claude/tts/vits-piper-pt_BR-{VOICE}/pt_BR-{VOICE}.onnx')
LSF = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0; NS = float(sys.argv[3]) if len(sys.argv) > 3 else 0.6; TAG = sys.argv[4] if len(sys.argv) > 4 else VOICE
SR = V.config.sample_rate; LEAD, TAIL = 1.6, 4.0
out = [np.zeros(int(LEAD * SR))]; t = LEAD; ph = {}
for cid, txt, ls, gap in C:
    chunks = [np.frombuffer(ch.audio_int16_bytes, np.int16) for ch in V.synthesize(txt, syn_config=SynthesisConfig(length_scale=ls * LSF, noise_scale=NS, noise_w_scale=0.7))]
    a = np.concatenate(chunks).astype(np.float32) / 32768
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.06 * SR)]
    ph[cid] = {'start': round(t, 3), 'end': round(t + len(a) / SR, 3), 'text': txt}
    out += [a, np.zeros(int(gap * SR))]; t += len(a) / SR + gap
out.append(np.zeros(int(TAIL * SR))); x = np.concatenate(out)
sf.write(f'work/voz_bruta_{TAG}.wav', x, SR); json.dump(ph, open(f'work/phrases_{TAG}.json', 'w'), ensure_ascii=False, indent=1)
fx = 'highpass=f=75,equalizer=f=160:t=q:w=1.0:g=2.5,equalizer=f=320:t=q:w=1.2:g=-1.5,equalizer=f=3200:t=q:w=1.0:g=2,equalizer=f=8500:t=h:w=2500:g=-1.5,acompressor=threshold=-20dB:ratio=2.5:attack=12:release=180:makeup=3,aecho=0.8:0.5:60|120:0.10|0.06,loudnorm=I=-16:TP=-2:LRA=9'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'work/voz_bruta_{TAG}.wav', '-af', fx, '-ar', '48000', '-ac', '2', f'work/narracao_{TAG}.wav'], check=True)
print('duração', round(len(x) / SR, 2), 's', 'sr', SR)
