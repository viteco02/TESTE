import numpy as np, subprocess, scipy.signal as ss, os
SR=48000; DUR=65.0; N=int(SR*DUR)
SFX='/root/.claude/skills/media-use/audio/assets/sfx/'
MUS='/home/claude/srcs/openbars-assets/releases/2022/02/20220223.mp3'
def load(p):
    raw=subprocess.run(['ffmpeg','-v','0','-i',p,'-f','f32le','-ac','2','-ar',str(SR),'-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2).copy()
m=load(MUS); B=1.8576; b=lambda n:0.07+n*B
out=np.zeros((N,2),np.float32)
def fade(x,a=0.02,z=0.02):
    x=x.copy(); na=int(a*SR); nz=int(z*SR)
    if na: x[:na]*=np.linspace(0,1,na)[:,None]
    if nz: x[-nz:]*=np.linspace(1,0,nz)[:,None]
    return x
def put(o0,s0,s1,g=1.0,a=0.015,z=0.03):
    x=fade(m[int(s0*SR):int(s1*SR)],a,z)*g; i=int(o0*SR); x=x[:N-i]; out[i:i+len(x)]+=x
def bars(o0,n0,n1,**k): put(o0,b(n0),b(n1),**k)
# music edit (out bar n = n*B)
put(0.0,b(0),b(0)+10.22,z=0.06)            # intro; hard rest 10.22–13.0 (NÃO is alone)
bars(13.0,8,12,a=0.004)                    # groove under the lines
bars(20.43,32,35,a=0.004,z=0.01)           # full: the storm, cut dead at 26.0
put(26.93,b(29),b(29)+5.57,a=0.25,z=0.05)  # breakdown pad
bars(32.5,94,96.5,a=0.02)                  # break under the crack
bars(37.15,61,65,a=0.004)                  # build into the drop
bars(44.58,65,69,a=0.004,g=1.0)            # peak: the logo
bars(52.0,94,96,a=0.02,z=0.05)             # countdown thins out
put(55.73,b(115),b(115)+9.27,a=0.03,z=2.2,g=0.9)  # outro under QUASE / EM BREVE
mus=out.copy(); out[:]=0
# duck music 0.35 s before big hits
def duck(t,db=-8,pre=0.35,post=0.12):
    i0=int((t-pre)*SR); i1=int(t*SR); i2=int((t+post)*SR); g=10**(db/20)
    env=np.ones(N,np.float32); env[i0:i1]=np.linspace(1,g,i1-i0); env[i1:i2]=np.linspace(g,1,i2-i1); return env
env=np.ones(N,np.float32)
for t in [37.15,44.58,60.37]: env*=duck(t)
mus*=env[:,None]
# sfx
cache={}
def S(name):
    if name not in cache: cache[name]=load(SFX+name+'.mp3')
    return cache[name]
def pk(x): e=np.abs(x).max(1); return int(np.argmax(ss.medfilt(e,1)))
def onset(x): e=np.abs(x).max(1); return int(np.argmax(e>e.max()*0.1))
def sfx(name,t,db=0,align='onset',rate=1.0,dur=None,lp=None):
    x=S(name)
    if rate!=1.0: x=ss.resample(x,int(len(x)/rate)).astype(np.float32)
    if dur: x=fade(x[:int(dur*SR)],0.002,min(0.15,dur/3))
    if lp: s=ss.butter(2,lp/(SR/2),output='sos'); x=ss.sosfilt(s,x,axis=0).astype(np.float32)
    off=pk(x) if align=='peak' else onset(x)
    i=int(t*SR)-off; x=x*10**(db/20)
    if i<0: x=x[-i:]; i=0
    x=x[:N-i]; out[i:i+len(x)]+=x
sfx('whoosh-cinematic',1.6,-10,'peak',rate=0.8,lp=3000)
sfx('whoosh-short',4.70,-8,'peak'); sfx('impact-bass-1',5.10,-9)
for t in [7.43,8.36,9.29]: sfx('whoosh-short',t-0.08,-7,'peak'); sfx('click',t+0.02,-12)
sfx('impact-bass-2',11.15,-5); sfx('whoosh',11.18,-9)
for t in [13.0,14.86,16.72,18.58,20.43]: sfx('whoosh-short',t-0.12,-8,'peak')
sfx('impact-bass-1',13.38,-12,lp=1500); sfx('sparkle',15.05,-13); sfx('whoosh',16.9,-12,'peak'); sfx('pop',18.75,-12,rate=0.8)
for i,t in enumerate([20.43,21.36,22.06,22.52,22.99,23.22,23.45]): sfx('pop',t,-10,rate=0.85+0.05*i)
sfx('whoosh-cinematic',24.7,-8,'peak')
sfx('ping',27.37,-14); sfx('glitch-1',29.05,-15,dur=0.5); sfx('sparkle',31.25,-12)
sfx('glitch-2',32.51,-10,dur=0.6); sfx('impact-bass-1',32.51,-6)
sfx('riser',37.15,-9,'peak',dur=None)
sfx('impact-bass-2',37.15,-6); sfx('whoosh',38.15,-11,'peak'); sfx('whoosh-short',39.08,-6,'peak')
for i in range(4): sfx('click-soft',39.94+i*0.04*2,-14)
sfx('sparkle',40.95,-14); sfx('typing',41.33,-18,dur=0.9)
for t in [41.8,42.26,42.73,43.19,43.66,44.12]: sfx('whoosh-short',t-0.1,-12,'peak'); sfx('pop',t,-15)
sfx('typing',42.28,-16,dur=0.5); sfx('click',42.68,-10)
sfx('whoosh-cinematic',44.9,-8,'peak'); sfx('impact-bass-2',45.02,-4); sfx('impact-bass-1',45.43,-7); sfx('whoosh-short',45.6,-11,'peak')
sfx('chime',48.25,-13)
for t in [52.94,53.87,54.8]: sfx('impact-bass-1',t+0.05,-8); sfx('click',t,-9)
sfx('whoosh',55.5,-9,'peak'); sfx('pop',55.75,-10,rate=0.7)
sfx('whoosh-short',57.1,-6,'peak'); sfx('glitch-3',57.12,-16,dur=0.35)
sfx('whoosh',58.48,-11,'peak'); sfx('impact-bass-2',60.37,-5); sfx('chime',60.75,-10)
fx=out.copy()
# one room: short convolution reverb on sfx
ir_n=int(1.4*SR); rng=np.random.default_rng(3); ir=rng.standard_normal((ir_n,2)).astype(np.float32)*np.exp(-np.arange(ir_n)/SR*4.2)[:,None]; ir[:int(0.012*SR)]=0
wet=np.stack([ss.fftconvolve(fx[:,c],ir[:,c])[:N] for c in range(2)],1).astype(np.float32); wet*=0.10/np.abs(ir).sum(0).max()*30
mix=mus*0.85+fx+wet*0.35
mix[int(64.35*SR):]*=np.linspace(1,0,N-int(64.35*SR))[:,None]
mix/=max(1.0,np.abs(mix).max()/0.89)
import soundfile as sf; sf.write('/home/claude/casaja/ot/pre.wav',mix,SR)
print('ok', np.abs(mix).max())
