import { useState } from 'react'
import { useStore } from '../store'
import type { Season, TimeOfDay } from '../three/atmosphere'

const SEASONS: { id: Season; label: string; sq: string }[] = [
  { id: 'spring', label: 'Spring', sq: 'Pranverë' },
  { id: 'summer', label: 'Summer', sq: 'Verë' },
  { id: 'autumn', label: 'Autumn', sq: 'Vjeshtë' },
  { id: 'winter', label: 'Winter', sq: 'Dimër' },
]
const TIMES: { id: TimeOfDay; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'golden', label: 'Golden hour' },
  { id: 'night', label: 'Night' },
]

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
export const AtmoIcon: Record<Season | TimeOfDay, JSX.Element> = {
  spring: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" {...S}>
      <circle cx="12" cy="12" r="2.2" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="12" cy="6.6" rx="2.6" ry="3.4" transform={`rotate(${a} 12 12)`} />
      ))}
    </svg>
  ),
  summer: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" {...S}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </svg>
  ),
  autumn: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" {...S}>
      <path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z" />
      <path d="M5 19l9-9" />
    </svg>
  ),
  winter: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" {...S}>
      <path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4l2.5 2.5L14.5 4M9.5 20l2.5-2.5 2.5 2.5" />
    </svg>
  ),
  day: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" {...S}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
    </svg>
  ),
  golden: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" {...S}>
      <path d="M3 17h18M6.5 17a5.5 5.5 0 0 1 11 0M12 6.5V9M5 10l1.6 1.4M19 10l-1.6 1.4M8 21h8" />
    </svg>
  ),
  night: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" {...S}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  ),
}

function Group<T extends string>({ items, value, onChange, compact }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void; compact?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          title={it.label}
          aria-label={it.label}
          aria-pressed={value === it.id}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] transition ${
            value === it.id ? 'bg-ink-800 text-sand-100' : 'text-ink-600 hover:bg-white'
          }`}
        >
          {AtmoIcon[it.id as Season | TimeOfDay]}
          {!compact && <span className={value === it.id ? '' : 'hidden 2xl:inline'}>{it.label}</span>}
        </button>
      ))}
    </div>
  )
}

/** Season and time-of-day switcher (desktop: inline bar). */
export function AtmosphereBar() {
  const season = useStore((s) => s.season)
  const time = useStore((s) => s.timeOfDay)
  const setSeason = useStore((s) => s.setSeason)
  const setTime = useStore((s) => s.setTimeOfDay)
  return (
    <div className="panel pointer-events-auto flex items-center gap-1 !rounded-full px-1.5 py-1">
      <Group items={SEASONS} value={season} onChange={setSeason} />
      <span className="mx-1 h-5 w-px bg-ink-800/15" />
      <Group items={TIMES} value={time} onChange={setTime} />
    </div>
  )
}

/** Mobile: one round button that opens the switcher. */
export function AtmosphereButton() {
  const [open, setOpen] = useState(false)
  const season = useStore((s) => s.season)
  const time = useStore((s) => s.timeOfDay)
  const setSeason = useStore((s) => s.setSeason)
  const setTime = useStore((s) => s.setTimeOfDay)
  return (
    <div className="pointer-events-auto relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full bg-sand-50/90 text-ink-700 shadow-panel backdrop-blur"
        aria-label="Season and time of day"
      >
        {AtmoIcon[time === 'day' ? season : time]}
      </button>
      {open && (
        <div className="fade-up absolute right-0 top-full z-40 mt-2 rounded-2xl bg-sand-50 p-2 shadow-panel">
          <div className="eyebrow px-1.5 pb-1">Season</div>
          <Group items={SEASONS} value={season} onChange={setSeason} compact />
          <div className="eyebrow px-1.5 pb-1 pt-2">Time of day</div>
          <Group items={TIMES} value={time} onChange={setTime} compact />
        </div>
      )}
    </div>
  )
}
