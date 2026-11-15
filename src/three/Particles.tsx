import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAtmosphere } from './atmosphere'

/** Falling snow (winter), blossom petals (spring) or leaves (autumn) around the complex. */
export function Particles() {
  const { particles } = useAtmosphere()
  const kind = particles.kind
  const ref = useRef<THREE.Points>(null)
  const N = kind === 'snow' ? 4000 : 700
  const R = kind === 'snow' ? 160 : 60 // radius of the volume
  const TOP = kind === 'snow' ? 120 : 70

  const { geo, speed } = useMemo(() => {
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const speed = new Float32Array(N)
    const c = new THREE.Color()
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < N; i++) {
      const a = rnd() * Math.PI * 2
      const r = Math.sqrt(rnd()) * R
      pos[i * 3] = 6 + Math.cos(a) * r
      pos[i * 3 + 1] = rnd() * TOP
      pos[i * 3 + 2] = 4 + Math.sin(a) * r
      c.set(particles.colors[i % Math.max(1, particles.colors.length)] ?? '#ffffff')
      col.set([c.r, c.g, c.b], i * 3)
      speed[i] = kind === 'snow' ? 2.5 + rnd() * 2.5 : 1.2 + rnd() * 1.6
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return { geo, speed }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, N, R, TOP, particles.colors.join()])

  const sprite = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 64
    const g = cv.getContext('2d')!
    if (kind === 'snow') {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30)
      gr.addColorStop(0, 'rgba(255,255,255,1)')
      gr.addColorStop(0.5, 'rgba(255,255,255,0.7)')
      gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr
      g.fillRect(0, 0, 64, 64)
    } else {
      g.fillStyle = '#fff'
      g.beginPath()
      g.ellipse(32, 32, 26, 13, 0.6, 0, Math.PI * 2)
      g.fill()
    }
    const t = new THREE.CanvasTexture(cv)
    return t
  }, [kind])

  useFrame(({ clock }, dt) => {
    const pts = ref.current
    if (!pts) return
    const d = Math.min(dt, 0.05)
    const p = pts.geometry.attributes.position as THREE.BufferAttribute
    const arr = p.array as Float32Array
    const t = clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const s = speed[i]
      arr[i * 3 + 1] -= s * d
      const sway = kind === 'snow' ? 0.4 : 1.4
      arr[i * 3] += Math.sin(t * 0.8 + i) * sway * d + (kind === 'snow' ? 0 : 0.8 * d)
      arr[i * 3 + 2] += Math.cos(t * 0.6 + i * 1.3) * sway * d
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] += TOP
    }
    p.needsUpdate = true
  })

  if (!kind) return null
  return (
    <points ref={ref} geometry={geo} raycast={() => null} frustumCulled={false}>
      <pointsMaterial
        map={sprite}
        vertexColors
        size={kind === 'snow' ? 0.55 : 0.7}
        sizeAttenuation
        transparent
        alphaTest={kind === 'snow' ? 0.02 : 0.4}
        depthWrite={false}
        opacity={kind === 'snow' ? 0.95 : 1}
      />
    </points>
  )
}
