import json
cw=json.load(open('cut_words.json')); face=json.load(open('face.json'))
SH=[(13.4,23.35,260),(23.4,31.95,-330)]   # janelas em que a pessoa desliza para o lado (dx em px)
cards=[
 dict(site='Itatiaia',domain='itatiaia.com.br',date='16/10/2026',title='Estudo de 1960 previu fim do mundo para 13 de novembro de 2026; entenda',lead='Físico austríaco Heinz von Foerster projetou que a população mundial cresceria até um limite matemático',t0=13.6,t1=19.25,x=30,y=430,rot=-3,w=620),
 dict(site='Diário do Pará',domain='diariodopara.com.br',date='08/11/2026',title='Apagão mundial em 17 de novembro? Previsão de Os Simpsons viraliza',lead='Teoria ganhou as redes após internautas associarem episódio a um teste de emergência nos EUA',t0=19.3,t1=23.35,x=30,y=300,rot=-2.5,w=620),
 dict(site='DCI',domain='dci.com.br',date='07/11/2026',title='Os Simpsons previram apagão mundial no dia 17 de novembro? Entenda a teoria que viralizou',lead='“O que está previsto é uma transmissão de teste com duração aproximada de um minuto.”',t0=20.75,t1=23.35,x=60,y=700,rot=2.5,w=600),
 dict(site='Game Overdrive',domain='gameoverdrive.com.br',date='08/11/2026',title='Vai ter apagão de 3 dias no Brasil em 17 de novembro? Saiba o que é verdade',lead='“Não existe previsão oficial de uma interrupção nacional de energia nessa data.”',t0=23.6,t1=31.95,x=500,y=360,rot=2.5,w=570),
]
bg=[
 dict(text='confusão',t0=4.2,t1=6.3,y=330,size=250),
 dict(text='BBC',t0=10.4,t1=13.3,y=300,size=330),
 dict(text='confusa',t0=32.2,t1=34.4,y=330,size=240,serif=True,color='#C8FF2E'),
 dict(text='sinal?',t0=40.2,t1=42.8,y=320,size=300,serif=True,color='#C8FF2E'),
 dict(text='LUCAS 21:28',t0=43.0,t1=46.2,y=330,size=170),
 dict(text='redenção',t0=54.9,t1=56.6,y=320,size=260,serif=True,color='#C8FF2E'),
 dict(text='APAGÃO?',t0=68.7,t1=72.4,y=330,size=230),
 dict(text='APOCALIPSE 7',t0=77.0,t1=79.25,y=330,size=160),
 dict(text='CHAMADO',t0=87.2,t1=89.6,y=330,size=220),
 dict(text='identidade',t0=90.9,t1=93.4,y=320,size=230,serif=True,color='#C8FF2E'),
 dict(text='PERSEVERAR',t0=96.9,t1=100.1,y=330,size=180),
]
dim=[(b['t0'],b['t1']) for b in bg]+[(13.4,31.95)]
shots=[(0,1.42),(2.77,1.15),(6.17,1.32),(8.1,1.12),(13.4,1.0),(23.4,1.0),(32.07,1.38),(34.4,1.18),(39.1,1.45),(42.83,1.15),(47.9,1.3),(51.5,1.12),(56.63,1.3),(64.0,1.14),(69.6,1.38),(72.43,1.15),(79.27,1.3),(84.5,1.14),(89.63,1.38),(96.0,1.18)]
keys=['Jesus?','confusão','BBC','mundo...','apagão.','teste','preocupada,','confusa.','sinal','sinais','cabeças','redenção','autoridades','Apocalipse','soltos.','consciência','Bíblia,','identidade','chamado','perseverando','Deus']
import numpy as np
def ss(x): return x*x*(3-2*x)
def dx_at(t):
    v=0
    for a,b,d in SH:
        k=min(max((t-a)/0.6,0),1)*min(max((b-t)/0.6,0),1); v+=d*ss(k) if k>0 else 0
    return v
fx=[x+dx_at(t)/1080 for t,x in zip(face['t'],face['x'])]
plan=dict(dur=cw['dur'],words=cw['words'],keys=keys,cards=cards,bgwords=bg,dim=dim,shots=[dict(t=a,z=b) for a,b in shots],face=dict(t=face['t'],x=fx,y=face['y']),hook=dict(t1=2.77),endcard=3.6,shift=SH)
json.dump(plan,open('../proj/src/plan.json','w'),ensure_ascii=False)
# expressão ffmpeg do deslocamento (smoothstep nas bordas, 0.6 s)
def win(a,b,d):
    up=f"clip((t-{a})/0.6,0,1)"; dn=f"clip(({b}-t)/0.6,0,1)"; k=f"({up})*({dn})"
    return f"{d}*({k})*({k})*(3-2*({k}))"
open('dx_expr.txt','w').write('+'.join(win(*w) for w in SH))
print('ok', plan['dur'])
