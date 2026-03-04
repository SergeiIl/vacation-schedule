import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useEmployeeStore } from '@/store'

export function EmployeeSearch() {
  const { searchQuery, filterNRD, filterActiveVacation, setSearchQuery, setFilterNRD, setFilterActiveVacation } =
    useEmployeeStore()

  return (
    <div className="flex flex-col gap-2 p-2">
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
          variant={filterNRD === null && !filterActiveVacation ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => {
            setFilterNRD(null)
            setFilterActiveVacation(false)
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
    </div>
  )
}
