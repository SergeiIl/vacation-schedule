export type DragMode = 'move' | 'resize-left' | 'resize-right'

export interface GanttBar {
  employeeId: string
  vacationId: string // 'nrd' for NRD bars
  type: 'vacation' | 'nrd'
  startDate: Date
  endDate: Date
  x: number
  width: number
  rowIndex: number
  color?: string // custom hex color (vacation bars only)
}

export interface DragState {
  active: boolean
  barId: string // `${employeeId}:${vacationId}`
  barType: 'vacation' | 'nrd'
  mode: DragMode
  originX: number
  originStartDate: Date
  originEndDate: Date
  currentStartDate: Date
  currentEndDate: Date
  isValid: boolean
}

export type ResizeHandle = 'left' | 'right'
