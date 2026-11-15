import type { CSSProperties, ReactNode } from 'react'
import { CONTACT } from '../data/apartments'
import { SHOTS, SHOT_START, TOTAL, XFADE } from './shots'

const COPY = {
  en: {
    place: 'Prishtinë · Kosovë',
    s2: ['Hyrja A · B · C', 'Three entrances.\nOne address.'],
    s3: ['Hyrja C', 'Up to 16 floors\nabove the city'],
    s4: ['Residences', '58 – 182 m²', 'Apartments and penthouses\nin every entrance'],
    sales: 'Sales office',
    note: 'Illustrative 3D visualisation',
  },
  sq: {
    place: 'Prishtinë · Kosovë',
    s2: ['Hyrja A · B · C', 'Tri hyrje.\nNjë adresë.'],
    s3: ['Hyrja C', 'Deri në 16 kate\nmbi qytet'],
    s4: ['Banesat', '58 – 182 m²', 'Banesa dhe penthouse\nnë çdo hyrje'],
    sales: 'Zyra e shitjes',
    note: 'Vizualizim ilustrues 3D',
  },
}

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** 0→1 fade in from t0 (over d), 1→0 fade out ending at t1. */
function env(T: number, t0: number, t1: number, d = 0.7, dOut = 0.45) {
  return Math.min(easeOut(clamp((T - t0) / d)), clamp((t1 - T) / dOut))
}

function Rise({ T, t0, t1, u, children, style }: { T: number; t0: number; t1: number; u: number; children: ReactNode; style?: CSSProperties }) {
  const a = env(T, t0, t1)
  const inP = easeOut(clamp((T - t0) / 0.9))
  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <div style={{ opacity: a, transform: `translateY(${(1 - inP) * 46 * u}px)`, whiteSpace: 'pre-line' }}>{children}</div>
    </div>
  )
}

function Wordmark({ size }: { size: number }) {
  return (
    <span style={{ fontSize: size, letterSpacing: '0.12em', fontWeight: 500, lineHeight: 1 }}>
      H<span style={{ display: 'inline-block', transform: 'scaleX(1.1)' }}>Λ</span>B
    </span>
  )
}

export function Overlay({ T, w, h, lang }: { T: number; w: number; h: number; lang: string }) {
  const c = COPY[lang === 'sq' ? 'sq' : 'en']
  const u = w / 1080 // layout unit: 1px at 1080 wide
  const portrait = h / w > 1.5
  const ink = '#2a2622'
  const bronze = '#8A6F57'
  const end = (i: number) => SHOT_START[i] + SHOTS[i].duration - XFADE - 0.15
  const endStart = SHOT_START[SHOTS.length - 1]
  const card = env(T, endStart + 0.2, TOTAL + 10, 1.1)
  const pad = 84 * u

  const caption = (i: number, eyebrow: string, title: string, sub?: string, big = 96) => {
    const t0 = SHOT_START[i] + (i === 0 ? 0.5 : 0.35)
    const t1 = end(i)
    const rule = easeOut(clamp((T - t0) / 1.0)) * env(T, t0, t1, 0.01)
    return (
      <div style={{ position: 'absolute', left: pad, right: pad, bottom: (portrait ? 330 : 170) * u, color: ink }}>
        <Rise T={T} t0={t0} t1={t1} u={u}>
          <div style={{ fontSize: 26 * u, letterSpacing: '0.32em', textTransform: 'uppercase', color: bronze, fontWeight: 500 }}>{eyebrow}</div>
        </Rise>
        <div style={{ height: 2 * u, width: 120 * u * rule, background: bronze, margin: `${22 * u}px 0 ${26 * u}px` }} />
        <Rise T={T} t0={t0 + 0.12} t1={t1} u={u}>
          <div style={{ fontSize: big * u, lineHeight: 1.04, fontWeight: 400, letterSpacing: '-0.01em' }}>{title}</div>
        </Rise>
        {sub && (
          <Rise T={T} t0={t0 + 0.3} t1={t1} u={u} style={{ marginTop: 26 * u }}>
            <div style={{ fontSize: 34 * u, lineHeight: 1.3, color: '#5b524a' }}>{sub}</div>
          </Rise>
        )}
      </div>
    )
  }

  // Shot 1 title: the wordmark with the project name.
  const t0 = 0.5
  const t1 = end(0)
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: 'Jost, ui-sans-serif, sans-serif' }}>
      {/* soft sand wash behind the captions */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 1 - card,
          background: `linear-gradient(to top, rgba(244,236,227,0.96) 0%, rgba(244,236,227,0.86) ${portrait ? 22 : 26}%, rgba(244,236,227,0) ${portrait ? 46 : 58}%),
                       linear-gradient(to bottom, rgba(244,236,227,0.55) 0%, rgba(244,236,227,0) 16%)`,
        }}
      />

      {/* persistent brand pill, from the second shot on */}
      <div style={{ position: 'absolute', left: pad, top: (portrait ? 120 : 64) * u, opacity: env(T, SHOT_START[1] - 0.1, endStart + 0.6, 0.6) }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 22 * u, background: ink, color: '#f6efe7', borderRadius: 999, padding: `${18 * u}px ${34 * u}px` }}>
          <Wordmark size={34 * u} />
          <span style={{ width: 1.5 * u, height: 30 * u, background: 'rgba(246,239,231,0.3)' }} />
          <span style={{ fontSize: 20 * u, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(240,226,210,0.85)' }}>Kompleksi HAB 13</span>
        </div>
      </div>

      {/* shot 1: title */}
      <div style={{ position: 'absolute', left: pad, right: pad, bottom: (portrait ? 330 : 170) * u, color: ink }}>
        <Rise T={T} t0={t0} t1={t1} u={u}>
          <div style={{ fontSize: 26 * u, letterSpacing: '0.32em', textTransform: 'uppercase', color: bronze, fontWeight: 500 }}>{c.place}</div>
        </Rise>
        <div style={{ height: 2 * u, width: 120 * u * easeOut(clamp((T - t0) / 1)) * env(T, t0, t1, 0.01), background: bronze, margin: `${22 * u}px 0 ${30 * u}px` }} />
        <Rise T={T} t0={t0 + 0.15} t1={t1} u={u}>
          <Wordmark size={150 * u} />
        </Rise>
        <Rise T={T} t0={t0 + 0.35} t1={t1} u={u} style={{ marginTop: 18 * u }}>
          <div style={{ fontSize: 44 * u, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 400 }}>Kompleksi HAB 13</div>
        </Rise>
      </div>

      {caption(1, c.s2[0], c.s2[1])}
      {caption(2, c.s3[0], c.s3[1])}
      {caption(3, c.s4[0], c.s4[1], c.s4[2], 120)}

      {/* end card */}
      <div style={{ position: 'absolute', inset: 0, background: `rgba(36,32,29,${0.8 * card})` }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f6efe7',
          textAlign: 'center',
        }}
      >
        <Rise T={T} t0={endStart + 0.6} t1={TOTAL + 10} u={u}>
          <Wordmark size={170 * u} />
        </Rise>
        <Rise T={T} t0={endStart + 0.8} t1={TOTAL + 10} u={u} style={{ marginTop: 26 * u }}>
          <div style={{ fontSize: 30 * u, letterSpacing: '0.34em', textTransform: 'uppercase', color: '#e7d6c4' }}>Kompleksi HAB 13</div>
        </Rise>
        <div style={{ height: 2 * u, width: 140 * u * easeOut(clamp((T - endStart - 1.0) / 1)), background: '#b59a80', margin: `${50 * u}px 0` }} />
        <Rise T={T} t0={endStart + 1.2} t1={TOTAL + 10} u={u}>
          <div style={{ fontSize: 22 * u, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#b59a80', marginBottom: 18 * u }}>{c.sales}</div>
          <div style={{ fontSize: 46 * u, letterSpacing: '0.04em' }}>{CONTACT.phones[0]}</div>
        </Rise>
        <Rise T={T} t0={endStart + 1.4} t1={TOTAL + 10} u={u} style={{ marginTop: 22 * u }}>
          <div style={{ fontSize: 32 * u, color: '#e7d6c4', lineHeight: 1.5 }}>
            {CONTACT.email}
            <br />
            {CONTACT.web}
          </div>
        </Rise>
      </div>

      {/* disclaimer */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: (portrait ? 150 : 46) * u,
          textAlign: 'center',
          fontSize: 19 * u,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: card > 0.5 ? 'rgba(246,239,231,0.55)' : 'rgba(42,38,34,0.55)',
          opacity: clamp(T / 0.6),
        }}
      >
        {c.note}
      </div>
    </div>
  )
}
