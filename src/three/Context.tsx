import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useStore } from '../store'
import { Landmarks, StreetLabels } from './Labels'

/**
 * Real surroundings of the site from OpenStreetMap (public/context.json, built with
 * scripts/osm-to-context.mjs). Drawn as a muted, monochrome massing model so the
 * HAB 13 buildings stand out in their own colours.
 */

type Pt = [number, number]
export interface ContextData {
  buildings: { pts: Pt[]; h: number }[]
  roads: { pts: Pt[]; w: number; kind: string; name?: string }[]
  green: { pts: Pt[] }[]
  places?: { name: string; x: number; z: number; h: number; d: number; kind?: string }[]
  site: { rotation?: number; street: { angle: number; x: number; z: number } | null } | null
}

export function useContextData() {
  const data = useStore((s) => s.context)
  const setContext = useStore((s) => s.setContext)
  useEffect(() => {
    if (data !== undefined) return
    fetch('context.json')
      .then((r) => (r.ok && !(r.headers.get('content-type') ?? '').includes('text/html') ? r.json() : null))
      .then((d) => setContext(d && Array.isArray(d.buildings) ? d : null))
      .catch(() => setContext(null))
  }, [data, setContext])
  return data
}

function shapeOf(pts: Pt[]) {
  // Shape lives in XY; after rotating -90° about X, shape y maps to world -z.
  const s = new THREE.Shape()
  pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)))
  s.closePath()
  return s
}

function ribbon(pts: Pt[], w: number, y: number) {
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i]
    const [x2, z2] = pts[i + 1]
    const dx = x2 - x1
    const dz = z2 - z1
    const L = Math.hypot(dx, dz) || 1
    const nx = (-dz / L) * (w / 2)
    const nz = (dx / L) * (w / 2)
    const b = pos.length / 3
    pos.push(x1 + nx, y, z1 + nz, x1 - nx, y, z1 - nz, x2 + nx, y, z2 + nz, x2 - nx, y, z2 - nz)
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Rotation that lines the real plot up with the model's axes (computed by the converter). */
export function contextRotation(d: ContextData | null) {
  return d?.site?.rotation ?? 0
}

export function Context({ data }: { data: ContextData }) {
  const { buildings, edges, roads, paths, green } = useMemo(() => {
    const bg: THREE.BufferGeometry[] = []
    for (const b of data.buildings) {
      try {
        const g = new THREE.ExtrudeGeometry(shapeOf(b.pts), { depth: b.h, bevelEnabled: false })
        g.rotateX(-Math.PI / 2)
        bg.push(g.toNonIndexed())
      } catch {
        /* skip degenerate footprints */
      }
    }
    const buildings = bg.length ? mergeGeometries(bg) : null
    const edges = buildings ? new THREE.EdgesGeometry(buildings, 30) : null
    const major = data.roads.filter((r) => r.w >= 4)
    const minor = data.roads.filter((r) => r.w < 4)
    const roads = major.length ? mergeGeometries(major.map((r) => ribbon(r.pts, r.w, 0.04))) : null
    const paths = minor.length ? mergeGeometries(minor.map((r) => ribbon(r.pts, r.w, 0.05))) : null
    const gg: THREE.BufferGeometry[] = []
    for (const a of data.green) {
      const g = new THREE.ShapeGeometry(shapeOf(a.pts))
      g.rotateX(-Math.PI / 2)
      g.translate(0, 0.02, 0)
      gg.push(g.toNonIndexed())
    }
    const green = gg.length ? mergeGeometries(gg.map((g) => (g.deleteAttribute('uv'), g))) : null
    bg.forEach((g) => g.dispose())
    return { buildings, edges, roads, paths, green }
  }, [data])

  const rot = contextRotation(data)

  return (
    <group rotation={[0, rot, 0]}>
      {buildings && (
        <mesh geometry={buildings} castShadow receiveShadow raycast={() => null}>
          <meshStandardMaterial color="#c3c5c7" roughness={0.95} metalness={0} />
        </mesh>
      )}
      {edges && (
        <lineSegments geometry={edges} raycast={() => null}>
          <lineBasicMaterial color="#9fa2a5" transparent opacity={0.7} />
        </lineSegments>
      )}
      {roads && (
        <mesh geometry={roads} receiveShadow raycast={() => null}>
          <meshStandardMaterial color="#a3a19d" roughness={1} />
        </mesh>
      )}
      {paths && (
        <mesh geometry={paths} receiveShadow raycast={() => null}>
          <meshStandardMaterial color="#cfcac3" roughness={1} />
        </mesh>
      )}
      {green && (
        <mesh geometry={green} receiveShadow raycast={() => null}>
          <meshStandardMaterial color="#cdd0c8" roughness={1} />
        </mesh>
      )}
      <StreetLabels data={data} />
      <Landmarks data={data} />
    </group>
  )
}
