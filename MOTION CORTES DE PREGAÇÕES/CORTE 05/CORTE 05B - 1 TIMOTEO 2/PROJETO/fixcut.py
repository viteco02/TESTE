# Recorta com duração exata em quadros: vídeo e áudio com o MESMO tamanho em cada peça (sem deriva)
import json, sys, subprocess, os
wd, src_default, voice_default = sys.argv[1], sys.argv[2], sys.argv[3]
os.chdir(wd); P = json.load(open('edl.json')); os.makedirs('pieces', exist_ok=True)
for f in os.listdir('pieces'): os.remove('pieces/' + f)
for i, p in enumerate(P):
    if len(p) == 4: s, a, b, _ = p; src, voice = f'../ref/{s}.mp4', f'vA{s}.wav'
    else: a, b = p; src, voice = src_default, voice_default
    n = round((b - a) * 30); d = n / 30
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-i', src, '-ss', f'{a:.3f}', '-i', voice, '-map', '0:v:0', '-map', '1:a:0',
        '-vf', 'fps=30', '-frames:v', str(n), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p',
        '-af', f'apad,atrim=0:{d:.6f},afade=t=in:d=0.015,afade=t=out:st={d - 0.03:.4f}:d=0.03', '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', f'pieces/p{i:02d}.mov'], check=True)
open('list.txt', 'w').write(''.join(f"file 'pieces/p{i:02d}.mov'\n" for i in range(len(P))))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'corte_raw.mov'], check=True)
for st in ('v', 'a'):
    print(st, subprocess.run(['ffprobe', '-v', 'error', '-select_streams', st, '-show_entries', 'stream=duration', '-of', 'csv=p=0', 'corte_raw.mov'], capture_output=True, text=True).stdout.strip())
