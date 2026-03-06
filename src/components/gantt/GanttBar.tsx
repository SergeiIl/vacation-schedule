import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { useDragContext } from './DnDHandler'
import { useBarContextMenu } from './BarContextMenuContext'
import { GanttTooltip } from './GanttTooltip'
import { computeDragPreview } from '@/utils/ganttLayout'
import { intervalDays } from '@/utils/dateUtils'
import { useSettingsStore } from '@/store'
import type { GanttBar as GanttBarType } from '@/types/gantt'
import { cn } from '@/lib/utils'

interface Props {
  bar: GanttBarType
  rowHeight: number
  allBars: GanttBarType[]
}

export function GanttBar({ bar, rowHeight, allBars }: Props) {
  const { dragState, startDrag } = useDragContext()
  const { openMenu } = useBarContextMenu()
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
  const barTop = (rowHeight - barHeight) / 2
  const days = intervalDays(
    format(displayStart, 'yyyy-MM-dd'),
    format(displayEnd, 'yyyy-MM-dd'),
  )
  const insideLabel = displayWidth > 20 ? `${days}д` : ''

  const GAP = 6
  const rightEdge = displayX + displayWidth
  const hasRightNeighbor = allBars.some(
    (b) => b.vacationId !== bar.vacationId && b.x >= rightEdge - 1 && b.x <= rightEdge + GAP,
  )
  const hasLeftNeighbor = allBars.some(
    (b) => b.vacationId !== bar.vacationId && (b.x + b.width) <= displayX + 1 && (b.x + b.width) >= displayX - GAP,
  )
  const dateLabel = displayWidth >= 8
    ? `${format(displayStart, 'dd.MM')}-${format(displayEnd, 'dd.MM')}`
    : ''
  const outsideSide = !hasRightNeighbor ? 'right' : !hasLeftNeighbor ? 'left' : null

  return (
    <>
      <div
        className={cn(
          'gantt-bar',
          bar.type === 'vacation' && !isDragging && !bar.color && 'gantt-bar-vacation',
          bar.type === 'nrd' && !isDragging && 'gantt-bar-nrd',
          bar.type === 'unpaid' && !isDragging && 'gantt-bar-unpaid',
          isDragging && isValid && 'opacity-90 shadow-lg',
          isDragging && !isValid && 'gantt-bar-invalid',
          'overflow-hidden',
        )}
        style={{
          left: displayX,
          width: Math.max(displayWidth, 4),
          height: barHeight,
          zIndex: isDragging ? 10 : 1,
          // Custom color for vacation bars
          ...(bar.type === 'vacation' && bar.color && !isDragging
            ? { backgroundColor: bar.color, color: '#fff' }
            : {}),
          ...(isDragging && isValid
            ? { backgroundColor: bar.type === 'nrd' ? '#fcd34d' : bar.type === 'unpaid' ? '#9ca3af' : (bar.color ?? '#60a5fa') }
            : {}),
        }}
        onPointerDown={(e) => {
          if (
            e.target === leftHandleRef.current ||
            e.target === rightHandleRef.current
          ) return
          startDrag(bar, 'move', e)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openMenu(barId, bar.type, e.clientX, e.clientY)
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

        {insideLabel && (
          <span className="absolute inset-0 z-[2] text-xs pointer-events-none select-none flex items-center justify-center">
            {insideLabel}
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

      {dateLabel && outsideSide && (
        <span
          className="absolute z-[2] text-xs pointer-events-none select-none text-gray-600 dark:text-gray-300 whitespace-nowrap"
          style={{
            top: barTop,
            height: barHeight,
            display: 'flex',
            alignItems: 'center',
            ...(outsideSide === 'right'
              ? { left: rightEdge + 4 }
              : { left: displayX - 4, transform: 'translateX(-100%)' }),
          }}
        >
          {dateLabel}
        </span>
      )}

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
