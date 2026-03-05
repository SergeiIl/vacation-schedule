import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Employee, VacationInterval, NRD, UnpaidLeave } from '@/types/employee'
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
  filterPositions: string[]
  filterColor: string | null

  // Undo/Redo
  past: Employee[][]
  future: Employee[][]

  setEmployees: (employees: Employee[]) => void
  addEmployee: (data: Omit<Employee, 'id' | 'createdAt' | 'order'>) => void
  updateEmployee: (id: string, data: Partial<Omit<Employee, 'id'>>) => void
  removeEmployee: (id: string) => void
  duplicateEmployee: (id: string) => void
  reorderEmployee: (id: string, newOrder: number) => void
  reorderEmployees: (orderedIds: string[]) => void
  setSelected: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setFilterNRD: (v: boolean | null) => void
  setFilterActiveVacation: (v: boolean) => void
  setFilterPositions: (v: string[]) => void
  setFilterColor: (v: string | null) => void
  addVacation: (employeeId: string, interval: Omit<VacationInterval, 'id'>) => void
  updateVacation: (employeeId: string, vacationId: string, interval: Partial<VacationInterval>) => void
  removeVacation: (employeeId: string, vacationId: string) => void
  setNRD: (employeeId: string, nrd: NRD[]) => void
  addNRD: (employeeId: string, interval: Omit<NRD, 'id'>) => void
  updateNRD: (employeeId: string, nrdId: string, interval: Partial<Omit<NRD, 'id'>>) => void
  removeNRD: (employeeId: string, nrdId: string) => void
  addUnpaidLeave: (employeeId: string, interval: Omit<UnpaidLeave, 'id'>) => void
  updateUnpaidLeave: (employeeId: string, leaveId: string, interval: Partial<Omit<UnpaidLeave, 'id'>>) => void
  removeUnpaidLeave: (employeeId: string, leaveId: string) => void
  undo: () => void
  redo: () => void
  filteredEmployees: (specialDates?: SpecialDate[]) => Employee[]
  importEmployees: (employees: Employee[]) => Promise<void>
}

function isCurrentlyOnVacation(employee: Employee): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return employee.vacations.some((v) => v.start <= today && v.end >= today)
}

function normalizeEmployee(emp: Employee): Employee {
  return { ...emp, unpaidLeave: emp.unpaidLeave ?? [] }
}

const MAX_HISTORY = 50

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  selected: null,
  searchQuery: '',
  filterNRD: null,
  filterActiveVacation: false,
  filterPositions: [],
  filterColor: null,
  past: [],
  future: [],

  setEmployees: (employees) => set({ employees: employees.map(normalizeEmployee) }),

  addEmployee: (data) => {
    const { employees } = get()
    const emp: Employee = {
      ...data,
      unpaidLeave: data.unpaidLeave ?? [],
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
      nrd: source.nrd.map((n) => ({ ...n, id: nanoid() })),
      unpaidLeave: source.unpaidLeave.map((u) => ({ ...u, id: nanoid() })),
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

  reorderEmployees: (orderedIds) => {
    set((s) => {
      const byId = new Map(s.employees.map((e) => [e.id, e]))
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((e): e is Employee => e !== undefined)
      const mentionedSet = new Set(orderedIds)
      const rest = s.employees.filter((e) => !mentionedSet.has(e.id))
      const all = [...reordered, ...rest].map((e, i) => ({ ...e, order: i }))
      bulkPutEmployees(all).catch(console.error)
      return {
        employees: all,
        past: [...s.past.slice(-MAX_HISTORY), s.employees],
        future: [],
      }
    })
  },

  setSelected: (id) => set({ selected: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterNRD: (filterNRD) => set({ filterNRD }),
  setFilterActiveVacation: (filterActiveVacation) => set({ filterActiveVacation }),
  setFilterPositions: (filterPositions) => set({ filterPositions }),
  setFilterColor: (filterColor) => set({ filterColor }),

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

  addNRD: (employeeId, interval) => {
    const nrd: NRD = { ...interval, id: nanoid() }
    set((s) => {
      const employees = s.employees.map((e) =>
        e.id === employeeId ? { ...e, nrd: [...e.nrd, nrd] } : e,
      )
      const updated = employees.find((e) => e.id === employeeId)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  updateNRD: (employeeId, nrdId, interval) => {
    set((s) => {
      const employees = s.employees.map((e) => {
        if (e.id !== employeeId) return e
        return {
          ...e,
          nrd: e.nrd.map((n) => (n.id === nrdId ? { ...n, ...interval } : n)),
        }
      })
      const updated = employees.find((e) => e.id === employeeId)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  removeNRD: (employeeId, nrdId) => {
    set((s) => {
      const employees = s.employees.map((e) => {
        if (e.id !== employeeId) return e
        return { ...e, nrd: e.nrd.filter((n) => n.id !== nrdId) }
      })
      const updated = employees.find((e) => e.id === employeeId)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  addUnpaidLeave: (employeeId, interval) => {
    const leave: UnpaidLeave = { ...interval, id: nanoid() }
    set((s) => {
      const employees = s.employees.map((e) =>
        e.id === employeeId ? { ...e, unpaidLeave: [...e.unpaidLeave, leave] } : e,
      )
      const updated = employees.find((e) => e.id === employeeId)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  updateUnpaidLeave: (employeeId, leaveId, interval) => {
    set((s) => {
      const employees = s.employees.map((e) => {
        if (e.id !== employeeId) return e
        return {
          ...e,
          unpaidLeave: e.unpaidLeave.map((u) => (u.id === leaveId ? { ...u, ...interval } : u)),
        }
      })
      const updated = employees.find((e) => e.id === employeeId)
      if (updated) putEmployee(updated).catch(console.error)
      return { employees, past: [...s.past.slice(-MAX_HISTORY), s.employees], future: [] }
    })
  },

  removeUnpaidLeave: (employeeId, leaveId) => {
    set((s) => {
      const employees = s.employees.map((e) => {
        if (e.id !== employeeId) return e
        return { ...e, unpaidLeave: e.unpaidLeave.filter((u) => u.id !== leaveId) }
      })
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
    const { employees, searchQuery, filterNRD, filterActiveVacation, filterPositions, filterColor } = get()
    let result = [...employees].sort((a, b) => a.order - b.order)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((e) => e.fullName.toLowerCase().includes(q))
    }

    if (filterNRD !== null) {
      result = result.filter((e) => filterNRD ? e.nrd.length > 0 : e.nrd.length === 0)
    }

    if (filterActiveVacation) {
      result = result.filter(isCurrentlyOnVacation)
    }

    if (filterPositions.length > 0) {
      result = result.filter((e) => filterPositions.includes(e.position ?? ''))
    }

    if (filterColor !== null) {
      result = result.filter((e) => (e.color ?? '') === filterColor)
    }

    return result
  },

  importEmployees: async (employees) => {
    const normalized = employees.map(normalizeEmployee)
    await clearAllEmployees()
    await bulkPutEmployees(normalized)
    set({ employees: normalized, past: [], future: [] })
  },
}))
