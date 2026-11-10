import sys, json, re, unicodedata, subprocess
from roteiro import C
def norm(s): s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if not unicodedata.combining(c)); return re.findall(r"[a-z0-9]+", s.replace('2026', 'dois mil e vinte e seis'))
ref = norm(' '.join(c[1] for c in C))
for v in sys.argv[1:]:
    out = subprocess.run(['python3', '/home/claude/motion-kit/transcrever.py', f'work/narracao_{v}.wav'], capture_output=True, text=True).stdout
    hyp = norm(' '.join(l.split('  ', 2)[-1] for l in out.splitlines() if re.match(r'^ +\d', l)))
    import difflib; sm = difflib.SequenceMatcher(None, ref, hyp); ok = sum(b.size for b in sm.get_matching_blocks())
    print(v, 'acerto de palavras', round(100 * ok / len(ref), 1), '%')
