import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { Canvas, advance, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { GL_PROPS, SceneContents } from '../three/Scene'
import { FPS, SHOTS, TOTAL, XFADE } from './shots'
import { Overlay } from './Overlay'

/**
 * Off-line renderer for the social-media film.
 *   ?film=1080x1920            → 3D layer, driven frame by frame via window.__film.frame(shot, t)
 *   ?film=1080x1920&layer=text → transparent caption layer, driven via window.__film.text(T)
 */

declare global {
  interface Window {
    __film?: {
      ready: () => boolean
      meta?: { FPS: number; XFADE: number; TOTAL: number; SHOTS: { duration: number }[] }
      frame?: (shot: number, t: number) => void
      text?: (T: number) => void
    }
  }
}

const META = { FPS, XFADE, TOTAL, SHOTS: SHOTS.map((s) => ({ duration: s.duration })) }

function parse() {
  const q = new URLSearchParams(location.search)
  const [w, h] = (q.get('film') || '1080x1920').split('x').map(Number)
  return { w, h, layer: q.get('layer') === 'text' ? 'text' : '3d', lang: q.get('lang') || 'en' }
}

/** Keep roughly the same horizontal field of view whatever the format. */
function vfov(aspect: number) {
  const hfov = ((aspect > 0.6 ? 46 : 30) * Math.PI) / 180
  const v = 2 * Math.atan(Math.tan(hfov / 2) / aspect)
  return Math.min((v * 180) / Math.PI, aspect > 0.6 ? 60 : 52)
}

function Driver() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const context = useStore((s) => s.context)
  useEffect(() => {
    let ts = 0
    let fontsReady = false
    document.fonts.ready.then(() => (fontsReady = true))
    camera.fov = vfov(size.width / size.height)
    // In squarer formats the captions take the lower part of the frame, so lift the subject:
    // render the lower window of a taller frame (subject ends up about 38% from the top).
    if (size.width / size.height > 0.6) {
      const dy = Math.round(size.height * 0.24)
      camera.setViewOffset(size.width, size.height + dy, 0, dy, size.width, size.height)
    }
    window.__film = {
      ready: () => fontsReady && context !== undefined,
      meta: META,
      frame: (shot, t) => {
        const p = SHOTS[shot].pose(t)
        camera.position.set(...p.pos)
        camera.lookAt(...p.target)
        camera.updateProjectionMatrix()
        ts += 1000 / FPS
        advance(ts)
      },
    }
  }, [camera, size, context])
  return null
}

export function Film() {
  const { w, h, layer, lang } = parse()
  const [T, setT] = useState(0)

  useEffect(() => {
    if (layer !== 'text') return
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    let fontsReady = false
    document.fonts.ready.then(() => (fontsReady = true))
    window.__film = { ready: () => fontsReady, meta: META, text: (t) => flushSync(() => setT(t)) }
  }, [layer])

  if (layer === 'text')
    return (
      <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden' }}>
        <Overlay T={T} w={w} h={h} lang={lang} />
      </div>
    )

  return (
    <div style={{ width: w, height: h }}>
      <Canvas
        shadows
        frameloop="never"
        dpr={1}
        camera={{ position: [0, 200, 200], fov: 40, near: 1, far: 1500 }}
        gl={{ ...GL_PROPS, preserveDrawingBuffer: true }}
      >
        <SceneContents />
        <Driver />
      </Canvas>
    </div>
  )
}
