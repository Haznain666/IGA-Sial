import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, opts = {}) => {
      const id = Math.random().toString(36).slice(2)
      const entry = { id, message, type: opts.type || 'success' }
      setToasts((prev) => [...prev, entry])
      const duration = opts.duration ?? 3800
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info
          const tone =
            t.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : t.type === 'info'
                ? 'border-brand-200 bg-white text-ink'
                : 'border-brand-200 bg-white text-ink'
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full max-w-sm animate-scale-in items-start gap-3 rounded-2xl border ${tone} px-4 py-3 shadow-lift`}
            >
              <Icon
                className={`mt-0.5 h-5 w-5 shrink-0 ${t.type === 'error' ? 'text-red-500' : 'text-brand-500'}`}
                aria-hidden="true"
              />
              <p className="flex-1 text-sm leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-0.5 text-ink/40 transition-colors hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
