import { Suspense, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls, useTexture } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Dollhouse view of one apartment type: the catalogue floor plan is laid on the floor and
 * the walls traced from it (scripts/plans-to-walls.py → public/catalog/<key>-walls.json)
 * are extruded. Walls are cut at WALL_H so the layout reads from above.
 */

interface Walls {
  w: number
  h: number
  ppm: number
  box: [number, number, number, number] // x0, y0, x1, y1 in plan pixels
  rects: [number, number, number, number][] // x, y, w, h in plan pixels
}

const WALL_H = 2.4

function useWalls(key: string) {
  const [data, setData] = useState<Walls | null>(null)
  useEffect(() => {
    let live = true
    setData(null)
    fetch(`catalog/${key}-walls.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setData(d))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [key])
  return data
}

function Flat({ typeKey, data }: { typeKey: string; data: Walls }) {
  const tex = useTexture(`catalog/${typeKey}-plan.jpg`)
  const { w, h, ppm, box, rects } = data
  const [x0, y0, x1, y1] = box
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const m = (px: number) => px / ppm

  const floorTex = useMemo(() => {
    const t = tex.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    t.repeat.set((x1 - x0) / w, (y1 - y0) / h)
    t.offset.set(x0 / w, 1 - y1 / h)
    t.needsUpdate = true
    return t
  }, [tex, w, h, x0, y0, x1, y1])

  const { walls, caps } = useMemo(() => {
    const wg: THREE.BufferGeometry[] = []
    const cg: THREE.BufferGeometry[] = []
    for (const [rx, ry, rw, rh] of rects) {
      const x = m(rx + rw / 2 - cx)
      const z = m(ry + rh / 2 - cy)
      const b = new THREE.BoxGeometry(m(rw), WALL_H, m(rh))
      b.translate(x, WALL_H / 2, z)
      wg.push(b)
      const c = new THREE.PlaneGeometry(m(rw), m(rh))
      c.rotateX(-Math.PI / 2)
      c.translate(x, WALL_H + 0.002, z)
      cg.push(c)
    }
    return { walls: wg.length ? mergeGeometries(wg) : null, caps: cg.length ? mergeGeometries(cg) : null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const fw = m(x1 - x0)
  const fd = m(y1 - y0)
  return (
    <group>
      {/* the plan is shown unlit so it keeps the catalogue colours; shadows go on a layer above */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <planeGeometry args={[fw, fd]} />
        <meshBasicMaterial map={floorTex} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, 0.02, 0]}>
        <planeGeometry args={[fw, fd]} />
        <shadowMaterial opacity={0.22} />
      </mesh>
      {/* slab edge under the plan */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[fw + 0.2, 0.3, fd + 0.2]} />
        <meshStandardMaterial color="#d9cfc3" roughness={1} />
      </mesh>
      {walls && (
        <mesh geometry={walls} castShadow receiveShadow>
          <meshStandardMaterial color="#f4efe9" roughness={0.85} />
        </mesh>
      )}
      {caps && (
        <mesh geometry={caps}>
          <meshBasicMaterial color="#3a3430" />
        </mesh>
      )}
    </group>
  )
}

function Scene({ typeKey, data, autoRotate }: { typeKey: string; data: Walls; autoRotate: boolean }) {
  const span = Math.max(data.box[2] - data.box[0], data.box[3] - data.box[1]) / data.ppm
  return (
    <>
      <color attach="background" args={['#f3ece4']} />
      <hemisphereLight args={['#fff6ec', '#b39c86', 0.9]} />
      <directionalLight
        position={[-span * 0.6, span * 1.4, span * 0.5]}
        intensity={1.8}
        color="#fff1df"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
      />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#fff3e4" position={[0, 6, -8]} scale={[16, 5, 1]} />
        <Lightformer form="circle" intensity={2} color="#ffffff" position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={5} />
      </Environment>
      <Suspense fallback={null}>
        <Flat typeKey={typeKey} data={data} />
      </Suspense>
      <ContactShadows position={[0, -0.31, 0]} scale={span * 2} blur={2.5} opacity={0.35} far={3} />
      <OrbitControls
        makeDefault
        enableDamping
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minDistance={span * 0.5}
        maxDistance={span * 2.6}
        maxPolarAngle={Math.PI / 2.3}
        target={[0, 0.6, 0]}
      />
    </>
  )
}

export function ApartmentViewer({ typeKey, className = '', large = false }: { typeKey: string; className?: string; large?: boolean }) {
  const data = useWalls(typeKey)
  const [interacted, setInteracted] = useState(false)
  useEffect(() => setInteracted(false), [typeKey])
  if (!data)
    return <div className={`grid place-items-center text-[11px] uppercase tracking-[0.2em] text-bronze-600 ${className}`}>Loading 3D layout…</div>
  const span = Math.max(data.box[2] - data.box[0], data.box[3] - data.box[1]) / data.ppm
  const d = span * (large ? 1.6 : 1.35) + 3
  return (
    <div className={className} onPointerDown={() => setInteracted(true)}>
      <Canvas
        key={typeKey}
        shadows
        dpr={[1, 2]}
        camera={{ position: [-d * 0.45, d * 0.85, d * 0.6], fov: 35, near: 0.1, far: 500 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <Scene typeKey={typeKey} data={data} autoRotate={!interacted} />
      </Canvas>
    </div>
  )
}
