from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
r=Path(__file__).resolve().parent.parent
out=r/'verdade_e_desafio_projeto_editavel.zip'
with ZipFile(out,'w',ZIP_DEFLATED,compresslevel=6) as z:
 for p in (r/'VERDADE_E_DESAFIO').rglob('*'):
  if p.is_file() and not any(s in p.parts for s in ['node_modules','revisao','work','__pycache__']):z.write(p,p.relative_to(r))
 for n in ['NARRAÇUDA.MP3','REFERENCIA 01.mp4','REFERENCIA 02.mp4','REFERENCIA 03.mp4','90a2dd50-1014-49ef-b2c9-f00efcb9cc3e.png']:
  z.write(r/n,n)
with ZipFile(out) as z:
 assert z.testzip() is None
 print('ZIP íntegro:',len(z.namelist()),'arquivos;',out.stat().st_size,'bytes')
