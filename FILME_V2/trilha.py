"""Trilha instrumental original sintetizada; sem amostras externas."""
import numpy as np,wave,json,subprocess
rate=48000;duration=57.652208;n=int(rate*duration);t=np.arange(n)/rate
music=np.zeros(n)
chords=[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]]
for bar in range(15):
 start=bar*4;end=min(start+5,duration);a=int(start*rate);b=int(end*rate);tt=t[a:b]-start
 env=(1-np.exp(-tt*1.2))*np.minimum(1,(end-start-tt)/1.2)
 for note in chords[bar%4]:
  hz=440*2**((note-69)/12)
  music[a:b]+=.06*env*(np.sin(2*np.pi*hz*tt)+.22*np.sin(2*np.pi*hz*2.001*tt)+.12*np.sin(2*np.pi*hz*.999*tt))
 for j in range(8):
  st=start+j*.5;a2=int(st*rate);b2=min(n,a2+int(rate*2.6))
  if a2>=n:continue
  q=np.arange(b2-a2)/rate;note=chords[bar%4][j%4]+12;hz=440*2**((note-69)/12)
  music[a2:b2]+=.12*np.exp(-q*2.5)*(1-np.exp(-q*65))*(np.sin(2*np.pi*hz*q)+.25*np.sin(2*np.pi*hz*2*q))
music*=np.interp(t,[0,5.2,11.22,17.14,28.64,35.66,46.26,49.76,55.48,57.652208],[.3,.35,.65,1.,.78,.8,.7,.85,1.2,.85])
voice=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i','../NARRAÇÃO.MP3','-ac','1','-ar',str(rate),'-f','f32le','-']),dtype=np.float32)
# Duck the bed during voiced windows, preserve original narration separately.
for s in json.load(open('timeline_palavras.json')):
 a=max(0,int((s['start']-.1)*rate));b=min(n,int((s['end']+.15)*rate));music[a:b]*=.52
music*=np.minimum(1,t/2)*np.minimum(1,(duration-t)/1.2)
# Efeitos originais sutis de ar e pulsos, gerados sem amostras externas.
rng=np.random.default_rng(72)
for start in [5.2,8.52,11.22,13.66,15.12,17.14,19.38,24.2,28.94,30.46,34.34,36.56,38.88,39.88,46.26,47.42,48.84,49.76,53.84]:
 a=int(start*rate);b=min(n,a+int(.32*rate));q=np.arange(b-a)/rate
 noise=rng.normal(0,1,b-a);noise=np.convolve(noise,np.ones(17)/17,mode='same')
 music[a:b]+=.11*noise*np.sin(np.pi*q/.32)**2+.035*np.sin(2*np.pi*(85*q-40*q*q))*np.exp(-q*18)
left=music;right=.98*music+.02*np.roll(music,480)
stereo=np.stack([left,right],axis=1)
with wave.open('trilha.wav','wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes((np.clip(stereo,-1,1)*32767).astype('<i2').tobytes())
