export interface VacationInterval {
  id: string
  start: string // ISO date "YYYY-MM-DD"
  end: string // ISO date "YYYY-MM-DD"
}

export interface NRD {
  id: string
  start: string // ISO date "YYYY-MM-DD"
  end: string // ISO date "YYYY-MM-DD"
}

export interface UnpaidLeave {
  id: string
  start: string // ISO date "YYYY-MM-DD"
  end: string // ISO date "YYYY-MM-DD"
}

export interface Employee {
  id: string
  fullName: string
  vacations: VacationInterval[]
  nrd: NRD[]
  unpaidLeave: UnpaidLeave[]
  order: number
  createdAt: string
  color?: string // hex color for Gantt bars
  position?: string // job title / department
  vacationDaysOverride?: number // individual norm override
}
