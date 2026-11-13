# Alinhamento palavra a palavra: divide cada peça em trechos falados (pausas >=0.12 s) e reparte as palavras por DP
import json, glob, subprocess, sys, os, numpy as np, soundfile as sf
wd = sys.argv[1]; os.chdir(wd)
subprocess.run(['ffmpeg','-v','error','-y','-i','corte_raw.mov','-ac','1','-ar','16000','cut16.wav'],check=True)
P = json.load(open('edl.json')); TX = json.load(open('texts.json'))
durs = [round((p[2]-p[1] if len(p)==4 else p[1]-p[0])*30)/30 for p in P]
x, sr = sf.read('cut16.wav'); h = int(0.01*sr); n = len(x)//h
e = 20*np.log10(np.sqrt((x[:n*h]**2).reshape(n,h).mean(1))+1e-9); e = np.convolve(e, np.ones(3)/3, 'same')
words=[]; segs=[]; t0=0.0
for d, txt in zip(durs, TX):
    a, b = t0, t0+d; t0 = b; segs.append([round(a,3), round(b,3)])
    ws = txt.split()
    if not ws: continue
    ia, ib = int(a*100), int(b*100); seg = e[ia:ib]; thr = max(np.percentile(seg, 25)+4, seg.max()-30)
    v = seg > thr; runs=[]; i=0
    while i < len(v):
        if v[i]:
            j=i
            while j < len(v) and (v[j] or (j+12 < len(v) and v[j:j+12].any())): j+=1
            if j-i >= 8: runs.append((i, j))
            i=j
        else: i+=1
    if not runs: runs=[(0, len(seg))]
    W = np.array([len(w.strip('.,?!:"…'))+1.2 for w in ws]); R = np.array([r[1]-r[0] for r in runs], float)
    nW, nR = len(ws), len(runs)
    if nR > nW: runs = sorted(sorted(runs, key=lambda r: r[0]-r[1])[:nW]); R = np.array([r[1]-r[0] for r in runs], float); nR = len(runs)
    # DP: grupos consecutivos de palavras por trecho
    cw = np.r_[0, np.cumsum(W)]/W.sum(); cr = np.r_[0, np.cumsum(R)]/R.sum()
    INF=1e9; D=np.full((nR+1,nW+1),INF); B=np.zeros((nR+1,nW+1),int); D[0,0]=0
    for r in range(1,nR+1):
        for k in range(r,nW-(nR-r)+1):
            for m in range(r-1,k):
                c=D[r-1,m]+(cw[k]-cr[r])**2
                if c<D[r,k]: D[r,k]=c; B[r,k]=m
    cuts=[nW]; k=nW
    for r in range(nR,0,-1): k=B[r,k]; cuts.append(k)
    cuts=cuts[::-1]
    for r in range(nR):
        g = list(range(cuts[r], cuts[r+1])); s0, s1 = runs[r]; ww = W[g]; c = np.r_[0, np.cumsum(ww)[:-1]]/ww.sum()
        for gi, cc in zip(g, c): words.append({'w': ws[gi], 't': round(a + (s0 + cc*(s1-s0))/100, 2)})
hook = round(sum(durs[:3]),3) if len(P[0])==4 else round(durs[0],3)
json.dump({'dur':round(t0,3),'hook':hook,'segs':segs,'words':words},open('cut_words.json','w'),ensure_ascii=False)
print('dur', round(t0,3), 'hook', hook); print(' '.join(f"{w['w']}@{w['t']}" for w in words[:60]))
