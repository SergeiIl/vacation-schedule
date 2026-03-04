import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { intervalDays } from '@/utils/dateUtils'

interface Props {
  startDate: Date
  endDate: Date
  label?: string
  x: number
  y: number
  isValid?: boolean
}

export function GanttTooltip({ startDate, endDate, label, x, y, isValid = true }: Props) {
  const start = format(startDate, 'd MMM', { locale: ru })
  const end = format(endDate, 'd MMM', { locale: ru })
  const days = intervalDays(
    format(startDate, 'yyyy-MM-dd'),
    format(endDate, 'yyyy-MM-dd'),
  )

  return (
    <div
      className={`fixed z-50 pointer-events-none px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap ${
        isValid
          ? 'bg-popover text-popover-foreground border border-border'
          : 'bg-destructive text-destructive-foreground'
      }`}
      style={{ left: x + 12, top: y - 8 }}
    >
      {label && <div className="font-semibold">{label}</div>}
      <div>
        {start} – {end} ({days} дн.)
      </div>
      {!isValid && <div className="font-semibold">Недопустимый период</div>}
    </div>
  )
}
