import Header from './components/layout/Header.jsx'
import Hero from './components/sections/Hero.jsx'
import About from './components/sections/About.jsx'
import Work from './components/sections/Work.jsx'
import Container from './components/ui/Container.jsx'
import AboutArcade from './components/sections/AboutArcade.jsx'
import Services from './components/sections/Services.jsx'
import WhyHire from './components/sections/WhyHire.jsx'
import Contact from './components/sections/Contact.jsx'
import Footer from './components/layout/Footer.jsx'
import FloatingWhatsApp from './components/ui/FloatingWhatsApp.jsx'
import { useEffect } from 'react'
import { installMailtoFallback } from './utils/mailtoFallback.js'
import Cursor from './components/ui/Cursor.jsx'
import ZoomLightbox from './components/ui/ZoomLightbox.jsx'

export default function App() {
  useEffect(() => installMailtoFallback(), [])
  return (
    <>
      <Cursor />
      <Header />
      <main id="main">
        <Hero />
        <About />
        <WhyHire />
        <Work />
        <section id="arcade" className="arcade-section" aria-label="Creative break and creative journey">
          <Container><AboutArcade /></Container>
        </section>
        <Services />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
      <ZoomLightbox />
    </>
  )
}
