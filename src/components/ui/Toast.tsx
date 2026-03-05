import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

const AUTO_DISMISS_MS = 6000

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} id={toast.id} message={toast.message} description={toast.description} type={toast.type} onDismiss={dismiss} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  id: string
  message: string
  description?: string
  type?: 'default' | 'warning' | 'error'
  onDismiss: (id: string) => void
}

function ToastItem({ id, message, description, type = 'default', onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm max-w-sm',
        'bg-background text-foreground',
        type === 'warning' && 'border-yellow-400/60 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-100',
        type === 'error' && 'border-destructive/60 bg-destructive/10 text-destructive',
        type === 'default' && 'border-border',
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium leading-snug">{message}</p>
        {description && <p className="mt-0.5 text-xs opacity-80">{description}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
