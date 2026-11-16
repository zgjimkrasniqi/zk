import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { boucle, marble, painting, painting2, stripes } from './textures'

/** Furniture pieces, modelled facing +z (front towards +z), origin on the floor. */

type V3 = [number, number, number]
interface P {
  position?: V3
  rotation?: number
}

const C = {
  boucle: '#ece6dc',
  linen: '#c9c6c0',
  navy: '#2c3446',
  oak: '#b98d5f',
  walnut: '#6b4a33',
  black: '#1d1c1b',
  white: '#f4f2ee',
  stone: '#e4e1db',
  brass: '#b8925a',
}

function useBoucle() {
  return useMemo(() => {
    const t = boucle()
    return t
  }, [])
}

function Fabric({ color, bump = true }: { color: string; bump?: boolean }) {
  const b = useBoucle()
  return <meshStandardMaterial color={color} roughness={0.95} bumpMap={bump ? b : undefined} bumpScale={0.6} />
}

function Leg({ position, h = 0.12 }: { position: V3; h?: number }) {
  return (
    <mesh position={[position[0], h / 2, position[2]]} castShadow>
      <cylinderGeometry args={[0.018, 0.014, h, 8]} />
      <meshStandardMaterial color={C.black} roughness={0.5} metalness={0.4} />
    </mesh>
  )
}

export function Sofa({ position, rotation = 0, w = 2.2, d = 0.92, color = C.boucle }: P & { w?: number; d?: number; color?: string }) {
  const seats = w > 1.9 ? 3 : 2
  const sw = (w - 0.3) / seats
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[w, 0.3, d]} radius={0.05} position={[0, 0.27, 0]} castShadow receiveShadow>
        <Fabric color={color} />
      </RoundedBox>
      {/* back */}
      <RoundedBox args={[w, 0.48, 0.22]} radius={0.08} position={[0, 0.62, -d / 2 + 0.11]} castShadow>
        <Fabric color={color} />
      </RoundedBox>
      {/* arms */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.16, 0.36, d]} radius={0.07} position={[s * (w / 2 - 0.08), 0.56, 0]} castShadow>
          <Fabric color={color} />
        </RoundedBox>
      ))}
      {/* seat cushions */}
      {Array.from({ length: seats }, (_, i) => (
        <RoundedBox key={i} args={[sw - 0.02, 0.14, d - 0.26]} radius={0.06} position={[-w / 2 + 0.15 + sw * (i + 0.5), 0.48, 0.1]} castShadow>
          <Fabric color={color} />
        </RoundedBox>
      ))}
      {/* scatter cushions */}
      <RoundedBox args={[0.42, 0.4, 0.14]} radius={0.06} position={[-w / 2 + 0.45, 0.72, -d / 2 + 0.3]} rotation={[-0.25, 0.25, 0]} castShadow>
        <Fabric color="#3c4352" bump={false} />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.38, 0.13]} radius={0.06} position={[w / 2 - 0.45, 0.72, -d / 2 + 0.3]} rotation={[-0.25, -0.2, 0]} castShadow>
        <Fabric color="#c46a3c" bump={false} />
      </RoundedBox>
      {[
        [-w / 2 + 0.1, -d / 2 + 0.1],
        [w / 2 - 0.1, -d / 2 + 0.1],
        [-w / 2 + 0.1, d / 2 - 0.1],
        [w / 2 - 0.1, d / 2 - 0.1],
      ].map(([x, z], i) => (
        <Leg key={i} position={[x, 0, z]} />
      ))}
    </group>
  )
}

export function Armchair({ position, rotation = 0, color = C.navy }: P & { color?: string }) {
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[0.8, 0.3, 0.78]} radius={0.06} position={[0, 0.3, 0]} castShadow>
        <Fabric color={color} />
      </RoundedBox>
      <RoundedBox args={[0.8, 0.5, 0.18]} radius={0.08} position={[0, 0.64, -0.3]} rotation-x={-0.12} castShadow>
        <Fabric color={color} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.12, 0.26, 0.7]} radius={0.05} position={[s * 0.36, 0.55, 0]} castShadow>
          <Fabric color={color} />
        </RoundedBox>
      ))}
      {[[-0.32, -0.3], [0.32, -0.3], [-0.32, 0.3], [0.32, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} castShadow>
          <cylinderGeometry args={[0.02, 0.015, 0.16, 8]} />
          <meshStandardMaterial color={C.oak} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

export function RoundTable({ position, r = 0.32, h = 0.38, top = 'marble' }: P & { r?: number; h?: number; top?: 'marble' | 'white' }) {
  const m = useMemo(() => marble(), [])
  return (
    <group position={position}>
      <mesh position={[0, h - 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 0.04, 40]} />
        {top === 'marble' ? <meshStandardMaterial map={m} roughness={0.25} /> : <meshStandardMaterial color={C.white} roughness={0.4} />}
      </mesh>
      <mesh position={[0, (h - 0.04) / 2, 0]} castShadow>
        <cylinderGeometry args={[r * 0.75, r * 0.85, h - 0.04, 40]} />
        <meshStandardMaterial color={C.white} roughness={0.5} />
      </mesh>
    </group>
  )
}

export function Rug({ position, w, d, rotation = 0, pattern = 'stripes', color = '#d9d3c9' }: P & { w: number; d: number; pattern?: 'stripes' | 'plain'; color?: string }) {
  const t = useMemo(() => stripes(), [])
  return (
    <mesh position={[position![0], 0.006, position![2]]} rotation={[-Math.PI / 2, 0, rotation]} receiveShadow>
      <planeGeometry args={[w, d]} />
      {pattern === 'stripes' ? <meshStandardMaterial map={t} roughness={1} /> : <meshStandardMaterial color={color} roughness={1} />}
    </mesh>
  )
}

export function MediaWall({ position, rotation = 0, w = 2.4, h = 2.75 }: P & { w?: number; h?: number }) {
  // vertical oak slats with a floating walnut console and a wall-mounted TV
  const ref = useRef<THREE.InstancedMesh>(null)
  const n = Math.floor(w / 0.065)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i < n; i++) {
      m.makeTranslation(-w / 2 + 0.0325 + i * 0.065, h / 2, 0.02)
      ref.current!.setMatrixAt(i, m)
    }
    ref.current!.instanceMatrix.needsUpdate = true
  }, [n, w, h])
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, h / 2, 0.003]} receiveShadow>
        <boxGeometry args={[w, h, 0.006]} />
        <meshStandardMaterial color="#3a2a1f" roughness={0.9} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, n]} castShadow receiveShadow>
        <boxGeometry args={[0.042, h, 0.035]} />
        <meshStandardMaterial color={C.oak} roughness={0.7} />
      </instancedMesh>
      <mesh position={[0, 0.42, 0.24]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.75, 0.32, 0.4]} />
        <meshStandardMaterial color={C.walnut} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.32, 0.07]} castShadow>
        <boxGeometry args={[1.4, 0.8, 0.04]} />
        <meshStandardMaterial color="#0d0d0f" roughness={0.15} metalness={0.3} />
      </mesh>
      {/* decor on the console */}
      <mesh position={[-0.55, 0.7, 0.24]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.24, 24]} />
        <meshStandardMaterial color="#c46a3c" roughness={0.6} />
      </mesh>
      <mesh position={[0.5, 0.62, 0.24]} castShadow>
        <boxGeometry args={[0.3, 0.06, 0.22]} />
        <meshStandardMaterial color="#e9e4dc" roughness={0.8} />
      </mesh>
    </group>
  )
}

export function DiningTable({ position, rotation = 0, w = 0.85, d = 1.5 }: P & { w?: number; d?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[w, 0.045, d]} radius={0.015} position={[0, 0.74, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={C.oak} roughness={0.55} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.36, s * (d / 2 - 0.25)]} castShadow>
          <boxGeometry args={[w * 0.7, 0.72, 0.06]} />
          <meshStandardMaterial color={C.walnut} roughness={0.6} />
        </mesh>
      ))}
      {/* vase */}
      <mesh position={[0, 0.86, 0]} castShadow>
        <sphereGeometry args={[0.09, 24, 16]} />
        <meshStandardMaterial color="#f1ece4" roughness={0.3} />
      </mesh>
    </group>
  )
}

export function Chair({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[0.46, 0.06, 0.46]} radius={0.02} position={[0, 0.46, 0]} castShadow>
        <Fabric color="#d7cdbf" />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.34, 0.05]} radius={0.02} position={[0, 0.72, -0.21]} rotation-x={-0.1} castShadow>
        <meshStandardMaterial color={C.walnut} roughness={0.6} />
      </RoundedBox>
      {[[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]} castShadow>
          <cylinderGeometry args={[0.016, 0.014, 0.44, 8]} />
          <meshStandardMaterial color={C.walnut} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

export function Pendant({ position, light = 0 }: P & { light?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.7, 6]} />
        <meshStandardMaterial color={C.black} />
      </mesh>
      <mesh rotation-x={Math.PI} castShadow>
        <sphereGeometry args={[0.24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={C.brass} roughness={0.35} metalness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshStandardMaterial color="#fff6e6" emissive="#ffd9a0" emissiveIntensity={0.5 + light * 4} />
      </mesh>
      {light > 0 && <pointLight position={[0, -0.15, 0]} intensity={light * 6} distance={5} decay={2} color="#ffd6a0" />}
    </group>
  )
}

export function FloorLamp({ position, rotation = 0, light = 0 }: P & { light?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 32]} />
        <meshStandardMaterial color={C.black} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 1.6, 8]} />
        <meshStandardMaterial color={C.brass} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.19, 0.24, 32, 1, true]} />
        <meshStandardMaterial color="#f3ebdd" roughness={0.9} side={THREE.DoubleSide} emissive="#ffd9a0" emissiveIntensity={light * 0.8} />
      </mesh>
      {light > 0 && <pointLight position={[0, 1.55, 0]} intensity={light * 4} distance={4} decay={2} color="#ffd6a0" />}
    </group>
  )
}

export function Plant({ position, s = 1 }: P & { s?: number }) {
  const leaves = useMemo(() => {
    const out: { p: V3; r: number; c: string }[] = []
    let k = 3
    const r = () => ((k = (k * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 16; i++) {
      const a = r() * Math.PI * 2
      const h = 0.55 + r() * 0.9
      const rr = 0.08 + r() * 0.28
      out.push({ p: [Math.cos(a) * rr, h, Math.sin(a) * rr], r: 0.12 + r() * 0.12, c: r() > 0.5 ? '#4f6b3a' : '#3f5a2e' })
    }
    return out
  }, [])
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.4, 32]} />
        <meshStandardMaterial color="#d8d0c4" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.012, 0.015, 0.9, 6]} />
        <meshStandardMaterial color="#5a4632" />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} position={l.p} scale={[1, 0.7, 1]} castShadow>
          <icosahedronGeometry args={[l.r, 0]} />
          <meshStandardMaterial color={l.c} roughness={0.8} flatShading />
        </mesh>
      ))}
    </group>
  )
}

export function Art({ position, rotation = 0, w = 1.2, h = 0.9, which = 1 }: P & { w?: number; h?: number; which?: 1 | 2 }) {
  const t = useMemo(() => (which === 1 ? painting() : painting2()), [which])
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0, 0.02]} castShadow>
        <boxGeometry args={[w + 0.04, h + 0.04, 0.035]} />
        <meshStandardMaterial color="#e9e3d9" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.039]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={t} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Base units with worktop, along +x from the origin (front facing +z). */
export function KitchenRun({ position, rotation = 0, w, uppers = true, sinkAt, hobAt }: P & { w: number; uppers?: boolean; sinkAt?: number; hobAt?: number }) {
  const doors = Math.max(1, Math.round(w / 0.6))
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[w / 2, 0.05, 0.02]}>
        <boxGeometry args={[w, 0.1, 0.52]} />
        <meshStandardMaterial color="#2a2827" />
      </mesh>
      {Array.from({ length: doors }, (_, i) => (
        <mesh key={i} position={[(w / doors) * (i + 0.5), 0.48, 0.03]} castShadow receiveShadow>
          <boxGeometry args={[w / doors - 0.006, 0.76, 0.58]} />
          <meshStandardMaterial color="#efebe4" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[w / 2, 0.885, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.02, 0.03, 0.63]} />
        <meshStandardMaterial color="#3b3836" roughness={0.3} />
      </mesh>
      {sinkAt !== undefined && (
        <group position={[sinkAt, 0.9, 0.02]}>
          <mesh position={[0, -0.005, 0]}>
            <boxGeometry args={[0.55, 0.012, 0.4]} />
            <meshStandardMaterial color="#18181a" roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.17, -0.25]} castShadow>
            <torusGeometry args={[0.12, 0.012, 8, 24, Math.PI]} />
            <meshStandardMaterial color={C.black} roughness={0.3} metalness={0.6} />
          </mesh>
        </group>
      )}
      {hobAt !== undefined && (
        <group position={[hobAt, 0.903, 0.02]}>
          <mesh>
            <boxGeometry args={[0.6, 0.006, 0.52]} />
            <meshStandardMaterial color="#0c0c0d" roughness={0.1} metalness={0.2} />
          </mesh>
          {[[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.004, z]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[0.07, 0.08, 32]} />
              <meshBasicMaterial color="#4a4a4d" />
            </mesh>
          ))}
        </group>
      )}
      {uppers && (
        <group>
          {Array.from({ length: doors }, (_, i) => (
            <mesh key={i} position={[(w / doors) * (i + 0.5), 1.85, -0.12]} castShadow>
              <boxGeometry args={[w / doors - 0.006, 0.7, 0.35]} />
              <meshStandardMaterial color={C.oak} roughness={0.65} />
            </mesh>
          ))}
          <mesh position={[w / 2, 1.48, -0.12]}>
            <boxGeometry args={[w - 0.04, 0.02, 0.3]} />
            <meshStandardMaterial color="#fff2dc" emissive="#ffe2b8" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}
      {/* splashback */}
      <mesh position={[w / 2, 1.18, -0.29]}>
        <boxGeometry args={[w, 0.55, 0.01]} />
        <meshStandardMaterial color="#d9d3ca" roughness={0.2} />
      </mesh>
    </group>
  )
}

export function Fridge({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 1.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 2.16, 0.62]} />
        <meshStandardMaterial color={C.oak} roughness={0.65} />
      </mesh>
      <mesh position={[-0.27, 1.1, 0.315]}>
        <boxGeometry args={[0.012, 0.5, 0.012]} />
        <meshStandardMaterial color={C.black} />
      </mesh>
    </group>
  )
}

export function Bed({ position, rotation = 0, w = 1.8, l = 2.05 }: P & { w?: number; l?: number }) {
  // headboard at -z
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[w + 0.1, 0.3, l]} radius={0.04} position={[0, 0.2, 0]} castShadow receiveShadow>
        <Fabric color="#a9a49c" />
      </RoundedBox>
      <RoundedBox args={[w + 0.14, 1.05, 0.12]} radius={0.05} position={[0, 0.55, -l / 2 + 0.06]} castShadow>
        <Fabric color="#a9a49c" />
      </RoundedBox>
      <RoundedBox args={[w, 0.24, l - 0.12]} radius={0.08} position={[0, 0.45, 0.05]} castShadow>
        <meshStandardMaterial color="#f6f4f0" roughness={0.9} />
      </RoundedBox>
      {/* duvet */}
      <RoundedBox args={[w + 0.06, 0.08, l * 0.62]} radius={0.04} position={[0, 0.59, l * 0.18]} castShadow>
        <meshStandardMaterial color="#d8d6d2" roughness={0.95} />
      </RoundedBox>
      {/* throw */}
      <RoundedBox args={[w + 0.08, 0.09, 0.45]} radius={0.04} position={[0, 0.63, l * 0.34]} castShadow>
        <Fabric color="#7d7a76" />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.68, 0.16, 0.42]} radius={0.07} position={[s * 0.42, 0.65, -l / 2 + 0.38]} rotation-x={-0.35} castShadow>
          <meshStandardMaterial color="#fbfaf8" roughness={0.9} />
        </RoundedBox>
      ))}
    </group>
  )
}

export function Nightstand({ position, rotation = 0, light = 0 }: P & { light?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.42, 0.4]} />
        <meshStandardMaterial color={C.walnut} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.06, 0.26, 16]} />
        <meshStandardMaterial color="#e4dccf" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.18, 24, 1, true]} />
        <meshStandardMaterial color="#f2eadc" roughness={0.9} side={THREE.DoubleSide} emissive="#ffd9a0" emissiveIntensity={light} />
      </mesh>
      {light > 0 && <pointLight position={[0, 0.82, 0]} intensity={light * 1.5} distance={2.5} decay={2} color="#ffd6a0" />}
    </group>
  )
}

export function Wardrobe({ position, rotation = 0, w = 1.9, d = 0.58, h = 2.5 }: P & { w?: number; d?: number; h?: number }) {
  const n = Math.round(w / 0.48)
  return (
    <group position={position} rotation-y={rotation}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-w / 2 + (w / n) * (i + 0.5), h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w / n - 0.006, h, d]} />
          <meshStandardMaterial color="#e9e3da" roughness={0.6} />
        </mesh>
      ))}
      {Array.from({ length: n }, (_, i) => (
        <mesh key={`h${i}`} position={[-w / 2 + (w / n) * (i + (i % 2 ? 0.1 : 0.9)), 1.1, d / 2 + 0.01]}>
          <boxGeometry args={[0.015, 0.4, 0.02]} />
          <meshStandardMaterial color={C.brass} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

export function WC({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.6, -0.12]}>
        <boxGeometry args={[0.6, 1.2, 0.12]} />
        <meshStandardMaterial color="#e9e7e3" roughness={0.4} />
      </mesh>
      <RoundedBox args={[0.38, 0.32, 0.55]} radius={0.12} position={[0, 0.4, 0.17]} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.15} />
      </RoundedBox>
      <mesh position={[0.08, 1.0, -0.055]}>
        <boxGeometry args={[0.18, 0.12, 0.01]} />
        <meshStandardMaterial color="#cfccc7" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function Vanity({ position, rotation = 0, w = 0.8 }: P & { w?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.3, 0.46]} />
        <meshStandardMaterial color={C.oak} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.85, 0.02]} castShadow>
        <cylinderGeometry args={[0.2, 0.17, 0.12, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.02, -0.17]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
        <meshStandardMaterial color={C.black} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* round mirror */}
      <mesh position={[0, 1.55, -0.22]}>
        <cylinderGeometry args={[0.34, 0.34, 0.02, 48]} />
        <meshStandardMaterial color="#d7dde2" metalness={1} roughness={0.04} />
      </mesh>
    </group>
  )
}

export function Shower({ position, w, d, glassAt }: P & { w: number; d: number; glassAt: number }) {
  const m = useMemo(() => marble(), [])
  return (
    <group position={position}>
      {/* stone walls */}
      <mesh position={[-w / 2 + 0.01, 1.2, 0]}>
        <boxGeometry args={[0.02, 2.4, d]} />
        <meshStandardMaterial map={m} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.2, d / 2 - 0.01]}>
        <boxGeometry args={[w, 2.4, 0.02]} />
        <meshStandardMaterial map={m} roughness={0.25} />
      </mesh>
      {/* glass screen */}
      <mesh position={[glassAt, 1.05, 0]}>
        <boxGeometry args={[0.012, 2.1, d * 0.8]} />
        <meshPhysicalMaterial color="#e8f0f2" transparent opacity={0.22} roughness={0.05} metalness={0} />
      </mesh>
      <mesh position={[glassAt, 2.1, 0]}>
        <boxGeometry args={[0.02, 0.02, d * 0.8]} />
        <meshStandardMaterial color={C.black} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* rain head */}
      <mesh position={[-w / 2 + 0.35, 2.15, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.015, 32]} />
        <meshStandardMaterial color={C.black} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[-w / 2 + 0.17, 2.18, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.01, 0.01, 0.34, 8]} />
        <meshStandardMaterial color={C.black} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function Washer({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[0.6, 0.85, 0.58]} radius={0.02} position={[0, 0.425, 0]} castShadow>
        <meshStandardMaterial color="#f4f4f2" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.45, 0.292]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.18, 0.18, 0.01, 40]} />
        <meshStandardMaterial color="#2a2e33" roughness={0.1} metalness={0.4} />
      </mesh>
    </group>
  )
}

export function Door({ position, rotation = 0, w = 0.95 }: P & { w?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 2.1, 0.05]} />
        <meshStandardMaterial color="#5d4636" roughness={0.6} />
      </mesh>
      <mesh position={[w / 2 - 0.1, 1.02, 0.05]}>
        <boxGeometry args={[0.02, 0.3, 0.02]} />
        <meshStandardMaterial color={C.brass} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function BistroSet({ position }: P) {
  return (
    <group position={position}>
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.025, 32]} />
        <meshStandardMaterial color="#3a3836" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.36, 8]} />
        <meshStandardMaterial color="#3a3836" metalness={0.5} roughness={0.4} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.55, 0, 0]} rotation-y={s > 0 ? -Math.PI / 2 : Math.PI / 2}>
          <RoundedBox args={[0.55, 0.1, 0.55]} radius={0.04} position={[0, 0.38, 0]} castShadow>
            <Fabric color="#d9cdb8" />
          </RoundedBox>
          <RoundedBox args={[0.55, 0.38, 0.1]} radius={0.04} position={[0, 0.6, -0.24]} castShadow>
            <Fabric color="#d9cdb8" />
          </RoundedBox>
          {[[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.17, z]}>
              <cylinderGeometry args={[0.015, 0.015, 0.34, 6]} />
              <meshStandardMaterial color="#3a3836" metalness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
