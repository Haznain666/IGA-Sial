import SectionHeading from '../components/SectionHeading.jsx'
import Reveal from '../components/Reveal.jsx'
import { Coins, HeartHandshake, Eye, Sprout } from 'lucide-react'

const STEPS = [
  {
    icon: Coins,
    title: 'Villagers earn income',
    text: 'A stable, guaranteed monthly income by leasing their cows to the farm.',
  },
  {
    icon: HeartHandshake,
    title: 'Cows are well cared for',
    text: 'Communal conditions with better nutrition, clean water, and timely healthcare.',
  },
  {
    icon: Eye,
    title: 'Sponsors see real results Every sponsor (refered as Project Partner) can track their contribution and its tangible impact.',
    text: '',
  },

  {
    icon: Sprout,
    title: 'Profits rebuild community',
    text: '100% of farm profits are reinvested into local development.',
  },
]

const STATS = [
  { value: '100%', label: 'Profits reinvested' },
  { value: 'DFaaS', label: 'Dairy Farm as a Service' },
  { value: '2–4', label: 'Cows in a typical household' },
]

export default function Concept() {
  return (
    <section id="concept" className="scroll-mt-20 bg-sand py-14 sm:py-24">
      <div className="container-x">
        <SectionHeading
          eyebrow="The concept"
          title="The DFaaS model — a sustainable charity"
          intro="Rural farmers often own 2–4 cows per household but face real challenges providing proper shelter, nutrition, and healthcare. Villagers lease their cows to the farm for a fixed period and receive guaranteed monthly income, while their cows are cared for in a professional, fully equipped facility."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="card h-full p-6 transition-transform duration-200 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <s.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="font-heading text-4xl font-bold text-sand">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-pine">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <dl className="mt-12 grid gap-4 rounded-3xl bg-pine p-8 text-cream sm:grid-cols-3 sm:p-10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="font-heading text-4xl font-bold text-gold-300">{s.value}</dt>
                <dd className="mt-1.5 text-sm text-cream/75">{s.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
