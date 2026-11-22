import numpy as np, subprocess, soundfile as sf, scipy.signal as ss
SR=48000; K=1.5; DUR=30.0*K; N=int(SR*DUR)
def load(p):
    raw=subprocess.run(['ffmpeg','-v','0','-i',p,'-f','f32le','-ac','2','-ar',str(SR),'-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2).copy()
voice=np.zeros((N,2),np.float32); fx=np.zeros((N,2),np.float32)
def put(buf,x,t,db=0,pan=0.0):
    i=int(round(t*SR)); x=x*10**(db/20)
    if pan: x=x*np.array([1-max(0,pan),1+min(0,pan)],np.float32)
    if i<0: x=x[-i:]; i=0
    x=x[:N-i]; buf[i:i+len(x)]+=x
# narração (Kokoro pm_alex, pt-BR)
NT=[0.3,4.3,8.0,10.75,13.35,18.6,21.6,25.95]
for i,t in enumerate(NT): put(voice,load(f'proj/public/audio2/slow_{i}.wav'),t*K)
C={}
def s(name,t,db,align='onset',pan=0.0,rate=1.0):
    if name not in C: C[name]=load(f'sfx2/{name.replace("/","_")}.wav')
    x=C[name]
    if rate!=1.0: x=ss.resample(x,int(len(x)/rate)).astype(np.float32)
    e=np.abs(x).max(1); off=int(np.argmax(e)) if align=='peak' else int(np.argmax(e>e.max()*0.1))
    put(fx,x,t*K-off/SR,db,pan)
# 1 · abertura
s('whoosh_big/reverse',0.55,-6,'peak')
s('pro_pop_in/airy',0.18,-8)
for i in range(0,16,2): s('pro_typing_key/tick',0.5+i*0.03,-16,pan=(i/16-0.5)*0.6)
s('swish/soft',1.4,-12,'peak')
# 2 · transição + celular
s('whoosh_fast/heavy',3.95,-5,'peak')
s('whoosh_big/thump',4.55,-7,'peak')
s('pro_pop_in/round',4.1,-10)
for t in [4.3,8.0,10.7,13.0]: s('pro_zip/up',t,-12,pan=0.4); s('ui_pop/step',t+0.05,-12,pan=0.4)
s('tap/glass',4.25,-8); s('swipe/glide',4.62,-10,'peak')
for k in range(6): s('pro_hover_tick/detent',5.3+k*0.25,-14+k)          # foco caçando
s('pro_riser/nblips',5.7,-9)                                             # leitura
s('pro_notify/ding_2167',6.87,-5); s('shutter/snap',6.85,-8)             # travou no QR
s('notify/mid_tine',7.18,-8)
s('tap/glass',7.9,-7); s('swish/zing',8.25,-9,'peak')                    # abre o 7me
s('tap/glass',8.95,-7); s('toggle/on',9.02,-9)
for i in range(8): s('typing_key/light',9.45+i*0.1,-11,rate=1+0.03*(i%3))
s('tap/glass',10.85,-7); s('pro_shimmer/m1',11.15,-9); s('swipe/flick',11.15,-11,'peak')
s('tap/glass',12.05,-7); s('pro_pop/tink',12.25,-6); s('toggle/latch',12.28,-10)
s('whoosh_fast/whip',13.6,-5,'peak')                                     # troca pro banco
for t in [14.45,15.25,15.85,16.7]: s('tap/glass',t,-8)
for t in [14.75,15.55,16.9]: s('swish/flick',t+0.1,-12,'peak')
s('tap/soft',16.25,-8); s('pro_pop/double',16.37,-7)                     # colar
s('riser/build',18.42,-9,'peak')                                         # tensão até confirmar
s('tap/glass',17.85,-5)
s('pro_logo_sting/sweep_hit',18.45,-5,'peak'); s('shimmer/m2',18.5,-12)  # PIX ENVIADO
# 3 · resumo
s('whoosh_big/swell',21.1,-6,'peak')
for i in range(0,14,2): s('pro_typing_key/tick',21.2+i*0.03,-17)
for i in range(4): s('pro_pop_in/knock',21.72+i*0.22,-8,rate=1+0.06*i,pan=(i-1.5)*0.25)
s('pro_zip/up_hi',23.0,-10)
# 4 · fechamento
s('riser/swell',25.9,-10,'peak')
s('whoosh_big/thump',25.95,-6,'peak')
s('pro_pop_in/airy',26.02,-9)
s('sub_drop/808',26.72,-6); s('impact/punch',26.72,-8)
s('logo_sting/soft_bloom',27.65,-9,'peak')
# trilha: Open Bars 20220223 (CC0), cortada em compassos conforme a história
m=load('/home/claude/srcs/openbars-assets/releases/2022/02/20220223.mp3'); B=1.8576; b=lambda n:0.07+n*B
mus=np.zeros((N,2),np.float32)
def seg(o0,o1,src,g=1.0,fi=0.01,fo=0.02):
    o0*=K; o1*=K
    x=m[int(src*SR):int(src*SR)+int((o1-o0)*SR)].copy()*g
    a=int(fi*SR); z=int(fo*SR)
    if a: x[:a]*=np.linspace(0,1,a)[:,None]
    if z: x[-z:]*=np.linspace(1,0,z)[:,None]
    put(mus,x,o0)
seg(0.0,3.95,b(0),0.9,0.4)          # curiosidade (intro)
seg(3.95,13.35,b(8),1.0)            # groove leve: câmera + app
seg(13.35,18.45,b(32),1.0)          # cheio: banco, tensão
seg(18.45,25.95,b(65),1.05)         # pico: Pix enviado + resumo
seg(25.95,30.0,b(97),1.0,0.01,1.6)  # final
env=np.abs(voice).max(1); env=ss.filtfilt(*ss.butter(1,3/(SR/2)),env)
duck=np.clip(1-env*5,0.45,1.0)
mus*=duck[:,None]*10**(-13/20)
mix=voice*1.15+fx*0.9+mus
mix[-int(0.6*SR):]*=np.linspace(1,0,int(0.6*SR))[:,None]
mix/=max(1,np.abs(mix).max()/0.89)
sf.write('doacao3_pre.wav',mix,SR); print('ok')
