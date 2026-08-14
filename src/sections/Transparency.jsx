import Reveal from '../components/Reveal.jsx'
import { Smartphone, Activity, Sun, Wallet, Milk, HeartPulse } from 'lucide-react'

const FEATURES = [
  { icon: HeartPulse, title: 'Animal welfare', text: 'Health, welfare, and productivity of your donated cow.' },
  { icon: Sun, title: 'Green energy', text: 'Contribute solar panels, batteries, and farm equipment.' },
  { icon: Wallet, title: 'Profit reinvestment', text: 'See how profits fund education, jobs, and empowerment.' },
]

export default function Transparency() {
  return (
    <section id="transparency" className="scroll-mt-20 overflow-hidden bg-pine py-14 text-cream sm:py-24">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="eyebrow mb-3 !text-gold-300">
            <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
            Transparency
          </p>
          <h2 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
            Tracking your impact — the Manzil App
          </h2>
          <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-cream/80">
            <p>
              Through the Manzil App{' '}
              <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-sm font-medium text-gold-200">
                under development
              </span>
              , global Project Partners can donate towards cows, contribute green-energy solutions,
              farm equipment, or operations — and track the progress of every contribution.
            </p>
            <p>
              The app provides complete transparency: the health, welfare, and productivity of your
              donated cow, and how the farm’s profits are reinvested into education, jobs, and
              women’s empowerment.
            </p>
          </div>

          <dl className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold-300">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <dt className="font-heading font-semibold text-cream">{f.title}</dt>
                  <dd className="text-sm text-cream/70">{f.text}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.1} className="flex justify-center">
          <PhoneMockup />
        </Reveal>
      </div>
    </section>
  )
}

function PhoneMockup() {
  return (
    <div className="relative w-full max-w-[19rem]">
      <div className="rounded-[2.5rem] border-[10px] border-ink/80 bg-cream shadow-lift">
        <div className="relative overflow-hidden rounded-[1.8rem]">
          <div className="flex items-center justify-between bg-brand-500 px-5 pb-5 pt-6 text-cream">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" aria-hidden="true" />
              <span className="font-heading text-sm font-semibold">Manzil</span>
            </div>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px]">Live</span>
          </div>

          <div className="space-y-3 bg-cream p-4">
            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-pine">Sabz</span>
                <span className="chip bg-brand-50 text-xs text-brand-700">Healthy</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Metric icon={Milk} label="Milk / day" value="12 L" />
                <Metric icon={HeartPulse} label="Welfare" value="98%" />
                <Metric icon={Activity} label="Weight" value="+6 kg" />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/45">
                Impact this month
              </p>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
                <div className="h-full w-[72%] rounded-full bg-gold-400" />
              </div>
              <p className="mt-2 text-sm text-ink/70">
                72% of profits reinvested into the community
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-pine p-4 text-cream">
              <Sun className="h-5 w-5 text-gold-300" aria-hidden="true" />
              <p className="text-sm">Solar output steady · 4.2 kW today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-parchment py-2">
      <Icon className="mx-auto h-4 w-4 text-brand-500" aria-hidden="true" />
      <p className="mt-1 font-heading text-sm font-semibold text-pine">{value}</p>
      <p className="text-[10px] text-ink/45">{label}</p>
    </div>
  )
}
