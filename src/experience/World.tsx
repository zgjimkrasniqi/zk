import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Sky dome and a hazy city skyline around the sample apartment (illustrative). */

export interface SkyLook {
  top: string
  horizon: string
  sun: string
  sunDir: [number, number, number]
  city: string
  haze: string
  lit: number // 0..1, lit windows in the skyline
}

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const frag = /* glsl */ `
uniform vec3 top; uniform vec3 horizon; uniform vec3 sun; uniform vec3 sunDir;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, -0.2, 1.0);
  vec3 c = mix(horizon, top, pow(max(h, 0.0), 0.55));
  float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
  c += sun * (pow(s, 600.0) * 2.0 + pow(s, 12.0) * 0.35);
  gl_FragColor = vec4(c, 1.0);
}`

export function World({ sky, floorY = -14 }: { sky: SkyLook; floorY?: number }) {
  const uniforms = useMemo(
    () => ({
      top: { value: new THREE.Color(sky.top) },
      horizon: { value: new THREE.Color(sky.horizon) },
      sun: { value: new THREE.Color(sky.sun) },
      sunDir: { value: new THREE.Vector3(...sky.sunDir) },
    }),
    [sky],
  )

  const merged = useMemo(() => {
    // deterministic ring of blocks; nearby ones stay below the apartment (we are on an upper floor)
    const g: THREE.BufferGeometry[] = []
    let k = 17
    const r = () => ((k = (k * 16807) % 2147483647) / 2147483647)
    const tones = ['#ffffff', '#efe9e1', '#e3e6ea', '#f3eee6', '#dcd6cf']
    const col = new THREE.Color()
    for (let i = 0; i < 280; i++) {
      const a = r() * Math.PI * 2
      const d = 70 + Math.pow(r(), 0.8) * 430
      const w = 12 + r() * 22
      const dd = 12 + r() * 22
      const h = d < 160 ? 6 + r() * 12 : 10 + r() * 34 * (r() > 0.9 ? 2.4 : 1)
      const b = new THREE.BoxGeometry(w, h, dd).toNonIndexed()
      // world-scaled UVs (one window bay = 3 m) so facades tile evenly
      const pos = b.attributes.position as THREE.BufferAttribute
      const nor = b.attributes.normal as THREE.BufferAttribute
      const uv = b.attributes.uv as THREE.BufferAttribute
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v), y = pos.getY(v) + h / 2, z = pos.getZ(v)
        const nx = Math.abs(nor.getX(v)), ny = Math.abs(nor.getY(v))
        if (ny > 0.5) uv.setXY(v, 0.02, 0.02)
        else uv.setXY(v, (nx > 0.5 ? z : x) / 24, y / 24)
      }
      col.set(tones[i % tones.length])
      const c = new Float32Array(pos.count * 3)
      for (let v = 0; v < pos.count; v++) c.set([col.r, col.g, col.b], v * 3)
      b.setAttribute('color', new THREE.BufferAttribute(c, 3))
      b.rotateY(r() * Math.PI)
      b.translate(Math.cos(a) * d, floorY + h / 2, Math.sin(a) * d)
      g.push(b)
    }
    return mergeGeometries(g)
  }, [floorY])

  const [facade, windows] = useMemo(() => {
    // 8 x 8 window bays per tile (tile = 24 m)
    const mk = (draw: (g: CanvasRenderingContext2D) => void) => {
      const c = document.createElement('canvas')
      c.width = c.height = 256
      draw(c.getContext('2d')!)
      const t = new THREE.CanvasTexture(c)
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
      return t
    }
    let k = 5
    const r = () => ((k = (k * 16807) % 2147483647) / 2147483647)
    const lit: boolean[] = Array.from({ length: 64 }, () => r() > 0.55)
    const f = mk((g) => {
      g.fillStyle = '#ffffff'
      g.fillRect(0, 0, 256, 256)
      for (let j = 0; j < 8; j++)
        for (let i = 0; i < 8; i++) {
          g.fillStyle = (i + j) % 5 === 0 ? '#93a0ab' : '#aab5bf'
          g.fillRect(i * 32 + 9, j * 32 + 9, 14, 15)
        }
    })
    const w = mk((g) => {
      g.fillStyle = '#000'
      g.fillRect(0, 0, 256, 256)
      for (let j = 0; j < 8; j++)
        for (let i = 0; i < 8; i++)
          if (lit[j * 8 + i]) {
            g.fillStyle = `rgb(255,${205 + ((i * 7 + j * 3) % 40)},${150 + ((i * 5 + j) % 50)})`
            g.fillRect(i * 32 + 9, j * 32 + 9, 14, 15)
          }
    })
    return [f, w]
  }, [])

  return (
    <group>
      <mesh scale={900}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <mesh geometry={merged}>
        <meshStandardMaterial vertexColors map={facade} color={sky.city} roughness={0.85} emissive="#ffffff" emissiveMap={windows} emissiveIntensity={sky.lit * 1.3} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, floorY, 0]}>
        <circleGeometry args={[700, 48]} />
        <meshStandardMaterial color={sky.haze} roughness={1} />
      </mesh>
      <fog attach="fog" args={[sky.haze, 90, 620]} />
    </group>
  )
}
