import { useEffect, useRef, useState } from 'react'
import { Scene } from './three/Scene'
import { GLB_URL } from './three/GlbModel'
import { useStore, filtersActive } from './store'
import { ExplorePanel } from './ui/ExplorePanel'
import { FilterPanel } from './ui/FilterPanel'
import { UnitsPanel } from './ui/UnitsPanel'
import { ContactModal } from './ui/ContactModal'
import { Icon, Legend, Logo } from './ui/common'

function useModelCheck() {
  const setModelSource = useStore((s) => s.setModelSource)
  useEffect(() => {
    // Use the downloaded GLB when present; otherwise fall back to the procedural placeholder.
    fetch(GLB_URL, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') ?? ''
        setModelSource(r.ok && !type.includes('text/html') ? 'glb' : 'procedural')
      })
      .catch(() => setModelSource('procedural'))
  }, [setModelSource])
}

function useScrollTopOnSelection() {
  const ref = useRef<HTMLDivElement>(null)
  const apt = useStore((s) => s.selectedApartment)
  const tab = useStore((s) => s.mobileTab)
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 })
  }, [apt, tab])
  return ref
}

function TopBar() {
  const openContact = useStore((s) => s.openContact)
  const resetView = useStore((s) => s.resetView)
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] sm:px-6 sm:pt-5">
      <div className="pointer-events-auto flex items-center gap-3 whitespace-nowrap rounded-full bg-ink-800 py-2 pl-5 pr-4 text-sand-100 shadow-panel">
        <Logo className="text-lg" />
        <span className="h-4 w-px bg-sand-100/25" />
        <span className="text-[10px] uppercase tracking-[0.24em] text-sand-200/85">
          <span className="hidden sm:inline">Kompleksi </span>HAB 13
        </span>
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        <button onClick={resetView} className="hidden rounded-full bg-sand-50/90 p-2.5 text-ink-700 shadow-panel backdrop-blur hover:bg-white sm:inline-flex" title="Reset view" aria-label="Reset view">
          {Icon.reset}
        </button>
        <button onClick={() => openContact(null)} className="btn-primary shadow-panel">
          {Icon.mail}
          <span>Contact</span>
        </button>
      </div>
    </header>
  )
}

function Disclaimer() {
  const modelSource = useStore((s) => s.modelSource)
  const [open, setOpen] = useState(false)
  return (
    <div className="pointer-events-auto relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-bronze-400/50 bg-sand-50/90 px-3 py-1.5 text-[11px] text-ink-700 shadow-panel backdrop-blur"
      >
        <span className="text-bronze-600">{Icon.cube}</span>
        <span className="font-medium">Illustrative 3D model</span>
        <span className="hidden text-ink-500 sm:inline">· sample availability</span>
      </button>
      {open && (
        <div className="fade-up absolute bottom-full left-0 mb-2 w-[min(340px,calc(100vw-32px))] rounded-xl bg-ink-800 p-4 text-[12px] leading-relaxed text-sand-100 shadow-panel">
          <p>
            <b className="font-medium">The 3D building is illustrative.</b>{' '}
            {modelSource === 'glb'
              ? 'It uses a downloaded placeholder model, not the actual HAB 13 design.'
              : 'It is a procedural model of the three entrances (Hyrja A, B, C), modelled after the catalogue cover render. Heights, footprints and facades are approximate, so it is not the actual HAB 13 design.'}
          </p>
          <p className="mt-2 text-sand-200/80">
            Floor bands and unit zones are simulated overlays sized from the catalogue areas. They are not architectural floor geometry.
          </p>
          <p className="mt-2 text-sand-200/80">
            Availability is <b className="font-medium text-sand-100">sample data</b>. Apartment types, areas, room schedules and plans come from the HAB 13 catalogue.
          </p>
        </div>
      )}
    </div>
  )
}

function DesktopLayout() {
  const [leftTab, setLeftTab] = useState<'explore' | 'filter'>('explore')
  const filters = useStore((s) => s.filters)
  const active = filtersActive(filters)
  const rightRef = useScrollTopOnSelection()
  return (
    <div className="pointer-events-none absolute inset-0 z-20 hidden lg:block">
      <aside className="panel pointer-events-auto absolute bottom-20 left-6 top-24 flex w-[340px] flex-col overflow-hidden">
        <div className="flex gap-1 border-b border-ink-800/10 p-2">
          {(['explore', 'filter'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setLeftTab(t)}
              className={`flex-1 rounded-lg py-2 text-[11px] uppercase tracking-[0.16em] transition ${
                leftTab === t ? 'bg-ink-800 text-sand-100' : 'text-ink-500 hover:bg-white'
              }`}
            >
              {t === 'explore' ? 'Buildings & floors' : 'Filter'}
              {t === 'filter' && active && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-bronze-400 align-middle" />}
            </button>
          ))}
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-5">{leftTab === 'explore' ? <ExplorePanel /> : <FilterPanel />}</div>
      </aside>

      <aside className="panel pointer-events-auto absolute bottom-20 right-6 top-24 w-[390px] overflow-hidden">
        <div ref={rightRef} className="scroll-thin h-full overflow-y-auto p-5">
          <UnitsPanel />
        </div>
      </aside>

      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
        <Disclaimer />
        <div className="panel pointer-events-auto px-4 py-2">
          <Legend />
        </div>
      </div>
    </div>
  )
}

function MobileLayout() {
  const tab = useStore((s) => s.mobileTab)
  const setTab = useStore((s) => s.setMobileTab)
  const [expanded, setExpanded] = useState(false)
  const selectedApartment = useStore((s) => s.selectedApartment)
  const sheetRef = useScrollTopOnSelection()
  useEffect(() => {
    if (selectedApartment) setExpanded(true)
  }, [selectedApartment])

  return (
    <div className="pointer-events-none absolute inset-0 z-20 lg:hidden">
      <div className="absolute left-4 right-4 top-[calc(max(env(safe-area-inset-top),12px)+56px)] flex items-center justify-between gap-2">
        <Disclaimer />
      </div>
      <section
        className={`panel pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col !rounded-b-none transition-[height] duration-300 ${
          expanded ? 'h-[78vh]' : 'h-[44vh]'
        }`}
      >
        <button onClick={() => setExpanded((e) => !e)} className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-ink-800/20" aria-label="Resize panel" />
        <Legend className="mx-auto mt-2 !gap-3 !text-[10px]" />
        <div className="flex gap-1 p-2">
          {(['explore', 'units', 'filters'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-[11px] uppercase tracking-[0.14em] ${
                tab === t ? 'bg-ink-800 text-sand-100' : 'text-ink-500'
              }`}
            >
              {t === 'explore' ? 'Buildings' : t === 'units' ? 'Residences' : 'Filter'}
            </button>
          ))}
        </div>
        <div ref={sheetRef} className="scroll-thin flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1">
          {tab === 'explore' ? <ExplorePanel /> : tab === 'units' ? <UnitsPanel /> : <FilterPanel />}
        </div>
      </section>
    </div>
  )
}

export default function App() {
  useModelCheck()
  const modelSource = useStore((s) => s.modelSource)
  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,#fbf3ea,#efe4d8)]">
      <div className="absolute inset-0 bottom-[44vh] isolate z-0 lg:bottom-0">
        <Scene />
      </div>
      {modelSource === 'checking' && (
        <div className="absolute inset-0 z-10 grid place-items-center text-[11px] uppercase tracking-[0.24em] text-bronze-600">Loading complex…</div>
      )}
      <TopBar />
      <DesktopLayout />
      <MobileLayout />
      <ContactModal />
    </div>
  )
}
