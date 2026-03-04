import { useRef, useState, useCallback, useEffect } from 'react'
import { GanttHeader, HEADER_HEIGHT } from './GanttHeader'
import { GanttGrid } from './GanttGrid'
import { GanttRow } from './GanttRow'
import { GanttFooter, FOOTER_HEIGHT } from './GanttFooter'
import { DnDHandler } from './DnDHandler'
import { useEmployeeStore, useSpecialDateStore, useSettingsStore } from '@/store'
import { useVirtualRows } from '@/hooks/useVirtualRows'
import { chartWidth, dateToPixel, getChartStartDate, PIXELS_PER_DAY } from '@/utils/dateUtils'

const SIDEBAR_WIDTH = 200

export function GanttChart() {
  const { filteredEmployees } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const { scale, planningYear, rowHeight } = useSettingsStore()

  const employees = filteredEmployees(specialDates)
  const totalWidth = chartWidth(planningYear, scale)
  const totalHeight = employees.length * rowHeight

  const chartScrollRef = useRef<HTMLDivElement>(null)
  const sidebarScrollRef = useRef<HTMLDivElement>(null)
  const footerScrollRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)

  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Scroll to today on mount
  useEffect(() => {
    const today = new Date()
    if (today.getFullYear() !== planningYear) return
    const chartStart = getChartStartDate(planningYear)
    const ppd = PIXELS_PER_DAY[scale]
    const todayX = dateToPixel(today, chartStart, ppd)
    const offset = Math.max(0, todayX - 300)
    chartScrollRef.current?.scrollTo({ left: offset, behavior: 'smooth' })
  }, [planningYear, scale])

  const handleChartScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const newScrollTop = el.scrollTop
    setScrollTop(newScrollTop)
    if (!isSyncing.current) {
      isSyncing.current = true
      if (sidebarScrollRef.current) {
        sidebarScrollRef.current.scrollTop = newScrollTop
      }
      if (footerScrollRef.current) {
        footerScrollRef.current.scrollLeft = el.scrollLeft
      }
      isSyncing.current = false
    }
  }, [])

  const handleSidebarScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    if (!isSyncing.current) {
      isSyncing.current = true
      if (chartScrollRef.current) {
        chartScrollRef.current.scrollTop = newScrollTop
      }
      isSyncing.current = false
    }
  }, [])

  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setContainerHeight(node.clientHeight - HEADER_HEIGHT)
  }, [])

  const { visibleItems, offsetTop, offsetBottom, startIndex } = useVirtualRows(
    employees,
    rowHeight,
    containerHeight,
    scrollTop,
  )

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Нет сотрудников для отображения
      </div>
    )
  }

  return (
    <DnDHandler>
      <div className="flex flex-col h-full overflow-hidden border border-border rounded-md">
        {/* Main scrollable area */}
        <div ref={measuredRef} className="flex flex-1 overflow-hidden">
          {/* Sidebar: employee names */}
          <div className="flex flex-col flex-shrink-0 border-r border-border" style={{ width: SIDEBAR_WIDTH }}>
            {/* Header placeholder */}
            <div
              className="border-b border-border bg-muted/30 flex items-center px-2 text-xs font-medium text-muted-foreground flex-shrink-0"
              style={{ height: HEADER_HEIGHT }}
            >
              Сотрудник
            </div>
            {/* Employee name rows */}
            <div
              ref={sidebarScrollRef}
              className="flex-1 overflow-hidden"
              onScroll={handleSidebarScroll}
            >
              <div style={{ height: offsetTop }} />
              {visibleItems.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-2 px-2 border-b border-border/50 text-sm"
                  style={{ height: rowHeight }}
                >
                  {emp.color && (
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: emp.color }}
                    />
                  )}
                  <span className="truncate">{emp.fullName}</span>
                </div>
              ))}
              <div style={{ height: offsetBottom }} />
            </div>
          </div>

          {/* Chart area */}
          <div
            ref={chartScrollRef}
            className="flex-1 overflow-auto"
            onScroll={handleChartScroll}
          >
            {/* Header: time axis */}
            <div className="sticky top-0 z-10">
              <GanttHeader totalWidth={totalWidth} />
            </div>

            {/* Rows + grid */}
            <div
              className="relative"
              style={{ width: totalWidth, height: totalHeight }}
            >
              <GanttGrid totalWidth={totalWidth} totalHeight={totalHeight} />

              <div style={{ height: offsetTop }} />

              {visibleItems.map((emp, localIdx) => (
                <GanttRow
                  key={emp.id}
                  employee={emp}
                  rowIndex={startIndex + localIdx}
                />
              ))}

              <div style={{ height: offsetBottom }} />
            </div>
          </div>
        </div>

        {/* Footer: daily vacation counter */}
        <div className="flex flex-shrink-0 border-t border-border bg-muted/20" style={{ height: FOOTER_HEIGHT }}>
          <div
            className="flex items-center justify-center px-1 text-[10px] text-muted-foreground bg-muted/30 border-r border-border flex-shrink-0 leading-tight text-center"
            style={{ width: SIDEBAR_WIDTH }}
          >
            В отпуске
          </div>
          <div ref={footerScrollRef} className="flex-1 overflow-hidden">
            <GanttFooter totalWidth={totalWidth} employees={employees} />
          </div>
        </div>
      </div>
    </DnDHandler>
  )
}
