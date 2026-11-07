import sys,json,subprocess,numpy as np
sys.path.insert(0,'/workspace/gse-production/python-packages')
from faster_whisper import WhisperModel
m=WhisperModel('small',device='cpu',compute_type='int8',download_root='/workspace/work/sabado/models',cpu_threads=2)
a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i','/workspace/TESTE/THE_MENTALIST_EP01/MOTION/assets/audio/dialogos.wav','-f','f32le','-ac','1','-ar','16000','-']),np.float32)
s,info=m.transcribe(a,language='pt',beam_size=5,initial_prompt='Patrick Jane, Teresa Lisbon, Cho, Wylie, Rigsby e Van Pelt.')
out=[]
for x in s:
 print(round(x.start,2),x.text,flush=True);out.append({'start':x.start,'end':x.end,'text':x.text})
open('/workspace/TESTE/THE_MENTALIST_EP01/MOTION/docs/transcricao_verificacao.json','w').write(json.dumps(out,ensure_ascii=False,indent=2))
