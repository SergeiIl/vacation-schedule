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

const DEFAULT_SETTINGS: Settings = {
  planningYear: new Date().getFullYear(),
  scale: 'month',
  theme: 'system',
  rowHeight: 40,
  showWeekends: true,
  showNRD: true,
}

function persistSettings(state: Settings) {
  putSettings(state).catch(console.error)
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,

  setScale: (scale) => {
    set({ scale })
    persistSettings({ ...get(), scale })
  },

  setYear: (planningYear) => {
    set({ planningYear })
    persistSettings({ ...get(), planningYear })
  },

  setTheme: (theme) => {
    set({ theme })
    applyThemeToDOM(theme)
    persistSettings({ ...get(), theme })
  },

  setRowHeight: (rowHeight) => {
    set({ rowHeight })
    persistSettings({ ...get(), rowHeight })
  },

  toggleShowWeekends: () => {
    const showWeekends = !get().showWeekends
    set({ showWeekends })
    persistSettings({ ...get(), showWeekends })
  },

  toggleShowNRD: () => {
    const showNRD = !get().showNRD
    set({ showNRD })
    persistSettings({ ...get(), showNRD })
  },

  applySettings: (s) => {
    set((prev) => ({ ...prev, ...s }))
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
