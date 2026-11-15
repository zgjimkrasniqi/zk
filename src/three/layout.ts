import { APARTMENTS, type Apartment, type BlockId } from '../data/apartments'

/**
 * Illustrative massing of the complex. Dimensions are approximate (metres) and
 * are NOT taken from architectural drawings. They exist to give each entrance
 * (Hyrja A/B/C) a selectable volume and each floor a selectable band.
 */

export const FLOOR_H = 3.2
export const GROUND_H = 4.4

export type FacadeStyle = 'navy' | 'charcoal' | 'brown' | 'white'

export interface Part {
  x: number
  z: number
  w: number // along X
  d: number // along Z
  levels: number // storeys incl. ground (index 0)
  style: FacadeStyle
  crown?: boolean // open two-storey frame on top, as on the towers in the catalogue cover
  loggias?: 'px' | 'nx' | 'pz' | 'nz' // face carrying a vertical strip of recessed balconies
  roofGarden?: boolean
}

export interface BlockLayout {
  id: BlockId
  /** parts[0] is the main volume: it carries the unit zones and the camera framing. */
  parts: Part[]
  levels: number
  setback: number // penthouse setback (m) on the main volume
}

/*
 * Massing read from the catalogue cover render (street view) and the site plans:
 *  - Hyrja C: tallest tower, a navy volume (G+13) locked into a taller charcoal volume
 *    (G+16) that ends in an open frame; recessed balconies run up one corner.
 *  - Hyrja B: white mid-rise between the towers with loggias and a planted roof.
 *  - Hyrja A: dark brown tower (G+13) with an open frame crown, fronted by a white
 *    G+8 wing with a roof garden.
 * Footprints and positions are approximate.
 */
export const LAYOUT: Record<BlockId, BlockLayout> = {
  C: {
    id: 'C',
    levels: 17,
    setback: 1.6,
    parts: [
      { x: -28, z: -9, w: 18, d: 17, levels: 17, style: 'charcoal', crown: true, loggias: 'px' },
      { x: -30, z: 2.5, w: 19, d: 9, levels: 14, style: 'navy' },
    ],
  },
  B: {
    id: 'B',
    levels: 8,
    setback: 1.8,
    parts: [
      { x: -2, z: 4, w: 26, d: 14, levels: 8, style: 'white', roofGarden: true },
      { x: -8, z: -7, w: 13, d: 9, levels: 8, style: 'white', roofGarden: true },
    ],
  },
  A: {
    id: 'A',
    levels: 14,
    setback: 1.6,
    parts: [
      { x: 24, z: -8, w: 18, d: 18, levels: 14, style: 'brown', crown: true, loggias: 'pz' },
      { x: 30, z: 7, w: 17, d: 12, levels: 9, style: 'white', roofGarden: true },
    ],
  },
}

export const mainPart = (id: BlockId) => LAYOUT[id].parts[0]

export const floorBottom = (floor: number) => (floor === 0 ? 0 : GROUND_H + (floor - 1) * FLOOR_H)
export const floorHeight = (floor: number) => (floor === 0 ? GROUND_H : FLOOR_H)
export const blockHeight = (b: BlockLayout) => floorBottom(b.levels - 1) + FLOOR_H
export const CROWN_H = FLOOR_H * 2

export interface Tile {
  apt: Apartment
  x: number // centre, world
  z: number
  w: number
  d: number
}

/**
 * Splits a floor footprint into simulated unit zones, proportional to the
 * catalogue area of each apartment type. These are presentation overlays,
 * not real floor plans.
 */
export function floorTiles(blockId: BlockId, floor: number): Tile[] {
  const b = { ...mainPart(blockId), setback: LAYOUT[blockId].setback }
  const apts = APARTMENTS.filter((a) => a.block === blockId && a.floor === floor)
  if (!apts.length) return []
  const isPH = floor === b.levels - 1
  const inset = isPH ? b.setback : 0
  const W = b.w - inset * 2
  const D = b.d - inset * 2
  const long = W >= D ? 'x' : 'z'
  const gap = 0.35

  const rows: Apartment[][] = apts.length <= 2 ? [apts] : splitBalanced(apts)
  const tiles: Tile[] = []
  const rowDepth = (long === 'x' ? D : W) / rows.length
  rows.forEach((row, ri) => {
    const total = row.reduce((s, a) => s + a.type.area, 0)
    let cursor = -(long === 'x' ? W : D) / 2
    row.forEach((apt) => {
      const len = (apt.type.area / total) * (long === 'x' ? W : D)
      const c = cursor + len / 2
      const r = -((long === 'x' ? D : W) / 2) + rowDepth * (ri + 0.5)
      if (long === 'x') tiles.push({ apt, x: b.x + c, z: b.z + r, w: len - gap, d: rowDepth - gap })
      else tiles.push({ apt, x: b.x + r, z: b.z + c, w: rowDepth - gap, d: len - gap })
      cursor += len
    })
  })
  return tiles
}

function splitBalanced(apts: Apartment[]): Apartment[][] {
  const half = Math.ceil(apts.length / 2)
  return [apts.slice(0, half), apts.slice(half)]
}

/** Camera presets */
export function blockView(id: BlockId) {
  const b = mainPart(id)
  const h = blockHeight(LAYOUT[id])
  const dist = Math.max(h * 2.1, 80)
  return {
    pos: [b.x + dist * 0.62, h * 0.72, b.z + dist * 0.95] as const,
    target: [b.x, h * 0.45, b.z] as const,
  }
}

export function floorView(id: BlockId, floor: number) {
  const b = mainPart(id)
  const y = floorBottom(floor) + FLOOR_H
  const dist = Math.max(b.w, b.d) * 2.4 + 22
  return {
    pos: [b.x + dist * 0.5, y + dist * 0.8, b.z + dist * 0.8] as const,
    target: [b.x, y, b.z] as const,
  }
}

export const OVERVIEW = {
  pos: [118, 78, 158] as const,
  target: [0, 18, 0] as const,
}
