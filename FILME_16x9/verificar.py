import subprocess,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parent
file=root.parent/'sabado_da_criacao_16x9.mp4'
original=root.parent/'sabado_da_criacao_reel_v2.mp4'
def probe(p):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(p)]))
def audio_hash(p):
 return subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-map','0:a','-c','copy','-f','hash','-hash','sha256','-']).decode().strip()
p=probe(file);v=next(s for s in p['streams'] if s['codec_type']=='video');a=next(s for s in p['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['pix_fmt'],v['r_frame_rate'])==(1920,1080,'yuv420p','60/1')
assert int(v['nb_frames'])==3460
check=subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],capture_output=True,text=True)
assert check.returncode==0 and not check.stderr,check.stderr
ah=audio_hash(file);oh=audio_hash(original);assert ah==oh
result={'resolution':[v['width'],v['height']],'aspect_ratio':'16:9','fps':v['r_frame_rate'],'frames':v['nb_frames'],'video_codec':v['codec_name'],'pixel_format':v['pix_fmt'],'duration':p['format']['duration'],'audio_codec':a['codec_name'],'audio_duration':a['duration'],'audio_identical_to_approved_v2':ah==oh,'audio_packet_hash':ah,'complete_decode_ok':True,'size_bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
(root/'VALIDACAO.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
