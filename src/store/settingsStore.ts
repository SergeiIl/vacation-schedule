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

function persist(state: Settings) {
  saveToLS(state)
  putSettings(state).catch(console.error)
}

const DEFAULT_SETTINGS = loadFromLS()

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,

  setScale: (scale) => {
    set({ scale })
    persist({ ...get(), scale })
  },

  setYear: (planningYear) => {
    set({ planningYear })
    persist({ ...get(), planningYear })
  },

  setTheme: (theme) => {
    set({ theme })
    applyThemeToDOM(theme)
    persist({ ...get(), theme })
  },

  setRowHeight: (rowHeight) => {
    set({ rowHeight })
    persist({ ...get(), rowHeight })
  },

  toggleShowWeekends: () => {
    const showWeekends = !get().showWeekends
    set({ showWeekends })
    persist({ ...get(), showWeekends })
  },

  toggleShowNRD: () => {
    const showNRD = !get().showNRD
    set({ showNRD })
    persist({ ...get(), showNRD })
  },

  applySettings: (s) => {
    set((prev) => {
      const next = { ...prev, ...s }
      persist(next)
      return next
    })
    if (s.theme) applyThemeToDOM(s.theme)
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
