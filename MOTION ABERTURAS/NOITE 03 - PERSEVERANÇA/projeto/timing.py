import json, numpy as np, soundfile as sf
P = json.load(open('work/phrases.json'))
KW = {'pesa': ('pesa', 'pesa'), 'resposta': ('ora', 'resposta'), 'resultados': ('esforca', 'resultados'), 'aparecem': ('esforca', 'aparecem'),
 'dificuldades': ('acumulam', 'dificuldades'), 'acumulam': ('acumulam', 'acumulam'), 'cansaco': ('cansaco', 'cansaço'), 'alto': ('cansaco', 'alto'),
 'silencio': ('silencio', 'silêncio'), 'parar': ('parar', 'parar'), 'deus0': ('mas', 'Deus'), 'facil': ('mas', 'fácil'), 'historia': ('mas', 'história'),
 'jose': ('jose', 'José'), 'esquecido': ('jose', 'esquecido'), 'prisao': ('jose', 'prisão'), 'deus1': ('jose2', 'Deus'), 'esqueceu': ('jose2', 'esqueceu'),
 'jo': ('jo', 'Jó'), 'tudo': ('jo1', 'tudo'), 'cinzas': ('jo2', 'cinzas'), 'fiel': ('jo2', 'fiel'),
 'daniel': ('daniel', 'Daniel'), 'leoes': ('daniel', 'leões'), 'orar': ('daniel2', 'orar'), 'jesus': ('jesus', 'Jesus'), 'cruz': ('jesus2', 'cruz'),
 'cansado': ('jesus3', 'Cansado'), 'ferido': ('jesus3', 'Ferido'), 'obediente': ('jesus3', 'obediente'), 'fim1': ('jesus3', 'fim'),
 'nunca': ('nunca', 'nunca'), 'cair': ('nunca', 'cair'), 'levantar': ('levantar', 'levantar'), 'maisuma': ('levantar', 'mais'),
 'orando': ('orando', 'orando'), 'ninguem': ('orando', 'ninguém'), 'passo': ('passo', 'passo'), 'forcas': ('passo', 'forças'), 'acabar': ('passo', 'acabar'),
 'ficar': ('ficar', 'ficar'), 'desistir1': ('ficar', 'desistir'), 'deus2': ('abandona', 'Deus'), 'abandona': ('abandona', 'abandona'), 'decide': ('abandona', 'decide'),
 'permanecer1': ('abandona', 'permanecer'), 'ele': ('abandona', 'Ele'), 'pergunto': ('pergunto', 'pergunto'), 'desistir2': ('meio', 'desistir'), 'meio': ('meio', 'meio'),
 'caminho': ('meio', 'caminho'), 'permanecer2': ('firme', 'permanecer'), 'firme': ('firme', 'firme'), 'fim2': ('firme', 'fim'),
 'desafios': ('desafios', 'desafios'), 'sozinho': ('sozinho', 'sozinho'), 'naodesista': ('naodesista', 'Não'), 'continue': ('continue', 'Continue'),
 'deus3': ('comvoce', 'Deus'), 'comvoce': ('comvoce', 'você'), 'semana': ('semana', 'Semana'), 'perseveranca': ('perseveranca', 'Perseverança')}
x, sr = sf.read('work/n16k.wav'); h = int(0.01 * sr); n = len(x) // h
env = np.sqrt((x[:n * h] ** 2).reshape(n, h).mean(1)); on = np.maximum(0, np.diff(np.convolve(env, np.ones(3) / 3, 'same'), prepend=0))
def kt(pid, w):
    p = P[pid]; t = p['text']; i = t.find(w); assert i >= 0, (pid, w); a, b = p['start'], p['end']
    if i == 0: return round(a, 2)
    est = a + (b - a) * i / len(t.rstrip('.!?:')); lo, hi = int(max(a, est - 0.16) * 100), int(min(b, est + 0.16) * 100)
    return round((lo + int(np.argmax(on[lo:hi + 1]))) / 100, 2)
K = {k: kt(*v) for k, v in KW.items()}
total = round(len(x) / sr, 3)
json.dump({'total': total, 'phrases': P, 'k': K}, open('src/timing.json', 'w'), ensure_ascii=False, indent=1)
print(total); print(K)
