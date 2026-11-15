import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CameraControls, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { Block } from './Block'
import { GlbModel } from './GlbModel'
import { Surroundings } from './Surroundings'
import { Context, contextRotation, useContextData } from './Context'
import { CompassUpdater } from './CompassUpdater'
import { AREA_VIEW, OVERVIEW, blockView, floorView } from './layout'

function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const selectedBlock = useStore((s) => s.selectedBlock)
  const selectedFloor = useStore((s) => s.selectedFloor)
  const viewNonce = useStore((s) => s.viewNonce)
  const areaView = useStore((s) => s.areaView)
  const first = useRef(true)
  const aspect = useThree((s) => s.size.width / s.size.height)
  // Narrow (portrait) screens need the camera further back to frame the same view.
  const portrait = aspect < 1.2
  const k = portrait ? 1.3 : aspect < 1.4 ? 1.15 : 1
  const fit = (pos: readonly number[], target: readonly number[]) =>
    [
      ...pos.map((p, i) => target[i] + (p - target[i]) * k + (i === 1 && portrait ? 14 : 0)),
      target[0],
      target[1] + (portrait ? 14 : 0),
      target[2],
    ] as [number, number, number, number, number, number]

  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (first.current) {
      // Fly-in on load
      first.current = false
      c.setLookAt(170, 120, 210, 0, 10, 0, false)
      c.smoothTime = 0.9
      c.setLookAt(...fit(OVERVIEW.pos, OVERVIEW.target), true).then(() => {
        c.smoothTime = 0.45
      })
      return
    }
    c.smoothTime = 0.45
    if (areaView) {
      c.smoothTime = 0.8
      c.setLookAt(...fit(AREA_VIEW.pos, AREA_VIEW.target), true)
    } else if (selectedBlock && selectedFloor !== null) {
      const v = floorView(selectedBlock, selectedFloor)
      c.setLookAt(...fit(v.pos, v.target), true)
    } else if (selectedBlock) {
      const v = blockView(selectedBlock)
      c.setLookAt(...fit(v.pos, v.target), true)
    } else {
      c.setLookAt(...fit(OVERVIEW.pos, OVERVIEW.target), true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlock, selectedFloor, viewNonce, k, areaView])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={18}
      maxDistance={520}
      maxPolarAngle={Math.PI / 2.08}
      dollySpeed={0.6}
      draggingSmoothTime={0.12}
    />
  )
}

export function Scene() {
  const modelSource = useStore((s) => s.modelSource)
  const selectBlock = useStore((s) => s.selectBlock)
  const mode = modelSource === 'glb' ? 'overlay' : 'solid'
  const context = useContextData()

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [170, 120, 210], fov: 32, near: 1, far: 1500 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerMissed={(e) => {
        if (e.type === 'click' && (e as MouseEvent).detail === 2) selectBlock(null)
      }}
    >
      <color attach="background" args={['#efe4d8']} />
      <fog attach="fog" args={['#efe4d8', 260, 760]} />

      <hemisphereLight args={['#fff4e6', '#8a6f57', 0.8]} />
      <directionalLight
        position={[-70, 120, 60]}
        intensity={2.1}
        color="#fff1df"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-110}
        shadow-camera-right={110}
        shadow-camera-top={110}
        shadow-camera-bottom={-110}
        shadow-camera-near={10}
        shadow-camera-far={400}
      />
      <directionalLight position={[80, 40, -60]} intensity={0.35} color="#d7c5b7" />

      {/* Studio-style environment built from light panels (no external HDR) */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#fff3e4" position={[0, 6, -10]} scale={[20, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#e9d6c2" position={[-10, 3, 6]} rotation-y={Math.PI / 2} scale={[16, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#bca38b" position={[10, 2, 4]} rotation-y={-Math.PI / 2} scale={[16, 4, 1]} />
        <Lightformer form="circle" intensity={3} color="#ffffff" position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={6} />
      </Environment>

      <Surroundings withContext={!!context} />
      {context && <Context data={context} />}
      <CompassUpdater rotation={contextRotation(context ?? null)} />

      <Suspense fallback={null}>{modelSource === 'glb' && <GlbModel />}</Suspense>

      {modelSource !== 'checking' && (
        <>
          <Block id="C" mode={mode} />
          <Block id="B" mode={mode} />
          <Block id="A" mode={mode} />
        </>
      )}

      <CameraRig />
    </Canvas>
  )
}
