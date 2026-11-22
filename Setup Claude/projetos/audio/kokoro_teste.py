import soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro('kokoro-v1.0.onnx', 'voices-v1.0.bin')
print([v for v in k.get_voices() if v.startswith('p')])
txt = 'Seis noites. Seis selos. E um desafio pra você! Na Semana de Oração Jovem, você vai receber o seu Mapa de Desafios!'
for v in ['pm_alex', 'pm_santa']:
    for sp in (1.0, 1.1):
        s, sr = k.create(txt, voice=v, speed=sp, lang='pt-br')
        sf.write(f't_{v}_{sp}.wav', s, sr); print(v, sp, len(s) / sr, sr)
