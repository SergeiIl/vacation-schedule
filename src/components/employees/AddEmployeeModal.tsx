import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { useEmployeeStore } from '@/store'
import { useSpecialDateStore } from '@/store'
import type { Employee, VacationInterval, NRD, UnpaidLeave } from '@/types/employee'
import {
  validateVacationInterval,
  validateNoSelfOverlap,
} from '@/utils/validation'

const PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#ec4899',
  '#6366f1',
]

interface Props {
  employee?: Employee
  onClose: () => void
}

interface FormVacation {
  id: string
  start: string
  end: string
  error?: string
}

const today = new Date().toISOString().slice(0, 10)

function overlaps(a: { start: string; end: string }, b: { start: string; end: string }): boolean {
  return a.start <= b.end && a.end >= b.start
}

export function AddEmployeeModal({ employee, onClose }: Props) {
  const { employees, addEmployee, updateEmployee } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()

  const existingPositions = [
    ...new Set(employees.map((e) => e.position).filter(Boolean)),
  ] as string[]

  const [fullName, setFullName] = useState(employee?.fullName ?? '')
  const [nameError, setNameError] = useState('')
  const [position, setPosition] = useState(employee?.position ?? '')
  const [vacationDaysOverride, setVacationDaysOverride] = useState(
    employee?.vacationDaysOverride != null ? String(employee.vacationDaysOverride) : '',
  )
  const [color, setColor] = useState(
    employee?.color ?? PALETTE[employees.length % PALETTE.length],
  )
  const [vacations, setVacations] = useState<FormVacation[]>(
    employee?.vacations.map((v) => ({
      id: v.id,
      start: v.start,
      end: v.end,
    })) ?? [],
  )
  const [nrds, setNRDs] = useState<FormVacation[]>(
    employee?.nrd.map((n) => ({ id: n.id, start: n.start, end: n.end })) ?? [],
  )
  const [unpaidLeaves, setUnpaidLeaves] = useState<FormVacation[]>(
    (employee?.unpaidLeave ?? []).map((u) => ({ id: u.id, start: u.start, end: u.end })),
  )
  const [globalError, setGlobalError] = useState('')

  const addNrd = () => {
    setNRDs((prev) => [...prev, { id: nanoid(), start: today, end: today }])
  }

  const removeNrd = (id: string) => {
    setNRDs((prev) => prev.filter((n) => n.id !== id))
  }

  const updateNrdField = (id: string, field: 'start' | 'end', value: string) => {
    setNRDs((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        const updated = { ...n, [field]: value }
        let error: string | undefined
        if (updated.start > updated.end) {
          error = 'Дата начала должна быть не позже даты окончания'
        } else {
          const cv = vacations.find((v) => overlaps(updated, v))
          if (cv) error = `Пересекается с отпуском (${cv.start}–${cv.end})`
          else {
            const cu = unpaidLeaves.find((u) => overlaps(updated, u))
            if (cu) error = `Пересекается с отпуском за свой счёт (${cu.start}–${cu.end})`
          }
        }
        return { ...updated, error }
      }),
    )
  }

  const addUnpaidLeave = () => {
    setUnpaidLeaves((prev) => [...prev, { id: nanoid(), start: today, end: today }])
  }

  const removeUnpaidLeave = (id: string) => {
    setUnpaidLeaves((prev) => prev.filter((u) => u.id !== id))
  }

  const updateUnpaidLeaveField = (id: string, field: 'start' | 'end', value: string) => {
    setUnpaidLeaves((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u
        const updated = { ...u, [field]: value }
        let error: string | undefined
        if (updated.start > updated.end) {
          error = 'Дата начала должна быть не позже даты окончания'
        } else {
          const cv = vacations.find((v) => overlaps(updated, v))
          if (cv) error = `Пересекается с отпуском (${cv.start}–${cv.end})`
          else {
            const cn = nrds.find((n) => overlaps(updated, n))
            if (cn) error = `Пересекается с НРД (${cn.start}–${cn.end})`
          }
        }
        return { ...updated, error }
      }),
    )
  }

  const addVacation = () => {
    setVacations((prev) => [
      ...prev,
      { id: nanoid(), start: today, end: today },
    ])
  }

  const removeVacation = (id: string) => {
    setVacations((prev) => prev.filter((v) => v.id !== id))
  }

  const updateVacation = (
    id: string,
    field: 'start' | 'end',
    value: string,
  ) => {
    setVacations((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v
        const updated = { ...v, [field]: value }
        // Validate this interval
        const allVacations: VacationInterval[] = vacations.map((vv) => ({
          id: vv.id,
          start: vv.start,
          end: vv.end,
        }))
        const result = validateVacationInterval(
          { id, start: updated.start, end: updated.end },
          allVacations,
          specialDates,
        )
        let error = result.valid ? undefined : result.errors[0]
        if (!error) {
          const cn = nrds.find((n) => overlaps(updated, n))
          if (cn) error = `Пересекается с НРД (${cn.start}–${cn.end})`
        }
        if (!error) {
          const cu = unpaidLeaves.find((u) => overlaps(updated, u))
          if (cu) error = `Пересекается с отпуском за свой счёт (${cu.start}–${cu.end})`
        }
        return { ...updated, error }
      }),
    )
  }

  const validate = (): boolean => {
    let valid = true
    setGlobalError('')

    if (fullName.trim().length < 2) {
      setNameError('ФИО должно содержать не менее 2 символов')
      valid = false
    } else {
      setNameError('')
    }

    // Check all vacations
    const allVacations: VacationInterval[] = vacations.map((v) => ({
      id: v.id,
      start: v.start,
      end: v.end,
    }))

    const overlapResult = validateNoSelfOverlap(allVacations)
    if (!overlapResult.valid) {
      setGlobalError(overlapResult.errors[0])
      valid = false
    }

    for (const v of vacations) {
      const result = validateVacationInterval(
        { id: v.id, start: v.start, end: v.end },
        allVacations,
        specialDates,
      )
      if (!result.valid) {
        setVacations((prev) =>
          prev.map((vv) =>
            vv.id === v.id ? { ...vv, error: result.errors[0] } : vv,
          ),
        )
        valid = false
      }
    }

    // Check NRD
    const allNrd = nrds.map((n) => ({ id: n.id, start: n.start, end: n.end }))
    for (const n of nrds) {
      if (n.start > n.end) {
        setNRDs((prev) =>
          prev.map((nn) =>
            nn.id === n.id ? { ...nn, error: 'Дата начала должна быть не позже даты окончания' } : nn,
          ),
        )
        valid = false
      }
    }
    const nrdOverlap = validateNoSelfOverlap(allNrd)
    if (!nrdOverlap.valid) {
      setGlobalError((prev) => prev || nrdOverlap.errors[0])
      valid = false
    }

    // Check unpaid leave
    const allUnpaid = unpaidLeaves.map((u) => ({ id: u.id, start: u.start, end: u.end }))
    for (const u of unpaidLeaves) {
      if (u.start > u.end) {
        setUnpaidLeaves((prev) =>
          prev.map((uu) =>
            uu.id === u.id ? { ...uu, error: 'Дата начала должна быть не позже даты окончания' } : uu,
          ),
        )
        valid = false
        continue
      }
    }
    const unpaidOverlap = validateNoSelfOverlap(allUnpaid)
    if (!unpaidOverlap.valid) {
      setGlobalError((prev) => prev || unpaidOverlap.errors[0])
      valid = false
    }

    // Cross-type checks
    for (const n of nrds) {
      if (n.start > n.end) continue
      const cv = vacations.find((v) => overlaps(n, v))
      if (cv) {
        setNRDs((prev) =>
          prev.map((nn) => nn.id === n.id && !nn.error ? { ...nn, error: `Пересекается с отпуском (${cv.start}–${cv.end})` } : nn),
        )
        valid = false
      }
      const cu = unpaidLeaves.find((u) => overlaps(n, u))
      if (cu) {
        setNRDs((prev) =>
          prev.map((nn) => nn.id === n.id && !nn.error ? { ...nn, error: `Пересекается с отпуском за свой счёт (${cu.start}–${cu.end})` } : nn),
        )
        valid = false
      }
    }
    for (const u of unpaidLeaves) {
      if (u.start > u.end) continue
      const cv = vacations.find((v) => overlaps(u, v))
      if (cv) {
        setUnpaidLeaves((prev) =>
          prev.map((uu) => uu.id === u.id && !uu.error ? { ...uu, error: `Пересекается с отпуском (${cv.start}–${cv.end})` } : uu),
        )
        valid = false
      }
    }

    return valid
  }

  const handleSave = () => {
    if (!validate()) return

    const vacationIntervals: VacationInterval[] = vacations.map((v) => ({
      id: v.id,
      start: v.start,
      end: v.end,
    }))

    const nrdIntervals: NRD[] = nrds.map((n) => ({
      id: n.id,
      start: n.start,
      end: n.end,
    }))

    const unpaidLeaveIntervals: UnpaidLeave[] = unpaidLeaves.map((u) => ({
      id: u.id,
      start: u.start,
      end: u.end,
    }))

    const normOverride = parseInt(vacationDaysOverride)
    const parsedOverride = !isNaN(normOverride) && normOverride > 0 ? normOverride : undefined

    if (employee) {
      updateEmployee(employee.id, {
        fullName: fullName.trim(),
        position: position.trim() || undefined,
        vacations: vacationIntervals,
        nrd: nrdIntervals,
        unpaidLeave: unpaidLeaveIntervals,
        color,
        vacationDaysOverride: parsedOverride,
      })
    } else {
      addEmployee({
        fullName: fullName.trim(),
        position: position.trim() || undefined,
        vacations: vacationIntervals,
        nrd: nrdIntervals,
        unpaidLeave: unpaidLeaveIntervals,
        color,
        vacationDaysOverride: parsedOverride,
      })
    }

    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">ФИО *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (nameError) setNameError('')
              }}
              placeholder="Иванов Иван Иванович"
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label htmlFor="position">Должность</Label>
            <Input
              id="position"
              list="positions-list"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Инженер, Менеджер..."
            />
            {existingPositions.length > 0 && (
              <datalist id="positions-list">
                {existingPositions.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            )}
          </div>

          {/* Vacation norm override */}
          <div className="space-y-1.5">
            <Label htmlFor="vacNormOverride">Норма дней отпуска</Label>
            <div className="flex items-center gap-2">
              <input
                id="vacNormOverride"
                type="number"
                min={1}
                max={365}
                value={vacationDaysOverride}
                onChange={(e) => setVacationDaysOverride(e.target.value)}
                placeholder="По умолчанию (из настроек)"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p className="text-xs text-muted-foreground">Оставьте пустым для использования глобальной нормы</p>
          </div>

          {/* Bar color */}
          <div className="space-y-1.5">
            <Label>Цвет на диаграмме</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#000' : 'transparent',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-6 w-6 rounded cursor-pointer border border-border"
                title="Свой цвет"
              />
            </div>
          </div>

          {/* Vacations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Отпуска</Label>
              <Button variant="outline" size="sm" onClick={addVacation}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Добавить
              </Button>
            </div>

            {vacations.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Нет отпусков. Нажмите «Добавить».
              </p>
            )}

            {vacations.map((v, i) => (
              <div key={v.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">
                    {i + 1}.
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <DateRangePicker
                      start={v.start}
                      end={v.end}
                      onChange={(s, e) => {
                        updateVacation(v.id, 'start', s)
                        updateVacation(v.id, 'end', e)
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => removeVacation(v.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {v.error && (
                  <p className="text-xs text-destructive ml-6">{v.error}</p>
                )}
              </div>
            ))}
          </div>

          {/* NRD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>НРД</Label>
              <Button variant="outline" size="sm" onClick={addNrd}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Добавить
              </Button>
            </div>

            {nrds.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Нет периодов НРД. Нажмите «Добавить».
              </p>
            )}

            {nrds.map((n, i) => (
              <div key={n.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <div className="flex-1 flex items-center gap-2">
                    <DateRangePicker
                      start={n.start}
                      end={n.end}
                      onChange={(s, e) => {
                        updateNrdField(n.id, 'start', s)
                        updateNrdField(n.id, 'end', e)
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => removeNrd(n.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {n.error && (
                  <p className="text-xs text-destructive ml-6">{n.error}</p>
                )}
              </div>
            ))}
          </div>

          {/* Отпуск за свой счёт */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Отпуск за свой счёт</Label>
              <Button variant="outline" size="sm" onClick={addUnpaidLeave}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Добавить
              </Button>
            </div>

            {unpaidLeaves.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Нет периодов. Нажмите «Добавить».
              </p>
            )}

            {unpaidLeaves.map((u, i) => (
              <div key={u.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <div className="flex-1 flex items-center gap-2">
                    <DateRangePicker
                      start={u.start}
                      end={u.end}
                      onChange={(s, e) => {
                        updateUnpaidLeaveField(u.id, 'start', s)
                        updateUnpaidLeaveField(u.id, 'end', e)
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => removeUnpaidLeave(u.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {u.error && (
                  <p className="text-xs text-destructive ml-6">{u.error}</p>
                )}
              </div>
            ))}
          </div>

          {globalError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded p-2">
              {globalError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
