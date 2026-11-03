"""Verify finished deliverables, full decode, caption coverage and audio levels."""
from pathlib import Path
import subprocess,json,hashlib,re
R=Path(__file__).resolve().parents[1];report={}
for name in ['VERDADE_E_DESAFIO.mp4','VERDADE_E_DESAFIO_LEGENDADO.mp4']:
 p=R/'output'/name
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
 v=next(x for x in data['streams'] if x['codec_type']=='video');a=next(x for x in data['streams'] if x['codec_type']=='audio')
 assert (v['width'],v['height'],v['avg_frame_rate'],v['codec_name'])==(1080,1920,'60/1','h264')
 assert a['codec_name']=='aac' and a['sample_rate']=='48000'
 assert abs(float(data['format']['duration'])-72.164)<.1
 result=subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(p),'-f','null','-'],capture_output=True,text=True)
 assert result.returncode==0,result.stderr
 report[name]={'duration':data['format']['duration'],'width':v['width'],'height':v['height'],'fps':v['avg_frame_rate'],'frames':v.get('nb_frames'),'audio':{'codec':a['codec_name'],'sample_rate':a['sample_rate'],'channels':a['channels']},'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'full_decode':'passed'}
subs=json.loads((R/'src/captions.json').read_text());j=json.loads((R/'src/timeline.json').read_text())
assert ' '.join(s['text'] for s in subs)==' '.join(p['text'] for p in j['paragraphs'])
assert all(0<=s['start']<s['end']<=72.164 for s in subs)
report['captions']={'count':len(subs),'exact_script_coverage':True,'timing_bounds':'passed'}
p=subprocess.run(['ffmpeg','-hide_banner','-i',str(R/'output/VERDADE_E_DESAFIO.mp4'),'-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True)
m=re.search(r'\{\s*"input_i"[\s\S]*?\}',p.stderr)
if m:report['audio_measurement']=json.loads(m.group())
(R/'docs/VERIFICACAO.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
