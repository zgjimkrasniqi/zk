import { useMemo } from 'react'
import * as THREE from 'three'
import { useAtmosphere } from './atmosphere'

export function Tree({ x, z, s = 1, i = 0 }: { x: number; z: number; s?: number; i?: number }) {
  const atm = useAtmosphere()
  const c1 = atm.foliage[i % atm.foliage.length]
  const c2 = atm.foliage[(i + 1) % atm.foliage.length]
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 2.8, 6]} />
        <meshStandardMaterial color={atm.trunk} roughness={1} />
      </mesh>
      <mesh position={[0, 4.1, 0]} castShadow>
        <icosahedronGeometry args={[2.2, 1]} />
        <meshStandardMaterial color={c1} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.7, 3.3, 0.4]} castShadow>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial color={c2} roughness={0.95} flatShading />
      </mesh>
    </group>
  )
}

function Lamp({ x, z }: { x: number; z: number }) {
  const atm = useAtmosphere()
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 4, 6]} />
        <meshStandardMaterial color="#2e2d2c" />
      </mesh>
      <mesh position={[0, 4.05, 0]}>
        <boxGeometry args={[0.5, 0.12, 0.25]} />
        <meshStandardMaterial color="#2e2d2c" emissive="#ffd7a8" emissiveIntensity={atm.lamps * 2} />
      </mesh>
    </group>
  )
}

export function Surroundings({ withContext = false }: { withContext?: boolean }) {
  const atm = useAtmosphere()
  const trees = useMemo(() => {
    const pts: [number, number, number][] = []
    for (let i = 0; i < 9; i++) pts.push([-48 + i * 12, 44, 0.8 + (i % 3) * 0.15])
    pts.push([-30, -20, 1.1], [-30, -2, 0.9], [-28, 12, 1], [40, -26, 1.1], [40, 4, 0.95], [-4, 2, 0.9], [2, -6, 0.8])
    return pts
  }, [])

  const paving = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')!
    g.fillStyle = '#d9cfc3'
    g.fillRect(0, 0, 256, 256)
    g.strokeStyle = 'rgba(120,100,80,0.18)'
    g.lineWidth = 2
    for (let i = 0; i <= 256; i += 32) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke()
      g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(18, 12)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [])

  return (
    <group>
      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[withContext ? 700 : 260, 64]} />
        <meshStandardMaterial color={atm.ground} roughness={1} />
      </mesh>
      {/* Site plaza (plot bounds when the real surroundings are shown) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={withContext ? [5.5, 0.06, 2.5] : [4, 0.0, 2]} receiveShadow>
        <planeGeometry args={withContext ? [51, 69] : [100, 80]} />
        <meshStandardMaterial map={paving} color={atm.plaza} roughness={0.95} />
      </mesh>
      {/* Lawns */}
      {!withContext && [
        [8, -16, 22, 12],
        [-44, -6, 8, 26],
        [44, -6, 8, 30],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, z]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color={atm.lawn} roughness={1} />
        </mesh>
      ))}
      {!withContext && (
        <>
      {/* Street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 50]} receiveShadow>
        <planeGeometry args={[240, 11]} />
        <meshStandardMaterial color="#5c5955" roughness={0.9} />
      </mesh>
      {Array.from({ length: 24 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-115 + i * 10, 0.04, 50]}>
          <planeGeometry args={[4, 0.25]} />
          <meshBasicMaterial color="#e8e1d6" />
        </mesh>
      ))}
      {/* Sidewalk */}
      <mesh position={[0, 0.12, 42.5]} receiveShadow>
        <boxGeometry args={[240, 0.25, 4]} />
        <meshStandardMaterial color="#cfc5b9" roughness={1} />
      </mesh>
      {trees.map(([x, z, s], i) => (
        <Tree key={i} x={x} z={z} s={s} i={i} />
      ))}
      {[-40, -20, 0, 20, 40].map((x) => (
        <Lamp key={x} x={x} z={41} />
      ))}
        </>
      )}
      {withContext &&
        ([[-6, -6, 0.8], [2, 4, 0.9], [-9, 10, 0.75], [5, -8, 0.7]] as const).map(([x, z, s], i) => (
            <Tree key={`s${i}`} x={x} z={z} s={s} i={i} />
          ))}
    </group>
  )
}
