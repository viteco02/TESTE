import json, subprocess, sys, numpy as np, soundfile as sf
sys.path.insert(0, '.')
import synth_lib as S
SR = 48000
plan = json.load(open('src/plan.json')); D = plan['dur']; TOT = D + plan['endcard']; N = int(TOT * SR)
def sfx(id_, seed=1):
    out = f"work/sfx/{id_.replace('/', '_')}_{seed}.wav"
    subprocess.run(['earshot', 'sfx', 'render', id_, '-o', out, '--seed', str(seed)], check=True, capture_output=True)
    x, sr = sf.read(out); x = x if x.ndim == 2 else np.stack([x, x], 1)
    if sr != SR: import soxr; x = soxr.resample(x, sr, SR)
    return x
bus = np.zeros((N, 2))
def put(x, t, g=1.0, align_peak=False):
    if align_peak: t -= np.argmax(np.abs(x).sum(1)) / SR
    a = int(max(0, t) * SR); b = min(N, a + len(x)); bus[a:b] += x[:b - a] * g
# gancho
put(sfx('riser/air'), 0.0, 0.35); put(sfx('cut_hit/air'), 2.77, 0.55, True)
# palavras de fundo: impacto curto na entrada
for i, b in enumerate(plan['bgwords']): put(sfx('pro_sub_drop/soft', i + 1), b['t0'] + 0.05, 0.4, True); put(sfx('swish/soft', i + 3), b['t0'] - 0.15, 0.3)
# matérias: entra com whoosh + pop de papel
for i, c in enumerate(plan['cards']): put(sfx('whoosh_fast/crisp', i + 1), c['t0'] - 0.2, 0.45); put(sfx('pro_pop_in/round', i + 2), c['t0'] + 0.2, 0.4, True)
put(sfx('downlifter/tape'), 13.2, 0.3); put(sfx('reverse_swell/breath'), 31.6, 0.3)
put(sfx('pro_logo_sting/swell_sting'), D + 0.2, 0.6)
# trilha: cama suave, tensa no meio, abre no fim
mus = np.zeros((N, 2)); S.N = N
def padc(ch, t0, d, g, br=900, atk=1.5, rel=1.5, oct_=0):
    b = S.Bus(); S.chord_pad(b, ch, 0, d, g, br, atk, rel, oct_); x = b.b.T[: int((d + rel + 0.5) * SR)]
    a = int(t0 * SR); e = min(N, a + len(x)); mus[a:e] += x[: e - a]
prog = ['Am', 'F', 'C', 'G']; t = 0.0; i = 0
while t < D:
    g = 0.12 if 13.4 <= t < 32 else 0.15
    padc(prog[i % 4], t, 4.0, g, 700 if t < 42.8 else 1100); t += 4.0; i += 1
for tt in np.arange(42.83, D - 0.3, 60 / 84):
    b = S.Bus(); b.add(S.kick(0.18 + 0.2 * (tt - 42.83) / (D - 42.83)), 0); x = b.b.T[: int(0.5 * SR)]; a = int(tt * SR); mus[a:a + len(x)] += x[: N - a]
padc('C', D, 3.4, 0.28, 2400, 0.05, 2.0); padc('C', D, 3.4, 0.14, 2200, 0.05, 2.0, 12)
mus = np.tanh(mus * 1.2)
# voz tratada
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '../work/corte_raw.mov', '-vn', '-af', 'highpass=f=80,afftdn=nf=-28,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=4,loudnorm=I=-16:TP=-2:LRA=7', '-ar', '48000', '-ac', '2', 'work/voz.wav'], check=True)
v, _ = sf.read('work/voz.wav'); vv = np.zeros((N, 2)); vv[: min(N, len(v))] = v[:N]
env = np.convolve(np.abs(vv).mean(1), np.ones(1440) / 1440, 'same'); env = np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
mix = vv + mus * 0.22 * (1 - 0.7 * env)[:, None] + bus * 0.45 * (1 - 0.4 * env)[:, None]
tail = int(0.6 * SR); mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
sf.write('work/pre.wav', mix, SR)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'work/pre.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', '48000', 'public/audio/mix.wav'], check=True)
x, _ = sf.read('public/audio/mix.wav'); print('dur', round(len(x) / SR, 2), 'pico', round(20 * np.log10(np.abs(x).max()), 1))
