# Contorno de pose real -> linhas vetoriais (JSON) para animar como desenho neon
import cv2, numpy as np, onnxruntime as ort, json, sys
def mask_of(img):
    s = ort.InferenceSession('/root/.u2net/u2net_human_seg.onnx', providers=['CPUExecutionProvider']); inp = s.get_inputs()[0].name
    h, w = img.shape[:2]; im = cv2.resize(img, (320, 320))[:, :, ::-1] / 255.0
    im = ((im - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
    m = s.run(None, {inp: im})[0][0, 0]; m = (m - m.min()) / (m.max() - m.min() + 1e-6)
    m = cv2.resize(m, (w, h)); seg = (m > 0.5).astype(np.uint8) * 255
    # reforço com a luminância (fundo preto puro): une o que a rede perdeu
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); lum = (cv2.GaussianBlur(g, (5, 5), 0) > 22).astype(np.uint8) * 255
    lum = cv2.morphologyEx(lum, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(lum); keep = np.zeros_like(lum)
    for i in range(1, n):
        if st[i, 4] > 0.01 * w * h and (seg[lab == i] > 0).mean() > 0.2: keep[lab == i] = 255
    return cv2.morphologyEx(cv2.bitwise_or(seg, keep), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
def poly(c, eps):
    a = cv2.approxPolyDP(c, eps, True)[:, 0, :].astype(float); return a
src, out = sys.argv[1], sys.argv[2]
img = cv2.imread(src); h, w = img.shape[:2]; M = mask_of(img)
ys, xs = np.where(M > 0); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max(); S = max(x1 - x0, y1 - y0)
def nrm(p): return [[round((x - (x0 + x1) / 2) / S, 4), round((y - y1) / S, 4)] for x, y in p]   # origem: pés, centro
cs, _ = cv2.findContours(M, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); cs = sorted(cs, key=cv2.contourArea, reverse=True)[:3]
outer = [nrm(poly(c, S * 0.0025)) for c in cs if cv2.contourArea(c) > 0.002 * S * S]
# linhas internas: bordas fortes dentro da pessoa (dobras, rosto, mãos)
g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); g = cv2.bilateralFilter(g, 9, 40, 9)
ed = cv2.Canny(g, 90, 200); ed[cv2.erode(M, np.ones((15, 15), np.uint8)) == 0] = 0
ec, _ = cv2.findContours(ed, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
inner = []
for c in sorted(ec, key=lambda c: cv2.arcLength(c, False), reverse=True)[:40]:
    L = cv2.arcLength(c, False)
    if L < S * 0.12: continue
    p = cv2.approxPolyDP(c, S * 0.006, False)[:, 0, :]
    # contornos do Canny voltam por cima de si: pega só metade do caminho
    p = p[: max(2, len(p) // 2 + 1)]; inner.append(nrm(p))
json.dump({'aspect': round((x1 - x0) / (y1 - y0), 4), 'outer': outer, 'inner': inner[:12]}, open(out, 'w'))
cv2.imwrite(out.replace('.json', '_mask.png'), M)
print(src, 'outer', [len(o) for o in outer], 'inner', len(inner))
