import { useState } from 'react'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { useSettingsStore } from '@/store'

export function SettingsPanel() {
  const {
    rowHeight,
    showWeekends,
    showNRD,
    showUnpaidLeave,
    maxConcurrentVacations,
    vacationDaysNorm,
    nrdColor,
    unpaidColor,
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

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
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

    </div>
  )
}
