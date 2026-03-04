import type { DBSchema } from 'idb'
import type { Employee } from '@/types/employee'
import type { SpecialDate, SpecialDateType } from '@/types/specialDate'
import type { Settings } from '@/types/settings'

export interface AppDB extends DBSchema {
  employees: {
    key: string
    value: Employee
    indexes: {
      'by-order': number
      'by-name': string
    }
  }
  specialDates: {
    key: string
    value: SpecialDate
    indexes: {
      'by-type': SpecialDateType
    }
  }
  settings: {
    key: 'app-settings'
    value: Settings
  }
}

export const DB_NAME = 'vacation-scheduler'
export const DB_VERSION = 1
