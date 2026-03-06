import { createContext, useContext } from 'react'

type BarType = 'vacation' | 'nrd' | 'unpaid'

export type { BarType }

export interface BarContextMenuCtx {
  openMenu: (barId: string, type: BarType, x: number, y: number) => void
}

export const BarContextMenuContext = createContext<BarContextMenuCtx>({ openMenu: () => {} })

export function useBarContextMenu() {
  return useContext(BarContextMenuContext)
}
