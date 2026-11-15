#!/usr/bin/env node
/**
 * Converts an OpenStreetMap Overpass JSON export ("out body geom") into a compact
 * context file for the 3D scene: public/context.json
 *
 *   node scripts/osm-to-context.mjs path/to/export.json
 *
 * Coordinates become metres around the HAB 13 map pin: +x = east, -z = north.
 * Heights come from OSM `height` / `building:levels` tags when present, otherwise a
 * default per building type. Context buildings are approximate by nature.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const PIN = { lat: 42.6572453, lon: 21.1702514 } // Google Maps pin "Kompleksi HAB 13"
const KEEP_RADIUS = 420

const src = process.argv[2]
if (!src) {
  console.error('usage: node scripts/osm-to-context.mjs <overpass-export.json>')
  process.exit(1)
}
const data = JSON.parse(readFileSync(src, 'utf8'))
const kx = 111320 * Math.cos((PIN.lat * Math.PI) / 180)
const kz = 110540
const proj = (p) => [+((p.lon - PIN.lon) * kx).toFixed(2), +(-(p.lat - PIN.lat) * kz).toFixed(2)]

const centroid = (pts) => {
  let x = 0, z = 0
  for (const [a, b] of pts) { x += a; z += b }
  return [x / pts.length, z / pts.length]
}
const area = (pts) => {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i]
    const [x2, z2] = pts[(i + 1) % pts.length]
    s += x1 * z2 - x2 * z1
  }
  return s / 2
}
const inside = (pt, poly) => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    if (zi > pt[1] !== zj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - zi)) / (zj - zi) + xi) c = !c
  }
  return c
}

const DEFAULT_H = {
  apartments: 21, residential: 18, commercial: 14, retail: 7, office: 18, house: 7, detached: 7,
  semidetached_house: 7, terrace: 8, garage: 3, garages: 3, shed: 3, roof: 4, school: 11,
  university: 14, hospital: 16, church: 14, mosque: 12, industrial: 9, warehouse: 9, construction: 6,
}
const heightOf = (t) => {
  const h = parseFloat(t.height)
  if (Number.isFinite(h) && h > 1) return h
  const lv = parseFloat(t['building:levels'])
  if (Number.isFinite(lv) && lv > 0) return lv * 3.1 + 1
  return DEFAULT_H[t.building] ?? 9
}

const ROAD_W = {
  motorway: 16, trunk: 14, primary: 12, secondary: 10, tertiary: 9, unclassified: 7, residential: 7,
  living_street: 6, service: 4.5, pedestrian: 5, footway: 2.2, path: 2, cycleway: 2.2, steps: 2,
}

const out = { pin: PIN, source: 'OpenStreetMap contributors (ODbL)', buildings: [], roads: [], green: [], site: null }
const siteCandidates = []

const ringsOf = (el) => {
  if (el.type === 'way' && el.geometry) return [el.geometry.map(proj)]
  if (el.type === 'relation' && el.members)
    return el.members.filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry.map(proj))
  return []
}

for (const el of data.elements ?? []) {
  const t = el.tags ?? {}
  if (t.building || t['building:part']) {
    for (let pts of ringsOf(el)) {
      if (pts.length > 2 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) pts = pts.slice(0, -1)
      if (pts.length < 3) continue
      const c = centroid(pts)
      const d = Math.hypot(c[0], c[1])
      if (d > KEEP_RADIUS) continue
      const name = `${t.name ?? ''} ${t['addr:housename'] ?? ''}`
      // The HAB 13 plot: a footprint named HAB, containing the pin, or the construction site next to it.
      const building_site = (t.building === 'construction' || t.construction) && d < 60
      const isHab = /\bhab\b/i.test(name) || inside([0, 0], pts) || building_site
      const rec = { pts: area(pts) < 0 ? pts.slice().reverse() : pts, h: +heightOf(t).toFixed(1), id: el.id, name: t.name }
      if (isHab) siteCandidates.push({ ...rec, d, tags: t })
      else out.buildings.push({ pts: rec.pts, h: rec.h })
    }
  } else if (t.highway && el.geometry) {
    const w = ROAD_W[t.highway]
    if (!w) continue
    out.roads.push({ pts: el.geometry.map(proj), w, kind: t.highway, name: t.name })
  } else if ((t.leisure && /park|garden|playground|pitch/.test(t.leisure)) || /grass|park|forest|meadow|recreation_ground|cemetery/.test(t.landuse ?? '')) {
    for (const pts of ringsOf(el)) if (pts.length > 3) out.green.push({ pts })
  }
}

// Orientation hint: the nearest named street to the pin, as a bearing (radians, scene space).
let best = null
for (const r of out.roads) {
  if (!r.name || r.w < 6) continue
  for (let i = 0; i < r.pts.length - 1; i++) {
    const [x1, z1] = r.pts[i]
    const [x2, z2] = r.pts[i + 1]
    const dx = x2 - x1, dz = z2 - z1
    const L2 = dx * dx + dz * dz || 1
    const t = Math.max(0, Math.min(1, -(x1 * dx + z1 * dz) / L2))
    const px = x1 + t * dx, pz = z1 + t * dz
    const d = Math.hypot(px, pz)
    if (!best || d < best.d) best = { d, name: r.name, angle: Math.atan2(dz, dx), px, pz }
  }
}
// Plot orientation: angle of its longest edge, folded into ±45°. The scene rotates the
// context by this angle so the plot's edges line up with the model's axes.
let rotation = 0
const plot = siteCandidates.sort((a, b) => Math.abs(area(b.pts)) - Math.abs(area(a.pts)))[0]
if (plot) {
  let L = 0
  for (let i = 0; i < plot.pts.length; i++) {
    const [x1, z1] = plot.pts[i]
    const [x2, z2] = plot.pts[(i + 1) % plot.pts.length]
    const len = Math.hypot(x2 - x1, z2 - z1)
    if (len > L) {
      L = len
      let a = Math.atan2(z2 - z1, x2 - x1)
      while (a > Math.PI / 4) a -= Math.PI / 2
      while (a <= -Math.PI / 4) a += Math.PI / 2
      rotation = a
    }
  }
}
out.site = {
  rotation: +rotation.toFixed(4),
  footprints: siteCandidates.map(({ pts, h, id, name }) => ({ pts, h, id, name })),
  street: best && { name: best.name, distance: +best.d.toFixed(1), angle: +best.angle.toFixed(4), x: +best.px.toFixed(1), z: +best.pz.toFixed(1) },
}

writeFileSync(new URL('../public/context.json', import.meta.url), JSON.stringify(out))
console.log(
  `context.json: ${out.buildings.length} buildings, ${out.roads.length} roads, ${out.green.length} green areas; ` +
    `${siteCandidates.length} footprint(s) on the HAB 13 plot; nearest street: ${best ? `${best.name} (${best.d.toFixed(0)} m)` : 'n/a'}`,
)
for (const s of siteCandidates) console.log('  plot footprint', s.id, s.name ?? '', `${Math.round(Math.abs(area(s.pts)))} m²`, `h=${s.h}`, JSON.stringify(s.tags))
