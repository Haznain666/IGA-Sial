import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { Mail, Phone, MapPin, Heart, Building2, Globe2, Send } from 'lucide-react'

const DETAILS = [
  { icon: Mail, label: 'Email', value: 'igasialfarm@gmail.com', href: 'mailto:igasialfarm@gmail.com' },
  { icon: Phone, label: 'WhatsApp', value: '@igasialfarm' },
  { icon: MapPin, label: 'Farm location', value: 'Waryam Wala, Punjab, Pakistan' },
  { icon: Globe2, label: 'Website / Social', value: '#IGASialFarm' },
]

const PAYMENTS = [
  { icon: Building2, text: 'Bank transfer — AUD, USD, SAR, PKR accounts available' },
  { icon: Send, text: 'International wire transfer' },
  { icon: Globe2, text: 'Wise / Payoneer and additional channels' },
]

export default function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 bg-sand py-14 sm:py-24">
      <div className="container-x">
        <div className="overflow-hidden rounded-[2rem] bg-brand-500 text-cream shadow-lift">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
            <Reveal>
              <p className="eyebrow mb-3 !text-gold-300">
                <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
                Get in touch
              </p>
              <h2 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
                Ready to sponsor a cow?
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-cream/85">
                We would love to welcome you as a Project Partner. Choose the live stock or equipment that speaks to you,
                and we will take care of the rest — from payment in your preferred currency to your
                first update from the farm.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/select" className="btn-gold btn-lg">
                  <Heart className="h-5 w-5" aria-hidden="true" />
                  Sponsor now
                </Link>
                <a href="mailto:igasialfarm@gmail.com" className="btn-lg btn border border-cream/30 bg-white/10 text-cream hover:bg-white/20">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                  Email the team
                </a>
              </div>

              <blockquote className="mt-10 border-l-2 border-gold-400 pl-5 text-cream/80">
                <p className="font-heading italic leading-relaxed">
                  “A heartfelt initiative with a modern vision — a sustainable, scalable charity model that respects the legacy of Iqbal & Ghulam Akbar Sial.”
                </p>
                <footer className="mt-2 text-sm text-cream/60">— The IGA Sial Farm Family</footer>
              </blockquote>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid gap-4 sm:grid-cols-2">
                {DETAILS.map((d) => {
                  const Inner = (
                    <>
                      <d.icon className="h-5 w-5 text-gold-300" aria-hidden="true" />
                      <div className="mt-3">
                        <p className="text-xs uppercase tracking-wide text-cream/55">{d.label}</p>
                        <p className="mt-0.5 font-heading font-medium text-cream">{d.value}</p>
                      </div>
                    </>
                  )
                  return d.href ? (
                    <a
                      key={d.label}
                      href={d.href}
                      className="rounded-2xl bg-white/10 p-5 transition-colors hover:bg-white/15"
                    >
                      {Inner}
                    </a>
                  ) : (
                    <div key={d.label} className="rounded-2xl bg-white/10 p-5">
                      {Inner}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-pine p-6">
                <h3 className="font-heading font-semibold text-cream">Sponsor payment options</h3>
                <ul className="mt-4 space-y-3">
                  {PAYMENTS.map((p) => (
                    <li key={p.text} className="flex items-center gap-3 text-sm text-cream/80">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold-300">
                        <p.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {p.text}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
