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
  const { scale, planningYear, rowHeight, showNRD } = useSettingsStore()

  const bars = useMemo(
    () => buildBarsForEmployee(employee, planningYear, scale, showNRD, rowIndex),
    [employee, planningYear, scale, showNRD, rowIndex],
  )

  return (
    <div
      className="relative"
      style={{ height: rowHeight }}
    >
      {bars.map((bar) => (
        <GanttBar key={`${bar.employeeId}:${bar.vacationId}`} bar={bar} rowHeight={rowHeight} />
      ))}
    </div>
  )
}
