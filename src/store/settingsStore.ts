import { create } from 'zustand'
import type { Settings, Scale, Theme } from '@/types/settings'
import { putSettings } from '@/db/indexedDB'

interface SettingsState extends Settings {
  setScale: (scale: Scale) => void
  setYear: (year: number) => void
  setTheme: (theme: Theme) => void
  setRowHeight: (h: number) => void
  toggleShowWeekends: () => void
  toggleShowNRD: () => void
  toggleShowUnpaidLeave: () => void
  setMaxConcurrentVacations: (v: number | null) => void
  setVacationDaysNorm: (v: number) => void
  setNrdColor: (color: string) => void
  setUnpaidColor: (color: string) => void
  applySettings: (s: Partial<Settings>) => void
}

const LS_KEY = 'app-settings'

const FALLBACK: Settings = {
  planningYear: new Date().getFullYear(),
  scale: 'month',
  theme: 'system',
  rowHeight: 44,
  showWeekends: true,
  showNRD: true,
  showUnpaidLeave: true,
  maxConcurrentVacations: null,
  vacationDaysNorm: 28,
  nrdColor: '#fbbf24',
  unpaidColor: '#d1d5db',
}

const MIN_ROW_HEIGHT = 44

function loadFromLS(): Settings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return FALLBACK
    const saved = { ...FALLBACK, ...JSON.parse(raw) }
    // Migrate: bump rowHeight if saved value is too small for position text
    if (saved.rowHeight < MIN_ROW_HEIGHT) saved.rowHeight = MIN_ROW_HEIGHT
    return saved
  } catch {
    return FALLBACK
  }
}

function saveToLS(state: Settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    // quota exceeded or private mode — ignore
  }
}

function toPlain(state: SettingsState): Settings {
  return {
    planningYear: state.planningYear,
    scale: state.scale,
    theme: state.theme,
    rowHeight: state.rowHeight,
    showWeekends: state.showWeekends,
    showNRD: state.showNRD,
    showUnpaidLeave: state.showUnpaidLeave,
    maxConcurrentVacations: state.maxConcurrentVacations,
    vacationDaysNorm: state.vacationDaysNorm,
    nrdColor: state.nrdColor,
    unpaidColor: state.unpaidColor,
  }
}

function persist(state: Settings) {
  saveToLS(state)
  putSettings(state).catch(console.error)
}

const DEFAULT_SETTINGS = loadFromLS()

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,

  setScale: (scale) => {
    set({ scale })
    persist(toPlain(get()))
  },

  setYear: (planningYear) => {
    set({ planningYear })
    persist(toPlain(get()))
  },

  setTheme: (theme) => {
    set({ theme })
    applyThemeToDOM(theme)
    persist(toPlain(get()))
  },

  setRowHeight: (rowHeight) => {
    set({ rowHeight })
    persist(toPlain(get()))
  },

  toggleShowWeekends: () => {
    const showWeekends = !get().showWeekends
    set({ showWeekends })
    persist(toPlain(get()))
  },

  toggleShowNRD: () => {
    const showNRD = !get().showNRD
    set({ showNRD })
    persist(toPlain(get()))
  },

  toggleShowUnpaidLeave: () => {
    const showUnpaidLeave = !get().showUnpaidLeave
    set({ showUnpaidLeave })
    persist(toPlain(get()))
  },

  setMaxConcurrentVacations: (maxConcurrentVacations) => {
    set({ maxConcurrentVacations })
    persist(toPlain(get()))
  },

  setVacationDaysNorm: (vacationDaysNorm) => {
    set({ vacationDaysNorm })
    persist(toPlain(get()))
  },

  setNrdColor: (nrdColor) => {
    set({ nrdColor })
    persist(toPlain(get()))
  },

  setUnpaidColor: (unpaidColor) => {
    set({ unpaidColor })
    persist(toPlain(get()))
  },

  applySettings: (s) => {
    set((prev) => ({ ...prev, ...s }))
    if (s.theme) applyThemeToDOM(s.theme)
    persist(toPlain(get()))
  },
}))

export function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}
