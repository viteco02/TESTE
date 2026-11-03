import asyncio,edge_tts,os,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
text=(ROOT/'docs/BRIEFING.md').read_text().split('Texto:\n\n')[1].split('\n### 6.')[0].strip()
(ROOT/'docs/ROTEIRO.txt').write_text(text+'\n')
paragraphs=text.split('\n\n')
async def main():
 timeline=[]; clock=.35
 for i,p in enumerate(paragraphs):
  path=ROOT/f'assets/audio/voz_{i:02}.mp3'
  words=[]
  comm=edge_tts.Communicate(p,'pt-BR-AntonioNeural',rate='+0%',pitch='+1Hz',boundary='WordBoundary',proxy=os.environ.get('HTTPS_PROXY'))
  with open(path,'wb') as f:
   async for chunk in comm.stream():
    if chunk['type']=='audio':f.write(chunk['data'])
    elif chunk['type']=='WordBoundary': words.append({'text':chunk['text'],'start':chunk['offset']/1e7,'end':(chunk['offset']+chunk['duration'])/1e7})
  duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)]))
  timeline.append({'id':i,'text':p,'start':round(clock,3),'duration':duration,'words':words})
  clock+=duration+(.35 if i in [1,2,4,6,7] else .12)
  print(i,round(clock,2),p[:45],flush=True)
 (ROOT/'src/timeline.json').write_text(json.dumps({'duration':round(clock+2,3),'paragraphs':timeline},ensure_ascii=False,indent=2))
asyncio.run(main())
