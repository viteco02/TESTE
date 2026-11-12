IN=voz48.wav
ffmpeg -v error -y -i $IN -af "highpass=f=85,arnndn=m=sh.rnnn:mix=0.85,afftdn=nf=-32:nr=10,equalizer=f=250:t=q:w=1.2:g=-3,equalizer=f=3200:t=q:w=1.0:g=3,highshelf=f=9000:g=2,acompressor=threshold=-22dB:ratio=3:attack=6:release=150:makeup=3,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 48000 vozA.wav
