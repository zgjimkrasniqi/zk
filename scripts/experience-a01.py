"""
Builds public/experience/a-01.json, the walls / openings of the sample apartment (Type A-01)
used by the walk-through. Walls come from the traced catalogue plan; openings (doors, windows)
are the gaps that a morphological closing fills in.
"""
import json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import importlib.util
spec = importlib.util.spec_from_file_location('ptw', os.path.join(os.path.dirname(__file__), 'plans-to-walls.py'))
ptw = importlib.util.module_from_spec(spec); spec.loader.exec_module(ptw)

ROOT = os.path.join(os.path.dirname(__file__), '..')
KEY = 'a-01'
f = os.path.join(ROOT, 'public/catalog', f'{KEY}-plan.jpg')
im, dark, thin, peach, black = ptw.masks(f)
g, _, box, outer = ptw.clean(dark, thin, peach, ptw.net_area(KEY))
C = ptw.CELL
# openings: gaps up to ~2.8 m closed along wall lines
closed = g.copy()
for r in (2, 4, 8, 14):
    closed |= ptw.erode(ptw.dilate(g, r), r) & ~ptw.dilate(np.zeros_like(g), 0)
gaps = closed & ~g
# keep only gap pieces that lie on a wall line (thin, between walls)
comps = ptw.components(gaps)
openings = []
for ys, xs in comps:
    if len(ys) < 4:
        continue
    x0, x1, y0, y1 = xs.min() * C, (xs.max() + 1) * C, ys.min() * C, (ys.max() + 1) * C
    openings.append([int(x0), int(y0), int(x1 - x0), int(y1 - y0)])
out = {
    'ppm': 98.0,
    'outer': [int(v) for v in outer],
    'walls': [[int(v) for v in r] for r in ptw.rects(g)],
    'openings': openings,
}
os.makedirs(os.path.join(ROOT, 'public/experience'), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, 'public/experience', f'{KEY}.json'), 'w'), separators=(',', ':'))
if len(sys.argv) > 1:
    dbg = im.copy().astype(np.uint8)
    for x, y, w, h in out['walls']:
        dbg[y:y + h, x:x + w] = [200, 30, 30]
    from PIL import ImageDraw
    pim = Image.fromarray(dbg); d = ImageDraw.Draw(pim)
    for i, (x, y, w, h) in enumerate(openings):
        d.rectangle([x, y, x + w, y + h], outline=(0, 120, 255), width=2)
        d.text((x + 2, y + 2), str(i), fill=(0, 0, 255))
    pim.save(sys.argv[1])
print(len(out['walls']), 'walls', len(openings), 'openings')
for i, o in enumerate(openings): print(i, o)
