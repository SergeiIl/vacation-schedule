import { useEffect } from 'react'
import { nanoid } from 'nanoid'
import { AppShell } from '@/components/layout/AppShell'
import { useEmployeeStore, useSpecialDateStore, useSettingsStore, applyThemeToDOM } from '@/store'
import { getAllEmployees, getAllSpecialDates, getSettings } from '@/db/indexedDB'
import { useVacationRuleCheck } from '@/hooks/useVacationRuleCheck'
import type { Employee } from '@/types/employee'

function migrateEmployee(raw: unknown): Employee {
  const e = raw as Record<string, unknown>
  let nrd = e.nrd
  if (nrd === null || nrd === undefined) {
    nrd = []
  } else if (!Array.isArray(nrd)) {
    const old = nrd as { start: string; end: string }
    nrd = [{ id: nanoid(), start: old.start, end: old.end }]
  } else {
    nrd = (nrd as Record<string, unknown>[]).map((n) =>
      n.id ? n : { ...n, id: nanoid() },
    )
  }
  return { ...e, nrd } as Employee
}

export default function App() {
  const { setEmployees } = useEmployeeStore()
  const { setSpecialDates } = useSpecialDateStore()
  const { applySettings, theme } = useSettingsStore()

  useVacationRuleCheck()

  useEffect(() => {
    async function bootstrap() {
      try {
        const [employees, specialDates, settings] = await Promise.all([
          getAllEmployees(),
          getAllSpecialDates(),
          getSettings(),
        ])
        setEmployees(employees.map(migrateEmployee))
        setSpecialDates(specialDates)
        if (settings) {
          applySettings(settings)
        }
      } catch (err) {
        console.error('Failed to load data from IndexedDB:', err)
      }
    }
    bootstrap()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme on mount
  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        useEmployeeStore.getState().undo()
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault()
        useEmployeeStore.getState().redo()
      }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        useEmployeeStore.getState().redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return <AppShell />
}
