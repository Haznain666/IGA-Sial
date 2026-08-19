import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ open, onClose, title, description, children, size = 'md', footer }) {
  const panelRef = useRef(null)
  // Keep the latest onClose without making it an effect dependency — otherwise
  // the focus effect below re-runs on every parent render (e.g. each keystroke)
  // and steals focus back to the Close button.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus the first form field on open (not the Close button), once.
    const t = setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const field = panel.querySelector('input:not([type="hidden"]), textarea, select')
      const fallback = panel.querySelector('button, [href], [tabindex]:not([tabindex="-1"])')
      ;(field || fallback)?.focus()
    }, 40)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      clearTimeout(t)
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        className={`relative flex max-h-[92vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift sm:rounded-3xl`}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-pine">{title}</h3>
              {description && <p className="mt-0.5 text-sm text-ink/60">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="-mr-1 rounded-full p-1.5 text-ink/40 transition-colors hover:bg-brand-50 hover:text-ink"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-black/5 bg-parchment px-6 py-4">{footer}</div>}
      </motion.div>
    </div>,
    document.body,
  )
}
