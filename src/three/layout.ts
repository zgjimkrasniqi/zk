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
 * Massing read from the catalogue cover render (street view), fitted to the real plot:
 * the C-shaped construction footprint mapped in OpenStreetMap at the Google Maps pin
 * (north wing, east wing along the lane, south wing), with the courtyard open to the west.
 * Model axes are aligned with the plot; the surrounding map is rotated to match.
 *  - Hyrja C: south-east corner. Tallest tower: a charcoal volume (G+16) ending in an open
 *    frame, a navy volume (G+13) along the south wing and a white G+7 end block.
 *  - Hyrja B: white mid-rise (G+7) in the middle of the east wing, with a planted roof.
 *  - Hyrja A: north wing. Dark brown tower (G+13) with an open frame crown and a white
 *    G+8 wing towards the north-east corner.
 * Which entrance sits in which wing, and all heights, are approximate.
 */
export const LAYOUT: Record<BlockId, BlockLayout> = {
  C: {
    id: 'C',
    levels: 17,
    setback: 1.6,
    parts: [
      { x: 20.3, z: 24.4, w: 15.8, d: 18.6, levels: 17, style: 'charcoal', crown: true, loggias: 'px' },
      { x: 4.7, z: 25.35, w: 15.4, d: 16.5, levels: 14, style: 'navy' },
      { x: -10, z: 25.35, w: 14, d: 16.5, levels: 8, style: 'white', roofGarden: true },
    ],
  },
  B: {
    id: 'B',
    levels: 8,
    setback: 1.8,
    parts: [{ x: 20.3, z: 5, w: 15.8, d: 20, levels: 8, style: 'white', roofGarden: true }],
  },
  A: {
    id: 'A',
    levels: 14,
    setback: 1.6,
    parts: [
      { x: -4.15, z: -20.95, w: 16.5, d: 15.5, levels: 14, style: 'brown', crown: true, loggias: 'pz' },
      { x: 16.25, z: -15.35, w: 24.3, d: 20.7, levels: 9, style: 'white', roofGarden: true },
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

/** Camera presets. Views come from the south-west, looking into the courtyard. */
const VIEW_DIR = { x: -0.62, z: 0.78 } // horizontal unit-ish vector from target to camera

export function blockView(id: BlockId) {
  const b = mainPart(id)
  const h = blockHeight(LAYOUT[id])
  const dist = Math.max(h * 2.5, 90)
  return {
    pos: [b.x + dist * VIEW_DIR.x, h * 0.72, b.z + dist * VIEW_DIR.z] as const,
    target: [b.x, h * 0.45, b.z] as const,
  }
}

export function floorView(id: BlockId, floor: number) {
  const b = mainPart(id)
  const y = floorBottom(floor) + FLOOR_H
  const dist = Math.max(b.w, b.d) * 2.4 + 22
  return {
    pos: [b.x + dist * 0.75 * VIEW_DIR.x, y + dist * 0.8, b.z + dist * 0.75 * VIEW_DIR.z] as const,
    target: [b.x, y, b.z] as const,
  }
}

export const OVERVIEW = {
  pos: [-128, 116, 166] as const,
  target: [6, 18, 4] as const,
}
