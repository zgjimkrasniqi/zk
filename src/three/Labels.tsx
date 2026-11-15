import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ContextData } from './Context'

/**
 * Street names painted on the road surface and pins for nearby landmarks,
 * from the OpenStreetMap context. Rendered inside the (rotated) context group.
 */

type Pt = [number, number]

const MAJOR = new Set(['primary', 'secondary', 'tertiary', 'secondary_link', 'trunk'])

interface StreetLabel {
  name: string
  x: number
  z: number
  angle: number // radians, rotation about Y so the text runs along the street
  size: number // text height in metres
  len: number // label length in metres
}

function measure(text: string, size: number) {
  const c = document.createElement('canvas').getContext('2d')!
  c.font = `600 100px Jost, ui-sans-serif, sans-serif`
  const spacing = 0.12 * 100 * text.length
  return ((c.measureText(text).width + spacing) / 100) * size
}

function pickStreetLabels(roads: ContextData['roads']): StreetLabel[] {
  const byName = new Map<string, { pts: Pt[]; kind: string; w: number }[]>()
  for (const r of roads) {
    if (!r.name || r.w < 4 || r.kind === 'service' || r.kind === 'steps' || r.kind === 'cycleway') continue
    const key = r.name.trim()
    byName.set(key, [...(byName.get(key) ?? []), r])
  }
  const labels: StreetLabel[] = []
  for (const [name, ways] of byName) {
    const major = ways.some((w) => MAJOR.has(w.kind))
    const size = major ? 5.5 : 4
    const text = `RR. ${name.toUpperCase()}`
    const len = measure(text, size)
    // candidate runs: consecutive, nearly straight segments long enough for the text
    const cands: { x: number; z: number; angle: number; d: number }[] = []
    for (const w of ways) {
      let i = 0
      while (i < w.pts.length - 1) {
        const [sx, sz] = w.pts[i]
        const h0 = Math.atan2(w.pts[i + 1][1] - sz, w.pts[i + 1][0] - sx)
        let j = i + 1
        while (j < w.pts.length - 1) {
          const h = Math.atan2(w.pts[j + 1][1] - w.pts[j][1], w.pts[j + 1][0] - w.pts[j][0])
          let dh = Math.abs(h - h0)
          if (dh > Math.PI) dh = 2 * Math.PI - dh
          if (dh > 0.3) break
          j++
        }
        const [ex, ez] = w.pts[j]
        const L = Math.hypot(ex - sx, ez - sz)
        if (L >= len + 4) {
          const x = (sx + ex) / 2
          const z = (sz + ez) / 2
          const d = Math.hypot(x, z)
          if (d < 380) cands.push({ x, z, angle: Math.atan2(-(ez - sz), ex - sx), d })
        }
        i = j
      }
    }
    cands.sort((a, b) => a.d - b.d)
    const chosen: typeof cands = []
    for (const c of cands) {
      if (chosen.length >= (major ? 3 : 2)) break
      if (chosen.every((o) => Math.hypot(o.x - c.x, o.z - c.z) > 160)) chosen.push(c)
    }
    for (const c of chosen) labels.push({ name: text, x: c.x, z: c.z, angle: c.angle, size, len })
  }
  return labels
}

function useLabelTexture(text: string, size: number, len: number) {
  const [fontTick, setFontTick] = useState(0)
  useEffect(() => {
    // redraw once the web font is ready so labels use Jost
    document.fonts?.load('600 100px Jost').then(() => setFontTick(1)).catch(() => {})
  }, [])
  return useMemo(() => {
    const pxPerM = 24
    const H = Math.round(size * pxPerM * 1.3)
    const W = Math.round(len * pxPerM + H * 0.6)
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!
    g.font = `600 ${Math.round(size * pxPerM)}px Jost, ui-sans-serif, sans-serif`
    ;(g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${Math.round(size * pxPerM * 0.12)}px`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = 'rgba(255,255,255,0.92)'
    g.fillText(text, W / 2, H / 2 + 1)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return { t, w: W / pxPerM, h: H / pxPerM }
  }, [text, size, len, fontTick])
}

function StreetName({ l }: { l: StreetLabel }) {
  const { t, w, h } = useLabelTexture(l.name, l.size, l.len)
  return (
    <group position={[l.x, 0.12, l.z]} rotation={[0, l.angle, 0]} userData={{ streetLabel: true, base: l.angle }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null} renderOrder={2}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={t} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function StreetLabels({ data }: { data: ContextData }) {
  const labels = useMemo(() => pickStreetLabels(data.roads), [data])
  const ref = useRef<THREE.Group>(null)
  const v = useMemo(() => ({ dir: new THREE.Vector3(), right: new THREE.Vector3() }), [])

  // Keep every label reading left-to-right from the current camera.
  useFrame(({ camera }) => {
    const g = ref.current
    if (!g) return
    v.right.setFromMatrixColumn(camera.matrixWorld, 0)
    for (const child of g.children) {
      const base = child.userData.base as number
      child.rotation.y = base
      child.updateMatrixWorld()
      v.dir.setFromMatrixColumn(child.matrixWorld, 0)
      if (v.dir.dot(v.right) < 0) child.rotation.y = base + Math.PI
    }
  })

  return (
    <group ref={ref}>
      {labels.map((l, i) => (
        <StreetName key={i} l={l} />
      ))}
    </group>
  )
}

// Landmarks worth showing for orientation (OSM names → English hint).
const LANDMARKS: Record<string, string> = {
  'Parku i Qytetit': 'City Park',
  'Varrezat e Dëshmorëve': "Martyrs' Memorial Cemetery",
  'Universiteti "Iliria"': 'Iliria University',
  'Kolegji Pjeter Budi': 'Pjetër Budi College',
  'Kooperativa Kreative e Kosovës': 'Creative Cooperative',
  OSCE: 'OSCE Mission',
  'Kulla Zotnisë': 'Residential tower',
  'Kulla Muhaxherëve': 'Residential tower',
  'IVY Tower': '',
  'VIP Tower': '',
}

export function Landmarks({ data }: { data: ContextData }) {
  const places = useMemo(() => {
    const seen = new Set<string>()
    return (data.places ?? []).filter((p) => {
      if (!(p.name in LANDMARKS) || seen.has(p.name)) return false
      seen.add(p.name)
      return true
    })
  }, [data])

  return (
    <group>
      {places.map((p) => (
        <Html key={p.name} position={[p.x, p.h + 4, p.z]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="whitespace-nowrap rounded-md bg-white/80 px-2 py-1 text-center leading-tight text-ink-600 shadow-sm backdrop-blur-sm">
              <div className="text-[10px] font-medium">{p.name.replace(/"/g, '')}</div>
              <div className="text-[9px] text-ink-500/80">
                {LANDMARKS[p.name] ? `${LANDMARKS[p.name]} · ` : ''}
                {p.d < 1000 ? `${Math.round(p.d / 10) * 10} m` : `${(p.d / 1000).toFixed(1)} km`}
              </div>
            </div>
            <div className="h-3 w-px bg-ink-500/50" />
            <div className="h-1.5 w-1.5 rounded-full bg-ink-500/70" />
          </div>
        </Html>
      ))}
    </group>
  )
}
