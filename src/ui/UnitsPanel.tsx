import { ApartmentViewer } from '../three/ApartmentModel'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore, matchesFilters, useFilteredApartments, filtersActive } from '../store'
import { APARTMENTS, ROOM_LABEL, blockById, floorName, type Apartment } from '../data/apartments'
import { Icon, StatusBadge, StatusDot } from './common'

const img = (key: string, kind: 'render' | 'plan') => `catalog/${key}-${kind}.jpg`

function UnitRow({ a }: { a: Apartment }) {
  const selectApartment = useStore((s) => s.selectApartment)
  const hoverApartment = useStore((s) => s.hoverApartment)
  const hovered = useStore((s) => s.hoveredApartment === a.id)
  const block = blockById(a.block)
  return (
    <button
      onClick={() => selectApartment(a.id)}
      onMouseEnter={() => hoverApartment(a.id)}
      onMouseLeave={() => hoverApartment(null)}
      className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
        hovered ? 'border-bronze-400 bg-white' : 'border-transparent hover:border-bronze-300 hover:bg-white/70'
      }`}
    >
      <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
        <img src={img(a.type.key, 'render')} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-ink-800">Type {a.type.code}</span>
          {a.type.penthouse && <span className="rounded bg-bronze-600 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white">PH</span>}
        </div>
        <div className="truncate text-[11px] text-ink-500">
          {block.name} · {floorName(block, a.floor)} · {a.bedrooms} bed
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13px] tabular-nums text-ink-800">{a.type.area} m²</div>
        <div className="mt-1 flex justify-end">
          <StatusDot status={a.status} />
        </div>
      </div>
    </button>
  )
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <img src={src} alt="" className="max-h-[90vh] max-w-[94vw] rounded-xl bg-white object-contain shadow-2xl" />
      <button className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-ink-800" onClick={onClose} aria-label="Close">
        {Icon.close}
      </button>
    </div>,
    document.body,
  )
}

function Modal3D({ typeKey, title, onClose }: { typeKey: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/80 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="relative h-[86vh] w-[min(1200px,96vw)] overflow-hidden rounded-2xl bg-sand-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <ApartmentViewer typeKey={typeKey} large className="h-full w-full touch-none" />
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-ink-800 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-sand-100">{title}</div>
        <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-ink-500">
          Drag to orbit · scroll or pinch to zoom · walls traced from the catalogue plan (illustrative)
        </div>
        <button className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-ink-800 shadow" onClick={onClose} aria-label="Close">
          {Icon.close}
        </button>
      </div>
    </div>,
    document.body,
  )
}

export function ApartmentDetail({ a }: { a: Apartment }) {
  const selectApartment = useStore((s) => s.selectApartment)
  const openContact = useStore((s) => s.openContact)
  const [tab, setTab] = useState<'3d' | 'render' | 'plan'>('3d')
  const [zoom, setZoom] = useState(false)
  const block = blockById(a.block)
  const siblings = APARTMENTS.filter((x) => x.block === a.block && x.floor === a.floor)
  const idx = siblings.findIndex((x) => x.id === a.id)

  useEffect(() => setTab('3d'), [a.id])

  const living = a.type.rooms.filter((r) => r.kind !== 'balcony' && r.kind !== 'terrace')
  const outdoor = a.type.rooms.filter((r) => r.kind === 'balcony' || r.kind === 'terrace')

  return (
    <div className="fade-up" key={a.id}>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => selectApartment(null)} className="inline-flex items-center gap-1 text-[12px] text-ink-500 hover:text-ink-800">
          {Icon.back} {floorName(block, a.floor)}
        </button>
        <div className="flex items-center gap-1">
          <button
            disabled={idx <= 0}
            onClick={() => selectApartment(siblings[idx - 1].id)}
            className="rounded-full p-1.5 text-ink-600 hover:bg-white disabled:opacity-30"
            aria-label="Previous unit on this floor"
          >
            {Icon.back}
          </button>
          <span className="text-[11px] tabular-nums text-ink-500">
            {idx + 1}/{siblings.length}
          </span>
          <button
            disabled={idx >= siblings.length - 1}
            onClick={() => selectApartment(siblings[idx + 1].id)}
            className="rotate-180 rounded-full p-1.5 text-ink-600 hover:bg-white disabled:opacity-30"
            aria-label="Next unit on this floor"
          >
            {Icon.back}
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">
            {block.name} · {floorName(block, a.floor)}
          </div>
          <h2 className="mt-1 text-2xl font-light leading-none text-ink-800">
            Type {a.type.code}
            {a.type.penthouse && <span className="ml-2 align-middle text-xs font-medium uppercase tracking-[0.2em] text-bronze-600">Penthouse</span>}
          </h2>
          <div className="mt-1 text-[11px] text-ink-500">Unit ref. {a.id}</div>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-ink-800/10 rounded-xl border border-ink-800/10 bg-white/60 text-center">
        <div className="p-2.5">
          <div className="text-xl font-light tabular-nums text-ink-800">{a.type.area}</div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">m² net</div>
        </div>
        <div className="p-2.5">
          <div className="text-xl font-light text-ink-800">{a.bedrooms}</div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Bedrooms</div>
        </div>
        <div className="p-2.5">
          <div className="text-xl font-light text-ink-800">{a.type.rooms.filter((r) => r.kind === 'bathroom' || r.kind === 'wc').length}</div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Bath / WC</div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-ink-800/10 bg-white">
        <div className="flex items-center justify-between border-b border-ink-800/10 px-2 py-1.5">
          <div className="flex gap-1">
            {(['3d', 'render', 'plan'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] transition ${
                  tab === t ? 'bg-ink-800 text-sand-100' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {t === '3d' ? '3D layout' : t === 'render' ? 'Render' : 'Floor plan'}
              </button>
            ))}
          </div>
          <button onClick={() => setZoom(true)} className="rounded-full p-1.5 text-ink-500 hover:bg-sand-100 hover:text-ink-800" aria-label="Enlarge">
            {Icon.expand}
          </button>
        </div>
        {tab === '3d' ? (
          <ApartmentViewer typeKey={a.type.key} className="aspect-[4/3] w-full touch-none" />
        ) : (
          <button className="block w-full" onClick={() => setZoom(true)}>
            <img
              src={img(a.type.key, tab)}
              alt={`HAB 13 type ${a.type.code} ${tab === 'render' ? '3D furnished plan' : 'floor plan'}`}
              className="aspect-[4/3] w-full object-contain p-2"
            />
          </button>
        )}
        <button
          onClick={() => {
            history.pushState({ fromApp: true }, '', `#/experience/${encodeURIComponent(a.id)}`)
            window.dispatchEvent(new HashChangeEvent('hashchange'))
          }}
          className="flex w-full items-center justify-between gap-3 border-t border-ink-800/10 bg-ink-800 px-4 py-3 text-left text-sand-100 transition hover:bg-ink-700"
        >
          <span>
            <span className="block text-[12px] font-medium uppercase tracking-[0.16em]">3D experience</span>
            <span className="block text-[11px] text-sand-200/75">Walk through a furnished sample residence</span>
          </span>
          <span className="rotate-180">{Icon.back}</span>
        </button>
        <div className="border-t border-ink-800/10 px-3 py-1.5 text-[10px] text-ink-500">
          {tab === '3d'
            ? 'Drag to orbit, scroll to zoom. Walls traced from the catalogue plan; illustrative.'
            : `Imagery: HAB 13 apartment catalogue · ${a.type.floorLabel}`}
        </div>
      </div>

      <div className="mt-4">
        <div className="eyebrow mb-2">Room schedule</div>
        <ul className="divide-y divide-ink-800/5 text-[13px]">
          {living.map((r, i) => (
            <li key={i} className="flex items-baseline justify-between py-1.5">
              <span className="text-ink-700">
                {ROOM_LABEL[r.kind].en}
                <span className="ml-1.5 text-[11px] text-ink-500/70">{ROOM_LABEL[r.kind].sq}</span>
              </span>
              <span className="tabular-nums text-ink-800">{r.note ?? `${r.area.toFixed(1)} m²`}</span>
            </li>
          ))}
          {outdoor.map((r, i) => (
            <li key={`o${i}`} className="flex items-baseline justify-between py-1.5">
              <span className="text-bronze-700">
                {ROOM_LABEL[r.kind].en}
                <span className="ml-1.5 text-[11px] text-bronze-600/70">{ROOM_LABEL[r.kind].sq}</span>
              </span>
              <span className="tabular-nums text-bronze-700">{r.area.toFixed(1)} m²</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sticky bottom-0 -mx-1 mt-5 bg-gradient-to-t from-sand-50 via-sand-50 to-transparent px-1 pb-1 pt-3">
        <button className="btn-primary w-full !py-3" onClick={() => openContact(a.id)}>
          {Icon.mail}
          {a.status === 'sold' ? 'Sold · ask about similar units' : 'Enquire about this residence'}
        </button>
      </div>

      {zoom &&
        (tab === '3d' ? (
          <Modal3D typeKey={a.type.key} title={`Type ${a.type.code} · ${a.type.area} m²`} onClose={() => setZoom(false)} />
        ) : (
          <Lightbox src={img(a.type.key, tab)} onClose={() => setZoom(false)} />
        ))}
    </div>
  )
}

export function UnitsPanel() {
  const selectedApartment = useStore((s) => s.selectedApartment)
  const selectedBlock = useStore((s) => s.selectedBlock)
  const selectedFloor = useStore((s) => s.selectedFloor)
  const filters = useStore((s) => s.filters)
  const filtered = useFilteredApartments()

  const apt = selectedApartment ? APARTMENTS.find((a) => a.id === selectedApartment) : null
  if (apt) return <ApartmentDetail a={apt} />

  let list: Apartment[]
  let title: string
  let eyebrow: string
  if (selectedBlock && selectedFloor !== null) {
    const block = blockById(selectedBlock)
    list = APARTMENTS.filter((a) => a.block === selectedBlock && a.floor === selectedFloor)
    eyebrow = block.name
    title = floorName(block, selectedFloor)
  } else if (selectedBlock) {
    list = filtered.filter((a) => a.block === selectedBlock)
    eyebrow = blockById(selectedBlock).name
    title = `${list.length} matching residences`
  } else {
    list = filtered
    eyebrow = filtersActive(filters) ? 'Filtered results' : 'All residences'
    title = `${list.length} residences`
  }
  const sorted = [...list].sort((x, y) => (x.status === 'available' ? 0 : 1) - (y.status === 'available' ? 0 : 1) || x.floor - y.floor)

  return (
    <div>
      <div className="mb-3">
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="mt-0.5 text-lg leading-tight text-ink-800">{title}</h2>
        {selectedFloor !== null && (
          <p className="mt-1 text-[12px] text-ink-500">Select a unit in the 3D view or below to see its plan and specifications.</p>
        )}
      </div>
      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-800/15 p-4 text-[13px] text-ink-500">No residences match these filters.</p>
      ) : (
        <div className="space-y-1">
          {sorted.map((a) => (
            <div key={a.id} className={matchesFilters(a, filters) ? '' : 'opacity-40'}>
              <UnitRow a={a} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
