import * as THREE from 'three'
import type { FacadeStyle } from './layout'

/**
 * Procedural facade textures for the placeholder massing, styled after the
 * catalogue cover render: dark clad towers (navy / charcoal / brown) with
 * vertical windows in light frames, white mid-rises with deep loggias and
 * timber soffits, and a glazed commercial ground floor.
 *
 * One texture == one storey of one facade face.
 */

type Kind = 'typical' | 'ground' | 'penthouse'

const cache = new Map<string, { map: THREE.Texture; emissive: THREE.Texture }>()
const PX_PER_M = 28

const WALL: Record<FacadeStyle, string> = {
  navy: '#2a3655',
  charcoal: '#2c2c2e',
  brown: '#382f2b',
  white: '#ecebe6',
}

function rand(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function glass(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, warm = false) {
  const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h)
  if (warm) {
    gr.addColorStop(0, '#b89a78')
    gr.addColorStop(1, '#7a5f45')
  } else {
    gr.addColorStop(0, '#5d6872')
    gr.addColorStop(0.45, '#262d34')
    gr.addColorStop(1, '#3b444d')
  }
  g.fillStyle = gr
  g.fillRect(x, y, w, h)
  g.fillStyle = 'rgba(255,255,255,0.08)'
  g.fillRect(x, y, w * 0.35, h)
}

export function facadeTextures(
  style: FacadeStyle,
  kind: Kind,
  widthM: number,
  heightM: number,
  variant: number,
  loggiaEdge: 'none' | 'left' | 'right' = 'none',
) {
  const key = `${style}-${kind}-${widthM.toFixed(1)}-${heightM.toFixed(1)}-${variant}-${loggiaEdge}`
  const hit = cache.get(key)
  if (hit) return hit

  const W = Math.max(64, Math.round(widthM * PX_PER_M))
  const H = Math.max(32, Math.round(heightM * PX_PER_M))
  const M = PX_PER_M
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const e = document.createElement('canvas')
  e.width = W
  e.height = H
  const ge = e.getContext('2d')!
  ge.fillStyle = '#000'
  ge.fillRect(0, 0, W, H)
  const r = rand(7919 + variant * 131 + Math.round(widthM * 17) + style.length * 1009)
  const lit = (x: number, y: number, w: number, h: number, a: number) => {
    ge.fillStyle = `rgba(255, ${200 + Math.round(r() * 30)}, ${140 + Math.round(r() * 40)}, ${a})`
    ge.fillRect(x, y, w, h)
  }

  if (kind === 'ground') {
    // White-framed glazed commercial ground floor (all blocks, as in the render)
    g.fillStyle = '#e9e7e2'
    g.fillRect(0, 0, W, H)
    const bay = 3.6 * M
    const n = Math.max(1, Math.round(W / bay))
    const bw = W / n
    for (let i = 0; i < n; i++) {
      const x = i * bw
      glass(g, x + 0.25 * M, 0.55 * M, bw - 0.5 * M, H - 0.75 * M)
      g.fillStyle = '#d9d6cf'
      g.fillRect(x + bw / 2 - 1.5, 0.55 * M, 3, H - 0.75 * M)
      g.fillRect(x + 0.25 * M, H * 0.78, bw - 0.5 * M, 2)
      if (r() > 0.3) lit(x + 0.3 * M, 0.6 * M, bw - 0.6 * M, H - 0.9 * M, 0.35 + r() * 0.25)
    }
    g.fillStyle = '#d6d2ca'
    g.fillRect(0, 0, W, 0.45 * M)
  } else if (style === 'white') {
    g.fillStyle = WALL.white
    g.fillRect(0, 0, W, H)
    // faint panel joints
    g.fillStyle = 'rgba(0,0,0,0.05)'
    for (let x = 0; x < W; x += 1.8 * M) g.fillRect(x, 0, 1, H)
    const mod = 3.2 * M
    const n = Math.max(1, Math.round(W / mod))
    const mw = W / n
    for (let i = 0; i < n; i++) {
      const x = i * mw
      const loggia = (i + variant) % 3 !== 1
      if (loggia) {
        // deep loggia: dark recess, timber soffit, glass balustrade
        const lx = x + 0.3 * M
        const lw = mw - 0.6 * M
        const ly = 0.15 * M
        const lh = H - 0.55 * M
        g.fillStyle = '#4a4744'
        g.fillRect(lx, ly, lw, lh)
        glass(g, lx + 0.25 * M, ly + 0.35 * M, lw - 0.5 * M, lh - 0.35 * M)
        g.fillStyle = '#9b7653'
        g.fillRect(lx, ly, lw, 0.28 * M)
        g.fillStyle = 'rgba(205,220,228,0.35)'
        g.fillRect(lx, ly + lh * 0.58, lw, lh * 0.42)
        g.fillStyle = 'rgba(255,255,255,0.5)'
        g.fillRect(lx, ly + lh * 0.58, lw, 2)
        if (r() > 0.72) lit(lx + 0.25 * M, ly + 0.35 * M, lw - 0.5 * M, lh - 0.35 * M, 0.25 + r() * 0.3)
      } else {
        const ww = 0.9 * M
        const wx = x + (mw - ww) / 2
        g.fillStyle = '#2b2b2b'
        g.fillRect(wx - 3, 0.5 * M - 3, ww + 6, H - 1.1 * M + 6)
        glass(g, wx, 0.5 * M, ww, H - 1.1 * M)
        if (r() > 0.75) lit(wx, 0.5 * M, ww, H - 1.1 * M, 0.3)
      }
    }
    g.fillStyle = '#dcd9d2'
    g.fillRect(0, H - 4, W, 4)
  } else {
    // Dark clad tower storey
    g.fillStyle = WALL[style]
    g.fillRect(0, 0, W, H)
    g.fillStyle = 'rgba(255,255,255,0.035)'
    for (let x = 0; x < W; x += 1.5 * M) g.fillRect(x, 0, 1, H)
    g.fillRect(0, H * 0.5, W, 1)

    const loggiaW = loggiaEdge === 'none' ? 0 : 3.2 * M
    const x0 = loggiaEdge === 'left' ? loggiaW : 0
    const x1 = loggiaEdge === 'right' ? W - loggiaW : W
    const mod = 1.6 * M
    const n = Math.max(1, Math.floor((x1 - x0) / mod))
    const mw = (x1 - x0) / n
    const frame = '#d8d4cc'
    for (let i = 0; i < n; i++) {
      const x = x0 + i * mw
      const roll = r()
      const big = kind === 'penthouse' ? roll > 0.2 : roll > 0.78
      if (!big && roll < 0.45) continue // solid panel
      const ww = big ? mw - 0.12 * M : 0.75 * M
      const wx = x + (mw - ww) / 2
      const wy = big ? 0.15 * M : 0.35 * M
      const wh = H - wy - 0.25 * M
      g.fillStyle = frame
      g.fillRect(wx - 2, wy - 2, ww + 4, wh + 4)
      glass(g, wx, wy, ww, wh)
      g.fillStyle = frame
      if (big) g.fillRect(wx + ww / 2 - 1, wy, 2, wh)
      g.fillRect(wx, wy + wh * 0.72, ww, 1.5)
      if (r() > (kind === 'penthouse' ? 0.4 : 0.7)) lit(wx, wy, ww, wh, 0.3 + r() * 0.3)
    }
    if (loggiaW) {
      // vertical strip of recessed balconies with warm timber soffits
      const lx = loggiaEdge === 'left' ? 0.1 * M : W - loggiaW + 0.1 * M
      const lw = loggiaW - 0.2 * M
      g.fillStyle = '#17181a'
      g.fillRect(lx, 0, lw, H)
      glass(g, lx + 0.3 * M, 0.35 * M, lw - 0.6 * M, H - 0.6 * M, r() > 0.5)
      g.fillStyle = '#b48a5e'
      g.fillRect(lx, 0, lw, 0.3 * M)
      g.fillStyle = 'rgba(205,220,228,0.3)'
      g.fillRect(lx, H * 0.62, lw, H * 0.38)
      g.fillStyle = 'rgba(255,255,255,0.45)'
      g.fillRect(lx, H * 0.62, lw, 2)
      lit(lx, 0, lw, 0.3 * M, 0.7)
      if (r() > 0.35) lit(lx + 0.3 * M, 0.35 * M, lw - 0.6 * M, H - 0.6 * M, 0.45 + r() * 0.3)
    }
    g.fillStyle = 'rgba(0,0,0,0.25)'
    g.fillRect(0, H - 3, W, 3)
  }

  const map = new THREE.CanvasTexture(c)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  const emissive = new THREE.CanvasTexture(e)
  emissive.colorSpace = THREE.SRGBColorSpace
  const out = { map, emissive }
  cache.set(key, out)
  return out
}

export const capColor = (style: FacadeStyle) => (style === 'white' ? '#dedbd4' : '#3a3836')
export const frameColor = (style: FacadeStyle) =>
  style === 'navy' ? '#2a3655' : style === 'brown' ? '#382f2b' : style === 'charcoal' ? '#2c2c2e' : '#ecebe6'
