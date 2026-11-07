from pathlib import Path
import subprocess,json
P=Path(__file__).resolve().parents[1];out={}
for name in ['A_ULTIMA_DANCA.mp4','A_ULTIMA_DANCA_LEGENDADO.mp4']:
 f=P/'output'/name
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]))
 v=next(x for x in data['streams'] if x['codec_type']=='video');a=next(x for x in data['streams'] if x['codec_type']=='audio')
 assert (v['width'],v['height'],v['r_frame_rate'])==(1080,1920,'30/1')
 assert abs(float(data['format']['duration'])-60)<.05
 assert v['nb_frames']=='1800'
 subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True)
 out[name]={'dimensions':[v['width'],v['height']],'fps':v['r_frame_rate'],'frames':v['nb_frames'],'duration':data['format']['duration'],'video_codec':v['codec_name'],'audio_codec':a['codec_name'],'sample_rate':a['sample_rate'],'bytes':f.stat().st_size,'full_decode':'passed'}
D=json.loads((P/'src/dialogue.json').read_text());assert len(D)==10
out['dialogue_count']=len(D);out['illustrated_animation']='Body motion and audio amplitude mouth animation; not phoneme-based lipsync.'
(P/'docs/VERIFICACAO.json').write_text(json.dumps(out,indent=2,ensure_ascii=False))
print(json.dumps(out,indent=2))
