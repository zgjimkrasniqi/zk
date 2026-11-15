/**
 * Storyboard for the social-media film. Each shot is rendered separately and
 * the clips are cross-faded with ffmpeg (see scripts/render-film.mjs).
 * Coordinates are model metres (same space as src/three/layout.ts).
 */

type V3 = [number, number, number]
export interface Pose {
  pos: V3
  target: V3
}

export const FPS = 30
export const XFADE = 0.7 // seconds of cross-fade between consecutive shots

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // easeInOutCubic
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const mix3 = (a: V3, b: V3, t: number): V3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
const lin = (a: Pose, b: Pose, t: number): Pose => ({ pos: mix3(a.pos, b.pos, t), target: mix3(a.target, b.target, t) })

function orbit(target: V3, r0: number, r1: number, a0: number, a1: number, h0: number, h1: number, t: number): Pose {
  const a = mix(a0, a1, t)
  const r = mix(r0, r1, t)
  return { pos: [target[0] + r * Math.sin(a), target[1] + mix(h0, h1, t), target[2] + r * Math.cos(a)], target }
}

export interface Shot {
  id: string
  duration: number
  pose: (t: number) => Pose // t in [0, 1]
}

export const SHOTS: Shot[] = [
  {
    // Aerial: from the neighbourhood (street names visible) down towards the complex.
    id: 'aerial',
    duration: 5.5,
    pose: (t) =>
      lin(
        { pos: [-30, 400, 250], target: [12, 0, -6] },
        { pos: [-118, 205, 190], target: [6, 14, 6] },
        easeOut(t),
      ),
  },
  {
    // Slow orbit around the courtyard side.
    id: 'orbit',
    duration: 5.5,
    pose: (t) => orbit([6, 22, 4], 135, 112, -1.45, -0.35, 44, 50, ease(t)),
  },
  {
    // Crane up the Hyrja C tower from the street.
    id: 'tower',
    duration: 5,
    pose: (t) =>
      lin(
        { pos: [-22, 24, 96], target: [14, 14, 25] },
        { pos: [-8, 40, 86], target: [17, 44, 25] },
        ease(t),
      ),
  },
  {
    // Bird's-eye drift over the roofs and courtyard.
    id: 'roofs',
    duration: 5,
    pose: (t) => {
      const a = mix(0.15, 0.85, ease(t))
      const h = mix(185, 150, ease(t))
      const r = 42
      return { pos: [4 + r * Math.sin(a), h, 2 + r * Math.cos(a)], target: [4, 0, 2] }
    },
  },
  {
    // Wide pull-back for the end card.
    id: 'end',
    duration: 6,
    pose: (t) => orbit([6, 20, 4], 175, 210, -0.35, -0.05, 60, 85, easeOut(t)),
  },
]

/** Start time of each shot on the final (cross-faded) timeline. */
export const SHOT_START = SHOTS.reduce<number[]>((acc, _s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SHOTS[i - 1].duration - XFADE)
  return acc
}, [])
export const TOTAL = SHOT_START[SHOTS.length - 1] + SHOTS[SHOTS.length - 1].duration
