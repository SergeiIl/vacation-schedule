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
import { Switch } from '@/components/ui/Switch'
import { useEmployeeStore } from '@/store'
import { useSpecialDateStore } from '@/store'
import type { Employee, VacationInterval, NRD } from '@/types/employee'
import { validateVacationInterval, validateNoSelfOverlap } from '@/utils/validation'

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
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

export function AddEmployeeModal({ employee, onClose }: Props) {
  const { employees, addEmployee, updateEmployee } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()

  const existingPositions = [...new Set(employees.map((e) => e.position).filter(Boolean))] as string[]

  const [fullName, setFullName] = useState(employee?.fullName ?? '')
  const [nameError, setNameError] = useState('')
  const [position, setPosition] = useState(employee?.position ?? '')
  const [color, setColor] = useState(
    employee?.color ?? PALETTE[employees.length % PALETTE.length],
  )
  const [vacations, setVacations] = useState<FormVacation[]>(
    employee?.vacations.map((v) => ({ id: v.id, start: v.start, end: v.end })) ?? [],
  )
  const [hasNRD, setHasNRD] = useState(employee?.nrd != null)
  const [nrd, setNRD] = useState<{ start: string; end: string }>(
    employee?.nrd ?? { start: today, end: today },
  )
  const [globalError, setGlobalError] = useState('')

  const addVacation = () => {
    setVacations((prev) => [...prev, { id: nanoid(), start: today, end: today }])
  }

  const removeVacation = (id: string) => {
    setVacations((prev) => prev.filter((v) => v.id !== id))
  }

  const updateVacation = (id: string, field: 'start' | 'end', value: string) => {
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
        return { ...updated, error: result.valid ? undefined : result.errors[0] }
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
          prev.map((vv) => (vv.id === v.id ? { ...vv, error: result.errors[0] } : vv)),
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

    const nrdValue: NRD | null = hasNRD ? { start: nrd.start, end: nrd.end } : null

    if (employee) {
      updateEmployee(employee.id, {
        fullName: fullName.trim(),
        position: position.trim() || undefined,
        vacations: vacationIntervals,
        nrd: nrdValue,
        color,
      })
    } else {
      addEmployee({
        fullName: fullName.trim(),
        position: position.trim() || undefined,
        vacations: vacationIntervals,
        nrd: nrdValue,
        color,
      })
    }

    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</DialogTitle>
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
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
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
              <p className="text-sm text-muted-foreground">Нет отпусков. Нажмите «Добавить».</p>
            )}

            {vacations.map((v, i) => (
              <div key={v.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type="date"
                      value={v.start}
                      onChange={(e) => updateVacation(v.id, 'start', e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">–</span>
                    <Input
                      type="date"
                      value={v.end}
                      min={v.start}
                      onChange={(e) => updateVacation(v.id, 'end', e.target.value)}
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
                {v.error && <p className="text-xs text-destructive ml-6">{v.error}</p>}
              </div>
            ))}
          </div>

          {/* NRD */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id="hasNRD"
                checked={hasNRD}
                onCheckedChange={setHasNRD}
              />
              <Label htmlFor="hasNRD">Нерабочие дни (НРД)</Label>
            </div>
            {hasNRD && (
              <div className="flex items-center gap-2 ml-8">
                <Input
                  type="date"
                  value={nrd.start}
                  onChange={(e) => setNRD((n) => ({ ...n, start: e.target.value }))}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">–</span>
                <Input
                  type="date"
                  value={nrd.end}
                  min={nrd.start}
                  onChange={(e) => setNRD((n) => ({ ...n, end: e.target.value }))}
                  className="flex-1"
                />
              </div>
            )}
          </div>

          {globalError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{globalError}</p>
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
