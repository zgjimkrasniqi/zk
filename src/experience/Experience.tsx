import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { APARTMENTS, TYPES } from '../data/apartments'
import { Apartment, type Lighting } from './Apartment'
import { World, type SkyLook } from './World'
import { BALCONY_RAIL, BLOCKERS, EYE, FLOOR_OAK, GLAZING, START, STOPS, WALLS, mx, mz, type R, type Stop } from './plan'
import { Icon } from '../ui/common'

type Time = 'day' | 'golden' | 'night'
type Mode = 'overview' | 'flying' | 'walk'

const LOOK: Record<Time, { sky: SkyLook; light: Lighting; sun: { color: string; intensity: number }; hemi: number; env: number; exposure: number }> = {
  day: {
    sky: { top: '#86acd6', horizon: '#eef2f4', sun: '#fff4dc', sunDir: [-0.5, 0.65, 0.55], city: '#e2e4e7', haze: '#e4e9ed', lit: 0 },
    light: { night: false, window: { color: '#eef3ff', intensity: 5 } },
    sun: { color: '#fff1dc', intensity: 2.4 },
    hemi: 0.8,
    env: 0.95,
    exposure: 1.0,
  },
  golden: {
    sky: { top: '#5f7fb3', horizon: '#f5b98a', sun: '#ffb06a', sunDir: [-0.85, 0.14, -0.5], city: '#b9a9ac', haze: '#e9c2a4', lit: 0.25 },
    light: { night: false, window: { color: '#ffc58e', intensity: 6 } },
    sun: { color: '#ffae66', intensity: 3.2 },
    hemi: 0.6,
    env: 0.75,
    exposure: 1.05,
  },
  night: {
    sky: { top: '#0a0f1d', horizon: '#26304a', sun: '#9fb0dd', sunDir: [0.3, 0.35, -0.85], city: '#1d222c', haze: '#171c29', lit: 1 },
    light: { night: true, window: { color: '#5c6f9c', intensity: 0.8 } },
    sun: { color: '#8fa2d0', intensity: 0.2 },
    hemi: 0.12,
    env: 0.18,
    exposure: 1.1,
  },
}

// ---------- walking ----------
const grow = ([x0, y0, x1, y1]: R, px: number): R => [x0 - px, y0 - px, x1 + px, y1 + px]
const SOLID: R[] = [...WALLS.map((r) => grow(r, 20)), ...BLOCKERS.map((r) => grow(r, 12)), grow(GLAZING[0].r, 20), grow(GLAZING[2].r, 20), grow(BALCONY_RAIL, 22)]
const PX = (x: number) => x * 98 + 516
const PY = (z: number) => z * 98 + 394
function blocked(x: number, z: number) {
  const px = PX(x)
  const py = PY(z)
  const [fx0, fy0, fx1, fy1] = FLOOR_OAK
  if (px < fx0 + 30 || px > fx1 - 30 || py < fy0 + 8 || py > fy1 - 30) return true
  return SOLID.some(([x0, y0, x1, y1]) => px > x0 && px < x1 && py > y0 && py < y1)
}

/** Overview camera, pulled back on portrait screens so the whole flat fits. */
const startPos = (): [number, number, number] => {
  const k = window.innerWidth / window.innerHeight < 1 ? 1.75 : 1
  return [START.pos[0] * k, START.pos[1] * k, START.pos[2] * k]
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const stopPose = (s: Stop) => {
  const pos = new THREE.Vector3(mx(s.pos[0]), EYE, mz(s.pos[1]))
  // a camera (not a plain Object3D) so lookAt points its -z axis at the target
  const o = new THREE.PerspectiveCamera()
  o.position.copy(pos)
  o.lookAt(mx(s.look[0]), s.look[1], mz(s.look[2]))
  return { pos, quat: o.quaternion.clone() }
}

interface RigApi {
  goStop: (s: Stop) => void
  goOverview: () => void
  walkTo: (p: THREE.Vector3) => void
}

function Rig({ mode, setMode, apiRef, onMoved }: { mode: Mode; setMode: (m: Mode) => void; apiRef: React.MutableRefObject<RigApi | null>; onMoved: () => void }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; enabled: boolean; update: () => void } | null
  const tween = useRef<{ p0: THREE.Vector3; q0: THREE.Quaternion; p1: THREE.Vector3; q1: THREE.Quaternion; t: number; dur: number; then: Mode } | null>(null)
  const look = useRef({ yaw: 0, pitch: 0 })
  const keys = useRef(new Set<string>())
  const modeRef = useRef(mode)
  modeRef.current = mode

  useEffect(() => {
    const start = (p1: THREE.Vector3, q1: THREE.Quaternion, then: Mode, dur?: number) => {
      const d = camera.position.distanceTo(p1)
      tween.current = { p0: camera.position.clone(), q0: camera.quaternion.clone(), p1, q1, t: 0, dur: dur ?? THREE.MathUtils.clamp(d / 3.2, 0.9, 2.6), then }
      setMode('flying')
    }
    apiRef.current = {
      goStop: (s) => {
        const { pos, quat } = stopPose(s)
        start(pos, quat, 'walk')
      },
      goOverview: () => {
        const o = new THREE.PerspectiveCamera()
        o.position.set(...startPos())
        o.lookAt(...START.target)
        start(o.position.clone(), o.quaternion.clone(), 'overview', 2)
      },
      walkTo: (p) => {
        const to = new THREE.Vector3(p.x, EYE, p.z)
        const from = camera.position.clone()
        // stop short of furniture / walls along the way
        const dir = to.clone().sub(from)
        const n = Math.ceil(dir.length() / 0.1)
        let ok = from.clone()
        for (let i = 1; i <= n; i++) {
          const q = from.clone().addScaledVector(dir, i / n)
          if (blocked(q.x, q.z)) break
          ok = q
        }
        if (ok.distanceTo(from) < 0.05) return
        start(ok, camera.quaternion.clone(), 'walk', THREE.MathUtils.clamp(ok.distanceTo(from) / 1.6, 0.5, 3))
        onMoved()
      },
    }
  }, [camera, setMode, apiRef, onMoved])

  // drag to look around while walking
  useEffect(() => {
    const el = gl.domElement
    let down: { x: number; y: number } | null = null
    const pd = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY })
    const pm = (e: PointerEvent) => {
      if (!down || modeRef.current !== 'walk') return
      const k = e.pointerType === 'touch' ? 0.006 : 0.0035
      look.current.yaw += (e.clientX - down.x) * k
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch + (e.clientY - down.y) * k, -1.1, 1.1)
      down = { x: e.clientX, y: e.clientY }
    }
    const pu = () => (down = null)
    const kd = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase())
    const ku = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())
    el.addEventListener('pointerdown', pd)
    window.addEventListener('pointermove', pm)
    window.addEventListener('pointerup', pu)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      el.removeEventListener('pointerdown', pd)
      window.removeEventListener('pointermove', pm)
      window.removeEventListener('pointerup', pu)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [gl])

  const e = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), [])
  useFrame((_, dt) => {
    const tw = tween.current
    if (tw) {
      tw.t = Math.min(1, tw.t + dt / tw.dur)
      const k = ease(tw.t)
      camera.position.lerpVectors(tw.p0, tw.p1, k)
      camera.quaternion.slerpQuaternions(tw.q0, tw.q1, k)
      if (tw.t >= 1) {
        tween.current = null
        e.setFromQuaternion(camera.quaternion)
        look.current = { yaw: e.y, pitch: e.x }
        if (tw.then === 'overview' && controls) {
          controls.target.set(...START.target)
          controls.update()
        }
        setMode(tw.then)
      }
      return
    }
    if (modeRef.current !== 'walk') return
    e.set(look.current.pitch, look.current.yaw, 0)
    camera.quaternion.setFromEuler(e)
    // keyboard walking
    const f = (keys.current.has('w') || keys.current.has('arrowup') ? 1 : 0) - (keys.current.has('s') || keys.current.has('arrowdown') ? 1 : 0)
    const r = (keys.current.has('d') || keys.current.has('arrowright') ? 1 : 0) - (keys.current.has('a') || keys.current.has('arrowleft') ? 1 : 0)
    if (f || r) {
      const sp = 1.5 * Math.min(dt, 0.05)
      const yaw = look.current.yaw
      const dx = (-Math.sin(yaw) * f + Math.cos(yaw) * r) * sp
      const dz = (-Math.cos(yaw) * f - Math.sin(yaw) * r) * sp
      const p = camera.position
      if (!blocked(p.x + dx, p.z + dz)) p.set(p.x + dx, EYE, p.z + dz)
      else if (!blocked(p.x + dx, p.z)) p.x += dx
      else if (!blocked(p.x, p.z + dz)) p.z += dz
      onMoved()
    }
  })

  return null
}

function Scene({ time, mode, setMode, apiRef, onMoved, fx }: { time: Time; mode: Mode; setMode: (m: Mode) => void; apiRef: React.MutableRefObject<RigApi | null>; onMoved: () => void; fx: boolean }) {
  const L = LOOK[time]
  const sunPos = useMemo(() => new THREE.Vector3(...L.sky.sunDir).normalize().multiplyScalar(14), [L])
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.toneMappingExposure = L.exposure
  }, [gl, L.exposure])
  return (
    <>
      {mode === 'overview' ? (
        <>
          <color attach="background" args={['#ece5dc']} />
          <mesh rotation-x={-Math.PI / 2} position={[0, -0.32, 0]} receiveShadow>
            <circleGeometry args={[40, 64]} />
            <meshStandardMaterial color="#e6ded3" roughness={1} />
          </mesh>
        </>
      ) : (
        <World sky={L.sky} />
      )}
      <hemisphereLight args={['#f6efe6', '#8a7a6a', L.hemi]} />
      <directionalLight
        position={sunPos}
        color={L.sun.color}
        intensity={L.sun.intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <Environment resolution={128} frames={1} environmentIntensity={L.env}>
        <Lightformer form="rect" intensity={2} color="#fff3e4" position={[0, 4, -8]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#e9d6c2" position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="circle" intensity={1.5} color="#ffffff" position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={4} />
      </Environment>
      <Suspense fallback={null}>
        <Apartment
          showCeiling={mode !== 'overview'}
          lighting={L.light}
          onFloorClick={(e: ThreeEvent<MouseEvent>) => {
            if (mode !== 'walk' || e.delta > 6) return
            e.stopPropagation()
            apiRef.current?.walkTo(e.point)
          }}
        />
      </Suspense>
      <OrbitControls
        makeDefault
        enabled={mode === 'overview'}
        enableDamping
        target={START.target}
        minDistance={6}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.4}
        autoRotate={mode === 'overview'}
        autoRotateSpeed={0.35}
      />
      <Rig mode={mode} setMode={setMode} apiRef={apiRef} onMoved={onMoved} />
      {fx && (
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <N8AO aoRadius={0.6} distanceFalloff={0.6} intensity={2.2} quality="medium" halfRes />
          <Bloom intensity={0.25} luminanceThreshold={0.88} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.3} darkness={0.35} />
        </EffectComposer>
      )}
    </>
  )
}

export function Experience({ aptId, onExit }: { aptId: string | null; onExit: () => void }) {
  const apt = APARTMENTS.find((a) => a.id === aptId) ?? null
  const sample = TYPES.find((t) => t.key === 'a-01')!
  const [time, setTime] = useState<Time>('day')
  const [mode, setMode] = useState<Mode>('overview')
  const [active, setActive] = useState<Stop | null>(null)
  const apiRef = useRef<RigApi | null>(null)
  const fx = useMemo(() => !window.matchMedia('(pointer: coarse)').matches && !new URLSearchParams(location.search).has('nofx'), [])
  const area = (room: string) => sample.rooms.filter((r) => r.kind === room).reduce((s, r) => s + r.area, 0)

  const go = (s: Stop) => {
    setActive(s)
    apiRef.current?.goStop(s)
  }

  return (
    <div className="fixed inset-0 bg-ink-900 text-ink-800">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: startPos(), fov: 55, near: 0.05, far: 2000 }}
        gl={{ antialias: !fx, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: 'high-performance' }}
        className="touch-none"
      >
        <Scene time={time} mode={mode} setMode={setMode} apiRef={apiRef} onMoved={() => setActive(null)} fx={fx} />
      </Canvas>

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 pt-[max(env(safe-area-inset-top),16px)] sm:p-6">
        <div className="pointer-events-auto flex items-center gap-3">
          <button onClick={onExit} className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-sand-100 shadow-panel">
            {Icon.back} Back
          </button>
          <div className="hidden rounded-2xl bg-sand-50/85 px-4 py-2 shadow-panel backdrop-blur sm:block">
            <div className="eyebrow">HAB 13 · 3D experience</div>
            <div className="text-[13px] text-ink-800">
              Sample residence · Type {sample.code} · {sample.area} m²
            </div>
          </div>
        </div>
        <div className="pointer-events-auto flex gap-0.5 rounded-full bg-sand-50/85 p-1 shadow-panel backdrop-blur">
          {(['day', 'golden', 'night'] as Time[]).map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`rounded-full px-3 py-1.5 text-[11px] capitalize transition ${time === t ? 'bg-ink-800 text-sand-100' : 'text-ink-600 hover:bg-white'}`}
            >
              {t === 'golden' ? 'Sunset' : t}
            </button>
          ))}
        </div>
      </div>

      {/* overview call to action */}
      {mode === 'overview' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 flex flex-col items-center gap-3 px-4 text-center sm:bottom-32">
          <div className="rounded-2xl bg-sand-50/85 px-5 py-3 shadow-panel backdrop-blur">
            <div className="eyebrow">Step inside</div>
            <div className="mt-0.5 text-lg font-light text-ink-800">A furnished one-bedroom residence</div>
          </div>
          <button onClick={() => go(STOPS[0])} className="btn-primary pointer-events-auto !px-6 !py-3 shadow-panel">
            Enter the apartment
          </button>
        </div>
      )}

      {/* info card, as in the reference */}
      {active && mode !== 'overview' && (
        <div key={active.id} className="fade-up pointer-events-none absolute bottom-28 left-4 w-[min(340px,calc(100vw-32px))] rounded-2xl bg-sand-50/90 p-4 shadow-panel backdrop-blur sm:bottom-24 sm:left-6">
          <div className="eyebrow">{active.eyebrow}</div>
          <div className="mt-1 text-lg font-light leading-snug text-ink-800">{active.title}</div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-600">{active.text}</p>
          {area(active.room) > 0 && <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-bronze-600">{area(active.room).toFixed(1)} m²</div>}
        </div>
      )}

      {/* stops */}
      <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(env(safe-area-inset-bottom),14px)] sm:px-6 sm:pb-6">
        <div className="scroll-thin mx-auto flex max-w-max gap-1 overflow-x-auto rounded-full bg-sand-50/90 p-1 shadow-panel backdrop-blur">
          <button
            onClick={() => {
              setActive(null)
              apiRef.current?.goOverview()
            }}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] uppercase tracking-[0.12em] ${mode === 'overview' ? 'bg-ink-800 text-sand-100' : 'text-ink-600 hover:bg-white'}`}
          >
            Overview
          </button>
          {STOPS.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] uppercase tracking-[0.12em] ${active?.id === s.id ? 'bg-ink-800 text-sand-100' : 'text-ink-600 hover:bg-white'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-2 text-center text-[10px] text-sand-100/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
          {mode === 'walk' ? 'Drag to look around · click or tap the floor to walk · W A S D on a keyboard' : 'Drag to rotate · scroll to zoom'}
          {' · '}Illustrative sample interior (catalogue Type {sample.code}, Hyrja A), shown for every residence
          {apt && apt.type.key !== 'a-01' ? `; your selection, Type ${apt.type.code}, has its own plan` : ''}
        </div>
      </div>
    </div>
  )
}

export default Experience
