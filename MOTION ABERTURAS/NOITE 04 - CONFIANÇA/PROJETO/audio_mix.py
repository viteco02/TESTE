# Trilha + SFX sob a narração (CONFIANÇA). Voz intacta, fundo >= 12 dB abaixo onde há fala.
import subprocess, numpy as np, soundfile as sf
from synth_lib import *
B = 60 / 76

def wind(d, g=1.0, f=500):
    t = T(d); m = 0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t + 1) * np.sin(2 * np.pi * 0.07 * t)
    return fade(bp(noise(d), f * 0.5, f * 2.2, 2) * m * g, 1.0, 1.0)
def rain(d, g=1.0):
    x = bp(noise(d), 900, 5000, 2) * 0.5 + hp(noise(d), 6000) * 0.25
    return fade(x * g, 1.5, 1.5)
def waves(d, g=1.0):
    t = T(d); m = 0.5 + 0.5 * np.sin(2 * np.pi * 0.18 * t) ** 2
    return fade((lp(noise(d), 700, 2) * 1.6 + bp(noise(d), 1500, 5000) * 0.3) * m * g, 1.5, 1.5)
def thunder(g=1.0):
    d = 4.0; t = T(d); x = lp(noise(d), 260, 3) * np.exp(-t / 1.2) * (1 + 0.6 * np.sin(2 * np.pi * 3 * t))
    x[:int(0.4 * SR)] *= np.linspace(0, 1, int(0.4 * SR)); return x * g * 3
def step(g=1.0, wet=True):
    d = 0.25; t = T(d); x = lp(noise(d), 380, 2) * np.exp(-t / 0.03) * 2.5
    if wet: x += bp(noise(d), 1500, 6000) * np.exp(-t / 0.05) * 0.5
    return fade(x * g)
def tick(g=1.0):
    d = 0.06; t = T(d); return fade(bp(noise(d), 2500, 7000) * np.exp(-t / 0.006) * g)
def heart(g=1.0):
    t = T(0.18); b = np.sin(2 * np.pi * 50 * t) * np.exp(-t / 0.05)
    y = np.zeros(int(0.5 * SR)); y[:len(b)] += b; y[int(0.17 * SR):int(0.17 * SR) + len(b)] += b * 0.7; return y * g
def bell(fq, g=1.0, d=3.0):
    t = T(d); x = sum(a * np.sin(2 * np.pi * fq * r * t) * np.exp(-t / (d * k)) for r, a, k in ((1, 1, .5), (2.01, .4, .3), (3.0, .2, .2), (4.2, .1, .12)))
    return fade(x * g, 0.002, 0.3)
def strings(m, ch, t0, d, g, bright=1600, atk=1.5, rel=1.5, oct_=12): chord_pad(m, ch, t0, d, g, bright, atk, rel, oct_)

MOTIF = [69, 72, 76, 74, 72, 71]   # lá-dó-mi-ré-dó-si: tema da confiança

def music():
    m = Bus()
    # 1 · mistério: drone e pad escuro
    m.add(sub(nf(33), 18.5, 0.3), 0.0); chord_pad(m, 'Am', 0.0, 10.8, 0.08, 500, 3.0, 1.5); chord_pad(m, 'F', 10.8, 7.6, 0.09, 600, 1.0, 1.5)
    for k, t in enumerate(np.arange(10.9, 18.2, B)): m.add(kick(0.12 + 0.01 * k), t)
    m.add(riser(2.0, 200, 3000, 0.25, tonal=False), 16.4)
    # 2 · o amanhã some: queda e vazio
    m.add(impact(0.5), 18.35); m.add(sub(nf(28), 4.0, 0.4), 18.35); chord_pad(m, 'Em', 18.4, 4.3, 0.06, 400, 0.6, 2.0)
    # 3 · Deus chama: luz
    chord_pad(m, 'C', 22.35, 5.8, 0.09, 1200, 2.0, 1.2); chord_pad(m, 'G', 27.95, 4.9, 0.1, 1400, 0.8, 1.2)
    for i, n in enumerate(MOTIF[:4]): m.add(bell(nf(n), 0.10), 23.2 + i * B * 1.5, pan=-0.2 + 0.13 * i)
    m.add(bell(nf(76), 0.16, 4.0), 30.9)
    # 4 · histórias: tema cresce (Am F C G)
    prog = [('Am', 32.7), ('F', 36.45), ('C', 40.4), ('G', 44.65), ('Am', 46.45), ('F', 50.3), ('C', 53.95), ('G', 57.5)]
    ends = [p[1] for p in prog[1:]] + [61.85]
    for i, ((ch, a), b) in enumerate(zip(prog, ends)):
        chord_pad(m, ch, a, b - a + 0.5, 0.1 + 0.006 * i, 900 + 80 * i, 0.8, 0.9); strings(m, ch, a, b - a + 0.5, 0.04 + 0.008 * i, 1500 + 100 * i)
        m.add(sub(nf(ROOT[ch]), b - a, 0.25 + 0.02 * i), a)
        if a >= 40.4:
            for k, t in enumerate(beats(a, b, B)): m.add(kick(0.22 + 0.03 * i), t)
        if a >= 50.3:
            for t in beats(a, b, B / 2): m.add(hat(0.04 + 0.006 * i), t)
    for i, n in enumerate(MOTIF): m.add(bell(nf(n), 0.08), 33.0 + i * B, pan=0.2)
    for t in (32.7, 40.4, 50.3): m.add(impact(0.55, True), t - 0.03)
    m.add(riser(1.6, 200, 6000, 0.5), 44.85); m.add(impact(1.0, True), 46.42); m.add(sub(nf(33), 3.0, 0.8), 46.42)
    m.add(riser(1.4, 250, 6000, 0.45), 57.9); m.add(impact(0.9, True), 59.27)
    # 5 · soltar o controle: calma
    chord_pad(m, 'F', 61.85, 5.0, 0.09, 900, 1.0, 1.5); chord_pad(m, 'C', 66.85, 5.6, 0.09, 1000, 0.8, 1.2)
    for i, n in enumerate(MOTIF): m.add(bell(nf(n), 0.09), 62.3 + i * B * 1.3, pan=-0.2)
    m.add(bell(nf(81), 0.12, 4.0), 65.0)
    # 6 · pergunta: tudo cai, só a voz
    m.add(sub(nf(33), 7.0, 0.22), 72.6); chord_pad(m, 'Am', 72.7, 6.6, 0.05, 450, 1.5, 1.2)
    for t in (74.4, 77.5): m.add(heart(0.45), t)
    m.add(bell(nf(69), 0.08, 5.0), 79.0)
    # 7 · resposta: cresce até CONFIANDO
    for i, (ch, a, b) in enumerate((('F', 79.35, 81.0), ('G', 81.0, 82.75), ('Am', 82.75, 84.25))):
        chord_pad(m, ch, a, b - a + 0.3, 0.13 + 0.03 * i, 1600 + 400 * i, 0.3, 0.6); strings(m, ch, a, b - a + 0.3, 0.08 + 0.02 * i, 2400)
        m.add(sub(nf(ROOT[ch]), b - a, 0.35), a)
        for t in beats(a, b, B / 2): m.add(kick(0.3 + 0.08 * i), t)
    m.add(riser(1.5, 250, 9000, 0.75), 82.75); m.add(reverse_swell(0.5, 0.5), 83.75)
    a = 84.22; m.add(impact(1.4, True), a); m.add(sub(nf(29), 4.0, 0.9), a)
    chord_pad(m, 'F', a, 4.5, 0.3, 3000, 0.05, 1.8); chord_pad(m, 'F', a, 4.5, 0.18, 2600, 0.05, 1.8, oct_=12); strings(m, 'F', a, 4.5, 0.15, 3000, 0.2)
    for i, n in enumerate(MOTIF): m.add(bell(nf(n + 12), 0.08), a + 0.5 + i * B * 0.75, pan=0.3 - 0.1 * i)
    # 8 · identidade: resolve em Dó
    chord_pad(m, 'C', 88.6, 4.8, 0.2, 2400, 0.6, 2.5); strings(m, 'C', 88.6, 4.8, 0.1, 2400, 0.6, 2.5); m.add(sub(nf(36), 4.6, 0.5), 88.6)
    m.add(riser(1.4, 250, 8000, 0.6), 90.15); m.add(impact(1.3, True), 91.52); m.add(bell(nf(72), 0.15, 3.0), 91.55)
    return m

def sfx():
    m = Bus()
    for t in np.arange(0.3, 7.3, 1.0): m.add(tick(0.35), t, pan=-0.3)          # relógio
    m.add(rain(8.0, 0.35), 10.8); m.add(wind(8.0, 0.3, 450), 10.8)            # cidade na chuva / encruzilhada
    for t in np.arange(11.1, 14.5, 0.55): m.add(step(0.25), t, pan=0.4)
    m.add(wind(5.0, 0.55, 300), 18.0); m.add(whoosh(1.4, 3000, 200, 0.5), 18.0)  # neblina engole
    m.add(wind(10.5, 0.2, 350), 22.35)
    for t in (28.45, 29.35, 30.25, 31.15, 32.05): m.add(step(0.5), t)          # passos na luz
    m.add(wind(8.0, 0.45, 700), 32.7)                                          # deserto
    m.add(waves(6.0, 0.6), 40.4); m.add(wind(6.0, 0.5, 600), 40.4); m.add(thunder(0.5), 41.0)
    m.add(whoosh(1.2, 200, 6000, 0.8), 45.3); m.add(waves(4.5, 1.0), 46.4)    # mar se abre
    m.add(rain(11.6, 0.55), 50.3); m.add(waves(11.6, 0.6), 50.3); m.add(thunder(0.9), 50.35); m.add(thunder(0.6), 55.0)
    m.add(whoosh(0.5, 400, 3000, 0.4), 55.6)                                   # pé na água
    m.add(wind(10.5, 0.2, 400), 62.0)
    for t in np.arange(69.6, 72.6, 0.6): m.add(step(0.3, False), t)
    m.add(wind(7.0, 0.3, 300), 72.6)
    for t in (10.75, 14.5, 22.3, 27.9, 32.65, 36.4, 40.35, 50.25, 57.45, 61.8, 66.8, 69.25, 79.3, 82.7): m.add(whoosh(0.6, 300, 4000, 0.3), t - 0.3)
    for t in np.arange(82.9, 88.0, 0.6): m.add(step(0.3 * (1 - (t - 82.9) / 6), False), t)
    m.add(whoosh(1.0, 300, 6000, 0.5), 85.5); m.add(whoosh(0.8, 400, 7000, 0.55), 91.0)
    return m

def master(b, peak):
    x = np.tanh(b.b * 1.1) / np.tanh(1.1); return x / np.abs(x).max() * peak

v, _ = sf.read('public/audio/narracao.wav'); vv = np.zeros((N, 2)); vv[:min(len(v), N)] = v[:N] if v.ndim == 2 else np.stack([v[:N]] * 2, 1)
mono = np.abs(vv).mean(1)
e = np.convolve(mono, np.ones(int(.03 * SR)) / int(.03 * SR), 'same'); a_, r_ = np.exp(-1 / (.02 * SR)), np.exp(-1 / (.35 * SR)); env = np.zeros_like(e); c = 0.0
for i, x in enumerate(e):
    c = a_ * c + (1 - a_) * x if x > c else r_ * c + (1 - r_) * x; env[i] = c
env = np.clip(env / (np.percentile(env, 97) + 1e-6), 0, 1)
tr = master(music(), 0.8).T * 0.42; fx = master(sfx(), 0.8).T * 0.34
tail = int(1.0 * SR); fd = np.ones(N); fd[-tail - int(0.2 * SR):-int(0.2 * SR)] = np.linspace(1, 0, tail); fd[-int(0.2 * SR):] = 0
bed = (tr * (1 - .5 * env)[:, None] + fx * (1 - .3 * env)[:, None]) * fd[:, None]
hop = int(.01 * SR); nf_ = N // hop
def frms(x): y = (x[:nf_ * hop] ** 2).mean(1).reshape(nf_, hop).mean(1); return np.sqrt(np.convolve(y, np.ones(8) / 8, 'same'))
vr, br = frms(vv), frms(bed)
speak = np.convolve((vr > 10 ** (-42 / 20)).astype(float), np.ones(25), 'same') > 0
g = np.where(speak, np.minimum(1, 10 ** (-12 / 20) * np.maximum(vr, 10 ** (-30 / 20)) / (br + 1e-9)), 1.0)
gs = np.ones_like(g); c = 1.0
for i, x in enumerate(g):
    c = x if x < c else c + (x - c) * 0.06; gs[i] = c
gs = np.convolve(gs, np.ones(5) / 5, 'same'); G = np.interp(np.arange(N), np.arange(nf_) * hop + hop / 2, gs)
mix = bed * G[:, None] + vv
k = 10 ** (-1.5 / 20) / np.abs(mix).max()
sf.write('public/audio/mix_final.wav', mix * k, SR, subtype='PCM_16')
sf.write('work/so_fundo.wav', bed * G[:, None] * k, SR, subtype='PCM_16')
print('dur', round(N / SR, 3))
r = subprocess.run(['ffmpeg', '-i', 'public/audio/mix_final.wav', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
print([l for l in r.splitlines() if 'I:' in l][-1])
