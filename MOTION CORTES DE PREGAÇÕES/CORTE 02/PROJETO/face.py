import cv2, numpy as np, json
cap=cv2.VideoCapture('corte_raw.mov'); fps=cap.get(5); det=cv2.FaceDetectorYN.create('/home/claude/bruto/yunet.onnx','',(540,960),0.6,0.3,5000); out=[]; i=0
while cap.grab():
    if i%3==0:
        _,fr=cap.retrieve(); _,fc=det.detect(cv2.resize(fr,(540,960)))
        out.append([i/fps]+((lambda r:[(r[0]+r[2]/2)/540,(r[1]+r[3]/2)/960])(max(fc,key=lambda r:r[2]*r[3])[:4]) if fc is not None and len(fc) else [None]*2))
    i+=1
t=np.array([o[0] for o in out]); arr=np.array([[np.nan if v is None else v for v in o[1:]] for o in out],float); ok=~np.isnan(arr[:,0])
for k in range(2): arr[:,k]=np.interp(t,t[ok],arr[ok,k]); arr[:,k]=np.convolve(np.pad(arr[:,k],7,mode='edge'),np.ones(15)/15,'valid')
json.dump({'t':t.round(3).tolist(),'x':arr[:,0].round(4).tolist(),'y':arr[:,1].round(4).tolist()},open('face.json','w'))
print('rosto',ok.sum(),'/',len(t), 'x', arr[:,0].min().round(2), arr[:,0].max().round(2), 'y', arr[:,1].min().round(2), arr[:,1].max().round(2))
