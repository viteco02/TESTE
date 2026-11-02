import json,subprocess,hashlib
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parent
file=root.parent/'verdade_e_desafio_reels.mp4'
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
def pcm(p):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-map','0:a:0','-af','pan=mono|c0=0.5*c0+0.5*c1','-ar','48000','-f','f32le','-']),np.float32)
p=probe(file);v=next(s for s in p['streams'] if s['codec_type']=='video');a=next(s for s in p['streams'] if s['codec_type']=='audio')
assert [v['width'],v['height']]==[1080,1920]
assert v['r_frame_rate']=='60/1' and v['avg_frame_rate']=='60/1'
assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
assert int(v['nb_frames'])==4641
assert a['codec_name']=='aac' and a['sample_rate']=='48000'
check=subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],capture_output=True,text=True);assert check.returncode==0 and not check.stderr,check.stderr
voice=pcm(root.parent/'NARRAÇUDA.MP3');mix=pcm(file);n=min(len(voice),len(mix));corr=float(np.corrcoef(voice[:n],mix[:n])[0,1]);peak=float(abs(mix).max());assert corr>.95,corr;assert peak<.99,peak
black=subprocess.run(['ffmpeg','-hide_banner','-i',str(file),'-vf','blackdetect=d=0.08:pix_th=0.06:pic_th=0.995','-an','-f','null','-'],capture_output=True,text=True)
blacklines=[l for l in black.stderr.splitlines() if 'black_start:' in l]
assert not blacklines,blacklines
rev=root/'revisao';rev.mkdir(exist_ok=True)
times=[1.8,3.9,6.8,8.5,11.3,14.1,16.6,17.7,20.8,22.7,25.8,29.4,30.8,34.9,36.8,38.6,41.8,45.5,47.7,48.7,51.8,54.1,55.6,58.8,61.8,63.2,65.7,68,71.5,73.8,76.4]
for i,t in enumerate(times):subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(file),'-frames:v','1','-vf','scale=216:384',str(rev/f'final_{i:02}.jpg')],check=True)
for start in range(0,len(times),15):
 sheet=Image.new('RGB',(1080,1212),'#121520');d=ImageDraw.Draw(sheet)
 for j,t in enumerate(times[start:start+15]):
  im=Image.open(rev/f'final_{start+j:02}.jpg');x=j%5*216;y=j//5*404;sheet.paste(im,(x,y));d.text((x+5,y+386),str(t)+' s',fill='white')
 sheet.save(rev/f'contato_final_{start}.jpg')
result={'resolution':[v['width'],v['height']],'fps':v['avg_frame_rate'],'video_codec':v['codec_name'],'pixel_format':v['pix_fmt'],'frames':int(v['nb_frames']),'duration':p['format']['duration'],'audio_codec':a['codec_name'],'audio_sample_rate':a['sample_rate'],'audio_duration':a['duration'],'narration_source_duration':probe(root.parent/'NARRAÇUDA.MP3')['format']['duration'],'audio_correlation_zero_lag':corr,'audio_peak_mono':peak,'complete_decode_ok':True,'unintended_black_intervals':blacklines,'size_bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'review_method':'Full decode, automatic browser playback, visual inspection of frames spanning all scenes; no claim of human continuous listening.'}
(root/'VALIDACAO.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
