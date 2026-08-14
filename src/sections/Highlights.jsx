import SectionHeading from '../components/SectionHeading.jsx'
import Reveal from '../components/Reveal.jsx'
import { TrendingUp, Recycle, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react'

const HIGHLIGHTS = [
  {
    icon: TrendingUp,
    title: 'Increased earnings through collective care',
    text: 'Economies of scale — larger herds spread feed, water, and healthcare costs, resulting in higher milk yield and better community income.',
  },
  {
    icon: Recycle,
    title: 'A charity that grows sustainably',
    text: 'Run like a business for efficiency, but every rupee of profit funds jobs, animal care, and women’s empowerment.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparency & accountability',
    text: 'The Manzil App (under development) lets sponsors track animal welfare, equipment in use, milk production, and impact directly.',
  },
  {
    icon: GraduationCap,
    title: 'Empowering rural women',
    text: 'Training and digital tools let village women take on operations and admin roles — building real independence.',
  },
  {
    icon: Sparkles,
    title: 'Long-term community impact',
    text: 'Designed for lasting transformation: education, employment, and prosperity for generations to come.',
  },
]

export default function Highlights() {
  return (
    <section id="highlights" className="scroll-mt-20 bg-cream py-14 sm:py-24">
      <div className="container-x">
        <SectionHeading
          eyebrow="Key highlights"
          title="Why Project Partners choose IGA Sial Farm"
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.07} className={i === 0 ? 'lg:row-span-2' : ''}>
              <div
                className={`flex h-full flex-col rounded-3xl border border-black/5 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift ${
                  i === 0 ? 'bg-brand-500 text-cream' : 'bg-white'
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    i === 0 ? 'bg-white/15 text-gold-300' : 'bg-brand-50 text-brand-600'
                  }`}
                >
                  <h.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3
                  className={`mt-4 font-heading text-lg font-semibold ${
                    i === 0 ? 'text-cream' : 'text-pine'
                  }`}
                >
                  {h.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${i === 0 ? 'text-cream/85' : 'text-ink/65'}`}
                >
                  {h.text}
                </p>
                {i === 0 && (
                  <p className="mt-auto pt-6 font-heading text-sm font-medium text-gold-300">
                    Collective care · higher yield
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
