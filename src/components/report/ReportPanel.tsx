import { BarChart3 } from 'lucide-react'
import { useEmployeeStore } from '@/store'
import { useSpecialDateStore } from '@/store'
import { useSettingsStore } from '@/store'
import {
  buildStatutoryHolidayDates,
  vacationDaysInYear,
  calendarDaysInYear,
} from '@/utils/dateUtils'
import { format } from 'date-fns'

export function ReportPanel() {
  const { employees } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const { planningYear, vacationDaysNorm } = useSettingsStore()

  const holidayDates = buildStatutoryHolidayDates(planningYear, specialDates)

  const today = format(new Date(), 'yyyy-MM-dd')

  const totalVacDays = employees.reduce(
    (sum, emp) =>
      sum +
      emp.vacations.reduce(
        (s, v) =>
          s + vacationDaysInYear(v.start, v.end, planningYear, holidayDates),
        0,
      ),
    0,
  )

  const statsRows = [...employees]
    .map((emp) => {
      const vacDays = emp.vacations.reduce(
        (s, v) =>
          s + vacationDaysInYear(v.start, v.end, planningYear, holidayDates),
        0,
      )
      const takenVacDays = emp.vacations.reduce(
        (s, v) =>
          v.end > today
            ? s
            : s +
              vacationDaysInYear(v.start, v.end, planningYear, holidayDates),
        0,
      )
      const nrdDays = emp.nrd.reduce(
        (s, n) => s + calendarDaysInYear(n.start, n.end, planningYear),
        0,
      )
      const takenNrdDays = emp.nrd.reduce(
        (s, n) => s + calendarDaysInYear(n.start, n.end, planningYear, today),
        0,
      )
      const unpaidDays = emp.unpaidLeave.reduce(
        (s, u) => s + calendarDaysInYear(u.start, u.end, planningYear),
        0,
      )
      const takenUnpaidDays = emp.unpaidLeave.reduce(
        (s, u) => s + calendarDaysInYear(u.start, u.end, planningYear, today),
        0,
      )
      const norm = emp.vacationDaysOverride ?? vacationDaysNorm
      return {
        name: emp.fullName,
        vacDays,
        takenVacDays,
        nrdDays,
        takenNrdDays,
        unpaidDays,
        takenUnpaidDays,
        norm,
        remaining: norm - vacDays,
      }
    })
    .sort((a, b) => b.vacDays - a.vacDays)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Отчёт по отпускам</span>
        <span className="text-sm text-muted-foreground ml-2">
          Всего:{' '}
          <span className="font-semibold text-foreground">
            {employees.length} сотр.
          </span>
          ,{' '}
          <span className="font-semibold text-foreground">
            {totalVacDays} дн.
          </span>{' '}
          отпусков
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur">
            <tr>
              <th
                rowSpan={2}
                className="text-left px-4 py-2 font-medium border-b border-border"
              >
                #
              </th>
              <th
                rowSpan={2}
                className="text-left px-4 py-2 font-medium border-b border-border"
              >
                ФИО
              </th>
              <th
                colSpan={2}
                className="text-center px-4 py-1 font-medium border-b-0 border-r border-border"
              >
                Отпуск, дн.
              </th>
              <th
                colSpan={2}
                className="text-center px-4 py-1 font-medium border-b-0 border-r border-border"
              >
                НРД, дн.
              </th>
              <th
                colSpan={2}
                className="text-center px-4 py-1 font-medium border-b-0 border-r border-border"
              >
                ЗСС, дн.
              </th>
              <th
                colSpan={2}
                className="text-center px-4 py-1 font-medium border-b-0 border-r border-border"
              >
                Итого, дн.
              </th>
              <th
                rowSpan={2}
                className="text-right px-4 py-2 font-medium border-b border-border"
              >
                Норма
              </th>
              <th
                rowSpan={2}
                className="text-right px-4 py-2 font-medium border-b border-border"
              >
                Отклонение
              </th>
            </tr>
            <tr>
              <th className="text-right px-3 py-1 font-medium border-b border-border text-muted-foreground">
                Всего
              </th>
              <th className="text-right px-3 py-1 font-medium border-b border-r border-border text-primary">
                Отгулено
              </th>
              <th className="text-right px-3 py-1 font-medium border-b border-border text-muted-foreground">
                Всего
              </th>
              <th className="text-right px-3 py-1 font-medium border-b border-r border-border text-primary">
                Отгулено
              </th>
              <th className="text-right px-3 py-1 font-medium border-b border-border text-muted-foreground">
                Всего
              </th>
              <th className="text-right px-3 py-1 font-medium border-b border-r border-border text-primary">
                Отгулено
              </th>
              <th className="text-right px-3 py-1 font-medium border-b border-border text-muted-foreground">
                Всего
              </th>
              <th className="text-right px-3 py-1 font-medium border-b border-r border-border text-primary">
                Отгулено
              </th>
            </tr>
          </thead>
          <tbody>
            {statsRows.map((row, i) => {
              const total = row.vacDays + row.nrdDays + row.unpaidDays
              const takenTotal =
                row.takenVacDays + row.takenNrdDays + row.takenUnpaidDays
              return (
                <tr
                  key={row.name}
                  className={`border-b border-border/50 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                >
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2 text-right">{row.vacDays || '–'}</td>
                  <td className="px-3 py-2 text-right text-primary border-r border-border/40">
                    {row.takenVacDays || '–'}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {row.nrdDays || '–'}
                  </td>
                  <td className="px-3 py-2 text-right text-primary border-r border-border/40">
                    {row.takenNrdDays || '–'}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {row.unpaidDays || '–'}
                  </td>
                  <td className="px-3 py-2 text-right text-primary border-r border-border/40">
                    {row.takenUnpaidDays || '–'}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {total || '–'}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-primary border-r border-border/40">
                    {takenTotal || '–'}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {row.norm}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${row.remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {row.remaining}
                  </td>
                </tr>
              )
            })}
            {employees.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
