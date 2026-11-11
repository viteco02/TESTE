import json, numpy as np
S=[tuple(map(float,l.split())) for l in open('sil.txt') if len(l.split())==2]
R=[(70.50,73.25),(24.45,30.01),(30.68,47.72),(52.00,63.35),(65.82,74.23),(91.39,105.84),(114.96,132.09),(133.72,140.73),(143.22,168.30)]
P=[]
for a,b in R:
    cur=a
    for s,e in S:
        if s>a and e<b and e-s>0.45:
            P.append((cur,s+0.12)); cur=e-0.12
    P.append((cur,b))
P=[(round(a,3),round(b,3)) for a,b in P if b-a>0.15]
json.dump(P,open('edl.json','w')); print(len(P),'peças', round(sum(b-a for a,b in P),2),'s'); print(P)
