import { Suspense, lazy } from 'react'

const Hero = lazy(() => import('../sections/Hero.jsx'))
const About = lazy(() => import('../sections/About.jsx'))
const Concept = lazy(() => import('../sections/Concept.jsx'))
const Highlights = lazy(() => import('../sections/Highlights.jsx'))
const Process = lazy(() => import('../sections/Process.jsx'))
const Herd = lazy(() => import('../sections/Herd.jsx'))
const Equipment = lazy(() => import('../sections/Equipment.jsx'))
const Transparency = lazy(() => import('../sections/Transparency.jsx'))
const MasterPlan = lazy(() => import('../sections/MasterPlan.jsx'))
const Contact = lazy(() => import('../sections/Contact.jsx'))

function SectionFallback() {
  return <div className="h-40 w-full animate-pulse rounded-2xl bg-sand" />
}

export default function Home() {
  return (
    <Suspense fallback={<SectionFallback />}>
      <Hero />
      <About />
      <Concept />
      <Highlights />
      <Process />
      <Herd />
      <Equipment />
      <Transparency />
      <MasterPlan />
      <Contact />
    </Suspense>
  )
}
