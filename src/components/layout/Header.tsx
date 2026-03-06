import {
  Undo2,
  Redo2,
  ImageIcon,
  Download,
  Sun,
  Moon,
  Monitor,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/Button'
import {
  useEmployeeStore,
  useSpecialDateStore,
  useSettingsStore,
} from '@/store'
import { exportGantt, type ExportFormat } from '@/utils/ganttExport'
import { SCALES, type Theme } from '@/types/settings'

const THEMES: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun className="h-4 w-4" />, label: 'Светлая тема' },
  { value: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Тёмная тема' },
  {
    value: 'system',
    icon: <Monitor className="h-4 w-4" />,
    label: 'Системная тема',
  },
]

const LS_SIDEBAR_KEY = 'gantt-sidebar-width'
const DEFAULT_SIDEBAR_WIDTH = 200

function getSidebarWidth(): number {
  try {
    const v = localStorage.getItem(LS_SIDEBAR_KEY)
    if (v) {
      const n = Number(v)
      if (n >= 100 && n <= 400) return n
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SIDEBAR_WIDTH
}

export function Header() {
  const { undo, redo, past, future, filteredEmployees } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const {
    planningYear,
    scale,
    rowHeight,
    showWeekends,
    showNRD,
    showUnpaidLeave,
    maxConcurrentVacations,
    theme,
    setTheme,
    setYear,
    setScale,
  } = useSettingsStore()

  const handleExport = (fmt: ExportFormat) => {
    exportGantt(
      {
        employees: filteredEmployees(specialDates),
        specialDates,
        planningYear,
        scale,
        rowHeight,
        sidebarWidth: getSidebarWidth(),
        showWeekends,
        showNRD,
        showUnpaidLeave,
        maxConcurrentVacations,
      },
      fmt,
    )
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur flex-shrink-0 no-print">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold">Планировщик отпусков</h1>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setYear(Math.max(2020, planningYear - 1))}
          title="Предыдущий год"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="font-mono text-sm font-semibold w-10 text-center select-none">
          {planningYear}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setYear(Math.min(2035, planningYear + 1))}
          title="Следующий год"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-sm"
              title="Масштаб диаграммы"
            >
              {SCALES.find((s) => s.value === scale)?.label}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[120px] rounded-md border border-border bg-popover p-1 shadow-md text-sm"
              sideOffset={4}
              align="center"
            >
              {SCALES.map((s) => (
                <DropdownMenu.Item
                  key={s.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground"
                  onSelect={() => setScale(s.value)}
                >
                  {s.label}
                  {scale === s.value && (
                    <Check className="h-3.5 w-3.5 ml-auto" />
                  )}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <div className="w-px h-5 bg-border mx-1" />
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
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Тема оформления"
            >
              {theme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : theme === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[150px] rounded-md border border-border bg-popover p-1 shadow-md text-sm"
              sideOffset={4}
              align="end"
            >
              {THEMES.map((t) => (
                <DropdownMenu.Item
                  key={t.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground"
                  onSelect={() => setTheme(t.value)}
                >
                  {t.icon}
                  {t.label}
                  {theme === t.value && (
                    <Check className="h-3.5 w-3.5 ml-auto" />
                  )}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <div className="w-px h-5 bg-border mx-1" />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Экспорт диаграммы"
            >
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[140px] rounded-md border border-border bg-popover p-1 shadow-md text-sm"
              sideOffset={4}
              align="end"
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground"
                onSelect={() => handleExport('png')}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Сохранить PNG
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground"
                onSelect={() => handleExport('jpeg')}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Сохранить JPEG
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
