import subprocess,os,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];d=json.loads((R/'src/timeline.json').read_text())['duration'];chunks=R/'.cache/chunks';chunks.mkdir(parents=True,exist_ok=True)
files=[]
for start in range(0,int(d)+1,4):
 end=min(start+4,d);dst=chunks/f'{start:03}.mp4';files.append(dst)
 if dst.exists():
  probe=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(dst)],capture_output=True,text=True)
  if probe.returncode==0 and abs(float(probe.stdout)-(end-start))<.04:
   print('Already rendered',start,flush=True);continue
 env=os.environ.copy();env.update(START=str(start),END=str(end),VIDEO_OUT=str(dst))
 subprocess.run(['node','--expose-gc',str(R/'src/render.mjs')],env=env,check=True)
 print('SAVED',start,end,flush=True)
lst=chunks/'concat.txt';lst.write_text(''.join(f"file '{p}'\n" for p in files))
subprocess.run(['ffmpeg','-v','warning','-y','-f','concat','-safe','0','-i',str(lst),'-c','copy','-movflags','+faststart',str(R/'output/visual.mp4')],check=True)
print('COMPLETE',flush=True)
