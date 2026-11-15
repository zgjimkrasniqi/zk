import * as THREE from 'three'
import { useStore } from '../store'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type TimeOfDay = 'day' | 'golden' | 'night'

/** Everything in the scene that changes with the season and the time of day. */
export interface Atmosphere {
  sky: string
  fog: [number, number]
  hemi: { sky: string; ground: string; intensity: number }
  sun: { color: string; intensity: number; position: [number, number, number] }
  fill: number
  env: number // environment (reflections) intensity
  exposure: number
  ground: string
  plaza: string
  ctxBuilding: string
  ctxEdge: string
  road: string
  path: string
  park: string
  foliage: string[] // tree crowns, cycled per tree
  trunk: string
  lawn: string // roof gardens
  roofTop: string | null // snow on roofs and caps (null = keep facade colour)
  glow: number // emissive intensity of lit windows
  lamps: number
  labels: string // street-name paint
  particles: { kind: 'snow' | 'petals' | 'leaves' | null; colors: string[] }
}

const SEASON = {
  spring: {
    ground: '#e5e3da', plaza: '#ffffff', park: '#c9d4b6', lawn: '#9db27a', trunk: '#5a4a3c',
    foliage: ['#93ab6c', '#e8b9c4', '#a5bb7c', '#f1cfd6'], roofTop: null,
    particles: { kind: 'petals' as const, colors: ['#f6d3dc', '#fbe6ea', '#ffffff'] },
  },
  summer: {
    ground: '#e6e1da', plaza: '#ffffff', park: '#c6ceb8', lawn: '#7f915f', trunk: '#5a4a3c',
    foliage: ['#5f7048', '#6f7a5a', '#55663f', '#7d8865'], roofTop: null,
    particles: { kind: null, colors: [] },
  },
  autumn: {
    ground: '#e7dfd4', plaza: '#f6eee4', park: '#d6c4a2', lawn: '#a39a64', trunk: '#4e3f33',
    foliage: ['#c7782f', '#b5512d', '#d9a441', '#9a6a3a'], roofTop: null,
    particles: { kind: 'leaves' as const, colors: ['#c7782f', '#b5512d', '#d9a441'] },
  },
  winter: {
    ground: '#f3f4f6', plaza: '#eef0f3', park: '#f6f7f9', lawn: '#f1f3f6', trunk: '#4a423c',
    foliage: ['#eef2f6', '#e3e9ef', '#f5f7fa', '#dfe5ec'], roofTop: '#f4f6f8',
    particles: { kind: 'snow' as const, colors: ['#ffffff'] },
  },
}

const TIME = {
  day: {
    sky: '#efe4d8', fog: [260, 760] as [number, number],
    hemi: { sky: '#fff4e6', ground: '#8a6f57', intensity: 0.8 },
    sun: { color: '#fff1df', intensity: 2.1, position: [-70, 120, 60] as [number, number, number] },
    fill: 0.35, env: 1, exposure: 1.05, glow: 0.6, lamps: 0.6, darken: 0, ctx: '#c3c5c7', edge: '#9fa2a5', road: '#a3a19d', path: '#cfcac3', labels: 'rgba(255,255,255,0.92)',
  },
  golden: {
    sky: '#f2d6bb', fog: [240, 720] as [number, number],
    hemi: { sky: '#ffd9b0', ground: '#7a5a44', intensity: 0.6 },
    sun: { color: '#ffb36b', intensity: 2.6, position: [-150, 42, 70] as [number, number, number] },
    fill: 0.25, env: 0.8, exposure: 1.05, glow: 1.1, lamps: 1.4, darken: 0.08, ctx: '#c8c2bd', edge: '#a49c96', road: '#a39c95', path: '#d2c7bc', labels: 'rgba(255,248,238,0.92)',
  },
  night: {
    sky: '#1d2433', fog: [220, 700] as [number, number],
    hemi: { sky: '#5b6f9a', ground: '#141820', intensity: 0.55 },
    sun: { color: '#9fb4dd', intensity: 0.55, position: [60, 140, -40] as [number, number, number] },
    fill: 0.12, env: 0.25, exposure: 1.1, glow: 2.6, lamps: 3, darken: 0.72, ctx: '#4d5462', edge: '#6b7384', road: '#2c3039', path: '#3d434f', labels: 'rgba(235,225,205,0.75)',
  },
}

const NIGHT = new THREE.Color('#202838')
const shade = (c: string, k: number) => (k ? '#' + new THREE.Color(c).lerp(NIGHT, k).getHexString() : c)

export function atmosphere(season: Season, time: TimeOfDay): Atmosphere {
  const s = SEASON[season]
  const t = TIME[time]
  const winter = season === 'winter'
  const k = t.darken
  return {
    sky: winter && time === 'day' ? '#eceef1' : t.sky,
    fog: winter ? [t.fog[0] * 0.8, t.fog[1] * 0.85] : t.fog,
    hemi: t.hemi,
    sun: winter && time === 'day' ? { ...t.sun, color: '#f4f6ff', intensity: 1.8 } : t.sun,
    fill: t.fill,
    env: t.env,
    exposure: t.exposure,
    ground: shade(s.ground, k),
    plaza: shade(s.plaza, k * 0.9),
    ctxBuilding: winter ? shade('#dfe2e6', k * 0.9) : t.ctx,
    ctxEdge: t.edge,
    road: winter ? shade('#b9bcc2', k) : t.road,
    path: winter ? shade('#eceef1', k) : t.path,
    park: shade(s.park, k),
    foliage: s.foliage.map((c) => shade(c, k * 0.8)),
    trunk: s.trunk,
    lawn: shade(s.lawn, k * 0.8),
    roofTop: s.roofTop ? shade(s.roofTop, k * 0.8) : null,
    glow: t.glow,
    lamps: t.lamps,
    labels: t.labels,
    particles: s.particles,
  }
}

export function useAtmosphere() {
  const season = useStore((s) => s.season)
  const time = useStore((s) => s.timeOfDay)
  return atmosphere(season, time)
}
