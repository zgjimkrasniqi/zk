import { useStore, AREA_MAX, AREA_MIN, filtersActive, useFilteredApartments } from '../store'
import { STATUS_COLOR, STATUS_LABEL, type Status } from '../data/apartments'

export function FilterPanel() {
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const resetFilters = useStore((s) => s.resetFilters)
  const count = useFilteredApartments().length
  const active = filtersActive(filters)

  const toggleStatus = (st: Status) => {
    const has = filters.statuses.includes(st)
    const next = has ? filters.statuses.filter((x) => x !== st) : [...filters.statuses, st]
    if (next.length) setFilters({ statuses: next })
  }

  const lo = ((filters.minArea - AREA_MIN) / (AREA_MAX - AREA_MIN)) * 100
  const hi = ((filters.maxArea - AREA_MIN) / (AREA_MAX - AREA_MIN)) * 100

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Filter</div>
          <div className="mt-0.5 text-lg leading-tight text-ink-800">
            {count} <span className="text-ink-500">residences</span>
          </div>
        </div>
        {active && (
          <button onClick={resetFilters} className="text-[11px] text-ink-500 underline-offset-2 hover:text-ink-800 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      <div>
        <div className="mb-2 text-[12px] text-ink-600">Bedrooms</div>
        <div className="grid grid-cols-4 gap-1 rounded-full bg-black/5 p-1">
          {[null, 1, 2, 3].map((n) => (
            <button
              key={String(n)}
              onClick={() => setFilters({ bedrooms: n })}
              className={`rounded-full py-1.5 text-xs transition ${
                filters.bedrooms === n ? 'bg-ink-800 text-sand-100 shadow' : 'text-ink-600 hover:bg-white'
              }`}
            >
              {n === null ? 'Any' : n === 3 ? '3+' : n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-[12px] text-ink-600">
          <span>Net area</span>
          <span className="tabular-nums text-ink-800">
            {filters.minArea}–{filters.maxArea} m²
          </span>
        </div>
        <div className="relative h-5">
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded bg-black/10" />
          <div
            className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded bg-bronze-500"
            style={{ left: `${lo}%`, right: `${100 - hi}%` }}
          />
          <input
            aria-label="Minimum area"
            type="range"
            className="dual absolute inset-0 w-full"
            min={AREA_MIN}
            max={AREA_MAX}
            step={5}
            value={filters.minArea}
            onChange={(e) => setFilters({ minArea: Math.min(Number(e.target.value), filters.maxArea - 5) })}
          />
          <input
            aria-label="Maximum area"
            type="range"
            className="dual absolute inset-0 w-full"
            min={AREA_MIN}
            max={AREA_MAX}
            step={5}
            value={filters.maxArea}
            onChange={(e) => setFilters({ maxArea: Math.max(Number(e.target.value), filters.minArea + 5) })}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 text-[12px] text-ink-600">Availability</div>
        <div className="flex flex-wrap gap-1.5">
          {(['available', 'reserved', 'sold'] as Status[]).map((st) => {
            const on = filters.statuses.includes(st)
            return (
              <button
                key={st}
                onClick={() => toggleStatus(st)}
                className={`chip inline-flex items-center gap-1.5 ${
                  on ? 'border-ink-800/20 bg-white text-ink-800' : 'border-transparent bg-black/5 text-ink-500 line-through'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: on ? STATUS_COLOR[st] : '#bbb' }} />
                {STATUS_LABEL[st]}
              </button>
            )
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-800/10 bg-white/50 px-3 py-2.5">
        <span className="text-[13px] text-ink-700">Penthouses only</span>
        <span className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={filters.penthouseOnly}
            onChange={(e) => setFilters({ penthouseOnly: e.target.checked })}
          />
          <span className="block h-5 w-9 rounded-full bg-black/15 transition peer-checked:bg-bronze-600" />
          <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
        </span>
      </label>
    </div>
  )
}
