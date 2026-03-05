import { useRef, useState } from 'react'
import { Upload, FileJson, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { useEmployeeStore, useSpecialDateStore, useSettingsStore } from '@/store'
import {
  exportJSON,
  exportCSV,
  importJSON,
  importCSV,
  downloadFile,
  type CSVImportResult,
} from '@/utils/exportImport'
import type { Employee } from '@/types/employee'
import { nanoid } from 'nanoid'

type Status = { type: 'success' | 'error'; message: string } | null

export function ExportImportPanel() {
  const { employees } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const settings = useSettingsStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>(null)
  const [csvPreview, setCsvPreview] = useState<CSVImportResult | null>(null)
  const [pendingJSON, setPendingJSON] = useState<{ employees: Employee[]; specialDates: typeof specialDates } | null>(null)

  const { importEmployees } = useEmployeeStore()
  const { importSpecialDates } = useSpecialDateStore()
  const { applySettings } = useSettingsStore()

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message })
    setTimeout(() => setStatus(null), 4000)
  }

  const handleExportJSON = () => {
    try {
      const { planningYear, scale, theme, rowHeight, showWeekends, showNRD, showUnpaidLeave } = settings
      const json = exportJSON(employees, specialDates, { planningYear, scale, theme, rowHeight, showWeekends, showNRD, showUnpaidLeave })
      const filename = `vacation-schedule-${format(new Date(), 'yyyy-MM-dd')}.json`
      downloadFile(json, filename, 'application/json')
      showStatus('success', 'JSON успешно экспортирован')
    } catch (e) {
      showStatus('error', 'Ошибка экспорта')
    }
  }

  const handleExportCSV = () => {
    try {
      const csv = exportCSV(employees)
      const filename = `vacation-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`
      downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8')
      showStatus('success', 'CSV успешно экспортирован')
    } catch (e) {
      showStatus('error', 'Ошибка экспорта')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    e.target.value = ''

    if (file.name.endsWith('.json')) {
      try {
        const data = importJSON(text)
        setPendingJSON({ employees: data.employees, specialDates: data.specialDates })
        if (data.settings) applySettings(data.settings)
      } catch (err) {
        showStatus('error', err instanceof Error ? err.message : 'Ошибка импорта JSON')
      }
    } else if (file.name.endsWith('.csv')) {
      try {
        const result = importCSV(text)
        setCsvPreview(result)
      } catch (err) {
        showStatus('error', err instanceof Error ? err.message : 'Ошибка импорта CSV')
      }
    } else {
      showStatus('error', 'Поддерживаются только .json и .csv файлы')
    }
  }

  const confirmJSONImport = async () => {
    if (!pendingJSON) return
    try {
      await importEmployees(pendingJSON.employees)
      await importSpecialDates(pendingJSON.specialDates)
      setPendingJSON(null)
      showStatus('success', `Импортировано ${pendingJSON.employees.length} сотрудников`)
    } catch {
      showStatus('error', 'Ошибка сохранения данных')
    }
  }

  const confirmCSVImport = async () => {
    if (!csvPreview) return
    try {
      // Merge CSV into existing employees
      const updatedEmployees = [...employees]
      for (const match of csvPreview.matches) {
        const existing = updatedEmployees.find(
          (e) => e.fullName.toLowerCase().trim() === match.fullName.toLowerCase().trim(),
        )
        if (existing) {
          existing.vacations = match.vacations.map((v) => ({ ...v, id: nanoid() }))
          existing.nrd = match.nrd.map((n) => ({ ...n, id: nanoid() }))
          existing.unpaidLeave = match.unpaidLeave.map((u) => ({ ...u, id: nanoid() }))
        } else {
          updatedEmployees.push({
            id: nanoid(),
            fullName: match.fullName,
            vacations: match.vacations.map((v) => ({ ...v, id: nanoid() })),
            nrd: match.nrd.map((n) => ({ ...n, id: nanoid() })),
            unpaidLeave: match.unpaidLeave.map((u) => ({ ...u, id: nanoid() })),
            order: updatedEmployees.length,
            createdAt: new Date().toISOString(),
          })
        }
      }
      await importEmployees(updatedEmployees)
      setCsvPreview(null)
      showStatus('success', `Импортировано ${csvPreview.matches.length} сотрудников`)
    } catch {
      showStatus('error', 'Ошибка сохранения данных')
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Export */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Экспорт</h3>
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="justify-start gap-2" onClick={handleExportJSON}>
            <FileJson className="h-4 w-4 text-blue-500" />
            Скачать JSON (полные данные)
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={handleExportCSV}>
            <FileText className="h-4 w-4 text-green-500" />
            Скачать CSV (отпуска)
          </Button>
        </div>
      </section>

      {/* Import */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Импорт</h3>
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file && fileInputRef.current) {
              const dt = new DataTransfer()
              dt.items.add(file)
              fileInputRef.current.files = dt.files
              fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
            }
          }}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Перетащите файл или кликните для выбора
          </p>
          <p className="text-xs text-muted-foreground mt-1">Поддерживается .json и .csv</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={handleFileSelect}
        />
      </section>

      {/* JSON import confirm */}
      {pendingJSON && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md space-y-3">
          <p className="text-sm font-medium">
            Импортировать {pendingJSON.employees.length} сотрудников?
          </p>
          <p className="text-xs text-muted-foreground">
            Все текущие данные сотрудников будут заменены.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmJSONImport}>Импортировать</Button>
            <Button size="sm" variant="outline" onClick={() => setPendingJSON(null)}>Отмена</Button>
          </div>
        </div>
      )}

      {/* CSV import confirm */}
      {csvPreview && (
        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md space-y-3">
          <p className="text-sm font-medium">
            Найдено {csvPreview.matches.length} сотрудников в CSV
          </p>
          {csvPreview.skippedRows.length > 0 && (
            <p className="text-xs text-amber-600">
              Пропущено строк: {csvPreview.skippedRows.length}
            </p>
          )}
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {csvPreview.matches.slice(0, 10).map((m) => (
              <p key={m.fullName} className="text-xs">{m.fullName} ({m.vacations.length} отпусков)</p>
            ))}
            {csvPreview.matches.length > 10 && (
              <p className="text-xs text-muted-foreground">... и ещё {csvPreview.matches.length - 10}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmCSVImport}>Применить</Button>
            <Button size="sm" variant="outline" onClick={() => setCsvPreview(null)}>Отмена</Button>
          </div>
        </div>
      )}

      {/* Status */}
      {status && (
        <div className={`flex items-center gap-2 p-2 rounded text-sm ${
          status.type === 'success'
            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
        }`}>
          {status.type === 'success'
            ? <CheckCircle className="h-4 w-4" />
            : <AlertCircle className="h-4 w-4" />}
          {status.message}
        </div>
      )}
    </div>
  )
}
