import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Employee, VacationInterval, NRD } from '@/types/employee'
import {
  putEmployee,
  deleteEmployee as dbDeleteEmployee,
  bulkPutEmployees,
  clearAllEmployees,
} from '@/db/indexedDB'
import type { SpecialDate } from '@/types/specialDate'

interface EmployeeState {
  employees: Employee[]
  selected: string | null
  searchQuery: string
  filterNRD: boolean | null
  filterActiveVacation: boolean
  filterPosition: string | null

  // Undo/Redo
  past: Employee[][]
  future: Employee[][]

  setEmployees: (employees: Employee[]) => void
  addEmployee: (data: Omit<Employee, 'id' | 'createdAt' | 'order'>) => void
  updateEmployee: (id: string, data: Partial<Omit<Employee, 'id'>>) => void
  removeEmployee: (id: string) => void
  duplicateEmployee: (id: string) => void
  reorderEmployee: (id: string, newOrder: number) => void
  setSelected: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setFilterNRD: (v: boolean | null) => void
  setFilterActiveVacation: (v: boolean) => void
  setFilterPosition: (v: string | null) => void
  addVacation: (employeeId: string, interval: Omit<VacationInterval, 'id'>) => void
  updateVacation: (employeeId: string, vacationId: string, interval: Partial<VacationInterval>) => void
  removeVacation: (employeeId: string, vacationId: string) => void
  setNRD: (employeeId: string, nrd: NRD | null) => void
  undo: () => void
  redo: () => void
  filteredEmployees: (specialDates?: SpecialDate[]) => Employee[]
  importEmployees: (employees: Employee[]) => Promise<void>
}

function isCurrentlyOnVacation(employee: Employee): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return employee.vacations.some((v) => v.start <= today && v.end >= today)
}

const MAX_HISTORY = 50

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  selected: null,
  searchQuery: '',
  filterNRD: null,
  filterActiveVacation: false,
  filterPosition: null,
  past: [],
  future: [],

  setEmployees: (employees) => set({ employees }),

  addEmployee: (data) => {
    const { employees } = get()
    const emp: Employee = {
      ...data,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      order: employees.length,
    }
    set((s) => ({
      employees: [...s.employees, emp],
      past: [...s.past.slice(-MAX_HISTORY), s.employees],
      future: [],
    }))
    putEmployee(emp).catch(console.error)
  },

  updateEmployee: (id, data) => {
    set((s) => {
      const employees = s.employees.map((e) => (e.id === id ? { ...e, ...data } : e))
      const updated = employees.find((e) => e.id === id)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  removeEmployee: (id) => {
    set((s) => ({
      employees: s.employees.filter((e) => e.id !== id),
      past: [...s.past.slice(-MAX_HISTORY), s.employees],
      future: [],
    }))
    dbDeleteEmployee(id).catch(console.error)
  },

  duplicateEmployee: (id) => {
    const { employees } = get()
    const source = employees.find((e) => e.id === id)
    if (!source) return
    const newEmp: Employee = {
      ...source,
      id: nanoid(),
      fullName: `${source.fullName} (копия)`,
      createdAt: new Date().toISOString(),
      order: employees.length,
      vacations: source.vacations.map((v) => ({ ...v, id: nanoid() })),
    }
    set((s) => ({
      employees: [...s.employees, newEmp],
      past: [...s.past.slice(-MAX_HISTORY), s.employees],
      future: [],
    }))
    putEmployee(newEmp).catch(console.error)
  },

  reorderEmployee: (id, newOrder) => {
    set((s) => {
      const employees = s.employees.map((e) => (e.id === id ? { ...e, order: newOrder } : e))
      employees.sort((a, b) => a.order - b.order)
      const updated = employees.find((e) => e.id === id)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees }
    })
  },

  setSelected: (id) => set({ selected: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterNRD: (filterNRD) => set({ filterNRD }),
  setFilterActiveVacation: (filterActiveVacation) => set({ filterActiveVacation }),
  setFilterPosition: (filterPosition) => set({ filterPosition }),

  addVacation: (employeeId, interval) => {
    const vacation: VacationInterval = { ...interval, id: nanoid() }
    set((s) => {
      const employees = s.employees.map((e) =>
        e.id === employeeId ? { ...e, vacations: [...e.vacations, vacation] } : e,
      )
      const updated = employees.find((e) => e.id === employeeId)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  updateVacation: (employeeId, vacationId, interval) => {
    set((s) => {
      const employees = s.employees.map((e) => {
        if (e.id !== employeeId) return e
        return {
          ...e,
          vacations: e.vacations.map((v) => (v.id === vacationId ? { ...v, ...interval } : v)),
        }
      })
      const updated = employees.find((e) => e.id === employeeId)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  removeVacation: (employeeId, vacationId) => {
    set((s) => {
      const employees = s.employees.map((e) => {
        if (e.id !== employeeId) return e
        return { ...e, vacations: e.vacations.filter((v) => v.id !== vacationId) }
      })
      const updated = employees.find((e) => e.id === employeeId)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  setNRD: (employeeId, nrd) => {
    set((s) => {
      const employees = s.employees.map((e) => (e.id === employeeId ? { ...e, nrd } : e))
      const updated = employees.find((e) => e.id === employeeId)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  undo: () => {
    const { past, employees, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    const newPast = past.slice(0, -1)
    set({ employees: previous, past: newPast, future: [employees, ...future] })
    bulkPutEmployees(previous).catch(console.error)
  },

  redo: () => {
    const { future, employees, past } = get()
    if (future.length === 0) return
    const next = future[0]
    set({ employees: next, past: [...past, employees], future: future.slice(1) })
    bulkPutEmployees(next).catch(console.error)
  },

  filteredEmployees: (_specialDates?: SpecialDate[]) => {
    const { employees, searchQuery, filterNRD, filterActiveVacation, filterPosition } = get()
    let result = employees

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((e) => e.fullName.toLowerCase().includes(q))
    }

    if (filterNRD !== null) {
      result = result.filter((e) => filterNRD ? e.nrd !== null : e.nrd === null)
    }

    if (filterActiveVacation) {
      result = result.filter(isCurrentlyOnVacation)
    }

    if (filterPosition !== null) {
      result = result.filter((e) => (e.position ?? '') === filterPosition)
    }

    return result
  },

  importEmployees: async (employees) => {
    await clearAllEmployees()
    await bulkPutEmployees(employees)
    set({ employees, past: [], future: [] })
  },
}))
