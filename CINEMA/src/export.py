from pathlib import Path
import subprocess
R=Path(__file__).resolve().parents[1]
def run(args):subprocess.run(['ffmpeg','-v','warning','-y']+args,check=True,cwd=R)
run(['-i','output/visual.mp4','-i','assets/audio/mix_final.wav','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart','-shortest','output/VERDADE_E_DESAFIO.mp4'])
run(['-i','output/VERDADE_E_DESAFIO.mp4','-vf','ass=src/captions.ass:fontsdir=assets/fonts','-c:v','libx264','-threads','2','-crf','20','-maxrate','8M','-bufsize','16M','-preset','fast','-c:a','copy','-movflags','+faststart','output/VERDADE_E_DESAFIO_LEGENDADO.mp4'])
print('Final exports complete.')
