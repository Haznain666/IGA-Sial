import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Heart, ArrowDown, Sprout } from 'lucide-react'
import { assetUrl } from '../lib/images.js'

const STATS = [
  { value: '100%', label: 'Profits reinvested' },
  { value: 'DFaaS', label: 'Dairy Farm as a Service' },
  { value: 'Punjab', label: 'Rooted in rural Pakistan' },
]

export default function Hero() {
  const reduce = useReducedMotion()
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: 0.05 } },
  }
  const item = {
    hidden: reduce ? {} : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={assetUrl('img/hero-mosque.png')}
          alt="Sunrise over a village in Punjab with a herder guiding cattle across green fields"
          className="h-full w-full object-cover"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pine via-pine/75 to-pine/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-pine/80 via-pine/30 to-transparent" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container-x relative flex min-h-[88svh] flex-col justify-center py-20 text-cream sm:py-24"
      >
        <motion.p
          variants={item}
          className="eyebrow mb-5 !text-gold-300"
        >
          <Sprout className="h-4 w-4" aria-hidden="true" />
Sponsor an Asset. Create a Lasting Impact.
        </motion.p>

        <motion.h1
          variants={item}
          className="max-w-4xl text-balance font-heading text-4xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl"
        >
          A living legacy of compassion, sustainability &amp; community
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 max-w-xl text-lg leading-relaxed text-cream/85 sm:text-xl">
          Sponsor livestock or equipment. Transform Lives.
        <br/>
          The income generated from livestock or from the use of farm equipment will be reinvested to create employment, support families, educate children, empower women, and strengthen the village community.
        <br/>
          Your sponsorship is more than a donation—it’s an investment in sustainable livelihoods, dignity, and a brighter future.
          Sponsor today. Create a lasting legacy.
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to="/select" className="btn-gold btn-lg w-full sm:w-auto">
            <Heart className="h-5 w-5" aria-hidden="true" />
            Sponsor now
          </Link>
          <a
            href="#herd"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('herd')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="btn btn-lg w-full border border-cream/30 bg-white/10 text-cream backdrop-blur-sm hover:bg-white/20 sm:w-auto"
          >
            Meet the herd
            <ArrowDown className="h-5 w-5" aria-hidden="true" />
          </a>
        </motion.div>

        <motion.p variants={item} className="mt-8 text-sm italic text-cream/60">
          In loving memory of Iqbal &amp; Ghulam Akbar Sial.
        </motion.p>

        <motion.dl
          variants={item}
          className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-cream/15 pt-8"
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <dt className="font-heading text-2xl font-bold text-gold-300 sm:text-3xl">
                {s.value}
              </dt>
              <dd className="mt-1 text-xs leading-snug text-cream/70 sm:text-sm">{s.label}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 leading-[0]">
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="h-[54px] w-full sm:h-[80px]">
          <path
            d="M0,64 C240,8 480,8 720,40 C960,72 1200,72 1440,32 L1440,90 L0,90 Z"
            fill="#F6F7F3"
          />
        </svg>
      </div>
    </section>
  )
}
