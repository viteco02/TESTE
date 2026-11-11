# Sintetiza trilha (public/sounds/trilha.wav) e efeitos (public/sounds/efeitos.wav), 48 kHz estéreo.
# Os tempos seguem src/timing.json + os marcos de cada cena. Uso: python3 scripts_synth_audio.py
import json, wave
import numpy as np
from scipy.signal import butter, sosfilt, sawtooth, fftconvolve

SR = 48000
DUR = 93.231
N = int(SR * DUR)
rng = np.random.default_rng(11)
BPM = 124.0
BEAT = 60.0 / BPM

def T(d): return np.arange(int(SR * d)) / SR
def lp(x, fc, o=2): return sosfilt(butter(o, min(fc, SR * 0.49) / (SR / 2), 'low', output='sos'), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc / (SR / 2), 'high', output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a / (SR / 2), min(b, SR * 0.49) / (SR / 2)], 'band', output='sos'), x)
def noise(d): return rng.standard_normal(int(SR * d))
def fade(x, a=0.004, r=0.01):
    n = len(x); ia = min(n, int(a * SR)); ir = min(n, int(r * SR))
    x = x.copy()
    if ia: x[:ia] *= np.linspace(0, 1, ia)
    if ir: x[-ir:] *= np.linspace(1, 0, ir)
    return x

class Bus:
    def __init__(self): self.b = np.zeros((2, N))
    def add(self, sig, t0, g=1.0, pan=0.0):
        i = int(t0 * SR)
        if i >= N or i + len(sig) <= 0: return
        if i < 0: sig = sig[-i:]; i = 0
        j = min(N, i + len(sig)); s = sig[: j - i] * g
        self.b[0, i:j] += s * np.cos((pan + 1) * np.pi / 4); self.b[1, i:j] += s * np.sin((pan + 1) * np.pi / 4)

# ---------- instrumentos ----------
def kick(g=1.0):
    t = T(0.42); f = 42 + 110 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8.5)
    x += 0.25 * hp(noise(0.42), 2500) * np.exp(-t * 90)
    return fade(x * g)
def clap(g=1.0):
    t = T(0.3); x = bp(noise(0.3), 1200, 7000) * (np.exp(-t * 20) + 0.6 * np.exp(-((t - 0.012) ** 2) * 9000))
    return fade(x * g)
def hat(g=1.0, open_=False):
    d = 0.28 if open_ else 0.07; t = T(d)
    return fade(hp(noise(d), 7500) * np.exp(-t * (14 if open_ else 70)) * g)
def snare(g=1.0):
    t = T(0.22); x = bp(noise(0.22), 900, 8000) * np.exp(-t * 22) + 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return fade(x * g)
def pluck(fq, d=0.7, g=1.0):
    t = T(d); x = sum(a * np.sin(2 * np.pi * fq * k * t) for k, a in [(1, 1), (2, 0.35), (3, 0.15), (4, 0.06)]) * np.exp(-t * 5.5)
    return fade(lp(x, 5200) * g * 0.5)
def bass(fq, d=0.4, g=1.0):
    t = T(d); x = lp(sawtooth(2 * np.pi * fq * t), 420) * 0.7 + np.sin(2 * np.pi * fq * t) * 0.8
    return fade(x * np.exp(-t * 3.0) * g, 0.006, 0.05)
def pad(freqs, d, g=1.0, bright=1100, atk=1.2, rel=1.5):
    t = T(d); x = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.35, 0.0, 0.35):
            x += sawtooth(2 * np.pi * fq * (1 + det * 0.004) * t + rng.random() * 6)
    x = lp(x, bright) / (len(freqs) * 3) * 2.2
    env = np.minimum(1, t / atk) * np.minimum(1, np.maximum(0, (d - t) / rel))
    return x * env * g
def sub(fq, d, g=1.0):
    t = T(d); return fade(np.sin(2 * np.pi * fq * t) * g, 0.02, 0.3)
def ping(fq, g=1.0, d=0.35):
    t = T(d); return fade((np.sin(2 * np.pi * fq * t) + 0.3 * np.sin(2 * np.pi * fq * 2.01 * t)) * np.exp(-t * 12) * g * 0.5)
def click(g=1.0):
    t = T(0.03); return fade((hp(noise(0.03), 3000) * np.exp(-t * 160) + 0.4 * np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 200)) * g)

_IR = None
def reverb(x, wet=0.5, tail=1.6):
    global _IR
    if _IR is None:
        t = T(tail); _IR = lp(noise(tail), 3500) * np.exp(-t * 3.2); _IR /= np.abs(_IR).max() * 6
    y = fftconvolve(x, _IR)[: len(x) + int(tail * SR * 0.6)]
    out = np.zeros(len(y)); out[: len(x)] += x * (1 - wet * 0.5); return out + y * wet

def whoosh(d, f0, f1, g=1.0, peak=0.5):
    """Ruído com banda deslizante (f0→f1) e envelope em sino."""
    n = int(SR * d); t = np.arange(n) / SR
    centers = np.geomspace(min(f0, f1) / 1.5, max(f0, f1) * 1.5, 12)
    sweep = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * (t / d) ** 1.4)
    x = np.zeros(n); src = noise(d)
    for c in centers:
        band = bp(src, c / 1.35, c * 1.35)
        gain = np.exp(-((np.log(c) - np.log(sweep)) ** 2) / (2 * 0.35 ** 2))
        x += band * gain
    u = t / d
    env = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.6)
    return x * env * g * 0.55
def riser(d, f0=300, f1=7000, g=1.0, tonal=True):
    x = whoosh(d, f0, f1, 1.0, peak=0.97) * 1.3
    t = T(d)
    if tonal:
        f = f0 * (f1 / f0) ** ((t / d) ** 1.7) / 4
        x += lp(sawtooth(2 * np.pi * np.cumsum(f) / SR), 3000) * 0.25 * (t / d) ** 2
    return fade(x * g * (t / d) ** 1.5, 0.01, 0.02)
def impact(g=1.0, big=False):
    d = 1.4 if big else 0.9; t = T(d)
    s = np.sin(2 * np.pi * np.cumsum(30 + 70 * np.exp(-t * 6)) / SR) * np.exp(-t * (2.6 if big else 4.5))
    s += 0.6 * lp(noise(d), 1800) * np.exp(-t * 7)
    s += 0.25 * hp(noise(d), 3000) * np.exp(-t * 18)
    return reverb(fade(s * g, 0.001, 0.2), 0.45 if big else 0.3, 1.8 if big else 1.0)
def glitch(d=0.3, g=1.0):
    n = int(SR * d); x = np.zeros(n); pos = 0
    while pos < n:
        L = int(SR * rng.uniform(0.008, 0.045))
        if rng.random() < 0.6:
            seg = rng.standard_normal(L) if rng.random() < 0.5 else np.sin(2 * np.pi * rng.uniform(200, 3000) * np.arange(L) / SR)
            x[pos: pos + L] = seg[: n - pos] if pos + L > n else seg
        pos += L
    x = np.round(x * 4) / 4
    return fade(hp(x, 800) * g * 0.6)
def tape_stop(d=0.3, f0=500, g=1.0):
    t = T(d); f = f0 * np.exp(-t * 11)
    return fade(lp(sawtooth(2 * np.pi * np.cumsum(f) / SR), 1800) * (1 - t / d) * g * 0.6)
def reverse_swell(d, g=1.0): return riser(d, 400, 6000, g, tonal=False)

# ---------- acordes ----------
def nf(n): return 440.0 * 2 ** ((n - 69) / 12)   # nota MIDI → Hz
CH = {'Am': [45, 52, 57, 60], 'F': [41, 48, 53, 57], 'C': [48, 55, 60, 64], 'G': [43, 50, 55, 59], 'Em': [40, 47, 52, 55]}
ROOT = {'Am': 33, 'F': 29, 'C': 36, 'G': 31, 'Em': 28}
ARP = {'Am': [57, 60, 64, 69, 64, 60], 'F': [53, 57, 60, 65, 60, 57], 'C': [60, 64, 67, 72, 67, 64], 'G': [55, 59, 62, 67, 62, 59]}

def chord_pad(m, ch, t0, d, g, bright=1100, atk=1.0, rel=1.2, oct_=0):
    m.add(pad([nf(n + oct_) for n in CH[ch]], d, g, bright, atk, rel), t0)

def beats(a, b, step=BEAT):
    k = np.arange(a, b, step); return k[k < b - 1e-6]

