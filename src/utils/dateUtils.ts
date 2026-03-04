import {
  startOfYear,
  endOfYear,
  differenceInCalendarDays,
  addDays,
  isWeekend,
  parseISO,
  format,
  startOfWeek,
  startOfMonth,
  getDaysInMonth,
  eachMonthOfInterval,
  eachWeekOfInterval,
  isSameDay,
  isWithinInterval,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Scale } from '@/types/settings'
import type { SpecialDate } from '@/types/specialDate'

export const PIXELS_PER_DAY: Record<Scale, number> = {
  day: 32,
  week: 14,
  month: 4,
}

export function getChartStartDate(year: number): Date {
  return startOfYear(new Date(year, 0, 1))
}

export function getChartEndDate(year: number): Date {
  return endOfYear(new Date(year, 0, 1))
}

export function getTotalDays(year: number): number {
  return differenceInCalendarDays(getChartEndDate(year), getChartStartDate(year)) + 1
}

export function chartWidth(year: number, scale: Scale): number {
  return getTotalDays(year) * PIXELS_PER_DAY[scale]
}

export function dateToPixel(date: Date, chartStartDate: Date, pixelsPerDay: number): number {
  return differenceInCalendarDays(date, chartStartDate) * pixelsPerDay
}

export function pixelToDate(px: number, chartStartDate: Date, pixelsPerDay: number): Date {
  const days = Math.round(px / pixelsPerDay)
  return addDays(chartStartDate, days)
}

export function intervalDays(start: string, end: string): number {
  return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1
}

export function snapToScale(date: Date, scale: Scale): Date {
  if (scale === 'week') {
    return startOfWeek(date, { weekStartsOn: 1 })
  }
  if (scale === 'month') {
    return startOfMonth(date)
  }
  return date
}

export { isWeekend, parseISO, format, addDays, isSameDay }

export function isHoliday(date: Date, specialDates: SpecialDate[]): boolean {
  const holidays = specialDates.filter((sd) => sd.type === 'holiday')
  return holidays.some((h) => {
    const start = parseISO(h.start)
    const end = h.end ? parseISO(h.end) : start
    return isWithinInterval(date, { start, end })
  })
}

export function isInForbiddenPeriod(date: Date, specialDates: SpecialDate[]): boolean {
  const forbidden = specialDates.filter((sd) => sd.type === 'forbidden')
  return forbidden.some((f) => {
    const start = parseISO(f.start)
    const end = f.end ? parseISO(f.end) : start
    return isWithinInterval(date, { start, end })
  })
}

export function overlapsAnyForbidden(
  start: Date,
  end: Date,
  specialDates: SpecialDate[],
): boolean {
  const forbidden = specialDates.filter((sd) => sd.type === 'forbidden')
  return forbidden.some((f) => {
    const fStart = parseISO(f.start)
    const fEnd = f.end ? parseISO(f.end) : fStart
    return start <= fEnd && end >= fStart
  })
}

// Header cell generation
export interface HeaderCell {
  label: string
  x: number
  width: number
}

export function buildTopHeaderCells(year: number, scale: Scale): HeaderCell[] {
  const chartStart = getChartStartDate(year)
  const chartEnd = getChartEndDate(year)
  const ppd = PIXELS_PER_DAY[scale]

  if (scale === 'month') {
    // Top row: quarters
    return [0, 3, 6, 9].map((startMonth, qi) => {
      const qStart = new Date(year, startMonth, 1)
      const qEnd = new Date(year, startMonth + 3, 0)
      const days = differenceInCalendarDays(qEnd, qStart) + 1
      return {
        label: `${['I', 'II', 'III', 'IV'][qi]} кв.`,
        x: dateToPixel(qStart, chartStart, ppd),
        width: days * ppd,
      }
    })
  }

  // day and week: top row = months
  return eachMonthOfInterval({ start: chartStart, end: chartEnd }).map((monthStart) => ({
    label: format(monthStart, 'LLLL', { locale: ru }),
    x: dateToPixel(monthStart, chartStart, ppd),
    width: getDaysInMonth(monthStart) * ppd,
  }))
}

export function buildHeaderCells(year: number, scale: Scale): HeaderCell[] {
  const chartStart = getChartStartDate(year)
  const chartEnd = getChartEndDate(year)
  const ppd = PIXELS_PER_DAY[scale]

  if (scale === 'month') {
    return eachMonthOfInterval({ start: chartStart, end: chartEnd }).map((monthStart) => ({
      label: format(monthStart, 'LLLL', { locale: ru }),
      x: dateToPixel(monthStart, chartStart, ppd),
      width: getDaysInMonth(monthStart) * ppd,
    }))
  }

  if (scale === 'week') {
    return eachWeekOfInterval({ start: chartStart, end: chartEnd }, { weekStartsOn: 1 }).map(
      (weekStart) => {
        const weekInYear = Math.ceil(differenceInCalendarDays(weekStart, chartStart) / 7) + 1
        const effectiveStart = weekStart < chartStart ? chartStart : weekStart
        const weekEnd = addDays(weekStart, 6)
        const effectiveEnd = weekEnd > chartEnd ? chartEnd : weekEnd
        const days = differenceInCalendarDays(effectiveEnd, effectiveStart) + 1
        return {
          label: `${weekInYear}`,
          x: dateToPixel(effectiveStart, chartStart, ppd),
          width: days * ppd,
        }
      },
    )
  }

  // day scale
  const totalDays = getTotalDays(year)
  const cells: HeaderCell[] = []
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(chartStart, i)
    cells.push({
      label: format(date, 'd'),
      x: i * ppd,
      width: ppd,
    })
  }
  return cells
}
