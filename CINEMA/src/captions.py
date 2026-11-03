import json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1];j=json.loads((R/'src/timeline.json').read_text());out=[]
for p in j['paragraphs']:
 words=p['text'].split();cursor=0;group=[]
 for w in p['words']:
  n=len(w['text'].split());part=' '.join(words[cursor:cursor+n]);cursor+=n;group.append({'text':part,'start':p['start']+w['start'],'end':p['start']+w['end']})
  if sum(len(x['text'])+1 for x in group)>32 or w==p['words'][-1]:
   out.append({'start':round(group[0]['start'],3),'end':round(group[-1]['end']+.1,3),'text':' '.join(x['text'] for x in group)});group=[]
 assert cursor==len(words),(p['id'],cursor,len(words))
def srt(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
def ass(t):
 cs=round(t*100);return f'{cs//360000}:{cs//6000%60:02}:{cs//100%60:02}.{cs%100:02}'
(R/'src/captions.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
(R/'output/VERDADE_E_DESAFIO.srt').write_text('\n\n'.join(f"{i+1}\n{srt(s['start'])} --> {srt(s['end'])}\n{s['text']}" for i,s in enumerate(out))+'\n')
head='''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Barlow Condensed,54,&H00F4EDF4,&H000000FF,&H001F1A0B,&H80000000,-1,0,0,0,100,100,0,0,3,13,0,2,100,100,270,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
lines=[]
for x in out:
 # Caption lane in lower section; final poster uses top lane to keep event/date clear.
 pos='{\\an8\\pos(540,80)}' if x['start']>=61 else ''
 lines.append(f"Dialogue: 0,{ass(x['start'])},{ass(x['end'])},Default,,0,0,0,,{pos}{x['text']}")
(R/'src/captions.ass').write_text(head+'\n'.join(lines)+'\n')
print(len(out),'captions, exact text validated')
