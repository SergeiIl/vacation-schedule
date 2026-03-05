import { parseISO } from 'date-fns'
import type { Employee } from '@/types/employee'
import type { GanttBar, DragState } from '@/types/gantt'
import { dateToPixel, PIXELS_PER_DAY, getChartStartDate } from './dateUtils'
import type { Scale } from '@/types/settings'

export function buildBarsForEmployee(
  employee: Employee,
  year: number,
  scale: Scale,
  showNRD: boolean,
  rowIndex: number,
): GanttBar[] {
  const chartStart = getChartStartDate(year)
  const ppd = PIXELS_PER_DAY[scale]
  const bars: GanttBar[] = []

  for (const vacation of employee.vacations) {
    const startDate = parseISO(vacation.start)
    const endDate = parseISO(vacation.end)
    const x = dateToPixel(startDate, chartStart, ppd)
    const endX = dateToPixel(endDate, chartStart, ppd) + ppd
    bars.push({
      employeeId: employee.id,
      vacationId: vacation.id,
      type: 'vacation',
      startDate,
      endDate,
      x,
      width: endX - x,
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
        x,
        width: endX - x,
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
