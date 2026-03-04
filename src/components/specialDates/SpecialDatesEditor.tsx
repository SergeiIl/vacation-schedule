import { useState } from 'react'
import { Plus, Trash2, Pencil, AlertTriangle } from 'lucide-react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { useSpecialDateStore } from '@/store'
import type { SpecialDate } from '@/types/specialDate'
import { format } from 'date-fns'

const today = format(new Date(), 'yyyy-MM-dd')

interface FormState {
  id?: string
  name: string
  start: string
  end: string
}

const EMPTY_FORM: FormState = { name: '', start: today, end: today }

function SpecialDateForm({
  initial,
  onSave,
  onCancel,
  showWarning,
}: {
  initial: FormState
  onSave: (data: FormState) => void
  onCancel: () => void
  showWarning?: boolean
}) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<string[]>([])

  const validate = () => {
    const e: string[] = []
    if (!form.name.trim()) e.push('Введите название')
    if (form.start > form.end) e.push('Дата начала должна быть не позже даты окончания')
    setErrors(e)
    return e.length === 0
  }

  const days = form.start && form.end
    ? differenceInCalendarDays(parseISO(form.end), parseISO(form.start)) + 1
    : 0

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
      <div className="space-y-1">
        <Label>Название *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Например: Новый год"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <Label>Начало</Label>
          <Input
            type="date"
            value={form.start}
            onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label>Конец</Label>
          <Input
            type="date"
            value={form.end}
            min={form.start}
            onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
          />
        </div>
      </div>
      {showWarning && days > 90 && (
        <div className="flex items-center gap-1.5 text-amber-600 text-xs">
          <AlertTriangle className="h-3.5 w-3.5" />
          Запретный период длиной {days} дн. — очень длинный
        </div>
      )}
      {errors.map((err) => (
        <p key={err} className="text-xs text-destructive">{err}</p>
      ))}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { if (validate()) onSave(form) }}>
          Сохранить
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  )
}

export function SpecialDatesEditor() {
  const { specialDates, addSpecialDate, updateSpecialDate, removeSpecialDate } =
    useSpecialDateStore()

  const [addingType, setAddingType] = useState<'holiday' | 'forbidden' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const holidays = specialDates.filter((sd) => sd.type === 'holiday')
  const forbidden = specialDates.filter((sd) => sd.type === 'forbidden')

  const handleSave = (type: 'holiday' | 'forbidden', form: FormState) => {
    if (form.id) {
      updateSpecialDate(form.id, { name: form.name, start: form.start, end: form.end })
      setEditingId(null)
    } else {
      addSpecialDate({ type, name: form.name, start: form.start, end: form.end || null })
      setAddingType(null)
    }
  }

  const getEditForm = (sd: SpecialDate): FormState => ({
    id: sd.id,
    name: sd.name,
    start: sd.start,
    end: sd.end ?? sd.start,
  })

  const renderList = (items: SpecialDate[], type: 'holiday' | 'forbidden') => (
    <div className="space-y-2">
      {items.length === 0 && !addingType && (
        <p className="text-sm text-muted-foreground">Нет записей. Добавьте первую.</p>
      )}

      {items.map((sd) =>
        editingId === sd.id ? (
          <SpecialDateForm
            key={sd.id}
            initial={getEditForm(sd)}
            onSave={(form) => handleSave(type, form)}
            onCancel={() => setEditingId(null)}
            showWarning={type === 'forbidden'}
          />
        ) : (
          <div
            key={sd.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded border border-border/50 hover:bg-accent/30 group"
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{sd.name}</span>
              <div className="text-xs text-muted-foreground">
                {sd.start}{sd.end && sd.end !== sd.start ? ` – ${sd.end}` : ''}
              </div>
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditingId(sd.id)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => removeSpecialDate(sd.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ),
      )}

      {addingType === type && (
        <SpecialDateForm
          initial={EMPTY_FORM}
          onSave={(form) => handleSave(type, form)}
          onCancel={() => setAddingType(null)}
          showWarning={type === 'forbidden'}
        />
      )}

      {addingType !== type && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setEditingId(null)
            setAddingType(type)
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Добавить
        </Button>
      )}
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-3">
      <Tabs defaultValue="holidays">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="holidays" className="flex-1">
            Праздники{' '}
            {holidays.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5">
                {holidays.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forbidden" className="flex-1">
            Запретные{' '}
            {forbidden.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5">
                {forbidden.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="holidays">{renderList(holidays, 'holiday')}</TabsContent>
        <TabsContent value="forbidden">{renderList(forbidden, 'forbidden')}</TabsContent>
      </Tabs>
    </div>
  )
}
