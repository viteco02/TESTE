import json, subprocess, sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
sys.path.insert(0, '.')
import synth_lib as S
SR = 48000
plan = json.load(open('src/plan.json')); D = plan['dur']; HK = plan['hook']; TOT = D + plan['endcard']; N = int(TOT * SR)
rng = np.random.default_rng(3)
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
# ── GANCHO P&B: chiado de filme/rádio, sintonia
hn = int(HK * SR); hiss = rng.standard_normal((hn, 2)) * 0.012
cr = np.zeros((hn, 2)); idx = rng.integers(0, hn, int(HK * 22)); cr[idx] = rng.uniform(-0.5, 0.5, (len(idx), 2)); cr = sosfilt(butter(2, [1500 / (SR / 2), 9000 / (SR / 2)], 'band', output='sos'), cr, axis=0)
bus[:hn] += (hiss + cr * 0.8) * np.linspace(0.6, 1, hn)[:, None]
put(sfx('pro_glitch/sparse'), 0.0, 0.5); put(sfx('shutter/film'), 0.02, 0.5)
put(sfx('pro_sub_drop/soft'), 0.85, 0.45, True); put(sfx('swish/soft', 2), 2.35, 0.35); put(sfx('cut_hit/punch', 7), 3.95, 0.6, True)
put(sfx('riser/snatch'), HK - 1.1, 0.5)
put(sfx('cut_hit/punch'), HK, 0.95, True); put(sfx('whoosh_big/thump'), HK, 0.6, True); put(sfx('shutter/snap'), HK, 0.4)
# ── cortes de câmera: whoosh curto e variado
for i, s in enumerate(plan['shots'][3:]):
    put(sfx(['whoosh_fast/tight', 'swish/flick', 'whoosh_fast/sleeve', 'swipe/glide'][i % 4], i + 1), s['t'] - 0.12, 0.26)
# ── flashes brancos: impacto + shutter
for i, t in enumerate(plan['flashes'][1:]):
    put(sfx('shutter/snap', i + 2), t, 0.35); put(sfx('cut_hit/air', i + 3), t, 0.45, True)
# ── palavras grandes
for i, b in enumerate(plan['big']):
    put(sfx('swish/zing', i + 1), b['t0'] - 0.12, 0.3); put(sfx(['cut_hit/sub', 'pro_impact/short'][i % 2], i + 2), b['t0'] + 0.02, 0.6, True)
# ── caixas: abre + digitação
for i, bx in enumerate(plan['boxes']):
    put(sfx('whoosh_fast/sleeve', i + 1), bx['t0'] - 0.1, 0.4); put(sfx('pro_typing_run/soft', i + 1), bx['t0'] + 0.4, 0.28); put(sfx('whoosh_fast/tight', i + 5), bx['t1'] - 0.4, 0.3)
# ── cartões de capítulo
for i, c in enumerate(plan['cards']):
    put(sfx('whoosh_big/thump', i + 1), c['t'], 0.5, True); put(sfx('whoosh_fast/whip', i + 2), c['t'] + 1.55, 0.3)
# ── sublinhados
under = set(plan['under'])
for w in plan['words']:
    if w['w'] in under and w['t'] > HK: put(sfx('swish/soft', int(w['t'] * 10)), w['t'] + 0.2, 0.18)
# ── final
put(sfx('downlifter/air_fall'), D - 1.2, 0.3); put(sfx('pro_logo_sting/swell_sting'), D + 0.2, 0.6)
# ── trilha: drone abafado no gancho, cama + pulso depois, sobe no fim
mus = np.zeros((N, 2)); S.N = N
def padc(ch, t0, d, g, br=900, atk=1.5, rel=1.5, oct_=0):
    b = S.Bus(); S.chord_pad(b, ch, 0, d, g, br, atk, rel, oct_); x = b.b.T[: int((d + rel + 0.5) * SR)]
    a = int(t0 * SR); e = min(N, a + len(x)); mus[a:e] += x[: e - a]
padc('Am', 0, HK, 0.14, 380, 0.8, 0.3)
prog = ['Am', 'F', 'C', 'G']; t = HK; i = 0
while t < D:
    padc(prog[i % 4], t, 4.0, 0.15, 800 if t < 51 else 1300); t += 4.0; i += 1
for tt in np.arange(HK, D - 0.3, 60 / 88):
    b = S.Bus(); b.add(S.kick(0.16 + 0.22 * (tt - HK) / (D - HK)), 0); x = b.b.T[: int(0.5 * SR)]; a = int(tt * SR); mus[a:a + len(x)] += x[: N - a]
padc('C', D, 3.4, 0.28, 2400, 0.05, 2.0); padc('C', D, 3.4, 0.14, 2200, 0.05, 2.0, 12)
mus = np.tanh(mus * 1.2)
# ── voz: tratada; no gancho vira "rádio"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '../work/corte_raw.mov', '-vn', '-af', 'loudnorm=I=-16:TP=-2:LRA=7', '-ar', '48000', '-ac', '2', 'work/voz.wav'], check=True)
v_, _ = sf.read('work/voz.wav'); vv = np.zeros((N, 2)); vv[: min(N, len(v_))] = v_[:N]
r = sosfilt(butter(4, [450 / (SR / 2), 3000 / (SR / 2)], 'band', output='sos'), vv[:hn], axis=0)
r = np.tanh(r * 3.2) / np.tanh(3.2) * 1.15
xf = int(0.03 * SR); w = np.ones(hn); w[-xf:] = np.linspace(1, 0, xf)
vv[:hn] = r * w[:, None] + vv[:hn] * (1 - w[:, None])
env = np.convolve(np.abs(vv).mean(1), np.ones(1440) / 1440, 'same'); env = np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
mix = vv + mus * 0.22 * (1 - 0.7 * env)[:, None] + bus * 0.5 * (1 - 0.35 * env)[:, None]
tail = int(0.6 * SR); mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
sf.write('work/pre.wav', mix, SR)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'work/pre.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', '48000', 'public/audio/mix.wav'], check=True)
x, _ = sf.read('public/audio/mix.wav'); print('dur', round(len(x) / SR, 2), 'pico', round(20 * np.log10(np.abs(x).max()), 1))
