import numpy as np, subprocess, scipy.signal as ss, soundfile as sf
SR=48000; DUR=45.0; N=int(SR*DUR)
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
bars(0.0,0,2,a=0.4,z=0.02,g=0.9)      # soft: the teaser's last frame
bars(3.72,8,9,a=0.004)                # hats in on the strike
bars(5.43,61.93,64,a=0.02,z=0.01)     # build under the loading (aligned so bar 62 lands at 5.57)
bars(9.29,65,76,a=0.004)              # drop: NO AR + the tour
bars(29.72,94,97,a=0.004,z=0.01)      # break: tudo num só lugar / pega pronto
bars(35.30,97,100,a=0.004,z=0.02)     # back in: acesse agora / end card
put(40.87,b(115),b(115)+4.13,a=0.03,z=0.02)  # outro
mus=out.copy(); out[:]=0
def duck(t,db=-8,pre=0.35,post=0.12):
    i0=int((t-pre)*SR); i1=int(t*SR); i2=int((t+post)*SR); g=10**(db/20)
    env=np.ones(N,np.float32); env[i0:i1]=np.linspace(1,g,i1-i0); env[i1:i2]=np.linspace(g,1,i2-i1); return env
env=np.ones(N,np.float32)
for t in [3.72,9.29,37.15]: env*=duck(t)
mus*=env[:,None]
cache={}
def S(name):
    if name not in cache: cache[name]=load(SFX+name+'.mp3')
    return cache[name]
def pk(x): e=np.abs(x).max(1); return int(np.argmax(e))
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
# 1 · lembra / strike
sfx('sparkle',1.9,-16); sfx('whoosh-short',3.66,-9,'peak'); sfx('impact-bass-2',3.72,-5); sfx('glitch-1',3.72,-14,dur=0.4)
sfx('whoosh',3.95,-12,'peak',rate=0.8); sfx('whoosh-short',4.15,-8,'peak')
sfx('pop',4.30,-12,rate=0.8); sfx('impact-bass-1',4.88,-8)
# 2 · loading
sfx('whoosh-short',5.52,-8,'peak'); sfx('typing',5.75,-15,dur=1.35)
for k in range(14): sfx('click-soft',6.65+k*0.16,-20-k*0.0, rate=1+k*0.03)
sfx('riser',9.29,-8,'peak'); sfx('ping',8.98,-12)
# 3 · drop
sfx('impact-bass-2',9.29,-3); sfx('whoosh-cinematic',9.29,-9,'peak'); sfx('pop',9.75,-10,rate=0.9)
sfx('whoosh-short',10.18,-9,'peak'); sfx('impact-bass-1',10.22,-5); sfx('ping',10.62,-14)
sfx('whoosh',11.15,-12,'peak'); sfx('impact-bass-1',11.38,-10); sfx('whoosh-short',11.52,-11,'peak'); sfx('typing',12.07,-17,dur=0.6); sfx('sparkle',12.6,-14)
# 4 · tour
for tf in [13.0,14.86,16.72,18.58,20.43,22.29,24.15,26.0,27.86]: sfx('whoosh-short',tf-0.06,-8,'peak')
sfx('typing',13.05,-16,dur=0.5); sfx('pop',13.6,-13); sfx('click-soft',13.72,-15)
sfx('typing',14.91,-15,dur=0.6); sfx('click',15.71,-9); [sfx('pop',15.81+i*0.08,-15,rate=1+i*0.1) for i in range(3)]
[sfx('pop',16.67+i*0.045,-19,rate=0.9+i*0.04) for i in range(12)]; sfx('click-soft',17.72,-14)
[sfx('pop',18.43+i*0.07,-13,rate=0.8+i*0.08) for i in range(3)]; sfx('whoosh',18.83,-13,'peak')
sfx('impact-bass-1',20.48,-8); sfx('click',21.38,-8); sfx('typing',21.43,-20,dur=0.5); sfx('chime',22.03,-13)
sfx('sparkle',22.35,-15); [sfx('pop',22.44+i*0.13,-15) for i in range(2)]
sfx('whoosh-short',24.2,-12,'peak'); sfx('pop',24.35,-14); sfx('whoosh-short',24.55,-12,'peak'); sfx('pop',24.7,-14)
sfx('whoosh',26.05,-11,'peak'); sfx('impact-bass-1',26.12,-9); sfx('pop',26.62,-11,rate=0.75)
sfx('whoosh',27.9,-12,'peak'); sfx('pop',28.16,-13); sfx('whoosh-short',28.5,-15,'peak')
# 5 · gather / tudo
sfx('whoosh-cinematic',30.25,-8,'peak'); sfx('impact-bass-2',30.19,-7); sfx('whoosh-short',30.45,-9,'peak'); sfx('pop',30.55,-12)
sfx('whoosh-short',31.55,-8,'peak'); sfx('impact-bass-1',31.6,-8); sfx('impact-bass-1',32.53,-8); sfx('pop',33.44,-12); sfx('whoosh-short',33.78,-10,'peak'); sfx('pop',33.9,-13)
# 6 · acesse / end
sfx('whoosh-short',35.25,-7,'peak'); sfx('impact-bass-2',35.3,-6); sfx('impact-bass-1',35.78,-6); sfx('click',36.46,-7); sfx('chime',36.6,-14)
sfx('whoosh-cinematic',37.15,-8,'peak'); sfx('impact-bass-2',37.38,-5); sfx('whoosh-short',37.55,-10,'peak')
sfx('whoosh-short',37.92,-9,'peak'); sfx('pop',38.05,-12); sfx('typing',38.55,-19,dur=0.9); sfx('sparkle',39.05,-13); sfx('chime',40.65,-12)
fx=out.copy()
ir_n=int(1.4*SR); rng=np.random.default_rng(3); ir=rng.standard_normal((ir_n,2)).astype(np.float32)*np.exp(-np.arange(ir_n)/SR*4.2)[:,None]; ir[:int(0.012*SR)]=0
wet=np.stack([ss.fftconvolve(fx[:,c],ir[:,c])[:N] for c in range(2)],1).astype(np.float32); wet*=0.10/np.abs(ir).sum(0).max()*30
mix=mus*0.85+fx+wet*0.35
i0=int(44.2*SR); mix[i0:]*=np.linspace(1,0,N-i0)[:,None]
mix/=max(1.0,np.abs(mix).max()/0.89)
sf.write('pre.wav',mix,SR); print('ok',np.abs(mix).max())
