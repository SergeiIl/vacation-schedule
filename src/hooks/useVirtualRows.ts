import { useMemo } from 'react'

export interface VirtualRowsResult<T> {
  visibleItems: T[]
  offsetTop: number
  offsetBottom: number
  startIndex: number
}

export function useVirtualRows<T>(
  items: T[],
  rowHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan = 5,
): VirtualRowsResult<T> {
  return useMemo(() => {
    if (containerHeight === 0) {
      return { visibleItems: items, offsetTop: 0, offsetBottom: 0, startIndex: 0 }
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan,
    )

    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      offsetTop: startIndex * rowHeight,
      offsetBottom: (items.length - endIndex - 1) * rowHeight,
      startIndex,
    }
  }, [items, rowHeight, containerHeight, scrollTop, overscan])
}
