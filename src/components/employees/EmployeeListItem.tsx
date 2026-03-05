import { AlertCircle, Copy, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useEmployeeStore } from '@/store'
import { useSpecialDateStore } from '@/store'
import type { Employee } from '@/types/employee'
import { intervalDays } from '@/utils/dateUtils'
import { checkConflicts } from '@/utils/validation'
import { cn } from '@/lib/utils'

interface Props {
  employee: Employee
  onEdit: (emp: Employee) => void
  style?: React.CSSProperties
}

export function EmployeeListItem({ employee, onEdit, style }: Props) {
  const { selected, setSelected, removeEmployee, duplicateEmployee } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const isSelected = selected === employee.id

  const totalVacDays = employee.vacations.reduce((sum, v) => sum + intervalDays(v.start, v.end), 0)
  const hasConflict = checkConflicts(employee.vacations, specialDates)

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
          <span className="text-[11px] text-muted-foreground flex-shrink-0">{totalVacDays} дн.</span>
          {employee.nrd.length > 0 && (
            <Badge variant="warning" className="text-[10px] px-1 py-0 flex-shrink-0">НРД</Badge>
          )}
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
            if (confirm(`Удалить сотрудника «${employee.fullName}»?`)) {
              removeEmployee(employee.id)
            }
          }}
          title="Удалить"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
