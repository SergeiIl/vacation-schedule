import { parseISO } from 'date-fns'
import type { Employee, VacationInterval } from '@/types/employee'
import type { SpecialDate } from '@/types/specialDate'
import type { Settings } from '@/types/settings'
import { intervalDays } from './dateUtils'

export interface ExportData {
  employees: Employee[]
  specialDates: SpecialDate[]
  settings: Settings
  exportedAt: string
  version: number
}

export function exportJSON(
  employees: Employee[],
  specialDates: SpecialDate[],
  settings: Settings,
): string {
  const data: ExportData = {
    employees,
    specialDates,
    settings,
    exportedAt: new Date().toISOString(),
    version: 1,
  }
  return JSON.stringify(data, null, 2)
}

export function exportCSV(employees: Employee[]): string {
  const rows: string[] = ['ФИО,Тип отпуска,Дата начала,Дата окончания,Общее количество дней']

  for (const emp of employees) {
    for (const v of emp.vacations) {
      const days = intervalDays(v.start, v.end)
      rows.push(`${emp.fullName},Основной отпуск,${v.start},${v.end},${days}`)
    }
    for (const nrd of emp.nrd) {
      const days = intervalDays(nrd.start, nrd.end)
      rows.push(`${emp.fullName},НРД,${nrd.start},${nrd.end},${days}`)
    }
  }

  return rows.join('\n')
}

export function importJSON(raw: string): ExportData {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Некорректный JSON-файл')
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Некорректная структура файла')
  }

  const obj = data as Record<string, unknown>

  if (!Array.isArray(obj.employees)) {
    throw new Error('Отсутствует массив сотрудников')
  }

  if (!Array.isArray(obj.specialDates)) {
    throw new Error('Отсутствует массив особых дат')
  }

  return {
    employees: obj.employees as Employee[],
    specialDates: obj.specialDates as SpecialDate[],
    settings: (obj.settings ?? {}) as Settings,
    exportedAt: (obj.exportedAt as string) ?? new Date().toISOString(),
    version: (obj.version as number) ?? 1,
  }
}

export interface CSVImportResult {
  matches: Array<{
    fullName: string
    vacations: Omit<VacationInterval, 'id'>[]
    nrd: { start: string; end: string }[]
  }>
  skippedRows: string[]
}

export function importCSV(raw: string): CSVImportResult {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) throw new Error('Файл CSV пуст или не содержит данных')

  const header = lines[0]
  if (!header.includes('ФИО')) {
    throw new Error('Некорректный заголовок CSV. Ожидается: ФИО,Тип отпуска,Дата начала,Дата окончания,...')
  }

  const dataLines = lines.slice(1)
  const byName = new Map<string, { vacations: Omit<VacationInterval, 'id'>[]; nrd: { start: string; end: string }[] }>()
  const skippedRows: string[] = []

  for (const line of dataLines) {
    const parts = line.split(',')
    if (parts.length < 4) {
      skippedRows.push(line)
      continue
    }

    const [fullName, type, start, end] = parts.map((p) => p.trim())

    if (!fullName || !start || !end) {
      skippedRows.push(line)
      continue
    }

    // Validate dates
    try {
      parseISO(start)
      parseISO(end)
    } catch {
      skippedRows.push(line)
      continue
    }

    if (!byName.has(fullName)) {
      byName.set(fullName, { vacations: [], nrd: [] })
    }

    const entry = byName.get(fullName)!

    if (type === 'НРД') {
      entry.nrd.push({ start, end })
    } else {
      entry.vacations.push({ start, end })
    }
  }

  const matches = Array.from(byName.entries()).map(([fullName, data]) => ({
    fullName,
    ...data,
  }))

  return { matches, skippedRows }
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
