import { useEffect } from 'react'
import { parseISO, eachDayOfInterval, format } from 'date-fns'
import { useEmployeeStore, useSettingsStore } from '@/store'
import { useToastStore } from '@/store/toastStore'

const RULE_TOAST_ID = 'vacation-max-concurrent'

export function useVacationRuleCheck() {
  const employees = useEmployeeStore((s) => s.employees)
  const maxConcurrent = useSettingsStore((s) => s.maxConcurrentVacations)
  const planningYear = useSettingsStore((s) => s.planningYear)
  const show = useToastStore((s) => s.show)
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    if (!maxConcurrent || maxConcurrent <= 0) {
      dismiss(RULE_TOAST_ID)
      return
    }

    const yearStart = new Date(planningYear, 0, 1)
    const yearEnd = new Date(planningYear, 11, 31)
    const counts = new Map<string, number>()

    for (const emp of employees) {
      for (const vac of emp.vacations) {
        const start = parseISO(vac.start)
        const end = parseISO(vac.end)
        const from = start < yearStart ? yearStart : start
        const to = end > yearEnd ? yearEnd : end
        if (from > to) continue
        for (const day of eachDayOfInterval({ start: from, end: to })) {
          const key = format(day, 'yyyy-MM-dd')
          counts.set(key, (counts.get(key) ?? 0) + 1)
        }
      }
    }

    const violations: string[] = []
    for (const [date, count] of counts.entries()) {
      if (count > maxConcurrent) violations.push(date)
    }

    if (violations.length === 0) {
      dismiss(RULE_TOAST_ID)
      return
    }

    violations.sort()
    const firstDate = format(parseISO(violations[0]), 'dd.MM.yyyy')

    show({
      id: RULE_TOAST_ID,
      message: `Нарушение: более ${maxConcurrent} чел. в отпуске одновременно`,
      description: `Первая дата нарушения: ${firstDate} (всего ${violations.length} дн.)`,
      type: 'warning',
    })
  }, [employees, maxConcurrent, planningYear, show, dismiss])
}
