from pathlib import Path
import subprocess,json
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache/frames';CACHE.mkdir(parents=True,exist_ok=True)
meta={}
for p in sorted((ROOT/'assets/video').glob('*.mp4')):
 dst=CACHE/p.stem;dst.mkdir(exist_ok=True)
 # Preserve filmed movement at 30fps; editorial animation renders at 60fps.
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(p),'-t','18','-an','-vf','fps=30,scale=960:-2','-q:v','3',str(dst/'%05d.jpg')],check=True)
 meta[p.stem]={'frames':len(list(dst.glob('*.jpg'))),'fps':30}
 print(p.stem,meta[p.stem],flush=True)
(CACHE/'meta.json').write_text(json.dumps(meta))
