# Trilha + SFX sob a narração (PERSEVERANÇA). Voz sempre à frente (fundo ≥ 9 dB abaixo onde há fala).
import json, subprocess, numpy as np, soundfile as sf
from synth_lib import *
K = json.load(open('src/timing.json'))['k']; B = 60 / 92

def rain(d, g=1.0, bright=5000):
    x = bp(noise(d), 900, bright, 2) * 0.5 + hp(noise(d), 6000) * 0.25
    drops = np.zeros(len(x)); idx = rng.integers(0, len(x), int(d * 90)); drops[idx] = rng.uniform(0.3, 1, len(idx))
    x += lp(np.convolve(drops, np.exp(-np.arange(200) / 30), 'same'), 3000) * 0.4
    return fade(x * g, 1.5, 1.5)
def wind(d, g=1.0, f=500):
    t = T(d); m = 0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t + 1) * np.sin(2 * np.pi * 0.07 * t)
    return fade(bp(noise(d), f * 0.5, f * 2.2, 2) * m * g, 1.0, 1.0)
def thunder(g=1.0):
    d = 4.0; t = T(d); x = lp(noise(d), 260, 3) * np.exp(-t / 1.2) * (1 + 0.6 * np.sin(2 * np.pi * 3 * t))
    x[:int(0.4 * SR)] *= np.linspace(0, 1, int(0.4 * SR)); return x * g * 3
def step(g=1.0, wet=True):
    d = 0.25; t = T(d); x = lp(noise(d), 380, 2) * np.exp(-t / 0.03) * 2.5
    if wet: x += bp(noise(d), 1500, 6000) * np.exp(-t / 0.05) * 0.5
    return fade(x * g)
def heart(g=1.0):
    t = T(0.18); b = np.sin(2 * np.pi * 50 * t) * np.exp(-t / 0.05)
    y = np.zeros(int(0.5 * SR)); y[:len(b)] += b; y[int(0.17 * SR):int(0.17 * SR) + len(b)] += b * 0.7; return y * g
def breath(d=1.2, g=1.0):
    t = T(d); return fade(bp(noise(d), 500, 2400) * np.sin(np.pi * t / d) ** 2 * g, 0.05, 0.1)
def strings(m, ch, t0, d, g, bright=1600, atk=1.5, rel=1.5, oct_=12): chord_pad(m, ch, t0, d, g, bright, atk, rel, oct_)

def music():
    m = Bus()
    # 1 · tensão: drone grave, pulso discreto
    m.add(sub(nf(28), 26.0, 0.32), 0.0); chord_pad(m, 'Em', 0.3, 16.0, 0.09, 500, 3.0, 2.0)
    for k, t in enumerate(np.arange(1.5, 15.8, B * 2)): m.add(kick(0.18 + 0.012 * k), t)
    # cortes de pressão
    for t in (7.5, 9.15, 11.25, 13.55): m.add(impact(0.45), t)
    for k, t in enumerate(np.arange(7.6, 15.6, B / 2)): m.add(hat(0.05 + 0.006 * k), t)
    m.add(riser(2.0, 200, 5000, 0.4), 14.3)
    # silêncio: tudo some
    m.add(tape_stop(0.5, 400, 0.4), 16.3); chord_pad(m, 'Am', 16.6, 6.0, 0.06, 400, 1.5, 2.5)
    for t in (16.98, 18.6, 20.2): m.add(heart(0.5), t)
    m.add(ping(330, 0.15, 2.0), K['parar'])
    # história: tema começa (Am F C G lento)
    prog = [('Am', 22.7), ('F', 27.5), ('C', 32.85), ('G', 39.0), ('Am', 44.25), ('F', 48.0), ('C', 51.0)]
    ends = [p[1] for p in prog[1:]] + [54.5]
    for (ch, a), b in zip(prog, ends):
        chord_pad(m, ch, a, b - a + 0.6, 0.12, 900, 1.2, 1.0); strings(m, ch, a, b - a + 0.6, 0.05 + 0.006 * (a - 22) / 3, 1400)
        m.add(sub(nf(ROOT[ch]), b - a, 0.28), a)
    for t in np.arange(22.9, 54.3, B * 2): m.add(kick(0.25), t)
    for t in np.arange(33.0, 54.3, B): m.add(hat(0.06), t + B / 2)
    for t in (27.45, 32.8, 38.95, 44.2): m.add(impact(0.55, True), t)
    m.add(impact(0.5), K['deus1'] - 0.05); m.add(impact(0.5), K['fiel'] - 0.05); m.add(impact(0.5), K['orar'] - 0.05)
    for t in (K['cansado'], K['ferido']): m.add(sub(nf(33), 0.8, 0.5), t)
    m.add(impact(0.8, True), K['obediente'] - 0.05)
    # decisão: cresce com a narração
    chord_pad(m, 'Am', 54.5, 3.6, 0.09, 600, 0.5, 0.6); m.add(impact(0.9, True), 56.0)
    groove_prog = [('F', 57.9), ('C', 60.17), ('G', 62.83), ('Am', 66.64)]
    ends = [g[1] for g in groove_prog[1:]] + [70.3]
    for i, ((ch, a), b) in enumerate(zip(groove_prog, ends)):
        chord_pad(m, ch, a, b - a + 0.4, 0.12 + 0.02 * i, 1200 + 300 * i, 0.3, 0.6); strings(m, ch, a, b - a + 0.4, 0.06 + 0.015 * i, 1800)
        m.add(sub(nf(ROOT[ch]), b - a, 0.35), a)
        for k, t in enumerate(beats(a, b, B)):
            m.add(kick(0.45 + 0.07 * i), t); m.add(hat(0.08 + 0.02 * i), t + B / 2)
            if i >= 1 and k % 2 == 1: m.add(clap(0.15 + 0.05 * i), t)
            if i >= 2: m.add(bass(nf(ROOT[ch] + 12), 0.3, 0.3), t + B / 2)
    m.add(impact(0.9, True), K['levantar'] - 0.05)
    m.add(riser(2.4, 200, 9000, 0.9), 68.0); m.add(reverse_swell(0.6, 0.7), 69.7)
    # IMPACTO
    a = K['deus2'] - 0.03
    m.add(impact(1.5, True), a); m.add(sub(nf(36), 4.0, 1.0), a)
    chord_pad(m, 'C', a, 4.3, 0.34, 3000, 0.04, 1.6); chord_pad(m, 'C', a, 4.3, 0.2, 2600, 0.04, 1.6, oct_=12); strings(m, 'C', a, 4.3, 0.16, 3000, 0.2)
    m.add(impact(1.1, True), K['permanecer1'] + 0.12)
    # PERGUNTA: pausa
    chord_pad(m, 'Am', 74.9, 10.0, 0.08, 500, 1.5, 1.0); m.add(sub(nf(33), 9.5, 0.3), 75.0)
    for t in (K['desistir2'], K['permanecer2']): m.add(heart(0.6), t - 0.3)
    m.add(ping(440, 0.15, 2.0), K['fim2'] + 0.1)
    # CONTINUE: cresce de novo, emocional
    prog2 = [('F', 85.2), ('C', 88.15), ('G', 91.1), ('Am', 92.97), ('F', 94.97)]
    ends = [p[1] for p in prog2[1:]] + [97.6]
    for i, ((ch, a), b) in enumerate(zip(prog2, ends)):
        chord_pad(m, ch, a, b - a + 0.5, 0.13 + 0.025 * i, 1400 + 400 * i, 0.4, 0.8); strings(m, ch, a, b - a + 0.5, 0.08 + 0.02 * i, 2400)
        m.add(sub(nf(ROOT[ch]), b - a, 0.4), a)
        for k, t in enumerate(beats(a, b, B)):
            m.add(kick(0.5 + 0.05 * i), t); m.add(hat(0.1 + 0.02 * i), t + B / 2)
            if k % 2 == 1: m.add(clap(0.2 + 0.04 * i), t)
            for j, n in enumerate(ARP[ch if ch in ARP else 'C'][:2]): m.add(pluck(nf(n + 12), 0.25, 0.08 + 0.02 * i), t + j * B / 2, pan=-0.3 + 0.6 * j)
    for t in (K['naodesista'], K['continue'], K['deus3']): m.add(impact(1.1, True), t - 0.05)
    # IDENTIDADE: resolve
    a = 97.6; m.add(impact(1.2, True), a); chord_pad(m, 'C', a, 9.3, 0.22, 2400, 0.1, 3.5); strings(m, 'C', a, 9.3, 0.12, 2400, 0.3, 3.5)
    m.add(sub(nf(36), 5.0, 0.6), a)
    m.add(riser(1.4, 250, 8000, 0.7), K['perseveranca'] - 1.45)
    m.add(impact(1.4, True), K['perseveranca'] - 0.1); m.add(sub(nf(36), 3.5, 0.9), K['perseveranca'] - 0.1)
    chord_pad(m, 'C', K['perseveranca'] - 0.1, 5.2, 0.2, 3000, 0.05, 3.5, oct_=12)
    return m

def sfx():
    m = Bus()
    # chuva contínua, com intensidade por cena
    for a, b, g in ((0.0, 16.3, 0.55), (16.3, 22.7, 0.28), (32.85, 39.0, 0.5), (54.5, 70.3, 0.6), (74.9, 85.2, 0.22), (85.2, 97.6, 0.2)):
        m.add(rain(b - a + 1.5, g), a)
    m.add(wind(16.0, 0.35, 400), 0.0); m.add(wind(6.5, 0.6, 700), 32.85); m.add(wind(4.2, 0.9, 900), 66.3); m.add(wind(10.5, 0.25, 350), 74.9)
    for t in (34.2, 37.0): m.add(thunder(0.9), t)
    m.add(thunder(0.6), 2.0)
    # passos pesados
    for t in np.arange(0.8, 7.4, 0.62): m.add(step(0.55), t, pan=-0.2)
    for t in np.arange(7.55, 9.0, 0.42): m.add(step(0.8), t)
    for t in np.arange(16.4, 19.0, 0.8): m.add(step(0.35 * (1 - (t - 16.4) / 3)), t)
    for t in np.arange(22.8, 27.3, 0.5): m.add(step(0.3, False), t, pan=0.3)
    for t in np.arange(44.4, 54.0, 0.9): m.add(step(0.3, False), t)  # Jesus subindo
    for t in np.arange(54.5, 55.55, 0.4): m.add(step(0.6), t)
    m.add(step(1.2), 55.7); m.add(impact(1.0), 56.15); m.add(whoosh(0.5, 3000, 300, 0.6), 55.6)
    m.add(click(0.6), 57.2); m.add(step(0.6), 57.3)  # mão agarrando
    for t in np.arange(62.85, 66.5, 0.45): m.add(step(0.7), t)
    for t in np.arange(66.7, 70.2, 0.55): m.add(step(0.6), t)
    for t in np.arange(84.5, 85.6, 0.55): m.add(step(0.5), t)
    for t in np.arange(85.6, 97.0, 0.55): m.add(step(0.4 * (1 - (t - 85.6) / 14)), t)
    m.add(breath(1.4, 0.35), 13.6); m.add(breath(1.2, 0.3), 15.0); m.add(breath(1.4, 0.3), 56.4)
    # transições
    for t in (7.45, 16.25, 22.65, 27.45, 32.8, 38.95, 44.2, 54.45, 85.15): m.add(whoosh(0.8, 300, 4000, 0.45), t - 0.35)
    for t in (9.1, 11.2, 13.5): m.add(whoosh(0.4, 5000, 400, 0.5), t - 0.1)
    m.add(whoosh(1.0, 200, 7000, 0.8), K['deus2'] - 0.8); m.add(whoosh(0.8, 300, 6000, 0.6), K['permanecer1'] - 0.4)
    for t in (K['naodesista'], K['continue'], K['deus3']): m.add(whoosh(0.5, 400, 6000, 0.5), t - 0.45)
    m.add(whoosh(1.2, 300, 6000, 0.6), 97.0); m.add(whoosh(0.8, 400, 7000, 0.6), K['perseveranca'] - 0.6)
    return m

def master(b, peak):
    x = np.tanh(b.b * 1.1) / np.tanh(1.1); return x / np.abs(x).max() * peak

v, _ = sf.read('public/audio/narracao.wav'); vv = np.zeros((N, 2)); vv[:min(len(v), N)] = v[:N] if v.ndim == 2 else np.stack([v[:N]] * 2, 1)
mono = np.abs(vv).mean(1)
e = np.convolve(mono, np.ones(int(.03 * SR)) / int(.03 * SR), 'same'); a_, r_ = np.exp(-1 / (.02 * SR)), np.exp(-1 / (.35 * SR)); env = np.zeros_like(e); c = 0.0
for i, x in enumerate(e):
    c = a_ * c + (1 - a_) * x if x > c else r_ * c + (1 - r_) * x; env[i] = c
env = np.clip(env / (np.percentile(env, 97) + 1e-6), 0, 1)
tr = master(music(), 0.8).T * 0.42; fx = master(sfx(), 0.8).T * 0.36
tail = int(1.3 * SR); fd = np.ones(N); fd[-tail - int(0.3 * SR):-int(0.3 * SR)] = np.linspace(1, 0, tail); fd[-int(0.3 * SR):] = 0
bed = (tr * (1 - .5 * env)[:, None] + fx * (1 - .3 * env)[:, None]) * fd[:, None]
hop = int(.01 * SR); nf_ = N // hop
def frms(x): y = (x[:nf_ * hop] ** 2).mean(1).reshape(nf_, hop).mean(1); return np.sqrt(np.convolve(y, np.ones(8) / 8, 'same'))
vr, br = frms(vv), frms(bed)
speak = np.convolve((vr > 10 ** (-42 / 20)).astype(float), np.ones(25), 'same') > 0
g = np.where(speak, np.minimum(1, 10 ** (-9 / 20) * np.maximum(vr, 10 ** (-30 / 20)) / (br + 1e-9)), 1.0)
gs = np.ones_like(g); c = 1.0
for i, x in enumerate(g):
    c = x if x < c else c + (x - c) * 0.06; gs[i] = c
gs = np.convolve(gs, np.ones(5) / 5, 'same'); G = np.interp(np.arange(N), np.arange(nf_) * hop + hop / 2, gs)
mix = bed * G[:, None] + vv
mix = mix / np.abs(mix).max() * 10 ** (-1.5 / 20)
sf.write('public/audio/mix_final.wav', mix, SR, subtype='PCM_16')
x, _ = sf.read('public/audio/mix_final.wav'); print('pico', round(20 * np.log10(np.abs(x).max()), 1), 'dBFS', 'dur', round(len(x) / SR, 3))
r = subprocess.run(['ffmpeg', '-i', 'public/audio/mix_final.wav', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
print([l for l in r.splitlines() if 'I:' in l][-1])
