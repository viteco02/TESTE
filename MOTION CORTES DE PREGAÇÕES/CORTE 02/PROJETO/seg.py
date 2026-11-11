# Máscara da pessoa (u2net_human_seg) por quadro → vídeo cinza 540x960
import cv2, numpy as np, onnxruntime as ort, subprocess, sys
src, out = sys.argv[1], sys.argv[2]
so = ort.SessionOptions(); so.intra_op_num_threads = 2
s = ort.InferenceSession('/root/.u2net/u2net_human_seg.onnx', so, providers=['CPUExecutionProvider']); inp = s.get_inputs()[0].name
cap = cv2.VideoCapture(src); n = int(cap.get(7)); W, H = 540, 960
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{H}', '-r', '30', '-i', '-', '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
mean = np.array([0.485, 0.456, 0.406]); std = np.array([0.229, 0.224, 0.225]); prev = None; i = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    im = cv2.resize(fr, (320, 320))[:, :, ::-1] / 255.0; im = ((im - mean) / std).transpose(2, 0, 1)[None].astype(np.float32)
    m = s.run(None, {inp: im})[0][0, 0]; m = (m - m.min()) / (m.max() - m.min() + 1e-6)
    m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)
    m = np.clip((m - 0.35) / 0.4, 0, 1)
    if prev is not None: m = 0.6 * m + 0.4 * prev
    prev = m; m8 = (cv2.GaussianBlur(m, (5, 5), 0) * 255).astype(np.uint8)
    p.stdin.write(m8.tobytes()); i += 1
    if i % 300 == 0: print(i, '/', n, flush=True)
p.stdin.close(); p.wait(); print('ok', i)
