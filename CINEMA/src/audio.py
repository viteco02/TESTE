"""Original instrumental score, synchronized voice stems, impacts, and captions."""
import json,subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io.wavfile import write
R=Path(__file__).resolve().parents[1];J=json.loads((R/'src/timeline.json').read_text());sr=48000;duration=J['duration'];N=int(duration*sr)
rng=np.random.default_rng(2026);music=np.zeros((N,2),np.float32);fx=np.zeros_like(music);voice=np.zeros(N,np.float32)
def put(dst,a,start,gain=1,pan=0):
 pos=int(start*sr);n=min(len(a),N-pos)
 if n<=0 or pos<0:return
 if dst.ndim==1:dst[pos:pos+n]+=a[:n]*gain
 else:
  dst[pos:pos+n,0]+=a[:n]*gain*np.sqrt((1-pan)/2);dst[pos:pos+n,1]+=a[:n]*gain*np.sqrt((1+pan)/2)
def tone(midi,dur,kind='piano'):
 t=np.arange(int(sr*dur))/sr;f=440*2**((midi-69)/12)
 if kind=='pad':
  a=(np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*(f*1.002)*t)+.22*np.sin(2*np.pi*2*f*t));env=np.minimum(t/.8,1)*np.minimum((dur-t)/1.2,1)*.18
 else:
  a=sum(np.sin(2*np.pi*f*k*t)*np.exp(-t*(.8+k*.6))/k**1.5 for k in range(1,7));env=np.minimum(t/.008,1)*np.minimum((dur-t)/.1,1)*.33
 return (a*env).astype(np.float32)
beat=60/102;chords=[[50,57,62,65],[46,53,58,62],[53,60,65,69],[48,55,60,64]]
# Evolving D minor / Bb / F / C instrumental, no external music recordings.
for bar,start in enumerate(np.arange(0,duration,beat*4)):
 chord=chords[bar%4];reflect=14.3<start<26.7;energy=.55 if reflect else (.8 if start<38 else 1)
 for k,m in enumerate(chord):put(music,tone(m,beat*5,'pad'),start,.35*energy,(k-1.5)*.36)
 put(music,tone(chord[0]-12,beat*3),start,.5*energy)
 if start>25 or start<14:
  for k in range(8):
   at=start+k*beat/2
   if at>duration-3:continue
   m=chord[[0,2,1,3,2,1,3,2][k]]+12
   a=tone(m,1.7);put(music,a,at,.24*energy,(-1)**k*.35)
   put(music,a,at+.29,.06*energy,(-1)**(k+1)*.6)
 for k in range(4):
  at=start+k*beat
  if reflect or at>duration-3:continue
  t=np.arange(int(sr*.3))/sr;kick=np.sin(2*np.pi*(47*t+9*(1-np.exp(-t*22))))*np.exp(-t*18)
  put(music,kick,at,.19*energy)
  if k%2:
   t=np.arange(int(sr*.16))/sr;noise=rng.normal(0,1,len(t));sn=sosfilt(butter(2,1400,fs=sr,btype='high',output='sos'),noise)*np.exp(-t*28)
   put(music,sn,at,.032*energy)
  t=np.arange(int(sr*.06))/sr;hat=sosfilt(butter(2,7000,fs=sr,btype='high',output='sos'),rng.normal(0,1,len(t)))*np.exp(-t*65)
  put(music,hat,at+beat/2,.018*energy,.3)
for at in [0,1.58,3.3,4.3,5.3,6.2,7.7,11.9,14.5,17.9,23.85,27.5,29.1,29.98,30.75,33.29,35.1,38.48,41.1,46.97,47.67,49.55,51.25,52,56.4,58.3,61.16,63.54,65.64,67.76]:
 t=np.arange(int(sr*.35))/sr;n=rng.normal(0,1,len(t));whoosh=sosfilt(butter(2,[650,4500],fs=sr,btype='band',output='sos'),n)*np.sin(np.pi*t/.35)**3
 put(fx,whoosh,max(0,at-.23),.036,(-1)**int(at)*.35)
 t=np.arange(int(sr*.6))/sr;hit=np.sin(2*np.pi*(42*t+6*(1-np.exp(-18*t))))*np.exp(-10*t)
 put(fx,hit,at,.12 if at in [1.58,47.67,61.16] else .045)
for p in J['paragraphs']:
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(R/f"assets/audio/voz_{p['id']:02}.mp3"),'-f','f32le','-ac','1','-ar',str(sr),'-'])
 a=np.frombuffer(raw,np.float32);put(voice,a,p['start'])
# Smooth sidechain gain: narration stays forward, music breathes in pauses.
activity=np.convolve((np.abs(voice[::480])>.012).astype(float),np.ones(17)/17,mode='same');duck=np.interp(np.arange(N)/480,np.arange(len(activity)),activity)
music*= (.72-.43*duck[:,None]);fade=np.clip(np.arange(N)/sr/1.2,0,1)*np.clip((duration-np.arange(N)/sr)/2,0,1);music*=fade[:,None]
voice*=min(1.5,.87/(np.max(np.abs(voice))+1e-8))
mix=voice[:,None]*np.ones((1,2))+music+fx
mix=np.tanh(mix*1.05)*.93
for name,a in [('narracao',voice),('trilha_original',music),('efeitos',fx),('mix_pre',mix)]:write(R/f'assets/audio/{name}.wav',sr,(np.clip(a,-1,1)*32767).astype(np.int16))
subprocess.run(['ffmpeg','-v','error','-y','-i',str(R/'assets/audio/mix_pre.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ar','48000',str(R/'assets/audio/mix_final.wav')],check=True)
(R/'assets/audio/mix_pre.wav').unlink()
# Captions from TTS word boundaries, preserving the supplied text in readable phrase groups.
subs=[]
for p in J['paragraphs']:
 group=[]
 for w in p['words']:
  group.append(w)
  if sum(len(x['text'])+1 for x in group)>32 or w==p['words'][-1]:
   subs.append({'start':round(p['start']+group[0]['start'],3),'end':round(p['start']+group[-1]['end']+.1,3),'text':' '.join(x['text'] for x in group)});group=[]
def stamp(x):
 ms=round(x*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(R/'output/VERDADE_E_DESAFIO.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(s['start'])} --> {stamp(s['end'])}\n{s['text']}" for i,s in enumerate(subs))+'\n')
(R/'src/captions.json').write_text(json.dumps(subs,ensure_ascii=False,indent=2))
print('Audio and captions complete',duration)
