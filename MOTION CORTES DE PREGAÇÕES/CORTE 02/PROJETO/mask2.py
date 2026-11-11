import cv2, numpy as np, subprocess
cap=cv2.VideoCapture('mask.mp4'); W,H=540,960
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','gray','-s',f'{W}x{H}','-r','30','-i','-','-c:v','libx264','-crf','12','-pix_fmt','yuv420p','mask2.mp4'],stdin=subprocess.PIPE)
K1=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,131)); K2=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5))
while True:
    ok,f=cap.read()
    if not ok: break
    m=f[:,:,0]
    b=(m>110).astype(np.uint8)*255
    c=cv2.morphologyEx(b,cv2.MORPH_CLOSE,K1,borderType=cv2.BORDER_CONSTANT,borderValue=0)
    # preenche buracos internos
    c=cv2.erode(c,K2)
    soft=np.maximum(m.astype(np.float32)*(c>0), 0); hard=c.astype(np.float32)
    out=np.clip(np.maximum(hard*0.0+soft, (c>0)*255*0.98),0,255)  # interior sólido
    out=cv2.GaussianBlur(cv2.erode(out,K2),(7,7),0)
    p.stdin.write(out.astype(np.uint8).tobytes())
p.stdin.close(); p.wait(); print('ok')
