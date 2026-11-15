import { useMemo } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useStore, matchesFilters } from '../store'
import { STATUS_COLOR, type BlockId } from '../data/apartments'
import { floorBottom, floorHeight, floorTiles } from './layout'

/**
 * Simulated apartment zones drawn on top of the selected floor.
 * Sized by catalogue area; NOT the real floor-plate layout.
 */
export function FloorTiles({ blockId, floor }: { blockId: BlockId; floor: number }) {
  const tiles = useMemo(() => floorTiles(blockId, floor), [blockId, floor])
  const filters = useStore((s) => s.filters)
  const hovered = useStore((s) => s.hoveredApartment)
  const selected = useStore((s) => s.selectedApartment)
  const hoverApartment = useStore((s) => s.hoverApartment)
  const selectApartment = useStore((s) => s.selectApartment)
  const y = floorBottom(floor) + floorHeight(floor)

  return (
    <group>
      {tiles.map((t) => {
        const match = matchesFilters(t.apt, filters)
        const isSel = selected === t.apt.id
        const isHov = hovered === t.apt.id
        const lift = isSel ? 1.2 : isHov ? 0.7 : 0.25
        const color = match ? STATUS_COLOR[t.apt.status] : '#9b948c'
        return (
          <group key={t.apt.id} position={[t.x, y + lift, t.z]}>
            <RoundedBox
              args={[t.w, 0.5, t.d]}
              radius={0.18}
              smoothness={3}
              castShadow
              onPointerOver={(e) => {
                e.stopPropagation()
                hoverApartment(t.apt.id)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                hoverApartment(null)
                document.body.style.cursor = 'auto'
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (e.delta > 6) return
                selectApartment(t.apt.id)
              }}
            >
              <meshStandardMaterial
                color={color}
                transparent
                opacity={match ? (isSel || isHov ? 0.98 : 0.86) : 0.35}
                roughness={0.45}
                emissive={color}
                emissiveIntensity={isSel ? 0.35 : isHov ? 0.2 : 0.06}
              />
            </RoundedBox>
            {isSel && (
              <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[t.w + 0.8, t.d + 0.8]} />
                <meshBasicMaterial color="#8A6F57" transparent opacity={0.5} />
              </mesh>
            )}
            <Html position={[0, 0.6, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
              <div
                className={`whitespace-nowrap rounded-md px-2 py-1 text-center leading-tight shadow-panel transition ${
                  isSel ? 'bg-ink-800 text-sand-100' : 'bg-sand-50/90 text-ink-800'
                } ${match ? '' : 'opacity-40'}`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em]">Type {t.apt.type.code}</div>
                <div className="text-[10px] opacity-75">{t.apt.type.area} m²</div>
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
