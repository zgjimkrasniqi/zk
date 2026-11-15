// Renders the social-media film frame by frame with headless Chromium and encodes it with ffmpeg.
// Usage: npm run build && npx vite preview --port 4173 &
//        node scripts/render-film.mjs --size 1080x1920 --out film/out [--lang en] [--preview]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright') // npm i -D playwright (not bundled with the app)
import { execFileSync } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const has = (k) => process.argv.includes(`--${k}`)
const SIZE = arg('size', '1080x1920')
const OUT = arg('out', 'film/out')
const LANGS = arg('lang', 'en').split(',')
const BASE = arg('url', 'http://localhost:4173/')
const ONLY = arg('only', 'all') // 3d | text | encode | all
const PREVIEW = has('preview') // a few stills per shot only
const [W, H] = SIZE.split('x').map(Number)

let FPS, XFADE, SHOTS, TOTAL // read from the page (src/film/shots.ts)

const launch = () =>
  chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })

async function open(browser, query) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.error('pageerror', e.message))
  await page.goto(`${BASE}?film=${SIZE}${query}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__film && window.__film.ready(), null, { timeout: 120000 })
  ;({ FPS, XFADE, SHOTS, TOTAL } = await page.evaluate(() => window.__film.meta))
  return page
}

async function render3d() {
  const browser = await launch()
  const page = await open(browser, '')
  // warm-up: environment map, label textures after the web font loads
  for (let i = 0; i < 4; i++) await page.evaluate(() => window.__film.frame(0, 0))
  await page.waitForTimeout(800)
  const only = arg('shots', '') ? arg('shots').split(',').map(Number) : null
  for (let s = 0; s < SHOTS.length; s++) {
    if (only && !only.includes(s)) continue
    const dir = join(OUT, `${SIZE}`, `shot${s}`)
    mkdirSync(dir, { recursive: true })
    const n = Math.round(SHOTS[s].duration * FPS)
    const idx = PREVIEW ? [0, Math.floor(n / 2), n - 1] : [...Array(n).keys()]
    const t0 = Date.now()
    for (const f of idx) {
      const file = join(dir, `f${String(f).padStart(4, '0')}.png`)
      if (!PREVIEW && existsSync(file)) continue
      await page.evaluate(([s, t]) => window.__film.frame(s, t), [s, f / (n - 1)])
      await page.screenshot({ path: file })
    }
    console.log(`shot ${s}: ${idx.length} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  }
  await browser.close()
}

async function renderText(lang) {
  const browser = await launch()
  const page = await open(browser, `&layer=text&lang=${lang}`)
  const dir = join(OUT, `${SIZE}`, `text-${lang}`)
  mkdirSync(dir, { recursive: true })
  const n = Math.round(TOTAL * FPS)
  const idx = PREVIEW ? [...Array(Math.ceil(TOTAL))].map((_, i) => i * FPS + 15).filter((f) => f < n) : [...Array(n).keys()]
  for (const f of idx) {
    await page.evaluate((T) => window.__film.text(T), f / FPS)
    await page.screenshot({ path: join(dir, `t${String(f).padStart(4, '0')}.png`), omitBackground: true })
  }
  console.log(`text ${lang}: ${idx.length} frames`)
  await browser.close()
}

function encode(lang) {
  const root = join(OUT, SIZE)
  const inputs = []
  SHOTS.forEach((_, s) => inputs.push('-framerate', `${FPS}`, '-i', join(root, `shot${s}`, 'f%04d.png')))
  inputs.push('-framerate', `${FPS}`, '-i', join(root, `text-${lang}`, 't%04d.png'))
  // chain cross-fades between shots, then lay the caption layer on top
  let filter = ''
  let prev = '[0:v]'
  let offset = 0
  for (let s = 1; s < SHOTS.length; s++) {
    offset += SHOTS[s - 1].duration - XFADE
    const label = `[x${s}]`
    filter += `${prev}[${s}:v]xfade=transition=fade:duration=${XFADE}:offset=${offset.toFixed(3)}${label};`
    prev = label
  }
  filter += `${prev}[${SHOTS.length}:v]overlay=0:0:format=auto,fade=t=in:st=0:d=0.5,format=yuv420p[v]`
  const out = join(OUT, `hab13-${lang}-${W}x${H}.mp4`)
  execFileSync(
    'ffmpeg',
    ['-y', ...inputs, '-filter_complex', filter, '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
      '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', `${FPS}`, out],
    { stdio: 'inherit' },
  )
  console.log('wrote', out)
}

if (ONLY === 'all' || ONLY === '3d') await render3d()
if (ONLY === 'all' || ONLY === 'text') for (const l of LANGS) await renderText(l)
if (!PREVIEW && (ONLY === 'all' || ONLY === 'encode')) {
  if (!SHOTS) {
    const b = await launch()
    await (await open(b, '&layer=text')).close()
    await b.close()
  }
  for (const l of LANGS) encode(l)
}
