import subprocess,json,hashlib
from pathlib import Path
import numpy as np
r=Path(__file__).resolve().parent.parent;(r/'FILME_V2/work').mkdir(exist_ok=True);v=r/'sabado_da_criacao_reel_v2.mp4';out=r/'FILME_V2/VALIDACAO.json'
d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(v)]));vid=next(s for s in d['streams'] if s['codec_type']=='video');aud=next(s for s in d['streams'] if s['codec_type']=='audio')
p=subprocess.run(['ffmpeg','-v','error','-i',str(v),'-f','null','-'],capture_output=True,text=True)
report={'resolution':[vid['width'],vid['height']],'fps':vid['r_frame_rate'],'video_codec':vid['codec_name'],'pixel_format':vid['pix_fmt'],'audio_codec':aud['codec_name'],'audio_bitrate_measured':aud.get('bit_rate'),'duration':d['format']['duration'],'audio_duration':aud.get('duration'),'frames':vid.get('nb_frames'),'size_bytes':v.stat().st_size,'complete_decode_ok':p.returncode==0 and not p.stderr.strip(),'decode_errors':p.stderr}
def pcm(file):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-ac','1','-ar','16000','-f','f32le','-']),dtype=np.float32)
x=pcm(r/'NARRAÇÃO.MP3');y=pcm(v);n=min(len(x),len(y));report['audio_correlation_zero_lag']=float(np.corrcoef(x[:n],y[:n])[0,1]);report['audio_peak']=float(np.abs(y).max())
def frame(file,n):return subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-vf',f'select=eq(n\\,{n})','-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-'])
aa=np.frombuffer(frame(v,822),dtype=np.uint8).astype(float);bb=np.frombuffer(frame(r/'sabado_da_criacao_teste_v2.mp4',180),dtype=np.uint8).astype(float)
report['approved_excerpt_sample_mean_absolute_difference']=float(np.abs(aa-bb).mean())
report['approved_excerpt_sample_psnr_db']=float(10*np.log10(255**2/max(np.mean((aa-bb)**2),1e-12)))
out.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
subprocess.run(['ffmpeg','-y','-v','error','-i',str(v),'-vf','fps=1,scale=108:192,tile=10x6','-frames:v','1',str(r/'FILME_V2/work/contato_final.jpg')],check=True)
