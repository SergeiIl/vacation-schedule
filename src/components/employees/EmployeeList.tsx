import { useRef, useState, useCallback } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmployeeSearch } from './EmployeeSearch'
import { EmployeeListItem } from './EmployeeListItem'
import { AddEmployeeModal } from './AddEmployeeModal'
import { useEmployeeStore } from '@/store'
import { useSettingsStore } from '@/store'
import { useSpecialDateStore } from '@/store'
import { useVirtualRows } from '@/hooks/useVirtualRows'
import type { Employee } from '@/types/employee'

export function EmployeeList() {
  const { filteredEmployees } = useEmployeeStore()
  const { specialDates } = useSpecialDateStore()
  const { rowHeight } = useSettingsStore()
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  const employees = filteredEmployees(specialDates)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Measure container height
  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setContainerHeight(node.clientHeight)
    }
  }, [])

  const { visibleItems, offsetTop, offsetBottom } = useVirtualRows(
    employees,
    rowHeight,
    containerHeight,
    scrollTop,
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-2 border-b border-border">
        <span className="text-sm font-semibold">
          Сотрудники{' '}
          <span className="text-muted-foreground font-normal">({employees.length})</span>
        </span>
        <Button size="sm" variant="ghost" onClick={() => setShowAddModal(true)} title="Добавить сотрудника">
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      <EmployeeSearch />

      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          measuredRef(node)
        }}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* Top spacer */}
        <div style={{ height: offsetTop }} />

        {employees.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8 px-4">
            Нет сотрудников. Добавьте первого.
          </div>
        ) : (
          visibleItems.map((emp) => (
            <EmployeeListItem
              key={emp.id}
              employee={emp}
              onEdit={setEditingEmployee}
              style={{ height: rowHeight }}
            />
          ))
        )}

        {/* Bottom spacer */}
        <div style={{ height: offsetBottom }} />
      </div>

      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} />
      )}
      {editingEmployee && (
        <AddEmployeeModal employee={editingEmployee} onClose={() => setEditingEmployee(null)} />
      )}
    </div>
  )
}
