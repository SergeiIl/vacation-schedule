export type Scale = 'day' | 'week' | 'month'
export type Theme = 'light' | 'dark' | 'system'

export interface Settings {
  planningYear: number
  scale: Scale
  theme: Theme
  rowHeight: number
  showWeekends: boolean
  showNRD: boolean
  showUnpaidLeave: boolean
}
