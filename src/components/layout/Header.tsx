import { Undo2, Redo2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useEmployeeStore, useSettingsStore } from '@/store'

export function Header() {
  const { undo, redo, past, future } = useEmployeeStore()
  const { planningYear, scale } = useSettingsStore()

  const scaleLabel = { day: 'День', week: 'Неделя', month: 'Месяц' }[scale]

  const handlePrint = () => {
    window.print()
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur flex-shrink-0 no-print">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold">Планировщик отпусков</h1>
        <span className="text-sm text-muted-foreground">{planningYear} · {scaleLabel}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={undo}
          disabled={past.length === 0}
          title="Отменить (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={redo}
          disabled={future.length === 0}
          title="Повторить (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrint}
          title="Печать"
        >
          <Printer className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
