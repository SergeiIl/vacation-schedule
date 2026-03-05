import { useMemo } from 'react'
import { GanttBar } from './GanttBar'
import { buildBarsForEmployee } from '@/utils/ganttLayout'
import { useSettingsStore } from '@/store'
import type { Employee } from '@/types/employee'

interface Props {
  employee: Employee
  rowIndex: number
}

export function GanttRow({ employee, rowIndex }: Props) {
  const { scale, planningYear, rowHeight, showNRD, showUnpaidLeave } = useSettingsStore()

  const bars = useMemo(
    () => buildBarsForEmployee(employee, planningYear, scale, showNRD, rowIndex, showUnpaidLeave),
    [employee, planningYear, scale, showNRD, showUnpaidLeave, rowIndex],
  )

  return (
    <div
      className="relative"
      style={{ height: rowHeight }}
    >
      {bars.map((bar) => (
        <GanttBar key={`${bar.employeeId}:${bar.vacationId}`} bar={bar} rowHeight={rowHeight} allBars={bars} />
      ))}
    </div>
  )
}
