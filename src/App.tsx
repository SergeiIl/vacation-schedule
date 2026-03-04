import { useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useEmployeeStore, useSpecialDateStore, useSettingsStore, applyThemeToDOM } from '@/store'
import { getAllEmployees, getAllSpecialDates, getSettings } from '@/db/indexedDB'

export default function App() {
  const { setEmployees } = useEmployeeStore()
  const { setSpecialDates } = useSpecialDateStore()
  const { applySettings, theme } = useSettingsStore()

  useEffect(() => {
    async function bootstrap() {
      try {
        const [employees, specialDates, settings] = await Promise.all([
          getAllEmployees(),
          getAllSpecialDates(),
          getSettings(),
        ])
        setEmployees(employees)
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
