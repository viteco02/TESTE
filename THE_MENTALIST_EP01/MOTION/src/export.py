from pathlib import Path
import subprocess,json
P=Path(__file__).resolve().parents[1]
cache=P/'.cache';cache.mkdir(exist_ok=True)
for start in range(0,1800,120):
 out=cache/f'block_{start:04d}.mp4'
 if out.exists():
  probe=subprocess.run(['ffprobe','-v','error','-show_entries','stream=nb_frames','-of','json',str(out)],capture_output=True,text=True)
  if probe.returncode==0 and json.loads(probe.stdout).get('streams',[{}])[0].get('nb_frames')=='120':continue
  out.unlink()
 renderer=subprocess.Popen(['node','--expose-gc',str(P/'src/render.mjs'),'render',str(start),str(start+120)],stdout=subprocess.PIPE)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','30','-i','pipe:0','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p',str(out)],stdin=renderer.stdout,check=True)
 renderer.stdout.close();assert renderer.wait()==0
 print(f'Render {start+120}/1800',flush=True)
concat=cache/'concat.txt';concat.write_text('\n'.join(f"file '{cache/f'block_{s:04d}.mp4'}'" for s in range(0,1800,120)))
master=P/'output/A_ULTIMA_DANCA.mp4'
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(concat),'-i',str(P/'assets/audio/mix_final.wav'),'-c:v','copy','-c:a','aac','-b:a','192k','-t','60','-movflags','+faststart',str(master)],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(master),'-vf',f"ass={P}/src/captions.ass:fontsdir={P}/assets/fonts",'-c:v','libx264','-threads','2','-preset','fast','-crf','19','-c:a','copy','-movflags','+faststart',str(P/'output/A_ULTIMA_DANCA_LEGENDADO.mp4')],check=True)
print('EXPORT COMPLETE',flush=True)
