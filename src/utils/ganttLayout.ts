import { parseISO } from 'date-fns'
import type { Employee } from '@/types/employee'
import type { GanttBar, DragState } from '@/types/gantt'
import { dateToPixel, PIXELS_PER_DAY, getChartStartDate, collectHolidayDates, effectiveVacationEnd } from './dateUtils'
import type { Scale } from '@/types/settings'
import type { SpecialDate } from '@/types/specialDate'

export function buildBarsForEmployee(
  employee: Employee,
  year: number,
  scale: Scale,
  showNRD: boolean,
  rowIndex: number,
  showUnpaidLeave: boolean = true,
  specialDates: SpecialDate[] = [],
): GanttBar[] {
  const chartStart = getChartStartDate(year)
  const ppd = PIXELS_PER_DAY[scale]
  const bars: GanttBar[] = []
  // Only statutory holidays (ст. 112 ТК РФ) extend vacations
  const statutoryHolidayDates = collectHolidayDates(specialDates, true)

  for (const vacation of employee.vacations) {
    const startDate = parseISO(vacation.start)
    const endDate = parseISO(vacation.end)
    const effEndStr = effectiveVacationEnd(vacation.start, vacation.end, statutoryHolidayDates)
    const effectiveEndDate = parseISO(effEndStr)
    const x = dateToPixel(startDate, chartStart, ppd)
    const storedEndX = dateToPixel(endDate, chartStart, ppd) + ppd
    const effectiveEndX = dateToPixel(effectiveEndDate, chartStart, ppd) + ppd
    bars.push({
      employeeId: employee.id,
      vacationId: vacation.id,
      type: 'vacation',
      startDate,
      endDate,
      effectiveEndDate,
      x,
      width: effectiveEndX - x,
      storedWidth: storedEndX - x,
      rowIndex,
      color: employee.color,
    })
  }

  if (showNRD) {
    for (const nrd of employee.nrd) {
      const startDate = parseISO(nrd.start)
      const endDate = parseISO(nrd.end)
      const x = dateToPixel(startDate, chartStart, ppd)
      const endX = dateToPixel(endDate, chartStart, ppd) + ppd
      bars.push({
        employeeId: employee.id,
        vacationId: nrd.id,
        type: 'nrd',
        startDate,
        endDate,
        effectiveEndDate: endDate,
        x,
        width: endX - x,
        storedWidth: endX - x,
        rowIndex,
      })
    }
  }

  if (showUnpaidLeave) {
    for (const leave of (employee.unpaidLeave ?? [])) {
      const startDate = parseISO(leave.start)
      const endDate = parseISO(leave.end)
      const x = dateToPixel(startDate, chartStart, ppd)
      const endX = dateToPixel(endDate, chartStart, ppd) + ppd
      bars.push({
        employeeId: employee.id,
        vacationId: leave.id,
        type: 'unpaid',
        startDate,
        endDate,
        effectiveEndDate: endDate,
        x,
        width: endX - x,
        storedWidth: endX - x,
        rowIndex,
      })
    }
  }

  return bars
}

export function computeDragPreview(
  dragState: DragState,
  year: number,
  scale: Scale,
): { x: number; width: number } {
  const chartStart = getChartStartDate(year)
  const ppd = PIXELS_PER_DAY[scale]
  const x = dateToPixel(dragState.currentStartDate, chartStart, ppd)
  const endX = dateToPixel(dragState.currentEndDate, chartStart, ppd) + ppd
  return { x, width: endX - x }
}
