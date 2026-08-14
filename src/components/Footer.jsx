import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, Hash } from 'lucide-react'
import Logo from './Logo.jsx'

export default function Footer() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const toSection = (id) => {
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 140)
    }
  }

  return (
    <footer className="bg-pine text-cream/85">
      <div className="container-x grid gap-10 py-12 sm:py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo chip className="h-14 sm:h-16" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
            A not-for-profit, community-first dairy initiative in Punjab, Pakistan — in loving
            memory of Iqbal &amp; Ghulam Akbar Sial.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gold-300">#IGASialFarm</p>
        </div>

        <div className="md:col-span-3">
          <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-cream">
            Explore
          </h3>
          <ul className="space-y-2.5 text-sm">
            {[
              ['about', 'Our story'],
              ['concept', 'The DFaaS model'],
              ['process', 'How it works'],
              ['herd', 'Meet the herd'],
              ['transparency', 'The Manzil App'],
              ['masterplan', 'Growth journey'],
            ].map(([id, label]) => (
              <li key={id}>
                <button
                  onClick={() => toSection(id)}
                  className="text-cream/70 transition-colors hover:text-gold-300"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-5">
          <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-cream">
            Get in touch
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
              <a href="mailto:igasialfarm@gmail.com" className="hover:text-gold-300">
                igasialfarm@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
              <span>Phone / WhatsApp — @igsialfarm</span>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
              <span>Waryam Wala, Punjab, Pakistan</span>
            </li>
            <li className="flex items-center gap-3">
              <Hash className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
              <span>Website / Social — #IGASialFarm</span>
            </li>
          </ul>

          <Link to="/select" className="btn-gold btn-md mt-6">
            Donate a cow
          </Link>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-x py-5 text-center">
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} IGA Sial Farm · Donate-a-Cow Program. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
