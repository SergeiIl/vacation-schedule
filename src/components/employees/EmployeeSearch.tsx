import { useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useEmployeeStore } from '@/store'

export function EmployeeSearch() {
  const {
    employees,
    searchQuery,
    filterNRD,
    filterActiveVacation,
    filterPosition,
    setSearchQuery,
    setFilterNRD,
    setFilterActiveVacation,
    setFilterPosition,
  } = useEmployeeStore()

  const positions = useMemo(
    () => [...new Set(employees.map((e) => e.position).filter(Boolean))].sort() as string[],
    [employees],
  )

  const isAllActive = filterNRD === null && !filterActiveVacation && filterPosition === null

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
            setFilterPosition(null)
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
                onClick={() => setFilterPosition(filterPosition === p ? null : p)}
                className={`text-left text-xs px-2 py-1 rounded transition-colors ${
                  filterPosition === p
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
