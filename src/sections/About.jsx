import Reveal from '../components/Reveal.jsx'
import { Heart, Leaf, Users } from 'lucide-react'
import { assetUrl } from '../lib/images.js'

const PILLARS = [
  { icon: Heart, label: 'Compassion', text: 'Built in loving memory, rooted in care.' },
  { icon: Leaf, label: 'Sustainability', text: 'Solar power, biogas, and green fodder.' },
  { icon: Users, label: 'Community', text: '100% of profits uplift rural families.' },
]

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-cream py-14 sm:py-24">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <p className="eyebrow mb-3">
            <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
            About IGA Sial Farm
          </p>
          <h2 className="text-balance text-3xl font-semibold leading-tight text-pine sm:text-4xl">
            A not-for-profit farm reimagining rural dairy
          </h2>
          <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-ink/75">
            <p>
              IGA Sial Farm is a community-first initiative built on compassion, sustainability, and modern thinking. Our mission is to support rural families in Punjab, Pakistan by transforming traditional dairy farming into a structured, fair, and transparent Dairy Farm as a Service (DFaaS) model.
            </p>
            <p>
              Sponsor a Cow – Enabling philanthropists to sponsor a cow that generates ongoing income to support families in need, education, and community development—creating a lasting legacy of hope and opportunity.
            </p>
            <p>
              Partner with your Cow – Empowering local farmers to lease their cows to the farm and receive stable, guaranteed monthly income, while their animals are cared for in a safe, professionally managed environment.
            </p>
            <p>
              With 100% of profits reinvested into education, employment, women’s empowerment, and community development, IGA Sial Farm is more than a project—it is a sustainable ecosystem designed to uplift generations.
            </p>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, label, text }) => (
              <div key={label} className="rounded-2xl bg-white p-4 shadow-soft">
                <Icon className="h-6 w-6 text-brand-500" aria-hidden="true" />
                <dt className="mt-2 font-heading font-semibold text-pine">{label}</dt>
                <dd className="mt-0.5 text-sm text-ink/60">{text}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-lift">
              <img
                src={assetUrl('img/aerial.png')}
                alt="Aerial view of IGA Sial Farm — cattle grazing beside an irrigation stream and green fields"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 hidden max-w-[15rem] rounded-2xl bg-pine p-5 text-cream shadow-lift sm:block">
              <p className="font-heading text-sm leading-relaxed">
                “In loving memory of Iqbal &amp; Ghulam Akbar Sial.”
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
