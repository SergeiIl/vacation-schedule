import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { addDays, format, subDays } from 'date-fns'
import type { DragState, DragMode, GanttBar } from '@/types/gantt'
import { useEmployeeStore } from '@/store'
import { useSpecialDateStore } from '@/store'
import { useSettingsStore } from '@/store'
import { PIXELS_PER_DAY } from '@/utils/dateUtils'
import { isIntervalValid } from '@/utils/validation'

interface DragContextValue {
  dragState: DragState | null
  startDrag: (bar: GanttBar, mode: DragMode, e: React.PointerEvent) => void
}

const DragContext = createContext<DragContextValue | null>(null)

export function useDragContext() {
  const ctx = useContext(DragContext)
  if (!ctx) throw new Error('useDragContext must be used within DnDHandler')
  return ctx
}

interface Props {
  children: React.ReactNode
}

export function DnDHandler({ children }: Props) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  dragStateRef.current = dragState

  const { updateVacation, updateNRD, updateUnpaidLeave } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const { scale, planningYear } = useSettingsStore()

  const pixelsPerDay = PIXELS_PER_DAY[scale]

  const startDrag = useCallback(
    (bar: GanttBar, mode: DragMode, e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      e.preventDefault()

      const state: DragState = {
        active: true,
        barId: `${bar.employeeId}:${bar.vacationId}`,
        barType: bar.type,
        mode,
        originX: e.clientX,
        originStartDate: bar.startDate,
        originEndDate: bar.endDate,
        currentStartDate: bar.startDate,
        currentEndDate: bar.endDate,
        isValid: true,
      }
      setDragState(state)
    },
    [],
  )

  useEffect(() => {
    if (!dragState?.active) return

    function onPointerMove(e: PointerEvent) {
      const ds = dragStateRef.current
      if (!ds?.active) return

      const deltaPx = e.clientX - ds.originX
      const deltaDays = Math.round(deltaPx / pixelsPerDay)

      let newStart = ds.originStartDate
      let newEnd = ds.originEndDate

      if (ds.mode === 'move') {
        newStart = addDays(ds.originStartDate, deltaDays)
        newEnd = addDays(ds.originEndDate, deltaDays)
      } else if (ds.mode === 'resize-left') {
        newStart = addDays(ds.originStartDate, deltaDays)
        if (newStart >= newEnd) newStart = subDays(newEnd, 1)
      } else {
        newEnd = addDays(ds.originEndDate, deltaDays)
        if (newEnd <= newStart) newEnd = addDays(newStart, 1)
      }

      // Clamp to year bounds
      const yearStart = new Date(planningYear, 0, 1)
      const yearEnd = new Date(planningYear, 11, 31)
      if (newStart < yearStart) newStart = yearStart
      if (newEnd > yearEnd) newEnd = yearEnd

      const [empId, vacId] = ds.barId.split(':')
      const { employees } = useEmployeeStore.getState()
      const employee = employees.find((e) => e.id === empId)
      const employeeVacations = employee?.vacations ?? []

      const valid = ds.barType === 'nrd' || ds.barType === 'unpaid'
        ? newStart <= newEnd
        : isIntervalValid(newStart, newEnd, employeeVacations, vacId, specialDates)

      setDragState((s) => s ? { ...s, currentStartDate: newStart, currentEndDate: newEnd, isValid: valid } : s)
    }

    function onPointerUp() {
      const ds = dragStateRef.current
      if (!ds) return

      if (ds.isValid) {
        const [empId, vacId] = ds.barId.split(':')
        const startStr = format(ds.currentStartDate, 'yyyy-MM-dd')
        const endStr = format(ds.currentEndDate, 'yyyy-MM-dd')

        if (ds.barType === 'nrd') {
          updateNRD(empId, vacId, { start: startStr, end: endStr })
        } else if (ds.barType === 'unpaid') {
          updateUnpaidLeave(empId, vacId, { start: startStr, end: endStr })
        } else {
          updateVacation(empId, vacId, { start: startStr, end: endStr })
        }
      }

      setDragState(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [dragState?.active, pixelsPerDay, specialDates, planningYear, updateVacation, updateNRD, updateUnpaidLeave])

  return (
    <DragContext.Provider value={{ dragState, startDrag }}>
      {children}
    </DragContext.Provider>
  )
}
