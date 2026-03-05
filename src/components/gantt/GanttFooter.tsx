import { useRef, useEffect } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Employee } from '@/types/employee'
import { getChartStartDate, getTotalDays, PIXELS_PER_DAY } from '@/utils/dateUtils'
import { useSettingsStore } from '@/store'

export const FOOTER_HEIGHT = 48

interface Props {
  totalWidth: number
  employees: Employee[]
}

export function GanttFooter({ totalWidth, employees }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { scale, planningYear } = useSettingsStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = totalWidth * dpr
    canvas.height = FOOTER_HEIGHT * dpr
    canvas.style.width = `${totalWidth}px`
    canvas.style.height = `${FOOTER_HEIGHT}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const chartStart = getChartStartDate(planningYear)
    const totalDays = getTotalDays(planningYear)
    const ppd = PIXELS_PER_DAY[scale]

    ctx.clearRect(0, 0, totalWidth, FOOTER_HEIGHT)

    // Compute per-day vacation + NRD counts
    const counts = new Array(totalDays).fill(0)
    for (const emp of employees) {
      for (const v of [...emp.vacations, ...emp.nrd]) {
        const startDay = Math.max(0, differenceInCalendarDays(parseISO(v.start), chartStart))
        const endDay = Math.min(totalDays - 1, differenceInCalendarDays(parseISO(v.end), chartStart))
        for (let d = startDay; d <= endDay; d++) {
          counts[d]++
        }
      }
    }

    const maxCount = Math.max(...counts, 1)
    const maxBarH = FOOTER_HEIGHT - 14

    for (let d = 0; d < totalDays; d++) {
      const count = counts[d]
      if (count === 0) continue

      const x = d * ppd
      const ratio = count / maxCount
      const barH = Math.max(3, ratio * maxBarH)

      ctx.fillStyle = `rgba(59, 130, 246, ${0.2 + ratio * 0.7})`
      const gap = ppd > 4 ? 1 : 0
      ctx.fillRect(x, FOOTER_HEIGHT - barH, ppd - gap, barH)

      if (ppd >= 14) {
        ctx.fillStyle = ratio >= 0.8 ? '#1e40af' : '#2563eb'
        ctx.font = `bold ${ppd >= 24 ? 11 : 9}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(String(count), x + ppd / 2, FOOTER_HEIGHT - barH - 3)
      }
    }
  }, [totalWidth, employees, scale, planningYear])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
