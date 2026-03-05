import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface Toast {
  id: string
  message: string
  description?: string
  type?: 'default' | 'warning' | 'error'
}

interface ToastState {
  toasts: Toast[]
  show: (toast: Omit<Toast, 'id'> & { id?: string }) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show: (toast) => {
    const id = toast.id ?? nanoid()
    set((s) => {
      const exists = s.toasts.some((t) => t.id === id)
      if (exists) {
        return { toasts: s.toasts.map((t) => (t.id === id ? { ...t, ...toast, id } : t)) }
      }
      return { toasts: [...s.toasts, { ...toast, id }] }
    })
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
