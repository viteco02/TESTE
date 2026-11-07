from pathlib import Path
import asyncio,edge_tts,json,os,subprocess,numpy as np
from scipy.io.wavfile import write
R=Path(__file__).resolve().parents[1];data=json.loads((R.parent/'timeline.json').read_text())
cast={'Wylie':('en-US-AndrewMultilingualNeural',3,4),'Cho':('pt-BR-AntonioNeural',-5,-9),'Rigsby':('pt-BR-AntonioNeural',2,1),'Van Pelt':('pt-BR-ThalitaMultilingualNeural',0,0),'Jane':('en-US-BrianMultilingualNeural',-3,-2),'Lisbon':('pt-BR-FranciscaNeural',-3,-4)}
async def main():
 out=[];i=0
 for shot in data['shots']:
  for who,a,b,text in shot['dialog']:
   voice,rate,pitch=cast[who];path=R/f'assets/audio/line_{i:02}.mp3'
   spoken=text.replace('Cho,','Tchô,').replace('senhora Jane?','senhora Djêin?')
   await edge_tts.Communicate(spoken,voice,rate=f'{rate:+}%',pitch=f'{pitch:+}Hz',proxy=os.environ.get('HTTPS_PROXY')).save(str(path))
   raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','1','-ar','48000','-']);samples=np.frombuffer(raw,np.float32)
   active=np.flatnonzero(np.abs(samples)>.008);lo=max(0,active[0]-2880);hi=min(len(samples),active[-1]+5760);samples=samples[lo:hi];dur=len(samples)/48000
   start=min(a,shot['end']-.15-dur);start=max(shot['start']+.15,start)
   assert start+dur<=shot['end']+.01,(who,dur,shot['duration'])
   write(R/f'assets/audio/line_{i:02}.wav',48000,(samples*32767).astype(np.int16))
   env=[float(np.sqrt(np.mean(samples[k:k+1600]**2))) for k in range(0,len(samples),1600)]
   out.append({'id':i,'shot':shot['id'],'character':who,'text':text,'start':round(start,3),'end':round(start+dur,3),'duration':dur,'voice':voice,'rate':rate,'pitch':pitch,'envelope':env})
   print(i,who,round(start,2),round(dur,2),text,flush=True);i+=1
 (R/'src/dialogue.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
asyncio.run(main())
