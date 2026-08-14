import { useState } from 'react'
import SectionHeading from '../components/SectionHeading.jsx'
import Reveal from '../components/Reveal.jsx'
import Lightbox from '../components/Lightbox.jsx'
import { Check, Loader, Clock, Maximize2 } from 'lucide-react'
import { assetUrl } from '../lib/images.js'

const STAGES = [
  {
    tag: 'Base',
    title: 'Base readiness',
    status: 'complete',
    text: 'Boundary wall, water well, solar panels, water-flow ditches, main plantation.',
  },
  {
    tag: '1',
    title: 'Goat Block',
    status: 'complete',
    text: 'Temporarily housing the cow herd while later stages are built.',
  },
  {
    tag: '2',
    title: 'Hydroponic Block',
    status: 'progress',
    text: 'Year-round green fodder production for the herd.',
  },
  {
    tag: '3',
    title: 'Dairy Shed & Milking Parlour',
    status: 'upcoming',
    text: 'Purpose-built shed and parlour for the growing dairy herd.',
  },
  {
    tag: '4',
    title: 'BioGas Generation',
    status: 'upcoming',
    text: 'On-farm biogas for energy and waste-to-value processing.',
  },
  {
    tag: '5',
    title: 'Residential Block',
    status: 'upcoming',
    text: 'On-site housing for farm staff and caretaker families.',
  },
]

const STATUS = {
  complete: { label: 'Complete', icon: Check, cls: 'bg-brand-500 text-white', pill: 'bg-brand-50 text-brand-700' },
  progress: { label: 'In progress', icon: Loader, cls: 'bg-gold-400 text-ink', pill: 'bg-gold-100 text-gold-800' },
  upcoming: { label: 'Upcoming', icon: Clock, cls: 'bg-sand text-ink/50', pill: 'bg-black/5 text-ink/50' },
}

export default function MasterPlan() {
  const [zoom, setZoom] = useState(false)
  return (
    <section id="masterplan" className="scroll-mt-20 bg-cream py-14 sm:py-24">
      <div className="container-x">
        <SectionHeading
          eyebrow="The master plan"
          title="Our growth journey — built in 5 stages"
          intro="IGA Sial Farm is being developed as a complete, purpose-built facility on a solid foundation — delivered in five planned stages after base readiness."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-5 lg:gap-10">
          <Reveal className="lg:col-span-3">
            <figure className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white shadow-soft">
              <button
                type="button"
                onClick={() => setZoom(true)}
                className="block w-full cursor-zoom-in"
                aria-label="Enlarge the site master plan"
              >
                <img
                  src={assetUrl('img/masterplan.png')}
                  alt="IGA Sial Farm site master plan showing residential, buffalo, goat, chiller, biogas, and storage blocks"
                  className="w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-medium text-cream backdrop-blur-sm transition-opacity group-hover:bg-ink/85">
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Enlarge plan
                </span>
              </button>
              <figcaption className="border-t border-black/5 px-5 py-3 text-sm text-ink/55">
                IGA Sial Farm Site Master Plan — Waryam Wala, Punjab
              </figcaption>
            </figure>
          </Reveal>

          <div className="lg:col-span-2">
            <ol className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-brand-100">
              {STAGES.map((s, i) => {
                const st = STATUS[s.status]
                return (
                  <Reveal key={s.title} delay={i * 0.05}>
                    <li className="relative flex gap-4">
                      <span
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold ${st.cls}`}
                      >
                        <st.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="pb-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading font-semibold text-pine">{s.title}</h3>
                          <span className={`chip text-[11px] ${st.pill}`}>{st.label}</span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-ink/60">{s.text}</p>
                      </div>
                    </li>
                  </Reveal>
                )
              })}
            </ol>
          </div>
        </div>
      </div>

      <Lightbox
        open={zoom}
        images={[assetUrl('img/masterplan.png')]}
        index={0}
        title="Site master plan — Waryam Wala, Punjab"
        onClose={() => setZoom(false)}
      />
    </section>
  )
}
