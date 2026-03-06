import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEmployeeStore } from '@/store'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { BarContextMenuContext, type BarType } from './BarContextMenuContext'

interface MenuState {
  barId: string
  type: BarType
  x: number
  y: number
}

interface EditState {
  employeeId: string
  intervalId: string
  type: BarType
  start: string
  end: string
}

export function BarContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const {
    employees,
    removeVacation, addVacation, updateVacation,
    removeNRD, addNRD, updateNRD,
    removeUnpaidLeave, addUnpaidLeave, updateUnpaidLeave,
  } = useEmployeeStore()

  const openMenu = useCallback((barId: string, type: BarType, x: number, y: number) => {
    setMenu({ barId, type, x, y })
  }, [])

  const closeMenu = useCallback(() => setMenu(null), [])

  useEffect(() => {
    if (!menu) return
    const onMouse = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu() }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu, closeMenu])

  const getInterval = (employeeId: string, intervalId: string, type: BarType) => {
    const emp = employees.find((e) => e.id === employeeId)
    if (!emp) return null
    if (type === 'vacation') return emp.vacations.find((v) => v.id === intervalId) ?? null
    if (type === 'nrd') return emp.nrd.find((n) => n.id === intervalId) ?? null
    return emp.unpaidLeave.find((u) => u.id === intervalId) ?? null
  }

  const handleDelete = () => {
    if (!menu) return
    const [employeeId, intervalId] = menu.barId.split(':')
    if (menu.type === 'vacation') removeVacation(employeeId, intervalId)
    else if (menu.type === 'nrd') removeNRD(employeeId, intervalId)
    else removeUnpaidLeave(employeeId, intervalId)
    closeMenu()
  }

  const handleDuplicate = () => {
    if (!menu) return
    const [employeeId, intervalId] = menu.barId.split(':')
    const interval = getInterval(employeeId, intervalId, menu.type)
    if (!interval) { closeMenu(); return }
    if (menu.type === 'vacation') addVacation(employeeId, { start: interval.start, end: interval.end })
    else if (menu.type === 'nrd') addNRD(employeeId, { start: interval.start, end: interval.end })
    else addUnpaidLeave(employeeId, { start: interval.start, end: interval.end })
    closeMenu()
  }

  const handleEdit = () => {
    if (!menu) return
    const [employeeId, intervalId] = menu.barId.split(':')
    const interval = getInterval(employeeId, intervalId, menu.type)
    if (!interval) { closeMenu(); return }
    setEditState({ employeeId, intervalId, type: menu.type, start: interval.start, end: interval.end })
    closeMenu()
  }

  const handleEditSave = () => {
    if (!editState) return
    const { employeeId, intervalId, type, start, end } = editState
    if (!start || !end || start > end) return
    if (type === 'vacation') updateVacation(employeeId, intervalId, { start, end })
    else if (type === 'nrd') updateNRD(employeeId, intervalId, { start, end })
    else updateUnpaidLeave(employeeId, intervalId, { start, end })
    setEditState(null)
  }

  const typeLabel = (type: BarType) => {
    if (type === 'vacation') return 'отпуска'
    if (type === 'nrd') return 'нерабочего дня'
    return 'отпуска за свой счёт'
  }

  const menuX = menu ? Math.min(menu.x, window.innerWidth - 190) : 0
  const menuY = menu ? Math.min(menu.y, window.innerHeight - 120) : 0

  return (
    <BarContextMenuContext.Provider value={{ openMenu }}>
      {children}

      {menu && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] bg-popover border border-border rounded-md shadow-lg py-1 min-w-[180px]"
          style={{ left: menuX, top: menuY }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={handleEdit}
          >
            Редактировать
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={handleDuplicate}
          >
            Дублировать период
          </button>
          <div className="my-1 border-t border-border" />
          <button
            className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            Удалить
          </button>
        </div>,
        document.body,
      )}

      {editState && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-popover border border-border rounded-lg shadow-xl p-4 w-72">
            <h3 className="font-semibold text-sm mb-3">
              Редактировать период {typeLabel(editState.type)}
            </h3>
            <DateRangePicker
              start={editState.start}
              end={editState.end}
              onChange={(start, end) => setEditState((s) => s ? { ...s, start, end } : null)}
              className="w-full"
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-3 py-1 text-sm rounded border border-border hover:bg-accent"
                onClick={() => setEditState(null)}
              >
                Отмена
              </button>
              <button
                className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                disabled={!editState.start || !editState.end}
                onClick={handleEditSave}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </BarContextMenuContext.Provider>
  )
}
