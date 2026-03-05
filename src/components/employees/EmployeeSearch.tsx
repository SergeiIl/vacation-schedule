import { useMemo } from 'react'
import { Search, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useEmployeeStore } from '@/store'

// Default vacation bar color (matches .gantt-bar-vacation)
const DEFAULT_COLOR = ''

function ColorSwatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  const bg = color || '#3b82f6'
  return (
    <button
      type="button"
      onClick={onClick}
      title={color || 'По умолчанию'}
      className="rounded-full transition-all focus:outline-none"
      style={{
        width: 20,
        height: 20,
        backgroundColor: bg,
        outline: active ? `2px solid ${bg}` : '2px solid transparent',
        outlineOffset: 2,
        opacity: active ? 1 : 0.55,
      }}
    />
  )
}

export function EmployeeSearch() {
  const {
    employees,
    searchQuery,
    filterNRD,
    filterActiveVacation,
    filterPositions,
    filterColor,
    setSearchQuery,
    setFilterNRD,
    setFilterActiveVacation,
    setFilterPositions,
    setFilterColor,
  } = useEmployeeStore()

  const positions = useMemo(
    () => [...new Set(employees.map((e) => e.position).filter(Boolean))].sort() as string[],
    [employees],
  )

  const colors = useMemo(() => {
    const seen = new Set<string>()
    for (const e of employees) {
      seen.add(e.color ?? DEFAULT_COLOR)
    }
    // default first, then custom sorted
    const result: string[] = []
    if (seen.has(DEFAULT_COLOR)) result.push(DEFAULT_COLOR)
    const custom = [...seen].filter((c) => c !== DEFAULT_COLOR).sort()
    return [...result, ...custom]
  }, [employees])

  const isAllActive =
    filterNRD === null && !filterActiveVacation && filterPositions.length === 0 && filterColor === null

  const togglePosition = (p: string) => {
    setFilterPositions(
      filterPositions.includes(p) ? filterPositions.filter((x) => x !== p) : [...filterPositions, p],
    )
  }

  return (
    <div className="flex-shrink-0 flex flex-col gap-2 p-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по ФИО..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge
          variant={isAllActive ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => {
            setFilterNRD(null)
            setFilterActiveVacation(false)
            setFilterPositions([])
            setFilterColor(null)
          }}
        >
          Все
        </Badge>
        <Badge
          variant={filterNRD === true ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilterNRD(filterNRD === true ? null : true)}
        >
          Есть НРД
        </Badge>
        <Badge
          variant={filterActiveVacation ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilterActiveVacation(!filterActiveVacation)}
        >
          В отпуске
        </Badge>
      </div>

      {colors.length > 1 && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide px-0.5">
            Цвет отпуска
          </span>
          <div className="flex flex-wrap gap-1.5 px-0.5">
            {colors.map((c) => (
              <ColorSwatch
                key={c || '__default__'}
                color={c}
                active={filterColor === c}
                onClick={() => setFilterColor(filterColor === c ? null : c)}
              />
            ))}
          </div>
        </div>
      )}

      {positions.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide px-0.5">
            Должность
          </span>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {positions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePosition(p)}
                className={`text-left text-xs px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  filterPositions.includes(p)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <span className="w-3.5 flex-shrink-0 text-center leading-none">
                  {filterPositions.includes(p) ? <Check className="inline w-3 h-3" strokeWidth={3} /> : null}
                </span>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
