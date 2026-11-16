import * as THREE from 'three'

/** Small procedural textures so the sample interior needs no image downloads. */

let seed = 1
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

function canvas(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  return t
}

const cache = new Map<string, THREE.Texture>()
const once = (k: string, f: () => THREE.Texture) => {
  if (!cache.has(k)) cache.set(k, f())
  return cache.get(k)!
}

/** Oak planks; one texture tile = 2 m x 2 m. */
export const oak = () =>
  once('oak', () => {
    seed = 11
    return canvas(1024, 1024, (g) => {
      const plankW = 1024 / 11 // ~18 cm
      for (let i = 0; i < 11; i++) {
        let y = -rnd() * 600
        while (y < 1024) {
          const L = 380 + rnd() * 520
          const tone = 168 + rnd() * 30
          g.fillStyle = `rgb(${tone + 22},${tone - 8},${tone - 48})`
          g.fillRect(i * plankW, y, plankW, L)
          // grain
          for (let k = 0; k < 14; k++) {
            g.strokeStyle = `rgba(90,60,35,${0.05 + rnd() * 0.08})`
            g.lineWidth = 0.6 + rnd() * 1.4
            g.beginPath()
            const x0 = i * plankW + rnd() * plankW
            g.moveTo(x0, y)
            for (let s = 0; s <= L; s += 40) g.lineTo(x0 + Math.sin(s * 0.01 + k) * 3, y + s)
            g.stroke()
          }
          g.fillStyle = 'rgba(70,45,25,0.35)'
          g.fillRect(i * plankW, y, plankW, 1.5)
          y += L
        }
        g.fillStyle = 'rgba(70,45,25,0.3)'
        g.fillRect(i * plankW, 0, 1.5, 1024)
      }
    }, [1, 1])
  })

export const marble = () =>
  once('marble', () => {
    seed = 5
    return canvas(1024, 1024, (g) => {
      g.fillStyle = '#efeeec'
      g.fillRect(0, 0, 1024, 1024)
      for (let v = 0; v < 26; v++) {
        let x = rnd() * 1024
        let y = rnd() * 1024
        const a = rnd() * Math.PI
        g.strokeStyle = `rgba(${90 + rnd() * 40},${85 + rnd() * 40},${95 + rnd() * 40},${0.12 + rnd() * 0.35})`
        g.lineWidth = 0.5 + rnd() * 2.5
        g.beginPath()
        g.moveTo(x, y)
        for (let s = 0; s < 60; s++) {
          x += Math.cos(a + (rnd() - 0.5) * 1.6) * 18
          y += Math.sin(a + (rnd() - 0.5) * 1.6) * 18
          g.lineTo(x, y)
        }
        g.stroke()
      }
    }, [1, 1])
  })

export const terrazzo = () =>
  once('terrazzo', () => {
    seed = 3
    return canvas(512, 512, (g) => {
      g.fillStyle = '#d9d6d1'
      g.fillRect(0, 0, 512, 512)
      for (let i = 0; i < 900; i++) {
        const c = rnd()
        g.fillStyle = c < 0.5 ? '#9b968f' : c < 0.8 ? '#f4f2ee' : '#6b6661'
        g.beginPath()
        g.ellipse(rnd() * 512, rnd() * 512, 1 + rnd() * 4, 1 + rnd() * 3, rnd() * 3, 0, Math.PI * 2)
        g.fill()
      }
    }, [2, 2])
  })

export const stripes = () =>
  once('stripes', () =>
    canvas(512, 512, (g) => {
      g.fillStyle = '#f1ede6'
      g.fillRect(0, 0, 512, 512)
      const cols = ['#1f1f22', '#f1ede6', '#8e9aa6', '#f1ede6', '#1f1f22', '#f1ede6', '#f1ede6']
      let y = 30
      let i = 0
      while (y < 482) {
        const h = 14 + ((i * 7) % 20)
        g.fillStyle = cols[i % cols.length]
        g.fillRect(30, y, 452, h)
        y += h
        i++
      }
      g.strokeStyle = '#d8d1c6'
      g.lineWidth = 6
      g.strokeRect(27, 27, 458, 458)
    }),
  )

/** Soft looped fabric (bouclé); used as a bump map. */
export const boucle = () =>
  once('boucle', () => {
    seed = 9
    return canvas(256, 256, (g) => {
      g.fillStyle = '#808080'
      g.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 2600; i++) {
        const v = 90 + rnd() * 120
        g.fillStyle = `rgb(${v},${v},${v})`
        g.beginPath()
        g.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 2.2, 0, Math.PI * 2)
        g.fill()
      }
    }, [3, 3])
  })

/** Abstract canvas in rust and ochre, a nod to the warm accents of the catalogue renders. */
export const painting = () =>
  once('painting', () => {
    seed = 21
    return canvas(512, 384, (g) => {
      g.fillStyle = '#b8471f'
      g.fillRect(0, 0, 512, 384)
      const grd = g.createLinearGradient(0, 0, 512, 384)
      grd.addColorStop(0, 'rgba(232,120,54,0.85)')
      grd.addColorStop(1, 'rgba(120,30,18,0.6)')
      g.fillStyle = grd
      g.fillRect(30, 26, 452, 332)
      g.fillStyle = 'rgba(40,20,15,0.85)'
      g.fillRect(300, 60, 140, 260)
      g.fillStyle = 'rgba(245,200,150,0.5)'
      for (let i = 0; i < 40; i++) g.fillRect(30 + rnd() * 450, 26 + rnd() * 330, 2 + rnd() * 30, 1 + rnd() * 3)
    })
  })

export const painting2 = () =>
  once('painting2', () =>
    canvas(384, 512, (g) => {
      g.fillStyle = '#ece6dc'
      g.fillRect(0, 0, 384, 512)
      g.fillStyle = '#c9a27a'
      g.beginPath()
      g.arc(170, 220, 110, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#2b2a2e'
      g.fillRect(200, 260, 110, 170)
    }),
  )
