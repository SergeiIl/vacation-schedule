import { useState, useRef, useCallback } from 'react'
import {
  Calendar,
  Download,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Header } from './Header'
import { EmployeeList } from '@/components/employees/EmployeeList'
import { GanttChart } from '@/components/gantt/GanttChart'
import { SpecialDatesEditor } from '@/components/specialDates/SpecialDatesEditor'
import { ExportImportPanel } from '@/components/export/ExportImportPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { Button } from '@/components/ui/Button'
import { ToastContainer } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

type RightPanel = 'special' | 'export' | 'settings'

const RIGHT_PANELS: { id: RightPanel; icon: React.ReactNode; label: string }[] =
  [
    {
      id: 'settings',
      icon: <Settings2 className="h-4 w-4" />,
      label: 'Настройки',
    },
    {
      id: 'special',
      icon: <Calendar className="h-4 w-4" />,
      label: 'Особые даты',
    },
    {
      id: 'export',
      icon: <Download className="h-4 w-4" />,
      label: 'Экспорт/Импорт',
    },
  ]

const LEFT_WIDTH_DEFAULT = 280
const LEFT_WIDTH_MIN = 150
const LEFT_WIDTH_MAX = 600
const RIGHT_WIDTH = 320

function getStoredLeftWidth(): number {
  const v = localStorage.getItem('leftPanelWidth')
  return v ? Math.max(LEFT_WIDTH_MIN, Math.min(LEFT_WIDTH_MAX, Number(v))) : LEFT_WIDTH_DEFAULT
}

export function AppShell() {
  const [rightPanel, setRightPanel] = useState<RightPanel | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [leftWidth, setLeftWidth] = useState(getStoredLeftWidth)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const toggleRight = (panel: RightPanel) => {
    setRightPanel((p) => (p === panel ? null : panel))
  }

  const onDividerPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (leftCollapsed) return
    // Single click to collapse/expand — handled on pointerup if no drag occurred
    dragging.current = false
    startX.current = e.clientX
    startWidth.current = leftWidth
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX.current
      if (!dragging.current && Math.abs(delta) > 3) dragging.current = true
      if (!dragging.current) return
      const newWidth = Math.max(LEFT_WIDTH_MIN, Math.min(LEFT_WIDTH_MAX, startWidth.current + delta))
      setLeftWidth(newWidth)
      localStorage.setItem('leftPanelWidth', String(newWidth))
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (!dragging.current) {
        setLeftCollapsed(true)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [leftCollapsed, leftWidth])

  return (
    <div className="flex flex-col h-screen bg-background">
      <ToastContainer />
      <div className="no-print"><Header /></div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div
          className={cn(
            'no-print flex flex-col border-r border-border flex-shrink-0',
            leftCollapsed ? 'overflow-hidden' : '',
          )}
          style={{ width: leftCollapsed ? 0 : leftWidth, transition: leftCollapsed ? 'width 0.2s' : 'none' }}
        >
          <EmployeeList />
        </div>

        {/* Resize / collapse divider */}
        <div
          className="no-print flex-shrink-0 flex items-center justify-center w-4 border-r border-border bg-muted/30 hover:bg-primary/10 transition-colors group"
          style={{ cursor: leftCollapsed ? 'e-resize' : 'col-resize' }}
          onPointerDown={leftCollapsed ? undefined : onDividerPointerDown}
          title={leftCollapsed ? 'Показать список' : 'Перетащить для изменения ширины / клик для скрытия'}
        >
          {leftCollapsed ? (
            <button
              className="flex items-center justify-center w-full h-full"
              onClick={() => setLeftCollapsed(false)}
            >
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </button>
          ) : (
            <ChevronLeft className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {/* Main: Gantt chart */}
        <div className="print-gantt flex-1 overflow-hidden p-2">
          <GanttChart />
        </div>

        {/* Right panel tabs */}
        <div className="no-print flex flex-col border-l border-border flex-shrink-0">
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
            className="no-print border-l border-border flex-shrink-0 overflow-hidden"
            style={{ width: RIGHT_WIDTH }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-semibold">
                {RIGHT_PANELS.find((p) => p.id === rightPanel)?.label}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRightPanel(null)}>
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
