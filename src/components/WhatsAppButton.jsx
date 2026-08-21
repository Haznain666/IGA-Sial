import { MessageCircleMore } from 'lucide-react'

export default function WhatsAppButton({ phone = '923139742224', className = '' }) {
  const href = `https://wa.me/${phone}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.35)] transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 ${className}`}
    >
      <MessageCircleMore className="h-7 w-7" aria-hidden="true" />
    </a>
  )
}
