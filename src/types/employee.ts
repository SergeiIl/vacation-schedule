export interface VacationInterval {
  id: string
  start: string // ISO date "YYYY-MM-DD"
  end: string // ISO date "YYYY-MM-DD"
}

export interface NRD {
  start: string
  end: string
}

export interface Employee {
  id: string
  fullName: string
  vacations: VacationInterval[]
  nrd: NRD | null
  order: number
  createdAt: string
  color?: string // hex color for Gantt bars
  position?: string // job title / department
}
