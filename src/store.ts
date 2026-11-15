import { create } from 'zustand'
import type { ContextData } from './three/Context'
import { APARTMENTS, type Apartment, type BlockId, type Status } from './data/apartments'

export interface Filters {
  bedrooms: number | null // null = any; 3 means 3+
  statuses: Status[]
  minArea: number
  maxArea: number
  penthouseOnly: boolean
}

export const AREA_MIN = 55
export const AREA_MAX = 185

export const DEFAULT_FILTERS: Filters = {
  bedrooms: null,
  statuses: ['available', 'reserved', 'sold'],
  minArea: AREA_MIN,
  maxArea: AREA_MAX,
  penthouseOnly: false,
}

export type ModelSource = 'checking' | 'glb' | 'procedural'

interface State {
  modelSource: ModelSource
  hoveredBlock: BlockId | null
  selectedBlock: BlockId | null
  selectedFloor: number | null
  hoveredApartment: string | null
  selectedApartment: string | null
  filters: Filters
  contactOpen: boolean
  contactRef: string | null
  viewNonce: number // bump to reset the camera
  mobileTab: 'explore' | 'units' | 'filters'
  /** undefined = not loaded yet, null = no surroundings file */
  context: ContextData | null | undefined
  setContext: (c: ContextData | null) => void

  setModelSource: (s: ModelSource) => void
  hoverBlock: (b: BlockId | null) => void
  selectBlock: (b: BlockId | null) => void
  selectFloor: (f: number | null) => void
  hoverApartment: (id: string | null) => void
  selectApartment: (id: string | null) => void
  setFilters: (f: Partial<Filters>) => void
  resetFilters: () => void
  openContact: (ref?: string | null) => void
  closeContact: () => void
  resetView: () => void
  setMobileTab: (t: State['mobileTab']) => void
}

export const useStore = create<State>((set) => ({
  modelSource: 'checking',
  hoveredBlock: null,
  selectedBlock: null,
  selectedFloor: null,
  hoveredApartment: null,
  selectedApartment: null,
  filters: DEFAULT_FILTERS,
  contactOpen: false,
  contactRef: null,
  viewNonce: 0,
  mobileTab: 'explore',
  context: undefined,
  setContext: (context) => set({ context }),

  setModelSource: (modelSource) => set({ modelSource }),
  hoverBlock: (hoveredBlock) => set({ hoveredBlock }),
  selectBlock: (b) =>
    set((s) => ({
      selectedBlock: b,
      selectedFloor: b && s.selectedBlock === b ? s.selectedFloor : null,
      selectedApartment: b && s.selectedBlock === b ? s.selectedApartment : null,
    })),
  selectFloor: (selectedFloor) => set({ selectedFloor, selectedApartment: null }),
  hoverApartment: (hoveredApartment) => set({ hoveredApartment }),
  selectApartment: (id) =>
    set(() => {
      if (!id) return { selectedApartment: null }
      const apt = APARTMENTS.find((a) => a.id === id)!
      return { selectedApartment: id, selectedBlock: apt.block, selectedFloor: apt.floor, mobileTab: 'units' }
    }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  openContact: (ref = null) => set({ contactOpen: true, contactRef: ref }),
  closeContact: () => set({ contactOpen: false }),
  resetView: () =>
    set((s) => ({
      selectedBlock: null,
      selectedFloor: null,
      selectedApartment: null,
      viewNonce: s.viewNonce + 1,
    })),
  setMobileTab: (mobileTab) => set({ mobileTab }),
}))

export function matchesFilters(a: Apartment, f: Filters) {
  if (f.bedrooms !== null) {
    if (f.bedrooms >= 3 ? a.bedrooms < 3 : a.bedrooms !== f.bedrooms) return false
  }
  if (!f.statuses.includes(a.status)) return false
  if (a.type.area < f.minArea || a.type.area > f.maxArea) return false
  if (f.penthouseOnly && !a.type.penthouse) return false
  return true
}

export const filtersActive = (f: Filters) =>
  f.bedrooms !== null ||
  f.statuses.length !== 3 ||
  f.minArea !== AREA_MIN ||
  f.maxArea !== AREA_MAX ||
  f.penthouseOnly

export function useFilteredApartments() {
  const filters = useStore((s) => s.filters)
  return APARTMENTS.filter((a) => matchesFilters(a, filters))
}
