import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { SpecialDate } from '@/types/specialDate'
import {
  putSpecialDate,
  deleteSpecialDate as dbDeleteSpecialDate,
  clearAllSpecialDates,
} from '@/db/indexedDB'
import { parseISO, eachDayOfInterval } from 'date-fns'

interface SpecialDateState {
  specialDates: SpecialDate[]
  setSpecialDates: (dates: SpecialDate[]) => void
  addSpecialDate: (data: Omit<SpecialDate, 'id'>) => void
  updateSpecialDate: (id: string, data: Partial<Omit<SpecialDate, 'id'>>) => void
  removeSpecialDate: (id: string) => void
  getHolidaySet: (year: number) => Set<string>
  getForbiddenRanges: () => Array<{ start: Date; end: Date; name: string }>
  importSpecialDates: (dates: SpecialDate[]) => Promise<void>
}

export const useSpecialDateStore = create<SpecialDateState>((set, get) => ({
  specialDates: [],

  setSpecialDates: (specialDates) => set({ specialDates }),

  addSpecialDate: (data) => {
    const sd: SpecialDate = { ...data, id: nanoid() }
    set((s) => ({ specialDates: [...s.specialDates, sd] }))
    putSpecialDate(sd).catch(console.error)
  },

  updateSpecialDate: (id, data) => {
    set((s) => {
      const specialDates = s.specialDates.map((sd) => (sd.id === id ? { ...sd, ...data } : sd))
      const updated = specialDates.find((sd) => sd.id === id)
      if (updated) putSpecialDate(updated).catch(console.error)
      return { specialDates }
    })
  },

  removeSpecialDate: (id) => {
    set((s) => ({ specialDates: s.specialDates.filter((sd) => sd.id !== id) }))
    dbDeleteSpecialDate(id).catch(console.error)
  },

  getHolidaySet: (year) => {
    const { specialDates } = get()
    const holidays = specialDates.filter((sd) => sd.type === 'holiday')
    const set = new Set<string>()
    for (const h of holidays) {
      const start = parseISO(h.start)
      const end = h.end ? parseISO(h.end) : start
      // Only include days within the given year
      const yearStart = new Date(year, 0, 1)
      const yearEnd = new Date(year, 11, 31)
      const effectiveStart = start < yearStart ? yearStart : start
      const effectiveEnd = end > yearEnd ? yearEnd : end
      if (effectiveStart <= effectiveEnd) {
        eachDayOfInterval({ start: effectiveStart, end: effectiveEnd }).forEach((d) => {
          set.add(d.toISOString().slice(0, 10))
        })
      }
    }
    return set
  },

  getForbiddenRanges: () => {
    const { specialDates } = get()
    return specialDates
      .filter((sd) => sd.type === 'forbidden')
      .map((sd) => ({
        start: parseISO(sd.start),
        end: sd.end ? parseISO(sd.end) : parseISO(sd.start),
        name: sd.name,
      }))
  },

  importSpecialDates: async (dates) => {
    await clearAllSpecialDates()
    for (const sd of dates) {
      await putSpecialDate(sd)
    }
    set({ specialDates: dates })
  },
}))
