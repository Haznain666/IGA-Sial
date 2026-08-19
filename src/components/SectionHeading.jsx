import Reveal from './Reveal.jsx'

export default function SectionHeading({ eyebrow, title, intro, align = 'center', className = '' }) {
  const alignment = align === 'left' ? 'text-left' : 'text-center mx-auto'
  return (
    <Reveal className={`${alignment} ${align === 'center' ? 'max-w-2xl' : ''} ${className}`}>
      {eyebrow && (
        <p className={`eyebrow mb-3 ${align === 'center' ? 'justify-center' : ''}`}>
          <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <h2 className="text-balance text-3xl font-semibold leading-tight text-pine sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-ink/70">{intro}</p>}
    </Reveal>
  )
}
