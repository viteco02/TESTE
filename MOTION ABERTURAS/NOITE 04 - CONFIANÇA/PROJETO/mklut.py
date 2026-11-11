import numpy as np, sys
N=33; mix=float(sys.argv[1]) if len(sys.argv)>1 else 0.7
stops=[(0,(2,8,34)),(0.30,(8,34,140)),(0.55,(35,104,242)),(0.80,(140,180,255)),(1.0,(255,255,255))]
def gm(y):
    for (a,ca),(b,cb) in zip(stops,stops[1:]):
        if y<=b:
            t=(y-a)/(b-a); return np.array(ca)*(1-t)+np.array(cb)*t
    return np.array(stops[-1][1])
L=[f'LUT_3D_SIZE {N}']
for bi in range(N):
  pass
lines=[]
for b in range(N):
  for g in range(N):
    for r in range(N):
      c=np.array([r,g,b])/(N-1); y=0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
      y=np.clip((y-0.02)/0.96,0,1); y=y**0.95
      d=gm(y)/255
      o=y+(c-y)*0.55; o=o*np.array([0.86,0.97,1.12])
      out=np.clip(mix*d+(1-mix)*o,0,1)
      lines.append('%.5f %.5f %.5f'%tuple(out))
open('blue.cube','w').write('\n'.join(L+lines)+'\n')
