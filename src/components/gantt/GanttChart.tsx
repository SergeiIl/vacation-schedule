import { useRef, useState, useCallback, useEffect } from 'react'
import { GripVertical } from 'lucide-react'
import { GanttHeader, HEADER_HEIGHT } from './GanttHeader'
import { GanttGrid } from './GanttGrid'
import { GanttRow } from './GanttRow'
import { GanttFooter, FOOTER_HEIGHT } from './GanttFooter'
import { DnDHandler } from './DnDHandler'
import { useEmployeeStore, useSpecialDateStore, useSettingsStore } from '@/store'
import { useVirtualRows } from '@/hooks/useVirtualRows'
import { chartWidth, dateToPixel, getChartStartDate, PIXELS_PER_DAY } from '@/utils/dateUtils'

const DEFAULT_SIDEBAR_WIDTH = 200
const MIN_SIDEBAR_WIDTH = 100
const MAX_SIDEBAR_WIDTH = 400
const LS_SIDEBAR_KEY = 'gantt-sidebar-width'

function loadSidebarWidth(): number {
  try {
    const v = localStorage.getItem(LS_SIDEBAR_KEY)
    if (v) {
      const n = Number(v)
      if (n >= MIN_SIDEBAR_WIDTH && n <= MAX_SIDEBAR_WIDTH) return n
    }
  } catch { /* ignore */ }
  return DEFAULT_SIDEBAR_WIDTH
}

export function GanttChart() {
  const { filteredEmployees, reorderEmployees } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const { scale, planningYear, rowHeight } = useSettingsStore()

  const employees = filteredEmployees(specialDates)
  const totalWidth = chartWidth(planningYear, scale)
  const totalHeight = employees.length * rowHeight

  // Sidebar resize
  const [sidebarWidth, setSidebarWidth] = useState(loadSidebarWidth)
  const isResizing = useRef(false)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(0)

  // Scroll sync
  const chartScrollRef = useRef<HTMLDivElement>(null)
  const sidebarScrollRef = useRef<HTMLDivElement>(null)
  const footerScrollRef = useRef<HTMLDivElement>(null)
  const sidebarOuterRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)

  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Row drag-to-reorder state
  const rowDragActive = useRef(false)
  const rowDragFromIndex = useRef(0)
  const rowDragDropIndex = useRef(0)
  const rowDragId = useRef('')
  const employeesRef = useRef(employees)
  employeesRef.current = employees

  const [rowDragVisual, setRowDragVisual] = useState<{
    dropIndex: number
    ghostY: number
    ghostName: string
  } | null>(null)

  // Sidebar resize handlers
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    resizeStartX.current = e.clientX
    resizeStartWidth.current = sidebarWidth
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [sidebarWidth])

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isResizing.current) return
    const delta = e.clientX - resizeStartX.current
    setSidebarWidth(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, resizeStartWidth.current + delta)))
  }, [])

  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isResizing.current) return
    isResizing.current = false
    const delta = e.clientX - resizeStartX.current
    const final = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, resizeStartWidth.current + delta))
    try { localStorage.setItem(LS_SIDEBAR_KEY, String(final)) } catch { /* ignore */ }
  }, [])

  // Row drag-to-reorder handler
  const handleGripPointerDown = useCallback((
    e: React.PointerEvent,
    empId: string,
    empName: string,
    filteredIndex: number,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    rowDragActive.current = true
    rowDragId.current = empId
    rowDragFromIndex.current = filteredIndex
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'

    setRowDragVisual({ dropIndex: filteredIndex, ghostY: e.clientY, ghostName: empName })

    const onMove = (ev: PointerEvent) => {
      if (!rowDragActive.current) return
      const sidebarRect = sidebarOuterRef.current?.getBoundingClientRect()
      if (!sidebarRect) return
      const relY = ev.clientY - sidebarRect.top - HEADER_HEIGHT + (sidebarScrollRef.current?.scrollTop ?? 0)
      const rawIdx = Math.round(relY / rowHeight)
      const dropIndex = Math.max(0, Math.min(employeesRef.current.length - 1, rawIdx))
      rowDragDropIndex.current = dropIndex
      setRowDragVisual((prev) => prev ? { ...prev, dropIndex, ghostY: ev.clientY } : null)
    }

    const onUp = () => {
      if (!rowDragActive.current) return
      rowDragActive.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setRowDragVisual(null)

      const fromIndex = rowDragFromIndex.current
      const dropIndex = rowDragDropIndex.current
      if (dropIndex !== fromIndex) {
        const currentFiltered = employeesRef.current
        const filteredIds = currentFiltered.map((e) => e.id)
        const newFilteredIds = [...filteredIds]
        const [moved] = newFilteredIds.splice(fromIndex, 1)
        newFilteredIds.splice(dropIndex, 0, moved)

        const allEmployees = useEmployeeStore.getState().employees
        const filteredSet = new Set(filteredIds)
        const newOrder: string[] = []
        let fi = 0
        for (const emp of [...allEmployees].sort((a, b) => a.order - b.order)) {
          if (filteredSet.has(emp.id)) {
            newOrder.push(newFilteredIds[fi++])
          } else {
            newOrder.push(emp.id)
          }
        }
        reorderEmployees(newOrder)
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [rowHeight, reorderEmployees])

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
      if (sidebarScrollRef.current) sidebarScrollRef.current.scrollTop = newScrollTop
      if (footerScrollRef.current) footerScrollRef.current.scrollLeft = el.scrollLeft
      isSyncing.current = false
    }
  }, [])

  const handleSidebarScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    if (!isSyncing.current) {
      isSyncing.current = true
      if (chartScrollRef.current) chartScrollRef.current.scrollTop = newScrollTop
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

  // Drop indicator position (relative to sidebar outer div)
  const dropIndicatorTop = rowDragVisual
    ? HEADER_HEIGHT + rowDragVisual.dropIndex * rowHeight - scrollTop
    : null
  const showDropIndicator =
    dropIndicatorTop !== null &&
    dropIndicatorTop >= HEADER_HEIGHT &&
    dropIndicatorTop <= HEADER_HEIGHT + containerHeight

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
          <div
            ref={sidebarOuterRef}
            className="relative flex flex-col flex-shrink-0"
            style={{ width: sidebarWidth }}
          >
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
              {visibleItems.map((emp, localIdx) => {
                const filteredIndex = startIndex + localIdx
                const isDragged = rowDragVisual?.ghostName === emp.fullName && rowDragId.current === emp.id
                return (
                  <div
                    key={emp.id}
                    className={`flex items-center gap-1 px-1 border-b border-border/50 text-sm transition-opacity ${isDragged ? 'opacity-30' : ''}`}
                    style={{ height: rowHeight }}
                  >
                    <div
                      className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
                      onPointerDown={(e) => handleGripPointerDown(e, emp.id, emp.fullName, filteredIndex)}
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                    {emp.color && (
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: emp.color }}
                      />
                    )}
                    <span className="truncate">{emp.fullName}</span>
                  </div>
                )
              })}
              <div style={{ height: offsetBottom }} />
            </div>

            {/* Drop indicator line */}
            {showDropIndicator && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-primary z-20 pointer-events-none"
                style={{ top: dropIndicatorTop! }}
              />
            )}
          </div>

          {/* Sidebar resize handle */}
          <div
            className="flex-shrink-0 w-1 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary transition-colors touch-none select-none"
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
          />

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
            style={{ width: sidebarWidth + 4 }}
          >
            В отпуске
          </div>
          <div ref={footerScrollRef} className="flex-1 overflow-hidden">
            <GanttFooter totalWidth={totalWidth} employees={employees} />
          </div>
        </div>
      </div>

      {/* Drag ghost */}
      {rowDragVisual && (
        <div
          className="fixed z-50 pointer-events-none bg-background border border-primary rounded px-2 py-1 text-sm shadow-lg flex items-center gap-1.5"
          style={{ top: rowDragVisual.ghostY - 14, left: 8 }}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{rowDragVisual.ghostName}</span>
        </div>
      )}
    </DnDHandler>
  )
}
