import sherpa_onnx, soundfile as sf, numpy as np, glob, json
L=["Visitante, quer contribuir com a nossa igreja? É bem simples.",
"Abra a câmera do celular e aponte para o QR Code.",
"Toque no link, escolha a oferta e digite o valor.",
"Toque em gerar Pix e copie o código.",
"Agora abra o aplicativo do seu banco, entre em Pix Copia e Cola, cole o código e confirme.",
"Pronto! Sua contribuição foi enviada.",
"Obrigado pela sua visita. Volte sempre!"]
d='/home/claude/tts/vits-piper-pt_BR-faber-medium'; onnx=glob.glob(d+'/*.onnx')[0]
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=onnx,tokens=d+'/tokens.txt',data_dir=d+'/espeak-ng-data'),num_threads=2))
tts=sherpa_onnx.OfflineTts(cfg); out=[]
for i,t in enumerate(L):
    a=tts.generate(t,sid=0,speed=1.05); x=np.array(a.samples)
    nz=np.where(np.abs(x)>0.01)[0]; x=x[max(0,nz[0]-400):nz[-1]+800]
    f=f'/home/claude/fachada/proj/public/audio/n{i}.wav'; sf.write(f,x,a.sample_rate); out.append(round(len(x)/a.sample_rate,2))
print(out)
