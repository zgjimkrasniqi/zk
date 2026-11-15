"""
Traces walls in the catalogue floor-plan images (public/catalog/<key>-plan.jpg) and writes
public/catalog/<key>-walls.json for the 3D apartment view.

Heuristic, tuned to the catalogue's drawing style:
  * dark grey fill (structural walls)            -> full-height walls
  * thin light-grey bands (partitions, ~10 cm)   -> full-height walls
  * thin structures (dimension lines, text) are removed by a morphological opening,
    wide light-grey areas (bathroom floors, counters, stair cores) by keeping only thin bands.
  * scale (px per metre): the bounding box of the peach floor is taken as the gross area
    (catalogue net area x 1.15).
"""
import json, sys, re, glob, os
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
CELL = 3  # px per grid cell when building rectangles

def shift_op(a, r, op):
    out = a.copy()
    for axis in (0, 1):
        acc = out.copy()
        for d in range(1, r + 1):
            acc = op(acc, np.roll(out, d, axis=axis))
            acc = op(acc, np.roll(out, -d, axis=axis))
        out = acc
    return out

erode = lambda a, r: shift_op(a, r, np.logical_and)
dilate = lambda a, r: shift_op(a, r, np.logical_or)
opening = lambda a, r: dilate(erode(a, r), r)

def masks(path):
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mx, mn = im.max(-1), im.min(-1)
    sat = mx - mn
    grey = sat < 14
    dark = grey & (mx < 150)
    light = grey & (mx >= 185) & (mx <= 242)
    peach = (r > 235) & (g > 215) & (g < 245) & (b > 195) & (b < 235) & (r - b > 18)
    walls_dark = opening(dark, 3)
    thin = opening(light, 2) & ~opening(light, 8)
    black = grey & (mx < 95)
    return im, walls_dark, thin, peach, black

def long_runs(mask, min_len):
    """Pixels on horizontal or vertical runs of at least min_len (straight partition lines)."""
    out = np.zeros_like(mask)
    for a, o in ((mask, out), (mask.T, out.T)):
        for i, row in enumerate(a):
            d = np.diff(np.concatenate(([0], row.astype(np.int8), [0])))
            for s0, s1 in zip(np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]):
                if s1 - s0 >= min_len:
                    o[i, s0:s1] = True
    return out

def components(mask):
    """4-connected components of a boolean array -> list of (ys, xs) index arrays."""
    H, W = mask.shape
    seen = np.zeros_like(mask)
    out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        stack = [(y0, x0)]
        seen[y0, x0] = True
        ys, xs = [], []
        while stack:
            y, x = stack.pop()
            ys.append(y); xs.append(x)
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True
                    stack.append((yy, xx))
        out.append((np.array(ys), np.array(xs)))
    return out

def to_grid(mask):
    H, W = mask.shape
    gh, gw = H // CELL, W // CELL
    return mask[: gh * CELL, : gw * CELL].reshape(gh, CELL, gw, CELL).mean((1, 3)) > 0.5

def clean(dark, thin, peach, net_area):
    """Grid of wall cells: structural walls of the flat, plus thin, elongated partitions.
    Also returns the scale (px per metre), from the outline of the flat vs its catalogue area."""
    d, t = to_grid(dark), to_grid(thin) & ~to_grid(dark)
    comps = components(d)
    py, px = np.nonzero(to_grid(peach))
    y0, y1 = np.percentile(py, [0.5, 99.5])
    x0, x1 = np.percentile(px, [0.5, 99.5])
    gross = (y1 - y0) * (x1 - x0) * CELL * CELL
    ppm = (gross / (net_area * 1.15)) ** 0.5
    cpm = ppm / CELL  # cells per metre
    m = 0.5 * cpm
    y0, y1, x0, x1 = y0 - m, y1 + m, x0 - m, x1 + m
    g = np.zeros_like(d)
    for ys, xs in comps:
        cy, cx = ys.mean(), xs.mean()
        if y0 <= cy <= y1 and x0 <= cx <= x1 and len(ys) > 0.04 * cpm * cpm:
            g[ys, xs] = True
    oy, ox = np.nonzero(g)
    outer = (ox.min() * CELL, oy.min() * CELL, (ox.max() + 1) * CELL, (oy.max() + 1) * CELL)
    for ys, xs in components(t):
        length = max(np.ptp(ys), np.ptp(xs)) + 1
        if length >= 0.8 * cpm and len(ys) / length <= 0.22 * cpm:
            g[ys, xs] = True
    # bridge 1-cell gaps between partitions and structural walls
    g = g | (erode(dilate(g, 1), 1) & to_grid(dark | thin))
    return g, ppm, (x0 * CELL, y0 * CELL, (x1 + 1) * CELL, (y1 + 1) * CELL), outer

def rects(g):
    gh, gw = g.shape
    used = np.zeros_like(g)
    out = []
    for y in range(gh):
        x = 0
        while x < gw:
            if g[y, x] and not used[y, x]:
                x1 = x
                while x1 < gw and g[y, x1] and not used[y, x1]:
                    x1 += 1
                y1 = y + 1
                while y1 < gh and g[y1, x:x1].all() and not used[y1, x:x1].any():
                    y1 += 1
                used[y:y1, x:x1] = True
                out.append((x * CELL, y * CELL, (x1 - x) * CELL, (y1 - y) * CELL))
                x = x1
            else:
                x += 1
    return out

def net_area(key):
    src = open(os.path.join(ROOT, 'src/data/apartments.ts')).read()
    return float(re.search(r"key: '%s'.*?area: ([0-9.]+)" % key, src, re.S).group(1))

def main(keys):
    for f in sorted(glob.glob(os.path.join(ROOT, 'public/catalog/*-plan.jpg'))):
        key = os.path.basename(f)[: -len('-plan.jpg')]
        if keys and key not in keys:
            continue
        im, dark, thin, peach, black = masks(f)
        H, W = dark.shape
        area = net_area(key)
        # Thin black partition lines are not used: in these drawings they are indistinguishable
        # from dimension lines, so partitions drawn that way stay visible on the floor texture only.
        g, ppm, box, outer = clean(dark, thin, peach, area)
        rs = rects(g)
        walls = np.zeros_like(dark)
        for x, y, w, h in rs:
            walls[y : y + h, x : x + w] = True
        rim = Image.open(f.replace('-plan.jpg', '-render.jpg'))
        json.dump(
            {'w': W, 'h': H, 'ppm': round(float(ppm), 2), 'box': [int(v) for v in box], 'outer': [int(v) for v in outer], 'renderFit': bool(abs((outer[2] - outer[0]) / (outer[3] - outer[1]) / (rim.width / rim.height) - 1) < 0.03), 'rects': [[int(v) for v in r] for r in rs]},
            open(os.path.join(ROOT, 'public/catalog', f'{key}-walls.json'), 'w'),
            separators=(',', ':'),
        )
        if os.environ.get('DEBUG'):
            dbg = im.copy().astype(np.uint8)
            dbg[walls] = [200, 30, 30]
            Image.fromarray(dbg).save(os.environ['DEBUG'] + f'/{key}-mask.png')
        rim = Image.open(f.replace('-plan.jpg', '-render.jpg'))
        print(key, 'outer aspect', round((outer[2] - outer[0]) / (outer[3] - outer[1]), 3), 'render aspect', round(rim.width / rim.height, 3), f'{W}x{H}', 'ppm', round(float(ppm), 1), 'rects', len(rs), 'area', area)

if __name__ == '__main__':
    main(sys.argv[1:])
