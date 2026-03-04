import { parseISO } from 'date-fns'
import type { VacationInterval } from '@/types/employee'
import type { SpecialDate } from '@/types/specialDate'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateNoSelfOverlap(
  vacations: VacationInterval[],
  excludeId?: string,
): ValidationResult {
  const intervals = vacations.filter((v) => v.id !== excludeId)
  const errors: string[] = []

  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      const a = intervals[i]
      const b = intervals[j]
      const aStart = parseISO(a.start)
      const aEnd = parseISO(a.end)
      const bStart = parseISO(b.start)
      const bEnd = parseISO(b.end)
      if (aStart <= bEnd && aEnd >= bStart) {
        errors.push(`Интервалы ${a.start}–${a.end} и ${b.start}–${b.end} пересекаются`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateNotForbidden(
  start: string,
  end: string,
  specialDates: SpecialDate[],
): ValidationResult {
  const startDate = parseISO(start)
  const endDate = parseISO(end)
  const forbidden = specialDates.filter((sd) => sd.type === 'forbidden')
  const errors: string[] = []

  for (const f of forbidden) {
    const fStart = parseISO(f.start)
    const fEnd = f.end ? parseISO(f.end) : fStart
    if (startDate <= fEnd && endDate >= fStart) {
      errors.push(`Период пересекается с запретным периодом «${f.name}»`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateVacationInterval(
  interval: { id?: string; start: string; end: string },
  allVacations: VacationInterval[],
  specialDates: SpecialDate[],
): ValidationResult {
  const errors: string[] = []

  if (interval.start > interval.end) {
    errors.push('Дата начала должна быть не позже даты окончания')
    return { valid: false, errors }
  }

  const overlapResult = validateNoSelfOverlap(
    [...allVacations, { id: interval.id ?? '__new__', start: interval.start, end: interval.end }],
    interval.id,
  )
  errors.push(...overlapResult.errors)

  const forbiddenResult = validateNotForbidden(interval.start, interval.end, specialDates)
  errors.push(...forbiddenResult.errors)

  return { valid: errors.length === 0, errors }
}

export function isIntervalValid(
  start: Date,
  end: Date,
  employeeVacations: VacationInterval[],
  excludeId: string,
  specialDates: SpecialDate[],
): boolean {
  if (start > end) return false

  // Check forbidden periods
  const forbidden = specialDates.filter((sd) => sd.type === 'forbidden')
  for (const f of forbidden) {
    const fStart = parseISO(f.start)
    const fEnd = f.end ? parseISO(f.end) : fStart
    if (start <= fEnd && end >= fStart) return false
  }

  // Check self-overlap
  const others = employeeVacations.filter((v) => v.id !== excludeId)
  for (const other of others) {
    const oStart = parseISO(other.start)
    const oEnd = parseISO(other.end)
    if (start <= oEnd && end >= oStart) return false
  }

  return true
}

export function checkConflicts(
  vacations: VacationInterval[],
  specialDates: SpecialDate[],
): boolean {
  for (const v of vacations) {
    const result = validateNotForbidden(v.start, v.end, specialDates)
    if (!result.valid) return true
  }
  return false
}
