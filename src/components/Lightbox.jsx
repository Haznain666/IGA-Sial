import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { imageUrl } from '../lib/images.js'

// Full-screen image viewer. Shows the complete photo (never cropped), with a
// prominent Close button and, for animals with several photos, prominent
// prev/next controls plus a thumbnail strip. Keyboard: Esc, ← / →.
export default function Lightbox({ open, images = [], index = 0, title, onClose }) {
  const urls = images.map(imageUrl).filter(Boolean)
  const [current, setCurrent] = useState(index)

  useEffect(() => setCurrent(Math.min(index, Math.max(0, urls.length - 1))), [index, open])

  const go = useCallback(
    (dir) => setCurrent((c) => (c + dir + urls.length) % urls.length),
    [urls.length],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, go, onClose])

  if (!open) return null
  const multiple = urls.length > 1

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[180] flex flex-col bg-ink/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${title || 'Image'} gallery`}
    >
      {/* Top bar: title + counter + prominent Close */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-cream sm:px-6 sm:py-4">
        <p className="min-w-0 truncate text-sm font-medium sm:text-base">
          {title}
          {multiple && <span className="ml-2 text-cream/50">{current + 1} / {urls.length}</span>}
        </p>
        <button
          onClick={onClose}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 text-sm font-medium text-cream transition-colors hover:bg-white/25 active:scale-95"
          aria-label="Close image"
        >
          <X className="h-5 w-5" />
          Close
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-3 pb-4 sm:px-20">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={current}
            src={urls[current]}
            alt={`${title || 'Animal'} — photo ${current + 1}`}
            className="max-h-full max-w-full rounded-2xl object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        </AnimatePresence>

        {multiple && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-cream transition-colors hover:bg-white/30 active:scale-95 sm:left-6 sm:h-14 sm:w-14"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-cream transition-colors hover:bg-white/30 active:scale-95 sm:right-6 sm:h-14 sm:w-14"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </>
        )}
      </div>

      {multiple && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-5 pt-1 hide-scrollbar">
          {urls.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-14 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-16 sm:w-14 ${
                i === current ? 'border-gold-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-90'
              }`}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === current}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>,
    document.body,
  )
}
