/**
 * Apartment data for the HAB 13 prototype.
 *
 * Apartment TYPES (areas, room schedules, floor ranges, imagery) are taken from
 * the HAB 13 apartment catalogue ("Katalogu i Banesave – Kompleksi HAB 13").
 *
 * AVAILABILITY is SAMPLE DATA generated from a fixed seed. It does not reflect
 * real sales status.
 */

export type BlockId = 'A' | 'B' | 'C'
export type Status = 'available' | 'reserved' | 'sold'

export type RoomKind =
  | 'living'
  | 'kitchen'
  | 'bedroom'
  | 'hallway'
  | 'bathroom'
  | 'wc'
  | 'storage'
  | 'utility'
  | 'balcony'
  | 'terrace'

export const ROOM_LABEL: Record<RoomKind, { en: string; sq: string }> = {
  living: { en: 'Living room', sq: 'Qëndrim ditor' },
  kitchen: { en: 'Kitchen & dining', sq: 'Kuzhina / tryezaria' },
  bedroom: { en: 'Bedroom', sq: 'Dhomë gjumi' },
  hallway: { en: 'Hallway', sq: 'Koridori' },
  bathroom: { en: 'Bathroom', sq: 'Banjo' },
  wc: { en: 'WC', sq: 'WC' },
  storage: { en: 'Storage', sq: 'Depo' },
  utility: { en: 'Utility', sq: 'Utilit' },
  balcony: { en: 'Balcony', sq: 'Ballkoni' },
  terrace: { en: 'Terrace', sq: 'Terasa' },
}

export interface Room {
  kind: RoomKind
  area: number
  note?: string
}

export interface ApartmentType {
  key: string // e.g. "a-01" — matches /catalog/<key>-render.jpg and -plan.jpg
  block: BlockId
  code: string // catalogue "TIPI"
  area: number // m², net, as printed in the catalogue
  floors: number[] // floors this type appears on (per catalogue)
  floorLabel: string // as printed in the catalogue, e.g. "Kati 2–6"
  penthouse: boolean
  rooms: Room[]
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

const R = (kind: RoomKind, area: number, note?: string): Room => ({ kind, area, note })

// prettier-ignore
export const TYPES: ApartmentType[] = [
  // ── Hyrja A ──────────────────────────────────────────────
  { key: 'a-01', block: 'A', code: '01', area: 59.8, floors: range(2, 6), floorLabel: 'Floors 2–6', penthouse: false,
    rooms: [R('living', 18.6), R('kitchen', 7.4), R('bedroom', 12.6), R('hallway', 2.5), R('bathroom', 5.5), R('balcony', 4.4)] },
  { key: 'a-02', block: 'A', code: '02', area: 82.5, floors: range(2, 6), floorLabel: 'Floors 2–6', penthouse: false,
    rooms: [R('living', 18.6), R('kitchen', 7.0), R('bedroom', 13.4), R('bedroom', 12.5), R('hallway', 6.7), R('bathroom', 3.7), R('wc', 3.0), R('balcony', 6.1)] },
  { key: 'a-03', block: 'A', code: '03', area: 82.5, floors: range(2, 6), floorLabel: 'Floors 2–6', penthouse: false,
    rooms: [R('living', 18.4), R('kitchen', 9.0), R('bedroom', 13.4), R('bedroom', 12.3), R('hallway', 6.4), R('bathroom', 3.9), R('wc', 2.2), R('balcony', 6.0)] },
  { key: 'a-04', block: 'A', code: '04', area: 58.4, floors: range(2, 6), floorLabel: 'Floors 2–6', penthouse: false,
    rooms: [R('living', 17.2), R('kitchen', 7.3), R('bedroom', 12.6), R('hallway', 2.7), R('bathroom', 5.5), R('balcony', 5.0)] },
  { key: 'a-05', block: 'A', code: '05', area: 87.6, floors: range(2, 6), floorLabel: 'Floors 2–6', penthouse: false,
    rooms: [R('living', 17.6), R('kitchen', 7.9), R('bedroom', 14.7), R('bedroom', 11.5), R('hallway', 9.1), R('bathroom', 5.1), R('wc', 2.2), R('storage', 2.3), R('balcony', 4.3)] },
  { key: 'a-06', block: 'A', code: '06', area: 60.8, floors: range(2, 6), floorLabel: 'Floors 2–6', penthouse: false,
    rooms: [R('living', 16.0), R('kitchen', 7.1), R('bedroom', 12.3), R('hallway', 7.1), R('bathroom', 4.0), R('balcony', 4.6)] },
  { key: 'a-31', block: 'A', code: '31', area: 126.7, floors: range(7, 9), floorLabel: 'Floors 7–9', penthouse: false,
    rooms: [R('living', 29.5), R('kitchen', 6.9), R('bedroom', 16.7), R('bedroom', 11.7), R('bedroom', 14.2), R('hallway', 13.1), R('bathroom', 4.3), R('bathroom', 4.8), R('storage', 2.5), R('balcony', 4.8)] },
  { key: 'a-38', block: 'A', code: '38', area: 86.1, floors: range(7, 9), floorLabel: 'Floors 7–9', penthouse: false,
    rooms: [R('living', 19.8), R('kitchen', 8.1), R('bedroom', 14.2), R('bedroom', 9.6), R('hallway', 9.6), R('bathroom', 4.7), R('wc', 2.1), R('storage', 2.1), R('balcony', 4.3)] },
  { key: 'a-39', block: 'A', code: '39', area: 90.5, floors: range(7, 9), floorLabel: 'Floors 7–9', penthouse: false,
    rooms: [R('living', 19.5), R('kitchen', 6.9), R('bedroom', 14.4), R('bedroom', 11.4), R('hallway', 8.8), R('bathroom', 4.7), R('wc', 2.0), R('storage', 2.0), R('balcony', 7.4)] },
  { key: 'a-42', block: 'A', code: '42', area: 127.3, floors: range(10, 12), floorLabel: 'Floors 10–12', penthouse: false,
    rooms: [R('living', 23.3), R('kitchen', 15.4), R('bedroom', 16.7), R('bedroom', 11.7), R('bedroom', 14.2), R('hallway', 12.1), R('bathroom', 4.8), R('bathroom', 4.3), R('storage', 2.5), R('balcony', 4.9)] },
  { key: 'a-43', block: 'A', code: '43', area: 115.5, floors: range(10, 12), floorLabel: 'Floors 10–12', penthouse: false,
    rooms: [R('living', 18.9), R('kitchen', 13.5), R('bedroom', 13.6), R('bedroom', 14.4), R('bedroom', 11.1), R('hallway', 13.4), R('bathroom', 4.7), R('wc', 2.0), R('storage', 2.0), R('balcony', 4.3)] },
  { key: 'a-46', block: 'A', code: '46', area: 162.2, floors: [13], floorLabel: 'Penthouse', penthouse: true,
    rooms: [R('living', 25.0), R('kitchen', 16.0), R('bedroom', 25.7), R('bedroom', 15.3), R('bedroom', 15.2), R('terrace', 80.6), R('hallway', 18.4), R('bathroom', 6.2), R('bathroom', 3.9), R('storage', 1.5), R('utility', 4.2), R('balcony', 7.1)] },

  // ── Hyrja B ──────────────────────────────────────────────
  { key: 'b-01', block: 'B', code: '01', area: 128.6, floors: range(1, 6), floorLabel: 'Floors 1–6', penthouse: false,
    rooms: [R('living', 28.3), R('kitchen', 11.8), R('bedroom', 17.9), R('bedroom', 9.6), R('bedroom', 13.2), R('hallway', 13.4), R('bathroom', 5.0), R('bathroom', 4.9), R('balcony', 8.5)] },
  { key: 'b-02', block: 'B', code: '02', area: 79.0, floors: range(1, 6), floorLabel: 'Floors 1–6', penthouse: false,
    rooms: [R('living', 17.9), R('kitchen', 7.9), R('bedroom', 11.2), R('bedroom', 9.8), R('hallway', 9.9), R('bathroom', 5.3), R('wc', 2.1), R('balcony', 3.7)] },
  { key: 'b-03', block: 'B', code: '03', area: 81.9, floors: range(1, 6), floorLabel: 'Floors 1–6', penthouse: false,
    rooms: [R('living', 17.8), R('kitchen', 8.4), R('bedroom', 11.5), R('bedroom', 10.2), R('hallway', 9.3), R('bathroom', 5.0), R('wc', 1.9), R('storage', 1.9), R('balcony', 4.0)] },
  { key: 'b-04', block: 'B', code: '04', area: 91.3, floors: range(1, 6), floorLabel: 'Floors 1–6', penthouse: false,
    rooms: [R('living', 18.7), R('kitchen', 7.4), R('bedroom', 14.0), R('bedroom', 10.5), R('hallway', 10.7), R('bathroom', 5.1), R('wc', 2.2), R('storage', 1.9), R('balcony', 7.5)] },
  { key: 'b-05', block: 'B', code: '05', area: 91.1, floors: range(1, 6), floorLabel: 'Floors 1–6', penthouse: false,
    rooms: [R('living', 17.3), R('kitchen', 7.8), R('bedroom', 19.7), R('bedroom', 10.0), R('hallway', 7.9), R('bathroom', 5.0), R('bathroom', 4.0), R('storage', 1.7), R('balcony', 4.0)] },
  { key: 'b-31', block: 'B', code: '31', area: 145.6, floors: [7], floorLabel: 'Penthouse', penthouse: true,
    rooms: [R('living', 30.3), R('kitchen', 11.7), R('bedroom', 17.5), R('bedroom', 12.4), R('bedroom', 18.2), R('terrace', 77.2), R('hallway', 17.5), R('bathroom', 5.6), R('bathroom', 5.2), R('wc', 2.4), R('balcony', 4.2)] },
  { key: 'b-32', block: 'B', code: '32', area: 142.5, floors: [7], floorLabel: 'Penthouse', penthouse: true,
    rooms: [R('living', 24.0), R('kitchen', 17.7), R('bedroom', 19.1), R('bedroom', 13.7), R('bedroom', 14.1), R('terrace', 106.8), R('hallway', 16.9), R('bathroom', 5.8), R('bathroom', 4.2), R('wc', 2.7), R('storage', 1.6), R('balcony', 3.3)] },

  // ── Hyrja C ──────────────────────────────────────────────
  { key: 'c-01', block: 'C', code: '01', area: 121.2, floors: range(1, 7), floorLabel: 'Floors 1–7', penthouse: false,
    rooms: [R('living', 23.5), R('kitchen', 8.6), R('bedroom', 20.3), R('bedroom', 9.8), R('bedroom', 12.2), R('hallway', 12.7), R('bathroom', 4.1), R('bathroom', 3.0), R('balcony', 10.2)] },
  { key: 'c-02', block: 'C', code: '02', area: 85.0, floors: range(1, 15), floorLabel: 'Floors 1–15', penthouse: false,
    rooms: [R('living', 18.1), R('kitchen', 8.8), R('bedroom', 12.9), R('bedroom', 10.7), R('hallway', 10.2), R('bathroom', 5.2), R('bathroom', 3.5), R('balcony', 4.4)] },
  { key: 'c-03', block: 'C', code: '03', area: 99.5, floors: range(1, 15), floorLabel: 'Floors 1–15', penthouse: false,
    rooms: [R('living', 24.0), R('kitchen', 8.9), R('bedroom', 19.4, '16.3 + 3.1 m²'), R('bedroom', 11.5), R('hallway', 9.6), R('bathroom', 4.0), R('wc', 2.9), R('balcony', 4.0)] },
  { key: 'c-22', block: 'C', code: '22', area: 121.2, floors: range(8, 15), floorLabel: 'Floors 8–15', penthouse: false,
    rooms: [R('living', 23.5), R('kitchen', 9.0), R('bedroom', 16.9), R('bedroom', 15.1), R('bedroom', 10.7), R('hallway', 11.3), R('bathroom', 4.2), R('bathroom', 3.4), R('balcony', 10.2)] },
  { key: 'c-46', block: 'C', code: '46', area: 182.1, floors: [16], floorLabel: 'Penthouse', penthouse: true,
    rooms: [R('living', 32.6), R('kitchen', 28.8), R('bedroom', 27.7), R('bedroom', 14.6), R('bedroom', 12.8), R('terrace', 123.7), R('hallway', 22.9), R('bathroom', 4.4), R('bathroom', 4.0), R('wc', 3.3), R('balcony', 7.7)] },
]

export interface BlockInfo {
  id: BlockId
  name: string
  subtitle: string
  /** Total storeys above ground, including the ground floor (index 0). */
  levels: number
  /** Floors that hold apartments in the catalogue. */
  residentialFloors: number[]
  penthouseFloor: number
}

export const BLOCKS: BlockInfo[] = [
  { id: 'C', name: 'Hyrja C', subtitle: 'Tower · 16 floors + ground', levels: 17, residentialFloors: range(1, 16), penthouseFloor: 16 },
  { id: 'B', name: 'Hyrja B', subtitle: 'Residence · 7 floors + ground', levels: 8, residentialFloors: range(1, 7), penthouseFloor: 7 },
  { id: 'A', name: 'Hyrja A', subtitle: 'Tower · 13 floors + ground', levels: 14, residentialFloors: range(2, 13), penthouseFloor: 13 },
]

export const blockById = (id: BlockId) => BLOCKS.find((b) => b.id === id)!

export interface Apartment {
  id: string // e.g. "A-05-03"
  block: BlockId
  floor: number
  type: ApartmentType
  bedrooms: number
  status: Status
}

// Deterministic PRNG so the sample availability is stable between reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildApartments(): Apartment[] {
  const rnd = mulberry32(13)
  const list: Apartment[] = []
  for (const block of BLOCKS) {
    for (const floor of block.residentialFloors) {
      const types = TYPES.filter((t) => t.block === block.id && t.floors.includes(floor))
      for (const type of types) {
        const r = rnd()
        // Lower floors sell first in the sample data — feels plausible in a demo.
        const soldBias = Math.max(0, 0.42 - floor * 0.018)
        const status: Status = r < soldBias ? 'sold' : r < soldBias + 0.17 ? 'reserved' : 'available'
        list.push({
          id: `${block.id}-${String(floor).padStart(2, '0')}-${type.code}`,
          block: block.id,
          floor,
          type,
          bedrooms: type.rooms.filter((x) => x.kind === 'bedroom').length,
          status,
        })
      }
    }
  }
  return list
}

export const APARTMENTS: Apartment[] = buildApartments()

export const floorName = (block: BlockInfo, floor: number) =>
  floor === 0 ? 'Ground' : floor === block.penthouseFloor ? 'Penthouse' : `Floor ${floor}`

export const STATUS_LABEL: Record<Status, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
}

export const STATUS_COLOR: Record<Status, string> = {
  available: '#7A9E7E',
  reserved: '#D09A4E',
  sold: '#A8564C',
}

export const CONTACT = {
  phones: ['+383 44 815 122', '+383 48 661 665', '+383 48 223 228', '+383 44 188 775'],
  email: 'shitjet@hab-eng.com',
  web: 'www.hab-eng.com',
  address: 'Rruga e Dubrovnikut, 10000 Prishtinë',
}
