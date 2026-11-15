import type { ReactNode } from 'react'
import { STATUS_COLOR, STATUS_LABEL, type Status } from '../data/apartments'

export function Logo({ className = '' }: { className?: string }) {
  // Typographic stand-in for the HAB wordmark (the A is drawn as a Λ, as in the catalogue).
  return (
    <span className={`select-none font-medium tracking-[0.12em] ${className}`} aria-label="HAB">
      H<span className="inline-block scale-x-110">Λ</span>B
    </span>
  )
}

export function StatusDot({ status, dim = false, size = 8 }: { status: Status; dim?: boolean; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: dim ? '#cfc6bc' : STATUS_COLOR[status] }}
      title={STATUS_LABEL[status]}
    />
  )
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]"
      style={{ background: `${STATUS_COLOR[status]}22`, color: STATUS_COLOR[status] }}
    >
      <StatusDot status={status} size={6} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Legend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 text-[11px] text-ink-600 ${className}`}>
      {(['available', 'reserved', 'sold'] as Status[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <StatusDot status={s} />
          {STATUS_LABEL[s]}
        </span>
      ))}
    </div>
  )
}

export function SectionTitle({ eyebrow, title, right }: { eyebrow: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="mt-0.5 text-lg font-normal leading-tight text-ink-800">{title}</h2>
      </div>
      {right}
    </div>
  )
}

export const Icon = {
  close: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  reset: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  ),
  expand: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  ),
  cube: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </svg>
  ),
}
