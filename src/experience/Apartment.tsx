import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { BALCONY_RAIL, DOOR_H, ENTRANCE, FLOOR_BALCONY, FLOOR_BATH, FLOOR_OAK, GLAZING, H, HEADERS, WALLS, len, mx, mz, rectM, type R } from './plan'
import { marble, oak, terrazzo } from './textures'
import {
  Armchair, Art, Bed, BistroSet, Chair, DiningTable, Door, Fridge, FloorLamp, KitchenRun, MediaWall, Nightstand, Pendant,
  Plant, Rug, RoundTable, Shower, Sofa, Vanity, WC, Wardrobe, Washer,
} from './Furniture'

RectAreaLightUniformsLib.init()

const at = (px: number, py: number, y = 0): [number, number, number] => [mx(px), y, mz(py)]
const PI = Math.PI

function Box({ r, y0, y1, material }: { r: R; y0: number; y1: number; material: THREE.Material }) {
  const m = rectM(r)
  return (
    <mesh position={[m.x, (y0 + y1) / 2, m.z]} material={material} castShadow receiveShadow>
      <boxGeometry args={[m.w, y1 - y0, m.d]} />
    </mesh>
  )
}

function Plane({ r, y, material, rotateTex = false, onClick, cast = false }: { r: R; y: number; material: THREE.Material; rotateTex?: boolean; onClick?: (e: ThreeEvent<MouseEvent>) => void; cast?: boolean }) {
  const m = rectM(r)
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(m.w, m.d)
    // world-scaled UVs: 1 UV unit = 2 m
    const uv = g.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * m.w) / 2, (uv.getY(i) * m.d) / 2)
    if (rotateTex) g.rotateZ(0)
    return g
  }, [m.w, m.d, rotateTex])
  return <mesh geometry={geo} position={[m.x, y, m.z]} rotation-x={-PI / 2} material={material} receiveShadow castShadow={cast} onClick={onClick} />
}

function Glazing({ r, along, mullions }: { r: R; along: 'x' | 'z'; mullions: number }) {
  const m = rectM(r)
  const L = along === 'x' ? m.w : m.d
  const frame = new THREE.MeshStandardMaterial({ color: '#2b2a29', roughness: 0.45, metalness: 0.5 })
  const bars: number[] = []
  for (let i = 0; i <= mullions + 1; i++) bars.push(-L / 2 + (L * i) / (mullions + 1))
  const sz = (a: number, b: number, c: number): [number, number, number] => (along === 'x' ? [a, b, c] : [c, b, a])
  const ps = (u: number, y: number): [number, number, number] => (along === 'x' ? [m.x + u, y, m.z] : [m.x, y, m.z + u])
  return (
    <group>
      <mesh position={ps(0, H / 2)} renderOrder={5}>
        <boxGeometry args={sz(L, H, 0.012)} />
        <meshPhysicalMaterial color="#dfe9ee" transparent opacity={0.12} roughness={0.02} metalness={0.1} depthWrite={false} />
      </mesh>
      {bars.map((u, i) => (
        <mesh key={i} position={ps(u, H / 2)} material={frame} castShadow>
          <boxGeometry args={sz(0.05, H, 0.07)} />
        </mesh>
      ))}
      {[0.025, H - 0.04].map((y, i) => (
        <mesh key={`h${i}`} position={ps(0, y)} material={frame}>
          <boxGeometry args={sz(L, 0.06, 0.08)} />
        </mesh>
      ))}
    </group>
  )
}

export interface Lighting {
  night: boolean
  window: { color: string; intensity: number }
}

/** The sample apartment (Type A-01) with its furniture. */
export function Apartment({ showCeiling, lighting, onFloorClick }: { showCeiling: boolean; lighting: Lighting; onFloorClick?: (e: ThreeEvent<MouseEvent>) => void }) {
  const mats = useMemo(() => {
    const o = oak()
    const mb = marble()
    const tz = terrazzo()
    return {
      wall: new THREE.MeshStandardMaterial({ color: '#f1ece5', roughness: 0.92 }),
      oak: new THREE.MeshStandardMaterial({ map: o, roughness: 0.55, color: '#ffffff' }),
      bath: new THREE.MeshStandardMaterial({ map: mb, roughness: 0.3 }),
      balcony: new THREE.MeshStandardMaterial({ map: tz, roughness: 0.8 }),
      ceiling: new THREE.MeshStandardMaterial({ color: '#f7f4ef', roughness: 1, side: THREE.DoubleSide }),
      skirting: new THREE.MeshStandardMaterial({ color: '#e7e1d8', roughness: 0.7 }),
    }
  }, [])
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  const light = lighting.night ? 1 : 0
  return (
    <group>
      {/* floors */}
      <Plane r={FLOOR_OAK} y={0} material={mats.oak} onClick={onFloorClick} />
      <Plane r={FLOOR_BATH} y={0.003} material={mats.bath} onClick={onFloorClick} />
      <Plane r={FLOOR_BALCONY} y={0.003} material={mats.balcony} onClick={onFloorClick} />
      {/* slab edge, seen from the dollhouse view */}
      {(() => {
        const m = rectM(FLOOR_OAK)
        return (
          <mesh position={[m.x, -0.16, m.z]} receiveShadow>
            <boxGeometry args={[m.w + 0.04, 0.3, m.d + 0.04]} />
            <meshStandardMaterial color="#d8d0c5" roughness={1} />
          </mesh>
        )
      })()}

      {/* walls, door headers, glazing, entrance */}
      {WALLS.map((r, i) => (
        <Box key={i} r={r} y0={0} y1={H} material={mats.wall} />
      ))}
      {HEADERS.map((r, i) => (
        <Box key={`h${i}`} r={r} y0={DOOR_H} y1={H} material={mats.wall} />
      ))}
      {GLAZING.map((g, i) => (
        <Glazing key={i} {...g} />
      ))}
      <Door position={at((ENTRANCE[0] + ENTRANCE[2]) / 2, (ENTRANCE[1] + ENTRANCE[3]) / 2)} w={len(ENTRANCE[2] - ENTRANCE[0]) - 0.06} />
      {/* balcony glass railing */}
      {(() => {
        const m = rectM(BALCONY_RAIL)
        return (
          <group>
            <mesh position={[m.x, 0.55, m.z]} renderOrder={5}>
              <boxGeometry args={[m.w, 1.05, 0.015]} />
              <meshPhysicalMaterial color="#dfe9ee" transparent opacity={0.18} roughness={0.05} depthWrite={false} />
            </mesh>
            <mesh position={[m.x, 1.08, m.z]}>
              <boxGeometry args={[m.w, 0.04, 0.05]} />
              <meshStandardMaterial color="#2b2a29" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        )
      })()}

      {showCeiling && (
        <group>
          <Plane r={FLOOR_OAK} y={H} material={mats.ceiling} cast />
          {/* recessed downlights */}
          {[[600, 300], [760, 300], [560, 640], [300, 380], [300, 650], [700, 610]].map(([x, y], i) => (
            <mesh key={i} position={at(x, y, H - 0.005)} rotation-x={PI / 2}>
              <circleGeometry args={[0.05, 24]} />
              <meshBasicMaterial color={light ? '#fff1d6' : '#e9e6e1'} />
            </mesh>
          ))}
        </group>
      )}

      {/* ---- living room ---- */}
      <Rug position={at(700, 330)} w={2.1} d={2.3} />
      <Sofa position={at(719, 150)} w={1.95} d={0.88} />
      <Sofa position={at(856, 318)} rotation={-PI / 2} w={2.35} d={0.88} />
      <Armchair position={at(585, 400)} rotation={1.98} />
      <RoundTable position={at(712, 318)} r={0.32} h={0.38} />
      <RoundTable position={at(680, 362)} r={0.24} h={0.32} top="white" />
      <MediaWall position={at(497, 343)} rotation={PI / 2} w={len(470 - 216) - 0.04} />
      <Art position={at(900, 318, 1.6)} rotation={-PI / 2} w={1.25} h={0.9} />
      <FloorLamp position={at(815, 175)} light={light} />
      <Plant position={at(872, 96)} s={1.15} />
      <Plant position={at(525, 200)} s={0.75} />

      {/* ---- dining & kitchen ---- */}
      <DiningTable position={at(835, 515)} rotation={PI / 2} w={0.8} d={1.1} />
      <Chair position={at(805, 462)} />
      <Chair position={at(865, 462)} />
      <Chair position={at(805, 568)} rotation={PI} />
      <Chair position={at(865, 568)} rotation={PI} />
      <Pendant position={at(835, 515, 1.85)} light={light} />
      <KitchenRun position={at(850, 700)} rotation={PI} w={len(850 - 655)} sinkAt={0.85} />
      <KitchenRun position={at(685, 670)} rotation={PI / 2} w={len(670 - 590)} uppers={false} hobAt={0.42} />
      <Fridge position={at(875, 699)} rotation={PI} />

      {/* ---- bedroom ---- */}
      <Rug position={at(262, 386)} w={2.3} d={2.6} pattern="plain" color="#d9d1c4" />
      <Bed position={at(234, 386)} rotation={PI / 2} w={1.7} l={2.05} />
      <Nightstand position={at(158, 268)} rotation={PI / 2} light={light} />
      <Nightstand position={at(158, 504)} rotation={PI / 2} light={light} />
      <Art position={at(133, 386, 1.62)} rotation={PI / 2} w={0.7} h={0.9} which={2} />
      <Wardrobe position={at(456, 314)} rotation={-PI / 2} w={len(410 - 218)} d={0.57} />
      <Plant position={at(455, 450)} s={0.7} />

      {/* ---- bathroom ---- */}
      <Shower position={at(177, 644)} w={len(222 - 133)} d={len(712 - 577)} glassAt={len(222 - 133) / 2} />
      <Washer position={at(277, 683)} rotation={PI} />
      <WC position={at(392, 712)} rotation={PI} />
      <Vanity position={at(447, 706)} rotation={PI} w={0.62} />

      {/* ---- balcony ---- */}
      <BistroSet position={at(320, 100)} />
      <Plant position={at(430, 60)} s={0.9} />

      {/* daylight through the glazing */}
      {GLAZING.map((g, i) => {
        const m = rectM(g.r)
        const L = g.along === 'x' ? m.w : m.d
        // face the light into the flat: living window looks south, balcony door east, bedroom window south
        const pos: [number, number, number] = [m.x + (i === 1 ? 0.15 : 0), H / 2, m.z + (i === 1 ? 0 : 0.2)]
        const target: [number, number, number] = i === 1 ? [m.x + 3, H / 2, m.z] : [m.x, H / 2 - 0.3, m.z + 3]
        return (
          <rectAreaLight
            key={i}
            width={L}
            height={H * 0.9}
            intensity={lighting.window.intensity * (i === 0 ? 1 : 0.6)}
            color={lighting.window.color}
            position={pos}
            onUpdate={(self) => self.lookAt(...target)}
          />
        )
      })}
    </group>
  )
}
