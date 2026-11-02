"""Two-pass loudness normalization, stream-copying the video."""
import subprocess,json,re
from pathlib import Path
root=Path(__file__).resolve().parent
p=root.parent/'verdade_e_desafio_reels.mp4'
scan=subprocess.run(['ffmpeg','-hide_banner','-i',str(p),'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
matches=re.findall(r'\{\s*"input_i".*?\}',scan.stderr,re.S);data=json.loads(matches[-1]);print(data)
flt='loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}'.format(**data)
out=p.with_name('verdade_e_desafio_normalizado.mp4')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(p),'-map','0:v','-map','0:a','-c:v','copy','-af',flt,'-c:a','aac','-b:a','256k','-ar','48000','-movflags','+faststart',str(out)],check=True)
out.replace(p)
(root/'LOUDNESS.json').write_text(json.dumps({'target_integrated_lufs':-16,'target_true_peak_dbtp':-1.5,'measurement_before':data},indent=2)+'\n')
