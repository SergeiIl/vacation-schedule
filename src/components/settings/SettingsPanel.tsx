import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { useSettingsStore } from '@/store'
import { useEmployeeStore } from '@/store'
import { useSpecialDateStore } from '@/store'
import { intervalDays, buildStatutoryHolidayDates, vacationDaysUsed } from '@/utils/dateUtils'
import type { Scale } from '@/types/settings'

const SCALES: { value: Scale; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
]

export function SettingsPanel() {
  const {
    scale,
    planningYear,
    rowHeight,
    showWeekends,
    showNRD,
    showUnpaidLeave,
    maxConcurrentVacations,
    vacationDaysNorm,
    nrdColor,
    unpaidColor,
    setScale,
    setYear,
    setRowHeight,
    toggleShowWeekends,
    toggleShowNRD,
    toggleShowUnpaidLeave,
    setMaxConcurrentVacations,
    setVacationDaysNorm,
    setNrdColor,
    setUnpaidColor,
  } = useSettingsStore()

  const [maxInput, setMaxInput] = useState(String(maxConcurrentVacations ?? ''))
  const [normInput, setNormInput] = useState(String(vacationDaysNorm))

  const { employees } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const holidayDates = buildStatutoryHolidayDates(planningYear, specialDates)

  const totalVacDays = employees.reduce(
    (sum, emp) => sum + emp.vacations.reduce((s, v) => s + vacationDaysUsed(v.start, v.end, holidayDates), 0),
    0,
  )

  const statsRows = [...employees]
    .map((emp) => {
      const vacDays = emp.vacations.reduce((s, v) => s + vacationDaysUsed(v.start, v.end, holidayDates), 0)
      const norm = emp.vacationDaysOverride ?? vacationDaysNorm
      return {
        name: emp.fullName,
        vacDays,
        nrdDays: emp.nrd.reduce((s, n) => s + intervalDays(n.start, n.end), 0),
        unpaidDays: emp.unpaidLeave.reduce((s, u) => s + intervalDays(u.start, u.end), 0),
        norm,
        remaining: norm - vacDays,
      }
    })
    .sort((a, b) => b.vacDays - a.vacDays)

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      {/* Scale */}
      <section className="space-y-2">
        <Label className="text-sm font-semibold">Масштаб диаграммы</Label>
        <div className="flex gap-1">
          {SCALES.map((s) => (
            <Button
              key={s.value}
              variant={scale === s.value ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setScale(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Year */}
      <section className="space-y-2">
        <Label className="text-sm font-semibold">Год планирования</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setYear(Math.max(2020, planningYear - 1))}
          >
            –
          </Button>
          <span className="font-mono font-semibold text-lg w-16 text-center">{planningYear}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setYear(Math.min(2035, planningYear + 1))}
          >
            +
          </Button>
        </div>
      </section>

      {/* Row height */}
      <section className="space-y-2">
        <Label className="text-sm font-semibold">Высота строки: {rowHeight}px</Label>
        <input
          type="range"
          min={44}
          max={80}
          step={4}
          value={rowHeight}
          onChange={(e) => setRowHeight(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </section>

      {/* Toggles */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold">Отображение</Label>
        <div className="flex items-center justify-between">
          <Label htmlFor="showWeekends" className="font-normal">Выделять выходные</Label>
          <Switch id="showWeekends" checked={showWeekends} onCheckedChange={toggleShowWeekends} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showNRD" className="font-normal">Показывать НРД</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={nrdColor}
              onChange={(e) => setNrdColor(e.target.value)}
              className="h-6 w-6 rounded cursor-pointer border border-border"
              title="Цвет НРД"
            />
            <Switch id="showNRD" checked={showNRD} onCheckedChange={toggleShowNRD} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showUnpaidLeave" className="font-normal">Показывать отпуска за свой счёт</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={unpaidColor}
              onChange={(e) => setUnpaidColor(e.target.value)}
              className="h-6 w-6 rounded cursor-pointer border border-border"
              title="Цвет ЗСС"
            />
            <Switch id="showUnpaidLeave" checked={showUnpaidLeave} onCheckedChange={toggleShowUnpaidLeave} />
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold">Правила</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ruleVacNorm" className="font-normal">
              Норма дней отпуска
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="ruleVacNorm"
                type="number"
                min={1}
                max={365}
                value={normInput}
                onChange={(e) => {
                  setNormInput(e.target.value)
                  const v = parseInt(e.target.value)
                  if (!isNaN(v) && v > 0) setVacationDaysNorm(v)
                }}
                className="w-20 h-7 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">дн.</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ruleMaxConcurrent" className="font-normal">
              Макс. человек в отпуске одновременно
            </Label>
            <Switch
              id="ruleMaxConcurrent"
              checked={maxConcurrentVacations !== null}
              onCheckedChange={(checked) => {
                if (checked) {
                  const v = parseInt(maxInput) || 5
                  setMaxInput(String(v))
                  setMaxConcurrentVacations(v)
                } else {
                  setMaxConcurrentVacations(null)
                }
              }}
            />
          </div>
          {maxConcurrentVacations !== null && (
            <div className="flex items-center gap-2 pl-0">
              <input
                type="number"
                min={1}
                max={999}
                value={maxInput}
                onChange={(e) => {
                  setMaxInput(e.target.value)
                  const v = parseInt(e.target.value)
                  if (!isNaN(v) && v > 0) setMaxConcurrentVacations(v)
                }}
                className="w-20 h-7 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">чел.</span>
            </div>
          )}
        </div>
      </section>

      {/* Reports */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <Label className="text-sm font-semibold">Отчёт по отпускам</Label>
        </div>

        <div className="text-sm text-muted-foreground">
          Всего: <span className="font-semibold text-foreground">{employees.length} сотр.</span>,{' '}
          <span className="font-semibold text-foreground">{totalVacDays} дн.</span> отпусков
        </div>

        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-2 py-1.5 font-medium">ФИО</th>
                <th className="text-right px-2 py-1.5 font-medium">Отпуск</th>
                <th className="text-right px-2 py-1.5 font-medium">НРД</th>
                <th className="text-right px-2 py-1.5 font-medium">ЗСС</th>
                <th className="text-right px-2 py-1.5 font-medium">Итого</th>
                <th className="text-right px-2 py-1.5 font-medium">Остаток</th>
              </tr>
            </thead>
            <tbody>
              {statsRows.map((row, i) => (
                <tr key={row.name} className={i % 2 === 1 ? 'bg-muted/20' : ''}>
                  <td className="px-2 py-1 truncate max-w-[120px]" title={row.name}>
                    {row.name}
                  </td>
                  <td className="px-2 py-1 text-right">{row.vacDays}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">
                    {row.nrdDays || '–'}
                  </td>
                  <td className="px-2 py-1 text-right text-muted-foreground">
                    {row.unpaidDays || '–'}
                  </td>
                  <td className="px-2 py-1 text-right font-medium">
                    {row.vacDays + row.nrdDays + row.unpaidDays}
                  </td>
                  <td className={`px-2 py-1 text-right font-medium ${row.remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {row.remaining}
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-3 text-center text-muted-foreground">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
