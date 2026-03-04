import { useState } from 'react'
import { Calendar, Download, Settings2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Header } from './Header'
import { EmployeeList } from '@/components/employees/EmployeeList'
import { GanttChart } from '@/components/gantt/GanttChart'
import { SpecialDatesEditor } from '@/components/specialDates/SpecialDatesEditor'
import { ExportImportPanel } from '@/components/export/ExportImportPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type RightPanel = 'special' | 'export' | 'settings'

const RIGHT_PANELS: { id: RightPanel; icon: React.ReactNode; label: string }[] = [
  { id: 'special', icon: <Calendar className="h-4 w-4" />, label: 'Особые даты' },
  { id: 'export', icon: <Download className="h-4 w-4" />, label: 'Экспорт/Импорт' },
  { id: 'settings', icon: <Settings2 className="h-4 w-4" />, label: 'Настройки' },
]

const LEFT_WIDTH = 220
const RIGHT_WIDTH = 280

export function AppShell() {
  const [rightPanel, setRightPanel] = useState<RightPanel | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)

  const toggleRight = (panel: RightPanel) => {
    setRightPanel((p) => (p === panel ? null : panel))
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: employee list */}
        <div
          className={cn(
            'flex flex-col border-r border-border flex-shrink-0 transition-all duration-200',
            leftCollapsed ? 'w-0 overflow-hidden' : '',
          )}
          style={{ width: leftCollapsed ? 0 : LEFT_WIDTH }}
        >
          <EmployeeList />
        </div>

        {/* Collapse toggle */}
        <button
          className="flex-shrink-0 flex items-center justify-center w-4 bg-muted/30 border-r border-border hover:bg-muted/60 transition-colors"
          onClick={() => setLeftCollapsed((v) => !v)}
          title={leftCollapsed ? 'Показать список' : 'Скрыть список'}
        >
          {leftCollapsed
            ? <ChevronRight className="h-3 w-3 text-muted-foreground" />
            : <ChevronLeft className="h-3 w-3 text-muted-foreground" />}
        </button>

        {/* Main: Gantt chart */}
        <div className="flex-1 overflow-hidden p-2">
          <GanttChart />
        </div>

        {/* Right panel tabs */}
        <div className="flex flex-col border-l border-border flex-shrink-0">
          <div className="flex flex-col gap-1 p-1 border-b border-border">
            {RIGHT_PANELS.map((panel) => (
              <Button
                key={panel.id}
                variant={rightPanel === panel.id ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => toggleRight(panel.id)}
                title={panel.label}
              >
                {panel.icon}
              </Button>
            ))}
          </div>
        </div>

        {/* Right panel content */}
        {rightPanel && (
          <div
            className="border-l border-border flex-shrink-0 overflow-hidden"
            style={{ width: RIGHT_WIDTH }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-semibold">
                {RIGHT_PANELS.find((p) => p.id === rightPanel)?.label}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setRightPanel(null)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="h-[calc(100%-41px)] overflow-hidden">
              {rightPanel === 'special' && <SpecialDatesEditor />}
              {rightPanel === 'export' && <ExportImportPanel />}
              {rightPanel === 'settings' && <SettingsPanel />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
