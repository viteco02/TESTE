from pathlib import Path
import json,numpy as np,subprocess
from scipy.io.wavfile import read,write
from scipy.signal import butter,sosfilt
R=Path(__file__).resolve().parents[1];sr=48000;duration=60;N=sr*duration;rng=np.random.default_rng(718)
D=json.loads((R/'src/dialogue.json').read_text());voices=np.zeros(N,np.float32);music=np.zeros((N,2),np.float32);amb=np.zeros_like(music)
def put(dst,a,t,amp=1,pan=0):
 i=round(t*sr);n=min(len(a),len(dst)-i)
 if n<=0 or i<0:return
 if dst.ndim==1:dst[i:i+n]+=a[:n]*amp
 else:
  dst[i:i+n,0]+=a[:n]*amp*np.sqrt((1-pan)/2);dst[i:i+n,1]+=a[:n]*amp*np.sqrt((1+pan)/2)
def note(midi,dur=3,kind='piano'):
 t=np.arange(round(sr*dur))/sr;f=440*2**((midi-69)/12)
 if kind=='bass':a=(np.sin(2*np.pi*f*t)+.2*np.sin(2*np.pi*2*f*t))*np.exp(-t*2.5)*.32
 else:a=sum(np.sin(2*np.pi*f*k*t)*np.exp(-t*(1.05+k*.5))/k**1.7 for k in range(1,8))*.20
 a*=np.minimum(t/.012,1)*np.minimum((dur-t)/.2,1);return a.astype(np.float32)
beat=60/76;bar=beat*3;chords=[[48,55,59,64],[45,52,55,60],[50,57,60,65],[43,50,57,59]]
for i,start in enumerate(np.arange(0,56,bar)):
 chord=chords[i%4]
 for k,m in enumerate(chord):
  a=note(m+12,3.5);put(music,a,start+k*.035,.25,(-1)**k*.28);put(music,a,start+.19+k*.035,.035,(-1)**(k+1)*.5)
 put(music,note(chord[0]-12,2,'bass'),start,.25)
 if start<22 or start>49:
  for b in [1,2]:
   t=np.arange(round(sr*.12))/sr;n=sosfilt(butter(2,[1000,6000],fs=sr,btype='band',output='sos'),rng.normal(0,1,len(t)))*np.exp(-t*24)
   put(music,n,start+b*beat,.004,.25)
 for b,m in [(1,chord[2]+12),(2,chord[3]+12)]:
  if i%3==0:put(music,note(m,2.5),start+b*beat,.12,-.2)
for k,m in enumerate([48,55,59,64,67]):put(music,note(m+12,4.5),55.1+k*.05,.18,(k-2)*.15)
# Continuous nonverbal garden bed; no borrowed recordings or television score.
noise=sosfilt(butter(2,[250,1700],fs=sr,btype='band',output='sos'),rng.normal(0,1,N)).astype(np.float32)
amb[:,0]=noise*.002;amb[:,1]=np.roll(noise,1100)*.002
for at in np.arange(.8,59,2.8):
 t=np.arange(round(sr*.25))/sr;chirp=np.sin(2*np.pi*(3100*t+80*t*t))*np.sin(np.pi*t/.25)**2*.001
 put(amb,chirp,at,1,np.sin(at))
for at in [0.6,1.1,2.0,3.3,4.4,23.6,24.2,37.3,49.1,49.8,50.5,51.5]:
 t=np.arange(round(sr*.16))/sr;a=sosfilt(butter(2,1000,fs=sr,btype='low',output='sos'),rng.normal(0,1,len(t)))*np.exp(-t*28)
 put(amb,a,at,.007)
for d in D:
 rate,a=read(R/f"assets/audio/line_{d['id']:02}.wav");a=a.astype(np.float32)/32768
 rms=np.sqrt(np.mean(a*a));gain=min(2.1,.135/(rms+1e-9));a*=gain;peak=np.max(np.abs(a));a*=min(1,.82/max(peak,.01));put(voices,a,d['start'])
fade=np.minimum(np.arange(N)/sr/.6,1)*np.minimum((duration-np.arange(N)/sr)/1.25,1)
activity=np.convolve((np.abs(voices[::480])>.008).astype(float),np.ones(13)/13,'same');duck=np.interp(np.arange(N)/480,np.arange(len(activity)),activity)
music*=(.9-.25*duck[:,None]);music*=fade[:,None];amb*=fade[:,None]
mix=voices[:,None]+music+amb
for name,a in [('dialogos',voices),('trilha_original',music),('ambiente',amb),('mix_pre',mix)]:write(R/f'assets/audio/{name}.wav',sr,(np.clip(a,-.98,.98)*32767).astype(np.int16))
subprocess.run(['ffmpeg','-v','error','-y','-i',str(R/'assets/audio/mix_pre.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ar','48000',str(R/'assets/audio/mix_final.wav')],check=True)
(R/'assets/audio/mix_pre.wav').unlink()
def ts(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(R/'output/A_ULTIMA_DANCA.srt').write_text('\n\n'.join(f"{i+1}\n{ts(d['start'])} --> {ts(d['end'])}\n{d['text']}" for i,d in enumerate(D))+'\n')
print('Mixagem de 60 s, dez falas e SRT concluídos.')
