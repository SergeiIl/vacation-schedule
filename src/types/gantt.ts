export type DragMode = 'move' | 'resize-left' | 'resize-right'

export interface GanttBar {
  employeeId: string
  vacationId: string
  type: 'vacation' | 'nrd' | 'unpaid'
  startDate: Date
  endDate: Date           // stored end (used for drag/resize)
  effectiveEndDate: Date  // visual end (extended past holidays)
  x: number
  width: number           // effective width (including holiday extension)
  storedWidth: number     // width up to stored end (without extension)
  rowIndex: number
  color?: string // custom hex color (vacation bars only)
}

export interface DragState {
  active: boolean
  barId: string // `${employeeId}:${vacationId}`
  barType: 'vacation' | 'nrd' | 'unpaid'
  mode: DragMode
  originX: number
  originStartDate: Date
  originEndDate: Date
  currentStartDate: Date
  currentEndDate: Date
  isValid: boolean
}

export type ResizeHandle = 'left' | 'right'
