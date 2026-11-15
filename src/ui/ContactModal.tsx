import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { APARTMENTS, CONTACT, blockById, floorName } from '../data/apartments'
import { Icon, Logo } from './common'

export function ContactModal() {
  const open = useStore((s) => s.contactOpen)
  const ref = useStore((s) => s.contactRef)
  const close = useStore((s) => s.closeContact)
  const [sent, setSent] = useState(false)
  const apt = ref ? APARTMENTS.find((a) => a.id === ref) : null

  useEffect(() => {
    if (open) setSent(false)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, close])

  if (!open) return null
  const subject = apt ? `HAB 13 enquiry – ${apt.id} (Type ${apt.type.code}, ${apt.type.area} m²)` : 'HAB 13 enquiry'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={close}>
      <div
        className="fade-up relative grid max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-t-2xl bg-sand-50 shadow-2xl sm:rounded-2xl md:grid-cols-[1fr_1.2fr]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Contact sales"
      >
        <div className="relative hidden bg-ink-800 p-7 text-sand-100 md:block">
          <img src="catalog/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="relative flex h-full flex-col">
            <Logo className="text-2xl" />
            <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-sand-200/80">Kompleksi HAB 13</div>
            <div className="mt-auto space-y-3 text-[13px]">
              <div className="text-[10px] uppercase tracking-[0.22em] text-bronze-300">Sales office</div>
              {CONTACT.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-white">
                  {Icon.phone} {p}
                </a>
              ))}
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-white">
                {Icon.mail} {CONTACT.email}
              </a>
              <div className="pt-2 text-sand-200/70">{CONTACT.address}</div>
              <div className="pt-3 font-light italic text-sand-200/80">“We build trust.”</div>
            </div>
          </div>
        </div>

        <div className="scroll-thin overflow-y-auto p-6 sm:p-7">
          <button onClick={close} className="absolute right-4 top-4 rounded-full p-2 text-ink-500 hover:bg-black/5" aria-label="Close">
            {Icon.close}
          </button>
          <div className="eyebrow">Contact</div>
          <h2 className="mt-1 text-2xl font-light text-ink-800">Arrange a viewing</h2>
          {apt && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-ink-800/10 bg-white p-2">
              <img src={`catalog/${apt.type.key}-render.jpg`} alt="" className="h-12 w-14 rounded-md object-cover" />
              <div className="text-[12px] leading-snug">
                <div className="font-medium text-ink-800">
                  Type {apt.type.code} · {apt.type.area} m²
                </div>
                <div className="text-ink-500">
                  {blockById(apt.block).name} · {floorName(blockById(apt.block), apt.floor)} · ref. {apt.id}
                </div>
              </div>
            </div>
          )}

          {sent ? (
            <div className="mt-6 rounded-xl border border-status-available/40 bg-status-available/10 p-4 text-[13px] text-ink-700">
              <div className="font-medium text-ink-800">Thank you — enquiry captured.</div>
              <p className="mt-1">
                This is a presentation prototype, so nothing was sent. In production this form would go to the HAB sales team. You can{' '}
                <a className="underline" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`}>
                  email the sales office directly
                </a>
                .
              </p>
            </div>
          ) : (
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
            >
              {[
                { n: 'name', l: 'Full name', t: 'text', a: 'name' },
                { n: 'email', l: 'Email', t: 'email', a: 'email' },
                { n: 'phone', l: 'Phone', t: 'tel', a: 'tel' },
              ].map((f) => (
                <label key={f.n} className="block">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-ink-500">{f.l}</span>
                  <input
                    required={f.n !== 'phone'}
                    type={f.t}
                    name={f.n}
                    autoComplete={f.a}
                    className="mt-1 w-full rounded-lg border border-ink-800/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-bronze-500 focus:ring-2 focus:ring-bronze-300/40"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.14em] text-ink-500">Message</span>
                <textarea
                  rows={3}
                  defaultValue={apt ? `I'm interested in residence ${apt.id} (Type ${apt.type.code}, ${apt.type.area} m²).` : ''}
                  className="mt-1 w-full resize-none rounded-lg border border-ink-800/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-bronze-500 focus:ring-2 focus:ring-bronze-300/40"
                />
              </label>
              <button type="submit" className="btn-primary w-full !py-3">
                Send enquiry
              </button>
              <p className="text-center text-[10px] text-ink-500">Prototype form · submissions are not sent anywhere.</p>
              <div className="space-y-1 pt-2 text-[12px] text-ink-600 md:hidden">
                {CONTACT.phones.slice(0, 2).map((p) => (
                  <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="mr-4 inline-flex items-center gap-1.5">
                    {Icon.phone} {p}
                  </a>
                ))}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
