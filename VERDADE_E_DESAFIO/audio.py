"""Original electronic score and procedural sound effects, no sampled commercial assets."""
from pathlib import Path
import numpy as np
from scipy.io.wavfile import write
from scipy.signal import butter,sosfilt
SR=48000;D=77.35;N=int(D*SR);rng=np.random.default_rng(20261108)
root=Path(__file__).resolve().parent
music=np.zeros((N,2),np.float64);fx=np.zeros_like(music)
def midi(n):return 440*2**((n-69)/12)
def put(dst,start,sound,amp=1,pan=0):
 a=int(start*SR);s=np.asarray(sound)*amp
 if a<0:s=s[-a:];a=0
 end=min(N,a+len(s))
 if end<=a:return
 pan=np.clip(pan,-1,1);dst[a:end,0]+=s[:end-a]*np.sqrt((1-pan)/2);dst[a:end,1]+=s[:end-a]*np.sqrt((1+pan)/2)
def osc(note,dur,kind='pluck'):
 t=np.arange(int(dur*SR))/SR;f=midi(note)
 if kind=='pad':
  s=(np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*f*1.002*t)+.2*np.sin(4*np.pi*f*t));env=np.minimum(1,t/.25)*np.minimum(1,np.maximum(0,dur-t)/.5)
 elif kind=='bass':
  s=np.sin(2*np.pi*f*t)+.25*np.sin(4*np.pi*f*t);env=np.minimum(1,t/.008)*np.exp(-t*4.5)*np.minimum(1,(dur-t)/.04)
 else:
  s=np.sin(2*np.pi*f*t)+.25*np.sin(4*np.pi*f*t)+.1*np.sin(6*np.pi*f*t);env=np.minimum(1,t/.004)*np.exp(-t*6)*np.minimum(1,(dur-t)/.025)
 return s*env
# A minor / F / C / G, sparse melody and harmonic movement under the voice.
chords=[(45,[57,60,64,71]),(41,[57,60,65,69]),(48,[55,60,64,67]),(43,[55,59,62,69])]
beat=60/124;bar=beat*4
for b,start in enumerate(np.arange(0,D,bar)):
 bass,notes=chords[b%4];energy=.45 if start<3.44 else .65 if 5.88<start<19.54 else 1 if 23.54<start<39.58 or 60.26<start<70.14 else .68
 if start>73.5:energy=.4
 for k,n in enumerate(notes):put(music,start,osc(n,bar+.65,'pad'),.014*energy,(k-1.5)*.3)
 for j in range(8):
  tt=start+j*beat/2;note=notes[(j+b)%4]+(12 if j%3==0 else 0);lead=osc(note,.55)
  put(music,tt,lead,.019*energy,.35*np.sin(j));put(music,tt+.23,lead,.006*energy,-.5*np.sin(j))
 for j in [0,2,3.5]:put(music,start+j*beat,osc(bass,.45,'bass'),.07*energy)
 if start>3:
  for j in [0,2]:
   t=np.arange(int(.26*SR))/SR;phase=2*np.pi*(46*t+55*.035*(1-np.exp(-t/.035)));kick=np.sin(phase)*np.exp(-t*16);put(music,start+j*beat,kick,.09*energy)
  for j in [1,3]:
   t=np.arange(int(.16*SR))/SR;noise=rng.normal(0,1,len(t));noise=np.r_[0,np.diff(noise)];snare=(noise*.28+np.sin(2*np.pi*190*t)*.3)*np.exp(-t*26);put(music,start+j*beat,snare,.045*energy,.08)
  for j in range(8):
   t=np.arange(int(.06*SR))/SR;h=rng.normal(0,1,len(t));h=np.r_[0,np.diff(h)]*np.exp(-t*80);put(music,start+j*beat/2,h,.007*energy,-.4 if j%2 else .4)
# Low musical cadence and smooth ending; original narration remains untouched.
for n in [45,57,60,64,69]:put(music,74.6,osc(n,2.75,'pad'),.017)
env=np.minimum(1,np.arange(N)/SR/.6)*np.minimum(1,(D-np.arange(N)/SR)/1.1);music*=env[:,None]
# Short original UI chords.
for time,notes in [(2.55,[72,76,79]),(16.96,[55,59]),(22.46,[67,72,76]),(23.96,[72]),(24.78,[76]),(36.02,[57,64,69]),(38.04,[60,67,72]),(66.72,[57,64,69]),(74.66,[72,76,81])]:
 for k,n in enumerate(notes):put(fx,time+k*.045,osc(n,.38),.035,(k-1)*.2)
for tt in [8.87,11.65,18.32,26.2,29.7,33.8,46.2,48.6,63.75]:
 t=np.arange(int(.14*SR))/SR;s=(rng.normal(0,.18,len(t))+np.sin(2*np.pi*72*t))*np.exp(-t*32);put(fx,tt,s,.045)
# Selective steps, restrained rather than on every visible movement.
for a,b in [(3.44,5.88),(9.2,11.1),(21.4,22.4),(44.04,45.2),(60.26,62.5),(64,66.2)]:
 for tt in np.arange(a,b,.31):
  t=np.arange(int(.045*SR))/SR;put(fx,tt,rng.normal(0,1,len(t))*np.exp(-t*100),.012)
# Weather with softer bandwidth and a fade in/out.
t=np.arange(int(6.2*SR))/SR;n=rng.normal(0,1,len(t));n=sosfilt(butter(2,[500,5200],btype='band',fs=SR,output='sos'),n);n*=np.minimum(1,t/.7)*np.minimum(1,(6.2-t)/.5);put(fx,13.66,n,.027)
for tt in [19.54,23.10,35.56,39.58,44.04,49.16,60.26,66.72]:
 t=np.arange(int(.48*SR))/SR;n=rng.normal(0,1,len(t));n=sosfilt(butter(2,1800,fs=SR,output='sos'),n);put(fx,tt,n*np.sin(np.pi*t/.48)**2,.045,-.2)
for tt in [47.14,47.55,48.24]:put(fx,tt,osc(81,.13),.018,.4)
for name,arr in [('trilha',music),('efeitos',fx)]:
 print(name,'peak',float(abs(arr).max()));write(root/'assets'/f'{name}.wav',SR,(np.clip(arr,-.98,.98)*32767).astype(np.int16))
