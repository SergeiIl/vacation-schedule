import { useMemo } from 'react'
import { isWeekend, addDays } from 'date-fns'
import { buildHeaderCells, buildTopHeaderCells, getChartStartDate } from '@/utils/dateUtils'
import { useSettingsStore } from '@/store'
import { cn } from '@/lib/utils'

export const HEADER_HEIGHT = 52
const TOP_ROW_H = 20

interface Props {
  totalWidth: number
}

export function GanttHeader({ totalWidth }: Props) {
  const { scale, planningYear } = useSettingsStore()
  const chartStart = getChartStartDate(planningYear)

  const topCells = useMemo(() => buildTopHeaderCells(planningYear, scale), [planningYear, scale])
  const bottomCells = useMemo(() => buildHeaderCells(planningYear, scale), [planningYear, scale])

  return (
    <div
      className="flex flex-col border-b border-border bg-muted/30 flex-shrink-0"
      style={{ width: totalWidth, height: HEADER_HEIGHT }}
    >
      {/* Top row: months (day/week) or quarters (month) */}
      <div className="relative border-b border-border/70 flex-shrink-0" style={{ height: TOP_ROW_H }}>
        {topCells.map((cell, i) => (
          <div
            key={i}
            className="absolute inset-y-0 flex items-center justify-center border-r border-border/50 overflow-hidden select-none"
            style={{ left: cell.x, width: cell.width }}
          >
            {cell.width >= 20 && (
              <span className="text-[11px] font-semibold text-foreground/70 truncate px-1 capitalize">
                {cell.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Bottom row: days / week numbers / month names */}
      <div className="relative flex-1">
        {bottomCells.map((cell, i) => {
          const isWeekendCell = scale === 'day' && isWeekend(addDays(chartStart, i))
          return (
            <div
              key={i}
              className={cn(
                'absolute inset-y-0 flex items-center justify-center text-xs border-r border-border/40 overflow-hidden select-none',
                isWeekendCell && 'text-muted-foreground bg-muted/30',
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
    </div>
  )
}
