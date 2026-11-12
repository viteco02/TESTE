# Trilha + sound design sob a narração (INTERCESSÃO). Voz intacta; fundo >= 12 dB abaixo onde há fala.
import subprocess, numpy as np, soundfile as sf
from synth_lib import *
TAIL = 3.0; NT = int((DUR + TAIL) * SR)
def sfx(id_, seed=1):
    out = f"work/sfx_{id_.replace('/', '_')}_{seed}.wav"
    subprocess.run(['earshot', 'sfx', 'render', id_, '-o', out, '--seed', str(seed)], check=True, capture_output=True)
    x, sr = sf.read(out); x = x if x.ndim == 2 else np.stack([x, x], 1)
    if sr != SR: import soxr; x = soxr.resample(x, sr, SR)
    return x.T
class B2:
    def __init__(s): s.b = np.zeros((2, NT))
    def add(s, x, t, g=1.0, peak=False):
        if x.ndim == 1: x = np.stack([x, x])
        if peak: t -= np.argmax(np.abs(x).sum(0)) / SR
        a = int(max(0, t) * SR); b = min(NT, a + x.shape[1]); s.b[:, a:b] += x[:, :b - a] * g
import synth_lib; synth_lib.N = NT
B = 60 / 72
def pad(m, ch, t0, d, g, br=900, atk=1.5, rel=1.5, o=0):
    tmp = Bus(); chord_pad(tmp, ch, 0, d, g, br, atk, rel, o); m.add(tmp.b[:, : int((d + rel + 0.6) * SR)], t0)
def music():
    m = B2()
    # silêncio / dor: drone grave, quase nada
    m.add(sub(nf(33), 17.8, 0.22), 0.0); pad(m, 'Am', 0.0, 17.6, 0.06, 420, 4.0, 1.5)
    for t in (3.92, 9.35): m.add(sub(nf(28), 2.0, 0.35), t)
    # atravessar: pulso que acelera
    for k, t in enumerate(np.arange(18.1, 26.3, B / 2)): m.add(kick(0.08 + 0.012 * k), t)
    pad(m, 'F', 18.1, 8.3, 0.08, 700, 1.0, 0.4)
    # ORAÇÃO: impacto sutil + abre
    m.add(impact(0.7, True), 26.5); m.add(sub(nf(33), 3.0, 0.5), 26.5); pad(m, 'C', 26.5, 17.0, 0.12, 1400, 0.3, 1.5); pad(m, 'C', 26.5, 17.0, 0.05, 1600, 0.3, 1.5, 12)
    # intercessão e exemplos: pads + pulso leve
    prog = [('Am', 43.7), ('F', 50.4), ('C', 55.6), ('G', 58.5), ('Am', 64.3), ('F', 68.8), ('C', 72.8), ('G', 74.9), ('Am', 77.0), ('F', 81.2)]
    ends = [p[1] for p in prog[1:]] + [84.6]
    for (ch, a), b in zip(prog, ends): pad(m, ch, a, b - a + 0.4, 0.11, 1000, 0.6, 0.8); m.add(sub(nf(ROOT[ch]), b - a, 0.2), a)
    for t in np.arange(43.7, 84.6, B): m.add(kick(0.14), t)
    # força termina: quase parado; VOCÊ PODE ORAR: crescimento
    pad(m, 'Am', 84.6, 9.3, 0.07, 500, 0.8, 0.6); m.add(riser(1.6, 200, 6000, 0.45), 92.5)
    m.add(impact(1.1, True), 95.1); pad(m, 'F', 95.1, 3.8, 0.22, 2600, 0.05, 1.0); pad(m, 'F', 95.1, 3.8, 0.1, 2200, 0.05, 1.0, 12); m.add(sub(nf(29), 3.6, 0.6), 95.1)
    for t in np.arange(95.1, 98.8, B / 2): m.add(kick(0.3), t)
    pad(m, 'C', 98.8, 4.5, 0.08, 700, 1.0, 1.2)
    # nomes / desafio: pulso que cresce
    prog2 = [('Am', 103.6), ('F', 107.7), ('C', 111.5), ('G', 117.8), ('Am', 121.0), ('F', 123.8), ('C', 128.4)]
    ends2 = [p[1] for p in prog2[1:]] + [131.6]
    for i, ((ch, a), b) in enumerate(zip(prog2, ends2)):
        pad(m, ch, a, b - a + 0.4, 0.11 + 0.01 * i, 1100 + 120 * i, 0.5, 0.8); m.add(sub(nf(ROOT[ch]), b - a, 0.25), a)
        for t in np.arange(a, b, B / 2): m.add(kick(0.14 + 0.03 * i), t)
        if a >= 117.8:
            for t in np.arange(a, b, B / 4): m.add(hat(0.03), t)
    m.add(impact(0.8, True), 129.5)
    # geração: cresce
    for i, (ch, a, b) in enumerate((('F', 131.6, 134.4), ('C', 134.4, 136.8), ('G', 136.8, 138.7), ('Am', 138.7, 141.9))):
        pad(m, ch, a, b - a + 0.4, 0.14 + 0.02 * i, 1500 + 200 * i, 0.4, 0.8); m.add(sub(nf(ROOT[ch]), b - a, 0.3), a)
        for t in np.arange(a, b, B / 2): m.add(kick(0.2 + 0.04 * i), t)
    # reflexão: só pad
    pad(m, 'F', 141.9, 13.5, 0.08, 600, 2.0, 1.5)
    # identidade
    m.add(riser(1.4, 250, 8000, 0.5), 154.2); m.add(impact(1.0, True), 155.6); pad(m, 'C', 155.6, 6.3, 0.18, 2200, 0.1, 1.0)
    for t in np.arange(155.6, 161.9, B / 2): m.add(kick(0.28), t)
    m.add(impact(0.9, True), 159.58)
    # tema: clímax
    m.add(riser(1.8, 200, 9000, 0.6), 162.3); m.add(reverse_swell(0.6, 0.5), 163.5)
    m.add(impact(1.5, True), 164.12); m.add(sub(nf(29), 4.5, 1.0), 164.12); pad(m, 'F', 164.12, 4.5, 0.3, 3000, 0.05, 2.0); pad(m, 'F', 164.12, 4.5, 0.15, 2600, 0.05, 2.0, 12)
    # pergunta e queda
    pad(m, 'Am', 168.6, 4.3, 0.1, 900, 0.8, 0.8)
    m.add(impact(1.0, True), 171.84); m.add(impact(0.9, True), 172.35); pad(m, 'C', 172.35, 3.6, 0.16, 2000, 0.05, 1.5)
    return m
def fx():
    m = B2()
    m.add(sfx('glitch/scramble'), 0.4, 0.25); m.add(sfx('pro_glitch/sparse'), 2.6, 0.2)
    m.add(sfx('downlifter/sub_sink'), 3.92, 0.35)
    m.add(sfx('swish/soft'), 5.4, 0.3); m.add(sfx('pro_glitch/data'), 6.5, 0.18)
    m.add(sfx('cut_hit/sub'), 9.35, 0.5, True); m.add(sfx('pro_shimmer/m1'), 9.7, 0.3)
    m.add(sfx('whoosh_big/gust'), 18.9, 0.4); m.add(sfx('impact/deep'), 19.95, 0.55, True); m.add(sfx('pro_shimmer/m3'), 20.1, 0.35)
    m.add(sfx('reverse_swell/short'), 26.5, 0.4, True); m.add(sfx('pro_sub_drop/low'), 26.52, 0.5, True)
    m.add(sfx('pro_shimmer/m0'), 34.9, 0.3); m.add(sfx('pro_logo_sting/zap_bloom'), 41.6, 0.35)
    for i, t in enumerate((43.7, 50.3, 53.4, 55.6, 58.5, 64.2, 77.0, 84.6, 87.6, 90.8, 98.9, 103.3, 111.4, 117.7, 119.5, 121.0, 122.35, 123.8, 125.75, 128.35, 131.55, 141.9)):
        m.add(sfx(['whoosh_fast/tight', 'swish/flick', 'whoosh_fast/sleeve', 'swipe/glide'][i % 4], i + 1), t - 0.15, 0.22)
    m.add(sfx('pro_shimmer/m2'), 56.9, 0.35)
    for i, t in enumerate((68.85, 70.77, 72.88)): m.add(sfx('cut_hit/kick', i + 3), t, 0.4, True)
    m.add(sfx('pro_logo_sting/swell_sting'), 74.92, 0.45, True); m.add(sfx('pro_zip/up'), 76.0, 0.25)
    m.add(sfx('cut_hit/punch'), 81.23, 0.45, True)
    m.add(sfx('knock/wood'), 85.8, 0.4); m.add(sfx('downlifter/air_fall'), 92.0, 0.3)
    m.add(sfx('pro_shimmer/m4'), 101.5, 0.3)
    for i in range(12): m.add(sfx('pro_pop/thup', i + 1), 103.8 + i * 0.28, 0.18)
    m.add(sfx('pro_notify/ding_2045'), 107.9, 0.3); m.add(sfx('cut_hit/sub'), 109.6, 0.45, True)
    m.add(sfx('cut_hit/punch'), 111.56, 0.45, True)
    for i in range(6): m.add(sfx('pro_pop/tink', i + 2), 117.85 + i * 0.1, 0.15)
    for t in (119.58, 121.05, 122.42): m.add(sfx('pro_pop_in/round', int(t)), t, 0.3, True)
    m.add(sfx('pro_typing_run/blip'), 122.6, 0.18)
    m.add(sfx('pro_shimmer/m1'), 124.4, 0.3); m.add(sfx('pro_shimmer/m3'), 126.6, 0.3)
    for t in (134.38, 136.78, 138.71): m.add(sfx('cut_hit/air', int(t)), t, 0.3, True)
    m.add(sfx('pro_glitch/framelock'), 159.55, 0.3); m.add(sfx('pro_shimmer/m2'), 164.2, 0.35)
    m.add(sfx('pro_logo_sting/sweep_hit'), 172.35, 0.5, True)
    return m
def master(b, peak): x = np.tanh(b.b * 1.1) / np.tanh(1.1); return x / (np.abs(x).max() + 1e-9) * peak
v, _ = sf.read('public/audio/narracao.wav'); vv = np.zeros((NT, 2)); vv[: min(len(v), NT)] = v[:NT]
mono = np.abs(vv).mean(1); e = np.convolve(mono, np.ones(int(.03 * SR)) / int(.03 * SR), 'same')
a_, r_ = np.exp(-1 / (.02 * SR)), np.exp(-1 / (.35 * SR)); env = np.zeros_like(e); c = 0.0
for i, x in enumerate(e): c = a_ * c + (1 - a_) * x if x > c else r_ * c + (1 - r_) * x; env[i] = c
env = np.clip(env / (np.percentile(env, 97) + 1e-6), 0, 1)
tr = master(music(), 0.8).T * 0.42; fxx = master(fx(), 0.8).T * 0.36
tail = int(2.6 * SR); fd = np.ones(NT); fd[-tail:] = np.linspace(1, 0, tail)
bed = (tr * (1 - .5 * env)[:, None] + fxx * (1 - .3 * env)[:, None]) * fd[:, None]
hop = int(.01 * SR); nf_ = NT // hop
def frms(x): y = (x[:nf_ * hop] ** 2).mean(1).reshape(nf_, hop).mean(1); return np.sqrt(np.convolve(y, np.ones(8) / 8, 'same'))
vr, br = frms(vv), frms(bed)
speak = np.convolve((vr > 10 ** (-42 / 20)).astype(float), np.ones(25), 'same') > 0
g = np.where(speak, np.minimum(1, 10 ** (-12 / 20) * np.maximum(vr, 10 ** (-30 / 20)) / (br + 1e-9)), 1.0)
gs = np.ones_like(g); c = 1.0
for i, x in enumerate(g): c = x if x < c else c + (x - c) * 0.06; gs[i] = c
gs = np.convolve(gs, np.ones(5) / 5, 'same'); G = np.interp(np.arange(NT), np.arange(nf_) * hop + hop / 2, gs)
mix = bed * G[:, None] + vv; k = 10 ** (-1.5 / 20) / np.abs(mix).max()
sf.write('public/audio/mix_cauda.wav', mix * k, SR, subtype='PCM_16')
sf.write('public/audio/mix_final.wav', (mix * k)[: int(DUR * SR)], SR, subtype='PCM_16')
r = subprocess.run(['ffmpeg', '-i', 'public/audio/mix_final.wav', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
print([l for l in r.splitlines() if 'I:' in l][-1])
