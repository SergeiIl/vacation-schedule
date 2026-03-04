import { useMemo } from 'react'
import { isWeekend, addDays } from 'date-fns'
import { buildHeaderCells, getChartStartDate } from '@/utils/dateUtils'
import { useSettingsStore } from '@/store'
import { cn } from '@/lib/utils'

interface Props {
  totalWidth: number
}

export function GanttHeader({ totalWidth }: Props) {
  const { scale, planningYear } = useSettingsStore()
  const chartStart = getChartStartDate(planningYear)

  const cells = useMemo(
    () => buildHeaderCells(planningYear, scale),
    [planningYear, scale],
  )

  return (
    <div
      className="relative border-b border-border bg-muted/30 flex-shrink-0"
      style={{ width: totalWidth, height: 32 }}
    >
      {/* Month names row (for day/week scales, show a secondary row with months) */}
      {cells.map((cell, i) => {
        const isWeekendCell =
          scale === 'day' && isWeekend(addDays(chartStart, i))

        return (
          <div
            key={i}
            className={cn(
              'absolute inset-y-0 flex items-center justify-center text-xs border-r border-border/50 overflow-hidden select-none',
              isWeekendCell && 'text-muted-foreground bg-muted/20',
            )}
            style={{ left: cell.x, width: cell.width }}
          >
            {cell.width >= 14 && (
              <span className="truncate px-0.5">{cell.label}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
