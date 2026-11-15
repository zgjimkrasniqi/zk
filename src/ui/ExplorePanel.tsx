import { useStore, matchesFilters } from '../store'
import { APARTMENTS, BLOCKS, blockById, floorName } from '../data/apartments'
import { Icon, SectionTitle, StatusDot } from './common'

function BlockCards() {
  const selectedBlock = useStore((s) => s.selectedBlock)
  const hoveredBlock = useStore((s) => s.hoveredBlock)
  const selectBlock = useStore((s) => s.selectBlock)
  const hoverBlock = useStore((s) => s.hoverBlock)
  const filters = useStore((s) => s.filters)

  return (
    <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
      {BLOCKS.map((b) => {
        const apts = APARTMENTS.filter((a) => a.block === b.id)
        const avail = apts.filter((a) => a.status === 'available' && matchesFilters(a, filters)).length
        const pct = (n: string) => (apts.filter((a) => a.status === n).length / apts.length) * 100
        const active = selectedBlock === b.id
        return (
          <button
            key={b.id}
            onClick={() => selectBlock(active ? null : b.id)}
            onMouseEnter={() => hoverBlock(b.id)}
            onMouseLeave={() => hoverBlock(null)}
            className={`group rounded-xl border p-3 text-left transition ${
              active
                ? 'border-ink-800 bg-ink-800 text-sand-100'
                : hoveredBlock === b.id
                  ? 'border-bronze-400 bg-white'
                  : 'border-ink-800/10 bg-white/50 hover:border-bronze-400 hover:bg-white'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[15px] font-medium tracking-wide">{b.name}</span>
              <span className={`hidden text-[11px] lg:inline ${active ? 'text-sand-200/80' : 'text-ink-500'}`}>
                {avail} available
              </span>
            </div>
            <div className={`mt-0.5 hidden text-[11px] lg:block ${active ? 'text-sand-200/70' : 'text-ink-500'}`}>{b.subtitle}</div>
            <div className={`mt-0.5 text-[11px] lg:hidden ${active ? 'text-sand-200/80' : 'text-ink-500'}`}>{avail} avail.</div>
            <div className="mt-2.5 flex h-1 overflow-hidden rounded-full bg-black/10">
              <span style={{ width: `${pct('available')}%` }} className="bg-status-available" />
              <span style={{ width: `${pct('reserved')}%` }} className="bg-status-reserved" />
              <span style={{ width: `${pct('sold')}%` }} className="bg-status-sold" />
            </div>
          </button>
        )
      })}
    </div>
  )
}

function FloorSelector() {
  const selectedBlock = useStore((s) => s.selectedBlock)
  const selectedFloor = useStore((s) => s.selectedFloor)
  const selectFloor = useStore((s) => s.selectFloor)
  const filters = useStore((s) => s.filters)
  const hoverApartment = useStore((s) => s.hoverApartment)
  const selectApartment = useStore((s) => s.selectApartment)
  const selectedApartment = useStore((s) => s.selectedApartment)

  if (!selectedBlock) {
    return (
      <p className="rounded-xl border border-dashed border-ink-800/15 p-4 text-[13px] leading-relaxed text-ink-500">
        Select a building in the 3D view or above to browse its floors.
      </p>
    )
  }
  const block = blockById(selectedBlock)
  const floors = [...block.residentialFloors].reverse()

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="eyebrow">Floors · {block.name}</div>
        {selectedFloor !== null && (
          <button onClick={() => selectFloor(null)} className="text-[11px] text-ink-500 underline-offset-2 hover:text-ink-800 hover:underline">
            Show all floors
          </button>
        )}
      </div>
      <ul className="space-y-1">
        {floors.map((f) => {
          const apts = APARTMENTS.filter((a) => a.block === selectedBlock && a.floor === f)
          const active = selectedFloor === f
          const avail = apts.filter((a) => a.status === 'available' && matchesFilters(a, filters)).length
          return (
            <li key={f}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => selectFloor(active ? null : f)}
                onKeyDown={(e) => e.key === 'Enter' && selectFloor(active ? null : f)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition ${
                  active ? 'bg-ink-800 text-sand-100' : 'hover:bg-white'
                }`}
              >
                <span className={`w-6 text-right text-[13px] tabular-nums ${active ? 'text-sand-100' : 'text-ink-700'}`}>
                  {f === block.penthouseFloor ? 'PH' : f}
                </span>
                <span className={`flex-1 text-[12px] ${active ? 'text-sand-200/80' : 'text-ink-500'}`}>
                  {floorName(block, f)}
                  {avail > 0 && <span className="ml-1.5 opacity-70">· {avail} free</span>}
                </span>
                <span className="flex items-center gap-1">
                  {apts.map((a) => (
                    <button
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        selectApartment(a.id)
                      }}
                      onMouseEnter={() => hoverApartment(a.id)}
                      onMouseLeave={() => hoverApartment(null)}
                      className={`grid h-4 w-4 place-items-center rounded-full transition hover:scale-125 ${
                        selectedApartment === a.id ? 'ring-2 ring-bronze-400 ring-offset-1 ring-offset-transparent' : ''
                      }`}
                      title={`Type ${a.type.code} · ${a.type.area} m²`}
                    >
                      <StatusDot status={a.status} dim={!matchesFilters(a, filters)} size={9} />
                    </button>
                  ))}
                </span>
              </div>
            </li>
          )
        })}
        <li className="flex items-center gap-3 px-3 py-2 text-[12px] text-ink-500/70">
          <span className="w-6 text-right">G</span>
          <span className="flex-1">Ground · commercial (not in catalogue)</span>
        </li>
      </ul>
    </div>
  )
}

export function ExplorePanel() {
  const resetView = useStore((s) => s.resetView)
  const selectedBlock = useStore((s) => s.selectedBlock)
  return (
    <div>
      <SectionTitle
        eyebrow="Kompleksi HAB 13"
        title="Explore the residences"
        right={
          selectedBlock && (
            <button onClick={resetView} className="btn-ghost !px-3 !py-1.5" title="Back to overview">
              {Icon.reset}
              <span className="hidden sm:inline">Overview</span>
            </button>
          )
        }
      />
      <BlockCards />
      <div className="mt-5">
        <FloorSelector />
      </div>
    </div>
  )
}
