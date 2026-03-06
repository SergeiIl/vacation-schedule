import { useState } from 'react'
import { AlertCircle, Copy, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { useEmployeeStore } from '@/store'
import { useSpecialDateStore } from '@/store'
import { useSettingsStore } from '@/store'
import type { Employee } from '@/types/employee'
import { intervalDays } from '@/utils/dateUtils'
import { checkConflicts } from '@/utils/validation'
import { cn } from '@/lib/utils'

const SKIP_KEY = 'confirm-delete-employee-skip'

interface Props {
  employee: Employee
  onEdit: (emp: Employee) => void
  style?: React.CSSProperties
}

export function EmployeeListItem({ employee, onEdit, style }: Props) {
  const { selected, setSelected, removeEmployee, duplicateEmployee } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const { vacationDaysNorm } = useSettingsStore()
  const isSelected = selected === employee.id
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [skipNextTime, setSkipNextTime] = useState(false)

  const totalVacDays = employee.vacations.reduce((sum, v) => sum + intervalDays(v.start, v.end), 0)
  const hasConflict = checkConflicts(employee.vacations, specialDates)
  const norm = employee.vacationDaysOverride ?? vacationDaysNorm
  const remaining = norm - totalVacDays
  const pct = Math.min(100, Math.round((totalVacDays / norm) * 100))

  return (
    <div
      style={style}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors group',
        isSelected && 'bg-accent',
      )}
      onClick={() => setSelected(isSelected ? null : employee.id)}
      onDoubleClick={() => onEdit(employee)}
    >
      {employee.color && (
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: employee.color }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 leading-tight">
          {hasConflict && <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />}
          <span className="text-sm font-medium truncate">{employee.fullName}</span>
        </div>
        <div className="flex items-center gap-1 leading-tight">
          {employee.position && (
            <span className="text-[11px] text-muted-foreground truncate">{employee.position}</span>
          )}
          {employee.position && <span className="text-[10px] text-muted-foreground/50">·</span>}
          <span
            className={cn('text-[11px] flex-shrink-0', remaining < 0 ? 'text-destructive font-medium' : 'text-muted-foreground')}
            title={`Использовано: ${totalVacDays} / ${norm} дн. | Остаток: ${remaining}`}
          >
            {totalVacDays}/{norm} дн.
          </span>
          {employee.nrd.length > 0 && (
            <Badge variant="warning" className="text-[10px] px-1 py-0 flex-shrink-0">НРД</Badge>
          )}
          {employee.unpaidLeave.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 flex-shrink-0">ЗСС</Badge>
          )}
        </div>
        <div className="w-full h-1 rounded-full bg-muted overflow-hidden mt-0.5">
          <div
            className={cn('h-full rounded-full transition-all', remaining < 0 ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(employee)
          }}
          title="Редактировать"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            duplicateEmployee(employee.id)
          }}
          title="Дублировать"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            if (localStorage.getItem(SKIP_KEY) === '1') {
              removeEmployee(employee.id)
            } else {
              setSkipNextTime(false)
              setConfirmOpen(true)
            }
          }}
          title="Удалить"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Удалить сотрудника</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить{' '}
              <span className="font-medium text-foreground">«{employee.fullName}»</span>?
              Это действие можно отменить через Ctrl+Z.
            </DialogDescription>
          </DialogHeader>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipNextTime}
              onChange={(e) => setSkipNextTime(e.target.checked)}
              className="accent-primary"
            />
            Больше не спрашивать
          </label>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (skipNextTime) localStorage.setItem(SKIP_KEY, '1')
                setConfirmOpen(false)
                removeEmployee(employee.id)
              }}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
