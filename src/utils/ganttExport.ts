import { addDays, isWeekend, format, differenceInCalendarDays, getDaysInMonth, addMonths } from 'date-fns'
import type { Employee } from '@/types/employee'
import type { SpecialDate } from '@/types/specialDate'
import type { Scale } from '@/types/settings'
import {
  PIXELS_PER_DAY,
  getChartStartDate,
  getTotalDays,
  isHoliday,
  isInForbiddenPeriod,
  dateToPixel,
  buildTopHeaderCells,
  buildHeaderCells,
} from './dateUtils'
import { buildBarsForEmployee } from './ganttLayout'
import { FOOTER_HEIGHT } from '../components/gantt/GanttFooter'

export type ExportFormat = 'png' | 'jpeg'

export interface GanttExportOptions {
  employees: Employee[]
  specialDates: SpecialDate[]
  planningYear: number
  scale: Scale
  rowHeight: number
  sidebarWidth: number
  showWeekends: boolean
  showNRD: boolean
  showUnpaidLeave: boolean
  maxConcurrentVacations: number | null
}

const HEADER_H = 52
const TOP_ROW_H = 20
const EXPORT_DPR = 2

export function exportGantt(opts: GanttExportOptions, fmt: ExportFormat): void {
  const { employees, specialDates, planningYear, scale, rowHeight, sidebarWidth, showWeekends, showNRD, showUnpaidLeave, maxConcurrentVacations } = opts

  const ppd = PIXELS_PER_DAY[scale]
  const totalDays = getTotalDays(planningYear)
  const chartW = totalDays * ppd
  const totalH = employees.length * rowHeight
  const canvasW = sidebarWidth + chartW
  const canvasH = HEADER_H + totalH + FOOTER_HEIGHT

  const canvas = document.createElement('canvas')
  canvas.width = canvasW * EXPORT_DPR
  canvas.height = canvasH * EXPORT_DPR
  const ctx = canvas.getContext('2d')!
  ctx.scale(EXPORT_DPR, EXPORT_DPR)

  const chartStart = getChartStartDate(planningYear)

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Sidebar background
  ctx.fillStyle = '#f8f9fa'
  ctx.fillRect(0, 0, sidebarWidth, canvasH)

  // Header background
  ctx.fillStyle = '#f1f3f4'
  ctx.fillRect(0, 0, canvasW, HEADER_H)

  // ── Row alternating stripes (chart area only) ────────────────────────────────
  for (let i = 0; i < employees.length; i++) {
    if (i % 2 === 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.02)'
      ctx.fillRect(sidebarWidth, HEADER_H + i * rowHeight, chartW, rowHeight)
    }
  }

  // ── Grid columns: weekends / holidays / forbidden ────────────────────────────
  const hatchCanvas = document.createElement('canvas')
  hatchCanvas.width = 10
  hatchCanvas.height = 10
  const hCtx = hatchCanvas.getContext('2d')!
  hCtx.strokeStyle = 'rgba(239,68,68,0.25)'
  hCtx.lineWidth = 1
  hCtx.beginPath(); hCtx.moveTo(0, 10); hCtx.lineTo(10, 0); hCtx.stroke()
  hCtx.beginPath(); hCtx.moveTo(-5, 10); hCtx.lineTo(5, 0); hCtx.stroke()
  hCtx.beginPath(); hCtx.moveTo(5, 10); hCtx.lineTo(15, 0); hCtx.stroke()
  const hatchPattern = ctx.createPattern(hatchCanvas, 'repeat')!

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(chartStart, i)
    const x = sidebarWidth + i * ppd
    if (showWeekends && isWeekend(date)) {
      ctx.fillStyle = 'rgba(0,0,0,0.04)'
      ctx.fillRect(x, HEADER_H, ppd, totalH)
    }
    if (isHoliday(date, specialDates)) {
      ctx.fillStyle = 'rgba(59,130,246,0.10)'
      ctx.fillRect(x, HEADER_H, ppd, totalH)
    }
    if (isInForbiddenPeriod(date, specialDates)) {
      ctx.fillStyle = hatchPattern
      ctx.fillRect(x, HEADER_H, ppd, totalH)
    }
  }

  // ── Violation overlay (days exceeding maxConcurrentVacations) ────────────────
  if (maxConcurrentVacations !== null && maxConcurrentVacations > 0) {
    const dayCounts = new Array(totalDays).fill(0)
    for (const emp of employees) {
      for (const vac of emp.vacations) {
        const startDay = Math.max(0, differenceInCalendarDays(new Date(vac.start), chartStart))
        const endDay = Math.min(totalDays - 1, differenceInCalendarDays(new Date(vac.end), chartStart))
        for (let d = startDay; d <= endDay; d++) dayCounts[d]++
      }
    }
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'
    for (let i = 0; i < totalDays; i++) {
      if (dayCounts[i] > maxConcurrentVacations) {
        ctx.fillRect(sidebarWidth + i * ppd, HEADER_H, ppd, totalH)
      }
    }
  }

  // ── Row dividers ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'
  ctx.lineWidth = 1
  for (let i = 1; i < employees.length; i++) {
    const y = HEADER_H + i * rowHeight
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke()
  }

  // ── Today line ───────────────────────────────────────────────────────────────
  const today = new Date()
  if (today.getFullYear() === planningYear) {
    const todayX = sidebarWidth + dateToPixel(today, chartStart, ppd)
    ctx.strokeStyle = 'rgba(239,68,68,0.7)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 2])
    ctx.beginPath(); ctx.moveTo(todayX, HEADER_H); ctx.lineTo(todayX, canvasH); ctx.stroke()
    ctx.setLineDash([])
  }

  // ── Header top divider ────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'
  ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(sidebarWidth, TOP_ROW_H); ctx.lineTo(canvasW, TOP_ROW_H); ctx.stroke()

  // ── Header cell labels ────────────────────────────────────────────────────────
  const topCells = buildTopHeaderCells(planningYear, scale)
  const bottomCells = buildHeaderCells(planningYear, scale)

  ctx.textBaseline = 'middle'

  // Top row (quarters / months)
  for (const cell of topCells) {
    const x = sidebarWidth + cell.x
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(x + cell.width, 0); ctx.lineTo(x + cell.width, TOP_ROW_H); ctx.stroke()
    if (cell.width >= 20) {
      ctx.fillStyle = '#4b5563'
      ctx.font = 'bold 11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(cell.label, x + cell.width / 2, TOP_ROW_H / 2, cell.width - 4)
    }
  }

  // Bottom row (months / week numbers / days)
  for (const cell of bottomCells) {
    const x = sidebarWidth + cell.x
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(x + cell.width, TOP_ROW_H); ctx.lineTo(x + cell.width, HEADER_H); ctx.stroke()
    if (cell.width >= 14) {
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(cell.label, x + cell.width / 2, TOP_ROW_H + (HEADER_H - TOP_ROW_H) / 2, cell.width - 2)
    }
  }

  // Sidebar header label "Сотрудник"
  ctx.fillStyle = '#6b7280'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Сотрудник', 8, HEADER_H / 2)

  // ── Header bottom border ─────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, HEADER_H); ctx.lineTo(canvasW, HEADER_H); ctx.stroke()

  // ── Sidebar: employee names ───────────────────────────────────────────────────
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'left'
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    const cy = HEADER_H + i * rowHeight + rowHeight / 2
    let textX = 8
    if (emp.color) {
      ctx.beginPath()
      ctx.fillStyle = emp.color
      ctx.arc(textX + 4, cy, 4, 0, Math.PI * 2)
      ctx.fill()
      textX += 14
    }
    ctx.fillStyle = '#1f2937'
    ctx.fillText(emp.fullName, textX, cy, sidebarWidth - textX - 6)
  }

  // ── Sidebar right border ─────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(sidebarWidth, 0); ctx.lineTo(sidebarWidth, canvasH); ctx.stroke()

  // ── Vacation / NRD bars ──────────────────────────────────────────────────────
  const barH = rowHeight - 8

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    const bars = buildBarsForEmployee(emp, planningYear, scale, showNRD, i, showUnpaidLeave)
    const barY = HEADER_H + i * rowHeight + 4

    for (const bar of bars) {
      const barX = sidebarWidth + bar.x
      const barW = Math.max(bar.width, 4)
      const fillColor = bar.type === 'nrd' ? '#fcd34d' : bar.type === 'unpaid' ? '#9ca3af' : (bar.color ?? '#60a5fa')

      ctx.fillStyle = fillColor
      roundRect(ctx, barX, barY, barW, barH, 3)
      ctx.fill()

      const days = differenceInCalendarDays(bar.endDate, bar.startDate) + 1
      const isNrdOrUnpaid = bar.type === 'nrd' || bar.type === 'unpaid'

      // Inside label: days count (matches live UI)
      if (barW > 20) {
        ctx.fillStyle = isNrdOrUnpaid ? '#1f2937' : '#ffffff'
        ctx.font = '10px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${days}д`, barX + barW / 2, barY + barH / 2, barW - 4)
      }

      // Outside label: date range in dd.MM format (matches live UI)
      const dateLabel = `${format(bar.startDate, 'dd.MM')}-${format(bar.endDate, 'dd.MM')}`
      ctx.font = '10px system-ui, sans-serif'
      const textWidth = ctx.measureText(dateLabel).width + 8
      const rightEdge = barX + barW
      if (rightEdge + textWidth <= canvasW) {
        ctx.fillStyle = '#4b5563'
        ctx.textAlign = 'left'
        ctx.fillText(dateLabel, rightEdge + 4, barY + barH / 2)
      } else if (barX - textWidth >= sidebarWidth) {
        ctx.fillStyle = '#4b5563'
        ctx.textAlign = 'right'
        ctx.fillText(dateLabel, barX - 4, barY + barH / 2)
      }
    }
  }

  // ── Footer: per-day counts bar chart ─────────────────────────────────────────
  const footerY = HEADER_H + totalH
  ctx.fillStyle = 'rgba(0,0,0,0.03)'
  ctx.fillRect(0, footerY, canvasW, FOOTER_HEIGHT)
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(canvasW, footerY); ctx.stroke()

  const footerCounts = new Array(totalDays).fill(0)
  for (const emp of employees) {
    for (const v of [...emp.vacations, ...emp.nrd, ...emp.unpaidLeave]) {
      const startDay = Math.max(0, differenceInCalendarDays(new Date(v.start), chartStart))
      const endDay = Math.min(totalDays - 1, differenceInCalendarDays(new Date(v.end), chartStart))
      for (let d = startDay; d <= endDay; d++) footerCounts[d]++
    }
  }

  const footerMax = Math.max(...footerCounts, 1)
  const maxBarH = FOOTER_HEIGHT - 14

  for (let d = 0; d < totalDays; d++) {
    const count = footerCounts[d]
    if (count === 0) continue
    const x = sidebarWidth + d * ppd
    const ratio = count / footerMax
    const barH = Math.max(3, ratio * maxBarH)
    ctx.fillStyle = `rgba(59, 130, 246, ${0.2 + ratio * 0.7})`
    const gap = ppd > 4 ? 1 : 0
    ctx.fillRect(x, footerY + FOOTER_HEIGHT - barH, ppd - gap, barH)
    if (ppd >= 14) {
      ctx.fillStyle = ratio >= 0.8 ? '#1e40af' : '#2563eb'
      ctx.font = `bold ${ppd >= 24 ? 11 : 9}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(String(count), x + ppd / 2, footerY + FOOTER_HEIGHT - barH - 3)
    }
  }

  if (scale === 'month') {
    for (let m = 0; m < 12; m++) {
      const monthStart = addMonths(chartStart, m)
      const dayOffset = differenceInCalendarDays(monthStart, chartStart)
      const daysInMonth = getDaysInMonth(monthStart)
      let maxInMonth = 0
      for (let d = dayOffset; d < dayOffset + daysInMonth && d < totalDays; d++) {
        if (footerCounts[d] > maxInMonth) maxInMonth = footerCounts[d]
      }
      if (maxInMonth === 0) continue
      const ratio = maxInMonth / footerMax
      const barH = Math.max(3, ratio * maxBarH)
      const centerX = sidebarWidth + (dayOffset + daysInMonth / 2) * ppd
      ctx.fillStyle = ratio >= 0.8 ? '#1e40af' : '#2563eb'
      ctx.font = 'bold 10px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(maxInMonth), centerX, footerY + FOOTER_HEIGHT - barH - 3)
    }
  }

  // ── Download ─────────────────────────────────────────────────────────────────
  const mimeType = fmt === 'jpeg' ? 'image/jpeg' : 'image/png'
  const dataUrl = fmt === 'jpeg' ? canvas.toDataURL(mimeType, 0.92) : canvas.toDataURL(mimeType)
  const link = document.createElement('a')
  link.download = `gantt-${planningYear}.${fmt}`
  link.href = dataUrl
  link.click()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
