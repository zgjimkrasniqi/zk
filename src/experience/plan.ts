/**
 * Sample apartment for the walk-through: catalogue Type A-01 (59.8 m², one bedroom).
 * Everything is authored in the catalogue plan's pixel space (public/catalog/a-01-plan.jpg,
 * 98 px per metre, from the 411 cm and 670 cm dimension lines) and converted to metres here.
 * x grows east (right on the plan), z grows south (down on the plan).
 */

export const PPM = 98
const CX = 516
const CY = 394
export const H = 2.75 // floor to ceiling
export const DOOR_H = 2.1
export const EYE = 1.6

export const mx = (px: number) => (px - CX) / PPM
export const mz = (py: number) => (py - CY) / PPM
export const len = (px: number) => px / PPM

/** [x0, y0, x1, y1] in plan pixels */
export type R = [number, number, number, number]

export const rectM = ([x0, y0, x1, y1]: R) => ({
  x: mx((x0 + x1) / 2),
  z: mz((y0 + y1) / 2),
  w: len(x1 - x0),
  d: len(y1 - y0),
})

/** Full-height walls */
export const WALLS: R[] = [
  // exterior
  [102, 30, 225, 75],
  [102, 75, 145, 216],
  [145, 175, 230, 216],
  [380, 175, 456, 216],
  [456, 30, 576, 69],
  [456, 69, 498, 90],
  [456, 174, 498, 216],
  [828, 30, 930, 69],
  [900, 69, 930, 757],
  [102, 216, 133, 757],
  [102, 712, 330, 757],
  [330, 730, 500, 757],
  [600, 730, 930, 757],
  // interior
  [485, 216, 497, 470],
  [485, 555, 497, 590],
  [485, 660, 497, 730],
  [133, 562, 485, 577],
  [643, 565, 655, 730],
]

/** Wall above a door opening, from DOOR_H to the ceiling */
export const HEADERS: R[] = [
  [485, 470, 497, 555], // bedroom door
  [485, 590, 497, 660], // bathroom door
  [500, 730, 600, 757], // entrance
]

/** Floor-to-ceiling glazing: [rect, axis the pane runs along] */
export const GLAZING: { r: R; along: 'x' | 'z'; mullions: number }[] = [
  { r: [576, 30, 828, 69], along: 'x', mullions: 3 }, // living room
  { r: [456, 90, 498, 174], along: 'z', mullions: 1 }, // balcony door
  { r: [230, 175, 380, 216], along: 'x', mullions: 2 }, // bedroom to balcony
]

export const ENTRANCE: R = [500, 730, 600, 757]

/** Floor finishes */
export const FLOOR_OAK: R = [102, 30, 930, 757]
export const FLOOR_BATH: R = [133, 577, 485, 730]
export const FLOOR_BALCONY: R = [145, 30, 456, 175]
export const BALCONY_RAIL: R = [225, 30, 456, 36]

/** Footprints that block walking (furniture), in plan pixels */
export const BLOCKERS: R[] = [
  [640, 104, 798, 184], // sofa
  [797, 200, 900, 437], // sofa along the east wall
  [545, 365, 615, 435], // armchair
  [670, 300, 745, 390], // coffee tables
  [497, 250, 540, 420], // media unit
  [770, 450, 900, 580], // dining
  [655, 590, 715, 730], // kitchen run
  [655, 668, 900, 730], // kitchen run
  [133, 290, 335, 480], // bed
  [428, 218, 485, 410], // wardrobe
  [133, 577, 222, 712], // shower
  [225, 650, 330, 712], // washer
  [360, 680, 485, 730], // wc + vanity
]

export interface Stop {
  id: string
  label: string
  room: string // room schedule key for the area
  pos: [number, number] // plan px
  look: [number, number, number] // plan px x, height (m), plan px y
  eyebrow: string
  title: string
  text: string
}

export const STOPS: Stop[] = [
  {
    id: 'living',
    label: 'Living room',
    room: 'living',
    pos: [560, 540],
    look: [760, 1.15, 170],
    eyebrow: 'The living room',
    title: 'Oak, bouclé and a wall of glass',
    text: 'A floor-to-ceiling window fills the room with light. Oak floors and soft textures keep it warm.',
  },
  {
    id: 'dining',
    label: 'Kitchen & dining',
    room: 'kitchen',
    pos: [640, 300],
    look: [810, 1.0, 640],
    eyebrow: 'Kitchen & dining',
    title: 'Cook, gather, linger',
    text: 'An L-shaped kitchen opens onto a table for four, under a warm pendant light.',
  },
  {
    id: 'bedroom',
    label: 'Bedroom',
    room: 'bedroom',
    pos: [455, 515],
    look: [190, 1.0, 360],
    eyebrow: 'The bedroom',
    title: 'Quiet, with a view to the loggia',
    text: 'Room for a king-size bed, a full-height wardrobe and glazing onto the balcony.',
  },
  {
    id: 'bath',
    label: 'Bathroom',
    room: 'bathroom',
    pos: [540, 625],
    look: [250, 1.2, 650],
    eyebrow: 'The bathroom',
    title: 'Stone and glass',
    text: 'A walk-in shower behind glass, a floating vanity and space for a washer.',
  },
  {
    id: 'balcony',
    label: 'Balcony',
    room: 'balcony',
    pos: [522, 150],
    look: [300, 0.9, 95],
    eyebrow: 'The balcony',
    title: 'A private loggia',
    text: 'Step out from the living room. Big enough for a table for two.',
  },
  {
    id: 'view',
    label: 'The view',
    room: 'living',
    pos: [705, 225],
    look: [690, 1.25, -300],
    eyebrow: 'The view',
    title: 'Above Prishtina',
    text: 'From the upper floors, the city opens up beyond the glass.',
  },
]

export const START = { pos: [-6, 8.5, 7.5] as [number, number, number], target: [0.3, 0.2, 0.3] as [number, number, number] }
