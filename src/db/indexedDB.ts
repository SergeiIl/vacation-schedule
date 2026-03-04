import { openDB, type IDBPDatabase } from 'idb'
import type { AppDB } from './schema'
import { DB_NAME, DB_VERSION } from './schema'
import type { Employee } from '@/types/employee'
import type { SpecialDate } from '@/types/specialDate'
import type { Settings } from '@/types/settings'

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null

export function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('employees')) {
          const empStore = db.createObjectStore('employees', { keyPath: 'id' })
          empStore.createIndex('by-order', 'order')
          empStore.createIndex('by-name', 'fullName')
        }
        if (!db.objectStoreNames.contains('specialDates')) {
          const sdStore = db.createObjectStore('specialDates', { keyPath: 'id' })
          sdStore.createIndex('by-type', 'type')
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings')
        }
      },
    })
  }
  return dbPromise
}

// Employees
export async function getAllEmployees(): Promise<Employee[]> {
  const db = await getDB()
  return db.getAllFromIndex('employees', 'by-order')
}

export async function putEmployee(emp: Employee): Promise<void> {
  const db = await getDB()
  await db.put('employees', emp)
}

export async function deleteEmployee(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('employees', id)
}

export async function bulkPutEmployees(employees: Employee[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('employees', 'readwrite')
  await Promise.all([...employees.map((emp) => tx.store.put(emp)), tx.done])
}

export async function clearAllEmployees(): Promise<void> {
  const db = await getDB()
  await db.clear('employees')
}

// Special dates
export async function getAllSpecialDates(): Promise<SpecialDate[]> {
  const db = await getDB()
  return db.getAll('specialDates')
}

export async function putSpecialDate(sd: SpecialDate): Promise<void> {
  const db = await getDB()
  await db.put('specialDates', sd)
}

export async function deleteSpecialDate(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('specialDates', id)
}

export async function clearAllSpecialDates(): Promise<void> {
  const db = await getDB()
  await db.clear('specialDates')
}

// Settings
export async function getSettings(): Promise<Settings | undefined> {
  const db = await getDB()
  return db.get('settings', 'app-settings')
}

export async function putSettings(s: Settings): Promise<void> {
  const db = await getDB()
  await db.put('settings', s, 'app-settings')
}
