import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Edges, Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useStore, matchesFilters } from '../store'
import { APARTMENTS, blockById, type BlockId } from '../data/apartments'
import { capColor, facadeTextures, frameColor } from './facade'
import { LAYOUT, FLOOR_H, floorBottom, floorHeight, blockHeight, type Part } from './layout'
import { FloorTiles } from './FloorTiles'

const BRONZE = new THREE.Color('#A08468')
const noRaycast = () => null

type Face = 'px' | 'nx' | 'pz' | 'nz'
// Which texture edge sits at the street-facing (+x/+z) corner, per box face.
const LOGGIA_EDGE: Record<Face, 'left' | 'right'> = { px: 'left', nx: 'right', pz: 'right', nz: 'left' }

function useFloorMaterials(p: Part, floor: number, inset: number) {
  return useMemo(() => {
    const isGround = floor === 0
    const isTop = floor === p.levels - 1
    const kind = isGround ? 'ground' : isTop && p.crown ? 'penthouse' : 'typical'
    const h = floorHeight(floor)
    const variant = floor % 5
    const make = (face: Face, width: number) => {
      const edge = p.loggias === face && !isGround && !isTop ? LOGGIA_EDGE[face] : 'none'
      const t = facadeTextures(p.style, kind, width, h, variant + (face === 'px' || face === 'nx' ? 0 : 7), edge)
      return new THREE.MeshStandardMaterial({
        map: t.map,
        emissiveMap: t.emissive,
        emissive: new THREE.Color('#ffe2bf'),
        emissiveIntensity: 0.6,
        roughness: p.style === 'white' ? 0.8 : 0.55,
        metalness: p.style === 'white' ? 0 : 0.12,
      })
    }
    const cap = new THREE.MeshStandardMaterial({ color: capColor(p.style), roughness: 0.9 })
    return [make('px', p.d - inset), make('nx', p.d - inset), cap, cap, make('pz', p.w - inset), make('nz', p.w - inset)]
  }, [p, floor, inset])
}

const ghostMat = new THREE.MeshStandardMaterial({
  color: '#F4E2D1',
  transparent: true,
  opacity: 0.1,
  depthWrite: false,
  roughness: 1,
})

const overlayMat = new THREE.MeshBasicMaterial({ color: '#A08468', transparent: true, opacity: 0, depthWrite: false })

interface FloorProps {
  p: Part
  floor: number
  inset: number
  mode: 'solid' | 'overlay'
  ghost: boolean
  selected: boolean
  hovered: boolean
  dimmed: boolean
  onOver: (e: ThreeEvent<PointerEvent>) => void
  onClick: (e: ThreeEvent<MouseEvent>) => void
}

function Floor({ p, floor, inset, mode, ghost, selected, hovered, dimmed, onOver, onClick }: FloorProps) {
  const mats = useFloorMaterials(p, floor, inset)
  const h = floorHeight(floor)
  const y = floorBottom(floor) + h / 2

  const material = useMemo(() => {
    if (mode === 'overlay') {
      const m = overlayMat.clone()
      m.opacity = selected ? 0.42 : hovered ? 0.28 : 0
      return m
    }
    if (ghost) return ghostMat
    return mats
  }, [mode, ghost, mats, selected, hovered])

  // Gentle tint on hover / dim when another block is focused
  useEffect(() => {
    if (mode !== 'solid' || ghost) return
    for (const m of mats as THREE.MeshStandardMaterial[]) {
      m.color.set('#ffffff')
      if (hovered || selected) m.color.lerp(BRONZE, selected ? 0.35 : 0.22)
      if (dimmed) m.color.multiplyScalar(0.72)
    }
  }, [mats, hovered, selected, dimmed, mode, ghost])

  return (
    <mesh
      position={[p.x, y, p.z]}
      castShadow={mode === 'solid' && !ghost}
      receiveShadow={mode === 'solid' && !ghost}
      material={material as THREE.Material}
      raycast={ghost ? noRaycast : THREE.Mesh.prototype.raycast}
      onPointerOver={onOver}
      onClick={onClick}
    >
      <boxGeometry args={[p.w - inset, h - 0.02, p.d - inset]} />
      {ghost && mode === 'solid' && <Edges color="#BCA38B" />}
      {(selected || (hovered && !ghost)) && <Edges color={selected ? '#8A6F57' : '#BCA38B'} lineWidth={selected ? 2 : 1} />}
    </mesh>
  )
}

/** Open two-storey frame that crowns the towers in the catalogue render. */
function Crown({ p, dimmed }: { p: Part; dimmed: boolean }) {
  const y0 = floorBottom(p.levels - 1)
  const H = FLOOR_H * 2
  const t = 0.4
  const color = useMemo(() => {
    const c = new THREE.Color(frameColor(p.style))
    if (dimmed) c.multiplyScalar(0.8)
    return c
  }, [p.style, dimmed])
  const members = useMemo(() => {
    const m: { pos: [number, number, number]; size: [number, number, number] }[] = []
    const bays = (len: number) => Math.max(2, Math.round(len / 4.5))
    // posts along the perimeter
    const nx = bays(p.w)
    const nz = bays(p.d)
    for (let i = 0; i <= nx; i++) {
      const x = -p.w / 2 + (p.w * i) / nx
      for (const z of [-p.d / 2, p.d / 2]) m.push({ pos: [x, H / 2, z], size: [t, H, t] })
    }
    for (let j = 1; j < nz; j++) {
      const z = -p.d / 2 + (p.d * j) / nz
      for (const x of [-p.w / 2, p.w / 2]) m.push({ pos: [x, H / 2, z], size: [t, H, t] })
    }
    // ring beams at mid height and top
    for (const y of [FLOOR_H, H - t / 2]) {
      m.push({ pos: [0, y, -p.d / 2], size: [p.w + t, t, t] })
      m.push({ pos: [0, y, p.d / 2], size: [p.w + t, t, t] })
      m.push({ pos: [-p.w / 2, y, 0], size: [t, t, p.d + t] })
      m.push({ pos: [p.w / 2, y, 0], size: [t, t, p.d + t] })
    }
    return m
  }, [p.w, p.d, H])

  return (
    <group position={[p.x, y0, p.z]}>
      {members.map((mm, i) => (
        <mesh key={i} position={mm.pos} castShadow>
          <boxGeometry args={mm.size} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
      {/* penthouse terrace deck inside the frame */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[p.w - 0.3, 0.12, p.d - 0.3]} />
        <meshStandardMaterial color="#8d7158" roughness={0.85} />
      </mesh>
      {/* glass balustrade */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[p.w - 0.4, 1.1, p.d - 0.4]} />
        <meshStandardMaterial color="#cfd8de" transparent opacity={0.18} roughness={0.05} depthWrite={false} />
      </mesh>
    </group>
  )
}

function RoofGarden({ p }: { p: Part }) {
  const y = floorBottom(p.levels - 1) + FLOOR_H
  const trees = useMemo(() => {
    const out: [number, number, number][] = []
    const n = Math.max(2, Math.round((p.w * p.d) / 70))
    for (let i = 0; i < n; i++) {
      const a = (i * 2.399) % (Math.PI * 2)
      const rr = 0.25 + ((i * 0.37) % 0.6) * 0.5
      out.push([Math.cos(a) * rr * p.w * 0.8, Math.sin(a) * rr * p.d * 0.8, 0.7 + ((i * 0.53) % 0.5)])
    }
    return out
  }, [p.w, p.d])
  return (
    <group position={[p.x, y, p.z]}>
      {/* parapet with timber cap, as on the white blocks in the render */}
      {(
        [
          [0, p.d / 2 - 0.15, p.w, 0.3],
          [0, -p.d / 2 + 0.15, p.w, 0.3],
          [p.w / 2 - 0.15, 0, 0.3, p.d],
          [-p.w / 2 + 0.15, 0, 0.3, p.d],
        ] as const
      ).map(([x, z, w, d], i) => (
        <group key={i}>
          <mesh position={[x, 0.5, z]} castShadow>
            <boxGeometry args={[w, 1, d]} />
            <meshStandardMaterial color="#e6e4de" roughness={0.85} />
          </mesh>
          <mesh position={[x, 1.04, z]}>
            <boxGeometry args={[w + 0.02, 0.08, d + 0.02]} />
            <meshStandardMaterial color="#a07850" roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[p.w - 1.2, 0.24, p.d - 1.2]} />
        <meshStandardMaterial color="#8c936f" roughness={1} />
      </mesh>
      {trees.map(([x, z, s], i) => (
        <group key={i} position={[x, 0.2, z]} scale={s}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 1.8, 5]} />
            <meshStandardMaterial color="#5a4a3c" />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <icosahedronGeometry args={[1.1, 0]} />
            <meshStandardMaterial color="#79845f" flatShading roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Block({ id, mode }: { id: BlockId; mode: 'solid' | 'overlay' }) {
  const b = LAYOUT[id]
  const main = b.parts[0]
  const info = blockById(id)
  const selectedBlock = useStore((s) => s.selectedBlock)
  const hoveredBlock = useStore((s) => s.hoveredBlock)
  const selectedFloor = useStore((s) => s.selectedFloor)
  const filters = useStore((s) => s.filters)
  const film = useStore((s) => s.film)
  const hoverBlock = useStore((s) => s.hoverBlock)
  const selectBlock = useStore((s) => s.selectBlock)
  const selectFloor = useStore((s) => s.selectFloor)
  const [hoverFloor, setHoverFloor] = useState<number | null>(null)

  const isSelected = selectedBlock === id
  const isHovered = hoveredBlock === id
  const focusedFloor = isSelected ? selectedFloor : null
  const dimmed = selectedBlock !== null && !isSelected

  const available = APARTMENTS.filter((a) => a.block === id && a.status === 'available' && matchesFilters(a, filters)).length
  const total = blockHeight(b) + (main.crown ? FLOOR_H : 0)

  const out = () => {
    setHoverFloor(null)
    if (useStore.getState().hoveredBlock === id) hoverBlock(null)
    document.body.style.cursor = 'auto'
  }

  return (
    <group onPointerOut={out}>
      {b.parts.map((p, pi) =>
        Array.from({ length: p.levels }, (_, floor) => {
          const residential = info.residentialFloors.includes(floor)
          const isTop = floor === p.levels - 1
          const inset = pi === 0 && isTop ? b.setback * 2 : 0
          return (
            <Floor
              key={`${pi}-${floor}`}
              p={p}
              floor={floor}
              inset={inset}
              mode={mode}
              ghost={focusedFloor !== null && floor > focusedFloor}
              selected={focusedFloor === floor}
              hovered={isSelected ? hoverFloor === floor && residential : isHovered && mode === 'overlay'}
              dimmed={dimmed}
              onOver={(e) => {
                e.stopPropagation()
                if (focusedFloor !== null && floor > focusedFloor) return
                hoverBlock(id)
                setHoverFloor(floor)
                document.body.style.cursor = 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (e.delta > 6) return
                if (focusedFloor !== null && floor > focusedFloor) return
                if (!isSelected) selectBlock(id)
                else if (residential) selectFloor(floor)
              }}
            />
          )
        }),
      )}

      {mode === 'solid' &&
        b.parts.map((p, pi) => {
          const hidden = focusedFloor !== null && focusedFloor < p.levels - 1
          if (hidden) return null
          return (
            <group key={pi}>
              {p.crown && <Crown p={p} dimmed={dimmed} />}
              {p.roofGarden && <RoofGarden p={p} />}
              {!p.crown && !p.roofGarden && (
                <mesh position={[p.x, floorBottom(p.levels - 1) + FLOOR_H + 0.5, p.z]} castShadow>
                  <boxGeometry args={[p.w, 1, p.d]} />
                  <meshStandardMaterial color={capColor(p.style)} roughness={0.9} />
                </mesh>
              )}
            </group>
          )
        })}

      {focusedFloor !== null && <FloorTiles blockId={id} floor={focusedFloor} />}

      {focusedFloor === null && !film && (
        <Html position={[main.x, total + 5, main.z]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => selectBlock(id)}
            onMouseEnter={() => hoverBlock(id)}
            onMouseLeave={() => hoverBlock(null)}
            className={`group whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] shadow-panel backdrop-blur transition ${
              isSelected || isHovered
                ? 'border-bronze-600 bg-ink-800 text-sand-100'
                : 'border-white/60 bg-sand-50/85 text-ink-800 hover:bg-ink-800 hover:text-sand-100'
            } ${dimmed ? 'opacity-50' : ''}`}
          >
            {info.name}
            <span className="ml-2 inline-flex items-center gap-1 font-normal normal-case tracking-normal opacity-80">
              <span className="h-1.5 w-1.5 rounded-full bg-status-available" />
              {available}
            </span>
          </button>
        </Html>
      )}
    </group>
  )
}
