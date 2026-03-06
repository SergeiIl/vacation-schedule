export type Scale = 'day' | 'week' | 'month'
export type Theme = 'light' | 'dark' | 'system'

export const SCALES: { value: Scale; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
]

export interface Settings {
  planningYear: number
  scale: Scale
  theme: Theme
  rowHeight: number
  showWeekends: boolean
  showNRD: boolean
  showUnpaidLeave: boolean
  maxConcurrentVacations: number | null
  vacationDaysNorm: number
  nrdColor: string
  unpaidColor: string
}
