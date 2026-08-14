import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading.jsx'
import Reveal from '../components/Reveal.jsx'
import { Search, HandCoins, LineChart, Award, Camera, HeartHandshake, BadgeCheck, Check } from 'lucide-react'

const STEPS = [
  {
    icon: Search,
    title: 'Browse the herd',
    text: 'Look through the profiles and choose the cow whose story speaks to you.',
  },
  {
    icon: HandCoins,
    title: 'Confirm your donation',
    text: 'Select your cow and pay through simple options in your preferred currency.',
  },
  {
    icon: LineChart,
    title: 'Follow the impact',
    text: 'Through the Manzil App and regular updates, see how your donation changes a family’s life.',
  },
]

const RECEIVE = [
  { icon: Award, text: 'A personalised donation certificate with your cow’s name and photo' },
  { icon: Camera, text: 'Regular photo and welfare updates on your donated cow' },
  { icon: HeartHandshake, text: 'Visibility into how your contribution supports the community' },
  { icon: BadgeCheck, text: 'Recognition as a Project Partner of IGA Sial Farm' },
]

export default function Process() {
  return (
    <section id="process" className="scroll-mt-20 bg-sand py-14 sm:py-24">
      <div className="container-x">
        <SectionHeading eyebrow="How it works" title="How Donate-a-Cow works" />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <div className="relative h-full rounded-3xl bg-white p-7 shadow-soft">
                <span className="absolute right-6 top-6 font-heading text-5xl font-bold text-brand-50">
                  {i + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
                  <s.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-pine">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <div className="h-full rounded-3xl bg-white p-8 shadow-soft">
              <h3 className="font-heading text-xl font-semibold text-pine">What you receive</h3>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {RECEIVE.map((r) => (
                  <li key={r.text} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <r.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-sm leading-relaxed text-ink/70">{r.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-3xl bg-brand-500 p-8 text-cream">
              <h3 className="font-heading text-xl font-semibold">Currencies accepted</h3>
              <p className="mt-2 text-sm text-cream/80">
                Every animal’s value is shown in four currencies for your convenience.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {['PKR', 'USD', 'AUD', 'SAR'].map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-heading font-semibold"
                  >
                    <Check className="h-4 w-4 text-gold-300" aria-hidden="true" />
                    {c}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-cream/60">
                Exchange rates are indicative and updated periodically.
              </p>
              <Link to="/select" className="btn-gold btn-lg mt-6 w-full">
                Browse the herd
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
