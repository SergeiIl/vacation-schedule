export type SpecialDateType = 'holiday' | 'forbidden'

export interface SpecialDate {
  id: string
  name: string
  type: SpecialDateType
  start: string // ISO date
  end: string | null // null = single-day
}
