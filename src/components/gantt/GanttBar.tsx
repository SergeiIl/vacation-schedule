import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useDragContext } from './DnDHandler'
import { GanttTooltip } from './GanttTooltip'
import { computeDragPreview } from '@/utils/ganttLayout'
import { intervalDays } from '@/utils/dateUtils'
import { useSettingsStore } from '@/store'
import type { GanttBar as GanttBarType } from '@/types/gantt'
import { cn } from '@/lib/utils'

interface Props {
  bar: GanttBarType
  rowHeight: number
}

export function GanttBar({ bar, rowHeight }: Props) {
  const { dragState, startDrag } = useDragContext()
  const { scale, planningYear } = useSettingsStore()
  const leftHandleRef = useRef<HTMLDivElement>(null)
  const rightHandleRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const barId = `${bar.employeeId}:${bar.vacationId}`
  const isDragging = dragState?.barId === barId && dragState?.active

  let displayX = bar.x
  let displayWidth = bar.width
  let displayStart = bar.startDate
  let displayEnd = bar.endDate
  let isValid = true

  if (isDragging && dragState) {
    const preview = computeDragPreview(dragState, planningYear, scale)
    displayX = preview.x
    displayWidth = preview.width
    displayStart = dragState.currentStartDate
    displayEnd = dragState.currentEndDate
    isValid = dragState.isValid
  }

  const barHeight = rowHeight - 8
  const days = intervalDays(
    format(displayStart, 'yyyy-MM-dd'),
    format(displayEnd, 'yyyy-MM-dd'),
  )
  const label = displayWidth > 50
    ? `${format(displayStart, 'd MMM', { locale: ru })} – ${format(displayEnd, 'd MMM', { locale: ru })}`
    : displayWidth > 24
    ? `${days}д`
    : ''

  return (
    <>
      <div
        className={cn(
          'gantt-bar',
          bar.type === 'vacation' && !isDragging && 'gantt-bar-vacation',
          bar.type === 'nrd' && !isDragging && 'gantt-bar-nrd',
          isDragging && isValid && 'bg-blue-400 opacity-90 shadow-lg',
          isDragging && !isValid && 'gantt-bar-invalid',
          bar.type === 'nrd' && isDragging && isValid && 'bg-amber-300',
          'overflow-hidden',
        )}
        style={{
          left: displayX,
          width: Math.max(displayWidth, 4),
          height: barHeight,
          zIndex: isDragging ? 10 : 1,
        }}
        onPointerDown={(e) => {
          if (
            e.target === leftHandleRef.current ||
            e.target === rightHandleRef.current
          ) return
          startDrag(bar, 'move', e)
        }}
        onMouseEnter={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setTooltipPos(null)}
      >
        {/* Left resize handle */}
        <div
          ref={leftHandleRef}
          className="gantt-resize-handle gantt-resize-handle-left"
          onPointerDown={(e) => {
            e.stopPropagation()
            startDrag(bar, 'resize-left', e)
          }}
        />

        {label && (
          <span className="relative z-[2] text-xs px-2 py-0.5 truncate pointer-events-none select-none leading-none flex items-center h-full">
            {label}
          </span>
        )}

        {/* Right resize handle */}
        <div
          ref={rightHandleRef}
          className="gantt-resize-handle gantt-resize-handle-right"
          onPointerDown={(e) => {
            e.stopPropagation()
            startDrag(bar, 'resize-right', e)
          }}
        />
      </div>

      {tooltipPos && !isDragging && (
        <GanttTooltip
          startDate={bar.startDate}
          endDate={bar.endDate}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}

      {isDragging && dragState && tooltipPos && (
        <GanttTooltip
          startDate={displayStart}
          endDate={displayEnd}
          x={tooltipPos.x}
          y={tooltipPos.y}
          isValid={isValid}
        />
      )}
    </>
  )
}
