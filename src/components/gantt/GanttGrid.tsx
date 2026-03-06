import { useEffect, useRef } from 'react'
import { addDays, isWeekend, differenceInCalendarDays, parseISO } from 'date-fns'
import { useSettingsStore } from '@/store'
import { useSpecialDateStore } from '@/store'
import { useEmployeeStore } from '@/store'
import {
  PIXELS_PER_DAY,
  getChartStartDate,
  getTotalDays,
  isHoliday,
  isInForbiddenPeriod,
  dateToPixel,
} from '@/utils/dateUtils'

interface Props {
  totalWidth: number
  totalHeight: number
}

export function GanttGrid({ totalWidth, totalHeight }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { scale, planningYear, showWeekends, rowHeight, maxConcurrentVacations } = useSettingsStore()
  const { specialDates } = useSpecialDateStore()
  const { employees } = useEmployeeStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = totalWidth * dpr
    canvas.height = totalHeight * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, totalWidth, totalHeight)

    const ppd = PIXELS_PER_DAY[scale]
    const totalDays = getTotalDays(planningYear)
    const chartStart = getChartStartDate(planningYear)

    // Draw hatching pattern for forbidden periods
    const hatchCanvas = document.createElement('canvas')
    hatchCanvas.width = 10
    hatchCanvas.height = 10
    const hCtx = hatchCanvas.getContext('2d')!
    hCtx.strokeStyle = 'rgba(239, 68, 68, 0.25)'
    hCtx.lineWidth = 1
    hCtx.beginPath()
    hCtx.moveTo(0, 10)
    hCtx.lineTo(10, 0)
    hCtx.stroke()
    hCtx.beginPath()
    hCtx.moveTo(-5, 10)
    hCtx.lineTo(5, 0)
    hCtx.stroke()
    hCtx.beginPath()
    hCtx.moveTo(5, 10)
    hCtx.lineTo(15, 0)
    hCtx.stroke()
    const hatchPattern = ctx.createPattern(hatchCanvas, 'repeat')!

    // Draw row alternating backgrounds
    const filteredEmps = employees
    for (let i = 0; i < filteredEmps.length; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.02)'
        ctx.fillRect(0, i * rowHeight, totalWidth, rowHeight)
      }
    }

    // Draw vertical day columns
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(chartStart, i)
      const x = i * ppd
      const w = ppd

      if (showWeekends && isWeekend(date)) {
        ctx.fillStyle = 'rgba(0,0,0,0.04)'
        ctx.fillRect(x, 0, w, totalHeight)
      }

      if (isHoliday(date, specialDates)) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.08)'
        ctx.fillRect(x, 0, w, totalHeight)
      }

      if (isInForbiddenPeriod(date, specialDates)) {
        ctx.fillStyle = hatchPattern
        ctx.fillRect(x, 0, w, totalHeight)
      }
    }

    // Draw violation overlay (days exceeding maxConcurrentVacations)
    if (maxConcurrentVacations !== null && maxConcurrentVacations > 0) {
      const dayCounts = new Array(totalDays).fill(0)
      for (const emp of employees) {
        for (const vac of emp.vacations) {
          const startDay = Math.max(0, differenceInCalendarDays(parseISO(vac.start), chartStart))
          const endDay = Math.min(totalDays - 1, differenceInCalendarDays(parseISO(vac.end), chartStart))
          for (let d = startDay; d <= endDay; d++) dayCounts[d]++
        }
      }
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'
      for (let i = 0; i < totalDays; i++) {
        if (dayCounts[i] > maxConcurrentVacations) {
          ctx.fillRect(i * ppd, 0, ppd, totalHeight)
        }
      }
    }

    // Draw today line
    const today = new Date()
    const todayYear = today.getFullYear()
    if (todayYear === planningYear) {
      const todayX = dateToPixel(today, chartStart, ppd)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 2])
      ctx.beginPath()
      ctx.moveTo(todayX, 0)
      ctx.lineTo(todayX, totalHeight)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw horizontal row dividers
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    for (let i = 1; i < filteredEmps.length; i++) {
      const y = i * rowHeight
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(totalWidth, y)
      ctx.stroke()
    }

  }, [scale, planningYear, specialDates, totalWidth, totalHeight, showWeekends, rowHeight, employees, maxConcurrentVacations])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: totalWidth, height: totalHeight, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    />
  )
}
