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
import { getRussianHolidays } from './russianHolidays'

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

// statutoryOnly=true — только нерабочие праздничные дни по ст. 112 ТК РФ (продлевают отпуск)
export function collectHolidayDates(specialDates: SpecialDate[], statutoryOnly = false): Set<string> {
  const set = new Set<string>()
  for (const sd of specialDates) {
    if (sd.type !== 'holiday') continue
    if (statutoryOnly && !sd.isStatutory) continue
    const start = parseISO(sd.start)
    const end = sd.end ? parseISO(sd.end) : start
    const days = differenceInCalendarDays(end, start) + 1
    for (let i = 0; i < days; i++) {
      set.add(format(addDays(start, i), 'yyyy-MM-dd'))
    }
  }
  return set
}

// Строит Set дат законных праздников (ст. 112 ТК РФ) для года:
// всегда включает базовые РФ-праздники из getRussianHolidays + пользовательские с isStatutory=true.
// Не зависит от наличия isStatutory в сохранённых SpecialDate.
export function buildStatutoryHolidayDates(year: number, specialDates: SpecialDate[]): Set<string> {
  const set = new Set<string>()
  // Базовые законные праздники РФ (всегда, независимо от stored-флага)
  for (const h of getRussianHolidays(year)) {
    if (!h.isBase) continue
    const start = parseISO(h.start)
    const end = parseISO(h.end)
    const days = differenceInCalendarDays(end, start) + 1
    for (let i = 0; i < days; i++) {
      set.add(format(addDays(start, i), 'yyyy-MM-dd'))
    }
  }
  // Пользовательские праздники, явно помеченные как законные
  for (const sd of specialDates) {
    if (sd.type === 'holiday' && sd.isStatutory) {
      const start = parseISO(sd.start)
      const end = sd.end ? parseISO(sd.end) : start
      const days = differenceInCalendarDays(end, start) + 1
      for (let i = 0; i < days; i++) {
        set.add(format(addDays(start, i), 'yyyy-MM-dd'))
      }
    }
  }
  return set
}

// Extends vacation end date past any holidays that fall within [start, end].
// E.g. if vacation is Mar 6–10 and Mar 8 is a holiday, returns Mar 11.
export function effectiveVacationEnd(start: string, end: string, holidayDates: Set<string>): string {
  const startDate = parseISO(start)
  let curEnd = parseISO(end)
  let i = 0
  while (i <= differenceInCalendarDays(curEnd, startDate)) {
    if (holidayDates.has(format(addDays(startDate, i), 'yyyy-MM-dd'))) {
      curEnd = addDays(curEnd, 1)
    }
    i++
  }
  return format(curEnd, 'yyyy-MM-dd')
}

// Days of a vacation interval that fall within [year-01-01, year-12-31], excluding holidays.
export function vacationDaysInYear(
  start: string,
  end: string,
  year: number,
  holidayDates: Set<string>,
  cutoffDate?: string,
): number {
  const yearStart = `${year}-01-01`
  const yearEnd = cutoffDate && cutoffDate < `${year}-12-31` ? cutoffDate : `${year}-12-31`
  const s = start < yearStart ? yearStart : start
  const e = end > yearEnd ? yearEnd : end
  if (s > e) return 0
  return vacationDaysUsed(s, e, holidayDates)
}

// Calendar days of vacation that count against the norm (total – holidays in [start, end]).
export function vacationDaysUsed(start: string, end: string, holidayDates: Set<string>): number {
  const total = intervalDays(start, end)
  let holidays = 0
  const startDate = parseISO(start)
  for (let i = 0; i < total; i++) {
    if (holidayDates.has(format(addDays(startDate, i), 'yyyy-MM-dd'))) holidays++
  }
  return total - holidays
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
