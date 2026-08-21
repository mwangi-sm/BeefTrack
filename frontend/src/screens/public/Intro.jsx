import { Fragment, memo, useRef, useState, useEffect, useCallback } from 'react'
import { roles } from '../../data/roles'
import { Icon, IconPaths } from '../../components/icons'
import { Footer } from './Footer'
import logo from '../../assets/BTheader.png'
import heroVideo from '../../assets/hero-traceability.mp4'

/* -------------------------------------------------------------------------- /
/                                CUSTOM HOOKS                                /
/ -------------------------------------------------------------------------- */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem('beeftrace-theme')
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    localStorage.setItem('beeftrace-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  return [theme, toggleTheme]
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  return reduced
}

function useInView({ threshold = 0.25, rootMargin = '0px 0px -60px 0px', once = true } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return setInView(true)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.unobserve(el)
        } else if (!once) setInView(false)
      },
      { threshold, rootMargin }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, inView]
}

function useCountUp(target, duration = 2200, start = false) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    let raf, t0
    const tick = (ts) => {
      if (!t0) t0 = ts
      const p = Math.min((ts - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])

  return value
}

/* -------------------------------------------------------------------------- /
/                              SUB-COMPONENTS                                /
/ -------------------------------------------------------------------------- */
const HeroVideo = memo(function HeroVideo() {
  return (
    <video className="hero-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true" tabIndex={-1}>
      <source src={heroVideo} type="video/mp4" />
    </video>
  )
})

const MagneticButton = memo(function MagneticButton({ children, onClick, variant = 'outline', className = '', ariaLabel }) {
  const btnRef = useRef(null)
  const reduced = useReducedMotion()

  const handleMove = useCallback((e) => {
    if (reduced) return
    const el = btnRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${(e.clientX - (rect.left + rect.width / 2)) * 0.15}px`)
    el.style.setProperty('--my', `${(e.clientY - (rect.top + rect.height / 2)) * 0.15}px`)
  }, [reduced])

  const handleLeave = useCallback(() => {
    const el = btnRef.current
    if (el) { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px') }
  }, [])

  return (
    <button
      ref={btnRef}
      className={`bt-btn bt-btn--${variant} ${className}`}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      aria-label={ariaLabel}
      style={{ transform: 'translate(var(--mx, 0), var(--my, 0))' }}
    >
      <span className="bt-btn__inner">{children}</span>
      <span className="bt-btn__ripple" aria-hidden="true" />
    </button>
  )
})

function StatDockItem({ label, targetValue, suffix = '' }) {
  const [ref, inView] = useInView({ threshold: 0.1 })
  const count = useCountUp(targetValue, 2500, inView)
  return (
    <div className="dock-item" ref={ref} role="listitem">
      <span className="dock-value">
        {count.toLocaleString()}
        {suffix && <span className="dock-suffix">{suffix}</span>}
      </span>
      <span className="dock-label">{label}</span>
    </div>
  )
}

function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }) {
  const [ref, inView] = useInView({ threshold: 0.18 })
  return <Tag ref={ref} className={`bt-reveal ${inView ? 'bt-reveal--in' : ''} ${className}`} style={{ '--d': `${delay}ms` }}>{children}</Tag>
}

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle> <line x1="12" y1="1" x2="12" y2="3"></line> <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line> <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line> <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line> <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
)

/* -------------------------------------------------------------------------- /
/                                NAVIGATION                                  /
/ -------------------------------------------------------------------------- */
function Navigation({ onLogin, theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isDark = theme === 'dark'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNav = (id) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className={`bt-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="bt-nav-inner">
        <a href="#" className="bt-nav-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}) }}>
          <img src={logo} alt="BeefTrace" className="bt-nav-logo" />
          <div className="bt-nav-text">
            <span className="bt-nav-wordmark">BeefTrace</span>
            <span className="bt-nav-tagline">Traceability Platform</span>
          </div>
        </a>

        <nav className="bt-nav-links" aria-label="Main navigation">
          <button onClick={() => handleNav('hero')}>Home</button>
          <button onClick={() => handleNav('about')}>About</button>
          <button onClick={() => handleNav('how-it-works')}>How It Works</button>
          <button onClick={() => handleNav('enroll-section')}>Stakeholders</button>
          <button onClick={() => handleNav('benefits')}>Benefits</button>
        </nav>

        <div className="bt-nav-actions">
          <button className="bt-nav-theme-toggle" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="bt-nav-ghost" onClick={onLogin}>Sign In</button>
          <button className="bt-nav-solid" onClick={() => handleNav('enroll-section')}>Get Started</button>
        </div>

        <button className={`bt-nav-burger ${mobileOpen ? 'is-open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
          <span /><span /><span />
        </button>
      </div>

      <div className={`bt-nav-mobile-menu ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <button onClick={() => handleNav('about')}>About</button>
        <button onClick={() => handleNav('how-it-works')}>How It Works</button>
        <button onClick={() => handleNav('benefits')}>Benefits</button>
        <button onClick={() => handleNav('enroll-section')}>Stakeholders</button>
        <div className="bt-nav-mobile-actions">
          <button className="bt-nav-theme-toggle-mobile" onClick={toggleTheme}>
            {isDark ? <SunIcon /> : <MoonIcon />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button onClick={onLogin}>Sign In</button>
          <button className="bt-nav-solid" onClick={() => handleNav('enroll-section')}>Get Started</button>
        </div>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- /
/                               SECTION: HERO                                /
/ -------------------------------------------------------------------------- */
function HeroSection({ onLogin, scrollToEnroll, scrollToAbout, heroRef, parallaxRef }) {
  return (
    <section className="hero" id="hero" ref={heroRef} aria-labelledby="hero-title">
      <HeroVideo />
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-glow hero-glow--top" aria-hidden="true" />
      <div className="hero-glow hero-glow--bottom" aria-hidden="true" />
      <div className="hero-spotlight" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-particles" aria-hidden="true">
        <span className="particle p-1" /><span className="particle p-2" /><span className="particle p-3" /><span className="particle p-4" /><span className="particle p-5" />
      </div>

      <div className="hero-content">
        <div className="hero-parallax-layer" ref={parallaxRef}>
          <div className="hero-badge-row hero-anim hero-anim-1">
            <span className="hero-badge"><span className="badge-dot" aria-hidden="true" />Trusted by 12,000+ Stakeholders</span>
          </div>
          <img src={logo} alt="BeefTrace" className="hero-logo hero-anim hero-anim-2" />
          <h1 className="hero-title hero-anim hero-anim-3" id="hero-title">
            Every animal. <br/>
            <span className="hero-title-shimmer">Every step</span>, verified.
          </h1>
          <p className="hero-subtitle hero-anim hero-anim-4">
            BeefTrace is the digital backbone of the Kenyan beef supply chain. 
            We record every hand-off in a secure, tamper-proof trail — bringing 
            enterprise-grade traceability to farmers, processors, and regulators.
          </p>
          <div className="hero-cta-group hero-anim hero-anim-5">
            <MagneticButton variant="primary" onClick={scrollToEnroll}>
              Enroll as a stakeholder <Icon size={14}>{IconPaths.arrowRight}</Icon>
            </MagneticButton>
            <MagneticButton variant="outline" onClick={onLogin}>Sign in to dashboard</MagneticButton>
          </div>
          <div className="hero-trust-grid hero-anim hero-anim-6">
            <div className="trust-chip"><Icon size={14}>{IconPaths.shield}</Icon><span>Tamper-Proof</span></div>
            <div className="trust-chip"><Icon size={14}>{IconPaths.activity}</Icon><span>Real-Time Sync</span></div>
            <div className="trust-chip"><Icon size={14}>{IconPaths.eye}</Icon><span>Farm-to-Consumer</span></div>
            <div className="trust-chip"><Icon size={14}>{IconPaths.users}</Icon><span>National Network</span></div>
          </div>
          <div className="hero-stats-dock hero-anim hero-anim-7" role="list" aria-label="Platform statistics">
            <StatDockItem label="Animals Tracked" targetValue={380} suffix="K+" />
            <div className="dock-divider" aria-hidden="true" />
            <StatDockItem label="Supply Stages" targetValue={7} />
            <div className="dock-divider" aria-hidden="true" />
            <StatDockItem label="Verified Records" targetValue={1240} suffix="K+" />
            <div className="dock-divider" aria-hidden="true" />
            <StatDockItem label="Stakeholders" targetValue={12} suffix="K+" />
          </div>
        </div>
      </div>
      <button className="hero-scroll-cue" onClick={scrollToAbout} aria-label="Scroll to learn more">
        <span className="scroll-line" aria-hidden="true" />
      </button>
    </section>
  )
}

/* -------------------------------------------------------------------------- /
/                              SECTION: ABOUT                                /
/ -------------------------------------------------------------------------- */
function AboutSection() {
  const pillars = [
    { icon: IconPaths.shield, title: 'Tamper-proof records', body: 'Every hand-off is cryptographically logged. No link in the chain can be silently rewritten.' },
    { icon: IconPaths.eye, title: 'Full-lifecycle visibility', body: 'Farm, transport, trading, slaughter, processing, retail — one continuous record per animal.' },
    { icon: IconPaths.users, title: 'Built for every stakeholder', body: 'Role-scoped dashboards show farmers what farmers need and regulators what regulators need.' },
    { icon: IconPaths.activity, title: 'Real-time outbreak response', body: 'Pinpoint affected batches in seconds — not days — when food safety incidents occur.' },
  ]

  return (
    <section className="bt-about" id="about" aria-labelledby="about-title">
      <div className="bt-container">
        <div className="bt-about-grid">
          <div className="bt-about-text">
            <Reveal><div className="bt-eyebrow"><span className="bt-eyebrow__dot" />About BeefTrace</div></Reveal>
            <Reveal delay={80}><h2 className="bt-section-title" id="about-title">Complete visibility, <em>farm to plate</em></h2></Reveal>
            <Reveal delay={160}>
              <p className="bt-lede">
                BeefTrace is a digital livestock traceability system designed to deliver continuous, verifiable visibility across the Kenyan beef supply chain.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <p className="bt-body-text">
                By recording every stage of the supply chain in a secure and traceable manner, the system helps address challenges such as limited product transparency, food safety concerns, disease outbreaks and inefficient product recalls.
              </p>
            </Reveal>
          </div>
          <div className="bt-pillars">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={120 + i * 80} as="article" className="bt-pillar">
                <div className="bt-pillar__icon" aria-hidden="true"><Icon size={22}>{p.icon}</Icon></div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- /
/                         SECTION: HOW IT WORKS                              /
/ -------------------------------------------------------------------------- */
function HowItWorksSection() {
  const [activeIdx, setActiveIdx] = useState(0)

  return (
    <section className="bt-hiw" id="how-it-works" aria-labelledby="hiw-title">
      <div className="bt-container">
        <Reveal><div className="bt-eyebrow"><span className="bt-eyebrow__dot" />How it works</div></Reveal>
        <Reveal delay={80}><h2 className="bt-section-title" id="hiw-title">Trace the <em>journey</em></h2></Reveal>
        <Reveal delay={160}><p className="bt-lede" style={{maxWidth: '60ch', margin: '0 auto 64px'}}>Every hand-off is verified. Hover or tap a stage to trace the path from pasture to plate.</p></Reveal>

        <div className="hiw-track" role="list">
          {roles.map((role, i) => (
            <Fragment key={role.name}>
              <div 
                className={`hiw-node ${activeIdx === i ? 'is-active' : ''} ${activeIdx > i ? 'is-passed' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => setActiveIdx(i)}
                onFocus={() => setActiveIdx(i)}
                tabIndex={0}
                role="listitem"
                aria-label={`Stage ${i + 1}: ${role.name}`}
              >
                <div className="hiw-orb"><Icon size={24}>{role.icon}</Icon></div>
                <div className="hiw-label">{role.name}</div>
              </div>
              {i < roles.length - 1 && (
                <div className={`hiw-conn ${activeIdx > i ? 'is-filled' : ''}`} aria-hidden="true">
                  <div className="hiw-line-base" />
                  <div className="hiw-line-fill" />
                  <div className="hiw-line-pulse" />
                  <Icon size={12} className="hiw-arrow">{IconPaths.arrowRight}</Icon>
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <div className="hiw-detail-card" aria-live="polite">
          <Reveal key={activeIdx} delay={50}>
            <div className="hiw-detail-inner">
              <div className="hiw-detail-step">Stage {String(activeIdx + 1).padStart(2, '0')}</div>
              <h3>{roles[activeIdx].name}</h3>
              <p>{roles[activeIdx].desc}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- /
/                             SECTION: BENEFITS                              /
/ -------------------------------------------------------------------------- */
function BenefitsSection() {
  const benefits = [
    { icon: IconPaths.shield, title: 'For Farmers', body: 'Prove the origin and quality of your livestock. Access premium markets and secure fair pricing based on verified data.' },
    { icon: IconPaths.activity, title: 'For Regulators', body: 'Monitor compliance in real-time. Instantly trace disease outbreaks and manage recalls with surgical precision.' },
    { icon: IconPaths.eye, title: 'For Consumers', body: 'Scan a QR code at the butcher or supermarket to see the exact farm, transport, and processing history of your meat.' },
  ]

  return (
    <section className="bt-benefits" id="benefits" aria-labelledby="benefits-title">
      <div className="bt-container">
        <Reveal><div className="bt-eyebrow"><span className="bt-eyebrow__dot" />Why BeefTrace</div></Reveal>
        <Reveal delay={80}><h2 className="bt-section-title" id="benefits-title">Built for the <em>entire chain</em></h2></Reveal>

        <div className="bt-benefits-grid">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={120 + i * 100} as="article" className="bt-benefit-card">
              <div className="bt-benefit-icon" aria-hidden="true"><Icon size={28}>{b.icon}</Icon></div>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- /
/                              SECTION: ENROLLMENT                           /
/ -------------------------------------------------------------------------- */
function EnrollmentSection({ onPickRole }) {
  return (
    <section className="bt-enroll" id="enroll-section" aria-labelledby="enroll-title">
      <div className="bt-container">
        <div className="bt-section-head">
          <Reveal><div className="bt-eyebrow"><span className="bt-eyebrow__dot" />Enroll as</div></Reveal>
          <Reveal delay={80}><h2 id="enroll-title">Where do you sit in the chain?</h2></Reveal>
          <Reveal delay={160}><p>Pick the role that matches what you do. It decides the form you fill in next and the dashboard you land on.</p></Reveal>
        </div>

        <div className="bt-enroll-grid">
          {roles.map((r, i) => (
            <Reveal key={r.name} delay={80 + i * 60}>
              <button className="bt-stakeholder-card" onClick={() => onPickRole(r)} aria-label={`Open ${r.name} dashboard`}>
                <span className="bt-stakeholder-card__glow" aria-hidden="true" />
                <div className="bt-stakeholder-card__icon" aria-hidden="true"><Icon size={34}>{r.icon}</Icon></div>
                <h3>{r.name}</h3>
                <p>{r.desc}</p>
                <span className="bt-stakeholder-card__cta"><span>View dashboard</span><Icon size={13}>{IconPaths.arrowRight}</Icon></span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- /
/                                SECTION: CTA                                /
/ -------------------------------------------------------------------------- */
function CTASection({ onLogin, scrollToEnroll }) {
  return (
    <section className="bt-cta">
      <div className="bt-container">
        <div className="bt-cta-inner">
          <Reveal><h2>Ready to secure your supply chain?</h2></Reveal>
          <Reveal delay={100}><p>Join the network of verified stakeholders building trust in Kenyan beef.</p></Reveal>
          <Reveal delay={200} className="bt-cta-actions">
            <MagneticButton variant="primary" onClick={scrollToEnroll}>Get Started Today <Icon size={14}>{IconPaths.arrowRight}</Icon></MagneticButton>
            <MagneticButton variant="outline" onClick={onLogin}>Sign In</MagneticButton>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- /
/                                  INTRO                                     /
/ -------------------------------------------------------------------------- */
export function Intro({ onPickRole, onLogin }) {
  const reduced = useReducedMotion()
  const [theme, toggleTheme] = useTheme()
  
  // Separate refs for the section (mouse tracking) and the layer (transform)
  const heroSectionRef = useRef(null)
  const parallaxRef = useRef(null)

  const scrollToAbout = useCallback(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), [])
  const scrollToEnroll = useCallback(() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' }), [])

  useEffect(() => {
    if (reduced) return
    const el = heroSectionRef.current
    const pEl = parallaxRef.current
    
    if (!el || !pEl) return
    
    let raf = 0, target = { x: 0, y: 0 }, current = { x: 0, y: 0 }
    
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      target = { 
        x: ((e.clientX - r.left) / r.width - 0.5) * -14, 
        y: ((e.clientY - r.top) / r.height - 0.5) * -10 
      }
      el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
      el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
    }
    
    const onLeave = () => { 
      target = { x: 0, y: 0 }
      el.style.setProperty('--mouse-x', '50%')
      el.style.setProperty('--mouse-y', '50%') 
    }
    
    const tick = () => {
      current.x += (target.x - current.x) * 0.08
      current.y += (target.y - current.y) * 0.08
      // Direct DOM manipulation for performance and to avoid React re-renders
      pEl.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)
    
    return () => { 
      cancelAnimationFrame(raf)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave) 
    }
  }, [reduced])

  return (
    <div className="bt-intro-root">
      <Navigation onLogin={onLogin} theme={theme} toggleTheme={toggleTheme} />
      <HeroSection 
        onLogin={onLogin} 
        scrollToEnroll={scrollToEnroll} 
        scrollToAbout={scrollToAbout} 
        heroRef={heroSectionRef} 
        parallaxRef={parallaxRef} 
      />
      <AboutSection />
      <HowItWorksSection />
      <BenefitsSection />
      <EnrollmentSection onPickRole={onPickRole} />
      <CTASection onLogin={onLogin} scrollToEnroll={scrollToEnroll} />
      <Footer onEnroll={scrollToEnroll} onLogin={onLogin} />

      <style>{`
        /* ============================================================
           BEEFTRACE — ENTERPRISE DESIGN SYSTEM 
           Exact Theme Variables + Semantic Mapping
           ============================================================ */
        [data-theme="light"] {
          --burgundy-deep: #3D0910;
          --burgundy-rich: #5A0F1A;
          --camel-light: #E4D9C6;
          --camel-card: #F3ECE0;
          --boho: #7B694E;
          --gold-accent-light: #B4831F;
          --gold-accent-dark: #C98F5E;
          --gold-accent-dark-bright: #E3B88A;
          --bg-primary: var(--camel-card);
          --bg-secondary: var(--camel-light);
          --surface: #FFFFFF;
          --surface-glass: rgba(255, 255, 255, 0.65);
          --surface-glass-strong: rgba(255, 255, 255, 0.85);
          --text-primary: var(--burgundy-deep);
          --text-secondary: var(--boho);
          --text-tertiary: var(--boho);
          --brand-primary: var(--burgundy-rich);
          --brand-primary-hover: var(--burgundy-deep);
          --brand-accent: var(--gold-accent-light);
          --brand-accent-hover: var(--gold-accent-dark);
          --border-subtle: rgba(61, 9, 16, 0.08);
          --border-strong: rgba(61, 9, 16, 0.15);
          --shadow-sm: 0 2px 8px rgba(61, 9, 16, 0.04);
          --shadow-md: 0 8px 24px rgba(61, 9, 16, 0.08);
          --shadow-lg: 0 20px 40px rgba(61, 9, 16, 0.12);
          --hero-overlay-top: rgba(243, 236, 224, 0.85);
          --hero-overlay-mid: rgba(243, 236, 224, 0.6);
          --hero-overlay-bot: rgba(243, 236, 224, 0.95);
          --hero-glow-top: rgba(180, 131, 31, 0.15);
          --hero-glow-bot: rgba(90, 15, 26, 0.1);
          --particle-color: var(--gold-accent-light);
          --grid-color: rgba(61, 9, 16, 0.04);
        }
        [data-theme="dark"] {
          --burgundy-deep: #3D0910;
          --burgundy-rich: #5A0F1A;
          --camel-light: #E4D9C6;
          --camel-card: #F3ECE0;
          --boho: #7B694E;
          --gold-accent-light: #B4831F;
          --gold-accent-dark: #C98F5E;
          --gold-accent-dark-bright: #E3B88A;
          --bg-primary: var(--burgundy-deep);
          --bg-secondary: #2A060B;
          --surface: var(--burgundy-rich);
          --surface-glass: rgba(90, 15, 26, 0.6);
          --surface-glass-strong: rgba(61, 9, 16, 0.85);
          --text-primary: var(--camel-light);
          --text-secondary: var(--gold-accent-dark);
          --text-tertiary: var(--gold-accent-dark);
          --brand-primary: var(--burgundy-rich);
          --brand-primary-hover: #7A1424;
          --brand-accent: var(--gold-accent-dark);
          --brand-accent-hover: var(--gold-accent-dark-bright);
          --border-subtle: rgba(228, 217, 198, 0.1);
          --border-strong: rgba(228, 217, 198, 0.2);
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
          --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
          --shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.6);
          --hero-overlay-top: rgba(61, 9, 16, 0.75);
          --hero-overlay-mid: rgba(61, 9, 16, 0.5);
          --hero-overlay-bot: rgba(61, 9, 16, 0.95);
          --hero-glow-top: rgba(227, 184, 138, 0.15);
          --hero-glow-bot: rgba(180, 131, 31, 0.2);
          --particle-color: var(--gold-accent-dark-bright);
          --grid-color: rgba(228, 217, 198, 0.05);
        }
        
        html { transition: background-color 0.3s ease, color 0.3s ease; }
        .bt-intro-root {
          position: relative;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          color: var(--text-primary);
          background: var(--bg-primary);
          --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
          --ease-spring: cubic-bezier(0.2, 0.8, 0.2, 1.2);
          --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .bt-container { max-width: 1280px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 48px); }
        .bt-reveal { opacity: 0; transform: translate3d(0, 24px, 0); transition: opacity 0.8s var(--ease-out), transform 0.8s var(--ease-out); transition-delay: var(--d, 0ms); }
        .bt-reveal--in { opacity: 1; transform: translate3d(0, 0, 0); }
        .bt-eyebrow { display: inline-flex; align-items: center; gap: 10px; padding: 6px 14px; border-radius: 999px; background: var(--surface-glass); border: 1px solid var(--border-strong); color: var(--brand-accent); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 20px; backdrop-filter: blur(8px); }
        .bt-eyebrow__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--brand-accent); box-shadow: 0 0 8px var(--brand-accent); animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .bt-section-title { font-family: 'Fraunces', Georgia, serif; font-weight: 500; font-size: clamp(2.2rem, 5vw, 3.8rem); line-height: 1.1; letter-spacing: -0.02em; color: var(--text-primary); margin: 0 0 24px; transition: color 0.3s ease; }
        .bt-section-title em { font-style: italic; background: linear-gradient(100deg, var(--brand-accent), var(--brand-accent-hover)); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .bt-lede { font-size: clamp(1.05rem, 1.4vw, 1.2rem); line-height: 1.6; color: var(--text-secondary); max-width: 50ch; margin: 0 0 24px; transition: color 0.3s ease; }
        .bt-body-text { font-size: 1rem; line-height: 1.7; color: var(--text-secondary); max-width: 50ch; transition: color 0.3s ease; }
        .bt-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 28px; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; background: transparent; color: inherit; isolation: isolate; overflow: hidden; transition: transform 0.3s var(--ease-spring), box-shadow 0.3s, background 0.3s, border-color 0.3s; will-change: transform; }
        .bt-btn__inner { position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 10px; }
        .bt-btn__ripple { position: absolute; inset: 0; z-index: 1; border-radius: inherit; opacity: 0; transform: scale(0.4); transition: transform 0.5s var(--ease-out), opacity 0.5s; }
        .bt-btn:hover .bt-btn__ripple { opacity: 1; transform: scale(1.4); }
        .bt-btn--primary { background: var(--brand-primary); color: var(--camel-light); box-shadow: var(--shadow-md); border: 1px solid rgba(255,255,255,0.05); }
        .bt-btn--primary:hover { background: var(--brand-primary-hover); box-shadow: var(--shadow-lg); }
        .bt-btn--primary .bt-btn__ripple { background: radial-gradient(circle, rgba(255,255,255,0.3), transparent 60%); }
        .bt-btn--outline { background: var(--surface-glass); border: 1px solid var(--border-strong); color: var(--text-primary); backdrop-filter: blur(8px); }
        .bt-btn--outline:hover { border-color: var(--brand-accent); background: var(--surface); }
        .bt-btn--outline .bt-btn__ripple { background: radial-gradient(circle, rgba(184, 138, 44, 0.2), transparent 60%); }
        .bt-btn:focus-visible { outline: 2px solid var(--brand-accent); outline-offset: 3px; }

        /* ============ NAVIGATION ============ */
        .bt-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 16px 0; transition: all 0.3s ease; }
        .bt-nav.is-scrolled { background: var(--surface-glass-strong); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--border-subtle); padding: 12px 0; }
        .bt-nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
        .bt-nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--text-primary); }
        .bt-nav-logo { height: 32px; width: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
        .bt-nav-text { display: flex; flex-direction: column; line-height: 1.1; }
        .bt-nav-wordmark { font-family: 'Fraunces', serif; font-size: 1.25rem; font-weight: 600; letter-spacing: -0.02em; color: var(--text-primary); transition: color 0.3s; }
        .bt-nav-tagline { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--brand-accent); opacity: 0.9; }
        .bt-nav-links { display: flex; gap: 32px; }
        .bt-nav-links button { background: none; border: none; color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: color 0.2s; position: relative; }
        .bt-nav-links button:hover { color: var(--text-primary); }
        .bt-nav-links button::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1px; background: var(--brand-accent); transition: width 0.3s ease; }
        .bt-nav-links button:hover::after { width: 100%; }
        .bt-nav-actions { display: flex; gap: 16px; align-items: center; }
        .bt-nav-theme-toggle { background: var(--surface-glass); border: 1px solid var(--border-subtle); color: var(--text-primary); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; }
        .bt-nav-theme-toggle:hover { background: var(--surface); border-color: var(--brand-accent); color: var(--brand-accent); }
        .bt-nav-theme-toggle svg { transition: transform 0.5s var(--ease-spring); }
        .bt-nav-theme-toggle:hover svg { transform: rotate(15deg); }
        .bt-nav-ghost { background: none; border: none; color: var(--text-primary); font-weight: 500; cursor: pointer; font-size: 0.9rem; transition: color 0.3s; }
        .bt-nav-solid { background: var(--brand-primary); color: var(--camel-light); border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-size: 0.9rem; }
        .bt-nav-solid:hover { background: var(--brand-primary-hover); }
        .bt-nav-burger { display: none; background: none; border: none; cursor: pointer; width: 32px; height: 32px; position: relative; }
        .bt-nav-burger span { display: block; width: 20px; height: 2px; background: var(--text-primary); position: absolute; left: 6px; transition: all 0.3s; }
        .bt-nav-burger span:nth-child(1) { top: 10px; }
        .bt-nav-burger span:nth-child(2) { top: 15px; }
        .bt-nav-burger span:nth-child(3) { top: 20px; }
        .bt-nav-burger.is-open span:nth-child(1) { top: 15px; transform: rotate(45deg); }
        .bt-nav-burger.is-open span:nth-child(2) { opacity: 0; }
        .bt-nav-burger.is-open span:nth-child(3) { top: 15px; transform: rotate(-45deg); }
        .bt-nav-mobile-menu { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface-glass-strong); backdrop-filter: blur(20px); padding: 24px; display: flex; flex-direction: column; gap: 16px; border-bottom: 1px solid var(--border-subtle); transform: translateY(-10px); opacity: 0; pointer-events: none; transition: all 0.3s var(--ease-out); }
        .bt-nav-mobile-menu.is-open { transform: translateY(0); opacity: 1; pointer-events: auto; }
        .bt-nav-mobile-menu button { background: none; border: none; color: var(--text-primary); font-size: 1.1rem; text-align: left; padding: 8px 0; cursor: pointer; }
        .bt-nav-mobile-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-subtle); }
        .bt-nav-theme-toggle-mobile { display: flex; align-items: center; gap: 12px; background: none; border: none; color: var(--text-primary); font-size: 1.1rem; text-align: left; padding: 8px 0; cursor: pointer; width: 100%; }

        /* ============ HERO (FIXED LAYOUT) ============ */
        .hero { 
          position: relative; 
          min-height: 100svh; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: flex-start; /* FIX: Prevents top clipping on overflow */
          overflow-x: hidden; 
          overflow-y: visible; 
          isolation: isolate; 
          background: var(--bg-primary); 
          padding: 120px 24px 40px; /* Ample space for badge and scroll cue */
          transition: background-color 0.3s ease; 
        }
        .hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none; animation: hero-fade 1.4s var(--ease-smooth) both; }
        @keyframes hero-fade { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: scale(1); } }
        .hero-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, var(--hero-overlay-top) 0%, var(--hero-overlay-mid) 40%, var(--hero-overlay-bot) 100%), radial-gradient(circle at 50% 50%, transparent 0%, var(--hero-glow-bot) 100%); transition: background 0.3s ease; }
        .hero-glow { position: absolute; z-index: 1; pointer-events: none; mix-blend-mode: multiply; opacity: 0.6; transition: mix-blend-mode 0.3s, opacity 0.3s; }
        [data-theme="dark"] .hero-glow { mix-blend-mode: screen; opacity: 0.3; }
        .hero-glow--top { top: -20%; left: -10%; width: 60%; height: 60%; background: radial-gradient(closest-side, var(--hero-glow-top), transparent 70%); }
        .hero-glow--bottom { bottom: -30%; right: -10%; width: 70%; height: 70%; background: radial-gradient(closest-side, var(--hero-glow-bot), transparent 70%); }
        .hero-grain { position: absolute; inset: 0; z-index: 1; opacity: 0.03; mix-blend-mode: overlay; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .hero-spotlight { position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0; transition: opacity 0.4s; background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(61, 9, 16, 0.06), transparent 40%); }
        [data-theme="dark"] .hero-spotlight { background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(227, 184, 138, 0.1), transparent 40%); }
        .hero:hover .hero-spotlight { opacity: 1; }
        .hero-grid { position: absolute; inset: 0; z-index: 1; pointer-events: none; background-image: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px); background-size: 80px 80px; mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%); }
        .hero-particles { position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; }
        .particle { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: var(--particle-color); box-shadow: 0 0 10px var(--particle-color); opacity: 0.4; animation: float 15s infinite linear; }
        .p-1 { top: 20%; left: 10%; animation-duration: 18s; } .p-2 { top: 60%; left: 80%; animation-duration: 22s; animation-delay: -5s; width: 3px; height: 3px; } .p-3 { top: 40%; left: 40%; animation-duration: 16s; animation-delay: -2s; opacity: 0.2; } .p-4 { top: 80%; left: 20%; animation-duration: 20s; animation-delay: -8s; width: 5px; height: 5px; } .p-5 { top: 30%; left: 70%; animation-duration: 25s; animation-delay: -12s; opacity: 0.3; }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); opacity: 0; } 10% { opacity: 0.6; } 90% { opacity: 0.6; } 100% { transform: translate(100px, -200px) scale(0.5); opacity: 0; } }
        
        .hero-content { 
          position: relative; 
          z-index: 2; 
          width: 100%; 
          max-width: 880px; 
          text-align: center; 
          color: var(--text-primary); 
          margin: auto 0; /* FIX: Centers if short, aligns top if tall */
          display: flex; 
          flex-direction: column; 
          align-items: center; 
        }

        .hero-parallax-layer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          width: 100%;
          will-change: transform;
          /* No CSS transition here, JS handles the lerp */
        }

        .hero-badge-row { margin-bottom: 0; }
        .hero-badge { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 999px; background: var(--surface-glass); border: 1px solid var(--border-strong); backdrop-filter: blur(12px); font-size: 0.78rem; font-weight: 600; color: var(--text-primary); letter-spacing: 0.04em; box-shadow: var(--shadow-sm); transition: all 0.3s ease; }
        .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-accent); box-shadow: 0 0 8px var(--brand-accent); animation: pulse 2s infinite; }
        .hero-logo { width: clamp(100px, 12vw, 130px); height: auto; filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.15)); }
        [data-theme="dark"] .hero-logo { filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.55)) brightness(1.1); }
        .hero-title { margin: 0; font-family: 'Fraunces', Georgia, serif; font-weight: 500; font-size: clamp(2.8rem, 6.5vw, 5.2rem); line-height: 1.05; letter-spacing: -0.02em; color: var(--text-primary); text-shadow: 0 2px 24px rgba(0, 0, 0, 0.05); transition: color 0.3s, text-shadow 0.3s; }
        [data-theme="dark"] .hero-title { text-shadow: 0 2px 24px rgba(0, 0, 0, 0.4); }
        .hero-title-shimmer { background: linear-gradient(100deg, var(--burgundy-rich) 0%, var(--gold-accent-light) 40%, var(--burgundy-rich) 80%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmer 6s linear infinite; }
        [data-theme="dark"] .hero-title-shimmer { background: linear-gradient(100deg, var(--gold-accent-dark) 0%, var(--gold-accent-dark-bright) 20%, var(--gold-accent-dark) 40%, var(--gold-accent-dark-bright) 60%, var(--gold-accent-dark) 80%, var(--gold-accent-dark-bright) 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; }
        @keyframes shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .hero-subtitle { margin: 0; max-width: 60ch; font-size: clamp(1.05rem, 1.4vw, 1.2rem); line-height: 1.65; color: var(--text-secondary); transition: color 0.3s; }
        .hero-cta-group { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; margin-top: 8px; }
        
        .hero-trust-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
        .trust-chip { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; background: var(--surface-glass); border: 1px solid var(--border-strong); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); font-size: 0.82rem; font-weight: 600; color: var(--text-primary); letter-spacing: 0.02em; transition: all 0.3s var(--ease-smooth); box-shadow: var(--shadow-sm); }
        .trust-chip:hover { background: var(--surface); border-color: var(--brand-accent); color: var(--brand-primary); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        [data-theme="dark"] .trust-chip:hover { color: var(--brand-accent-hover); }
        .trust-chip svg { color: var(--brand-accent); }
        
        .hero-stats-dock { 
          position: relative; 
          margin-top: 24px; 
          z-index: 10; 
          display: flex; 
          align-items: center; 
          gap: 0; 
          padding: 24px 48px; 
          border-radius: 16px; 
          background: var(--surface-glass); 
          border: 1px solid var(--border-strong); 
          backdrop-filter: blur(24px) saturate(150%); 
          box-shadow: var(--shadow-lg); 
          width: 100%; 
          max-width: 900px; 
          justify-content: space-around; 
          transition: background 0.3s, border-color 0.3s; 
        }
        .dock-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
        .dock-value { font-family: 'Fraunces', Georgia, serif; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 500; color: var(--text-primary); letter-spacing: -0.02em; line-height: 1; transition: color 0.3s; }
        .dock-suffix { font-size: 0.6em; color: var(--brand-accent); margin-left: 2px; }
        .dock-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-tertiary); font-weight: 500; text-align: center; transition: color 0.3s; }
        .dock-divider { width: 1px; height: 40px; background: linear-gradient(180deg, transparent, var(--border-strong), transparent); }
        
        .hero-scroll-cue { 
          position: relative; 
          margin-top: 48px;
          margin-bottom: 24px;
          background: transparent; 
          border: none; 
          cursor: pointer; 
          padding: 10px; 
          z-index: 2;
        }
        .scroll-line { width: 1px; height: 40px; background: linear-gradient(180deg, var(--brand-accent), transparent); animation: scroll-anim 2s ease-in-out infinite; }
        @keyframes scroll-anim { 0% { transform: scaleY(0); transform-origin: top; } 50% { transform: scaleY(1); transform-origin: top; } 51% { transform: scaleY(1); transform-origin: bottom; } 100% { transform: scaleY(0); transform-origin: bottom; } }
        .hero-anim { opacity: 0; animation: rise 1s var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; }
        .hero-anim-1 { animation-delay: 0.1s; } .hero-anim-2 { animation-delay: 0.25s; } .hero-anim-3 { animation-delay: 0.45s; } .hero-anim-4 { animation-delay: 0.6s; } .hero-anim-5 { animation-delay: 0.8s; } .hero-anim-6 { animation-delay: 1.0s; } .hero-anim-7 { animation-delay: 1.2s; }
        @keyframes rise { from { opacity: 0; transform: translate3d(0, 24px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }

        /* ============ ABOUT ============ */
        .bt-about { padding: clamp(120px, 12vw, 180px) 0; position: relative; background: var(--bg-primary); transition: background-color 0.3s ease; }
        .bt-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
        .bt-pillars { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .bt-pillar { padding: 24px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm); transition: all 0.3s; }
        .bt-pillar:hover { border-color: var(--brand-accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .bt-pillar__icon { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(90, 15, 26, 0.08); border: 1px solid rgba(90, 15, 26, 0.15); color: var(--brand-primary); margin-bottom: 16px; transition: all 0.3s; }
        [data-theme="dark"] .bt-pillar__icon { background: rgba(227, 184, 138, 0.1); border: 1px solid rgba(227, 184, 138, 0.2); color: var(--brand-accent-hover); }
        .bt-pillar h3 { margin: 0 0 8px; font-family: 'Fraunces', Georgia, serif; font-size: 1.15rem; color: var(--text-primary); letter-spacing: -0.01em; transition: color 0.3s; }
        .bt-pillar p { margin: 0; font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); transition: color 0.3s; }

        /* ============ HOW IT WORKS ============ */
        .bt-hiw { padding: clamp(100px, 10vw, 160px) 0; background: var(--bg-secondary); position: relative; overflow: hidden; transition: background-color 0.3s ease; }
        .bt-hiw::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 800px; height: 800px; background: radial-gradient(circle, rgba(90, 15, 26, 0.05) 0%, transparent 70%); pointer-events: none; }
        [data-theme="dark"] .bt-hiw::before { background: radial-gradient(circle, rgba(227, 184, 138, 0.08) 0%, transparent 70%); }
        .hiw-track { display: flex; align-items: center; justify-content: space-between; position: relative; margin: 64px 0; padding: 0 20px; }
        .hiw-node { display: flex; flex-direction: column; align-items: center; gap: 16px; cursor: pointer; outline: none; z-index: 2; transition: transform 0.4s var(--ease-spring); }
        .hiw-node:focus-visible { outline: 2px solid var(--brand-accent); outline-offset: 8px; border-radius: 50%; }
        .hiw-node:hover, .hiw-node.is-active { transform: translateY(-6px); }
        .hiw-orb { width: 64px; height: 64px; border-radius: 50%; background: var(--surface); border: 2px solid var(--border-strong); display: flex; align-items: center; justify-content: center; color: var(--text-primary); transition: all 0.4s var(--ease-out); box-shadow: var(--shadow-sm); }
        .hiw-node.is-passed .hiw-orb { background: var(--brand-primary); border-color: var(--brand-primary); color: var(--camel-light); }
        .hiw-node.is-active .hiw-orb { background: var(--brand-accent); border-color: var(--brand-accent); color: var(--bg-primary); box-shadow: 0 0 30px rgba(180, 131, 31, 0.5), var(--shadow-md); transform: scale(1.1); }
        .hiw-label { font-family: 'Fraunces', serif; font-size: 0.9rem; font-weight: 500; color: var(--text-tertiary); transition: color 0.3s; text-align: center; }
        .hiw-node.is-active .hiw-label, .hiw-node.is-passed .hiw-label { color: var(--text-primary); }
        .hiw-conn { flex: 1; height: 2px; position: relative; margin: 0 8px; align-self: center; margin-bottom: 32px; }
        .hiw-line-base { position: absolute; inset: 0; background: var(--border-subtle); border-radius: 2px; }
        .hiw-line-fill { position: absolute; inset: 0; background: linear-gradient(90deg, var(--brand-primary), var(--brand-accent)); transform: scaleX(0); transform-origin: left; transition: transform 0.8s var(--ease-out); border-radius: 2px; box-shadow: 0 0 10px rgba(180, 131, 31, 0.4); }
        .hiw-conn.is-filled .hiw-line-fill { transform: scaleX(1); }
        .hiw-line-pulse { position: absolute; top: -3px; bottom: -3px; width: 40px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent); filter: blur(3px); opacity: 0; left: 0; }
        .hiw-conn.is-filled .hiw-line-pulse { animation: hiw-pulse 2s linear infinite; }
        @keyframes hiw-pulse { 0% { left: -40px; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
        .hiw-arrow { position: absolute; right: -6px; top: 50%; transform: translateY(-50%) translateX(-10px); opacity: 0; transition: all 0.4s var(--ease-out); color: var(--brand-accent); }
        .hiw-conn.is-filled .hiw-arrow { opacity: 1; transform: translateY(-50%) translateX(0); }
        .hiw-detail-card { max-width: 600px; margin: 40px auto 0; min-height: 120px; }
        .hiw-detail-inner { background: var(--surface-glass); border: 1px solid var(--border-strong); border-radius: 16px; padding: 32px; text-align: center; backdrop-filter: blur(12px); transition: all 0.3s; }
        .hiw-detail-step { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--brand-accent); margin-bottom: 8px; font-weight: 600; }
        .hiw-detail-inner h3 { font-family: 'Fraunces', serif; font-size: 1.5rem; margin: 0 0 12px; color: var(--text-primary); transition: color 0.3s; }
        .hiw-detail-inner p { margin: 0; color: var(--text-secondary); line-height: 1.6; transition: color 0.3s; }

        /* ============ BENEFITS ============ */
        .bt-benefits { padding: clamp(100px, 10vw, 160px) 0; background: var(--bg-primary); transition: background-color 0.3s ease; }
        .bt-benefits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
        .bt-benefit-card { padding: 32px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm); transition: all 0.4s var(--ease-out); position: relative; overflow: hidden; }
        .bt-benefit-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(180, 131, 31, 0.08), transparent 60%); opacity: 0; transition: opacity 0.4s; }
        [data-theme="dark"] .bt-benefit-card::before { background: radial-gradient(circle at 50% 0%, rgba(227, 184, 138, 0.1), transparent 60%); }
        .bt-benefit-card:hover { transform: translateY(-4px); border-color: var(--brand-accent); box-shadow: var(--shadow-md); }
        .bt-benefit-card:hover::before { opacity: 1; }
        .bt-benefit-icon { width: 56px; height: 56px; border-radius: 12px; background: rgba(90, 15, 26, 0.08); border: 1px solid rgba(90, 15, 26, 0.15); display: flex; align-items: center; justify-content: center; color: var(--brand-primary); margin-bottom: 20px; position: relative; z-index: 1; transition: all 0.3s; }
        [data-theme="dark"] .bt-benefit-icon { background: rgba(227, 184, 138, 0.1); border: 1px solid rgba(227, 184, 138, 0.2); color: var(--brand-accent-hover); }
        .bt-benefit-card h3 { font-family: 'Fraunces', serif; font-size: 1.25rem; margin: 0 0 12px; color: var(--text-primary); position: relative; z-index: 1; transition: color 0.3s; }
        .bt-benefit-card p { margin: 0; color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem; position: relative; z-index: 1; transition: color 0.3s; }

        /* ============ ENROLLMENT ============ */
        .bt-enroll { padding: clamp(100px, 10vw, 160px) 0; background: var(--bg-secondary); transition: background-color 0.3s ease; }
        .bt-section-head { text-align: center; max-width: 640px; margin: 0 auto 64px; }
        .bt-section-head h2 { font-family: 'Fraunces', serif; font-size: clamp(2rem, 4vw, 3rem); color: var(--text-primary); margin: 0 0 16px; transition: color 0.3s; }
        .bt-section-head p { color: var(--text-secondary); line-height: 1.6; margin: 0; transition: color 0.3s; }
        .bt-enroll-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .bt-stakeholder-card { position: relative; text-align: left; padding: 28px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border-subtle); color: var(--text-primary); cursor: pointer; display: flex; flex-direction: column; gap: 12px; min-height: 240px; transition: all 0.4s var(--ease-out); overflow: hidden; box-shadow: var(--shadow-sm); }
        .bt-stakeholder-card::before { content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, transparent 40%, var(--brand-accent) 50%, transparent 60%); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0; transition: opacity 0.4s; pointer-events: none; }
        .bt-stakeholder-card__glow { position: absolute; inset: -40%; background: radial-gradient(closest-side, rgba(90, 15, 26, 0.08), transparent 70%); opacity: 0; transition: opacity 0.4s; pointer-events: none; z-index: 0; }
        [data-theme="dark"] .bt-stakeholder-card__glow { background: radial-gradient(closest-side, rgba(227, 184, 138, 0.15), transparent 70%); }
        .bt-stakeholder-card:hover { transform: translateY(-6px); border-color: var(--brand-accent); box-shadow: var(--shadow-lg); }
        .bt-stakeholder-card:hover::before { opacity: 1; }
        .bt-stakeholder-card:hover .bt-stakeholder-card__glow { opacity: 1; }
        .bt-stakeholder-card__icon { width: 56px; height: 56px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: rgba(180, 131, 31, 0.08); border: 1px solid rgba(180, 131, 31, 0.2); color: var(--brand-primary); transition: transform 0.4s var(--ease-spring), background 0.3s; z-index: 1; }
        [data-theme="dark"] .bt-stakeholder-card__icon { background: rgba(227, 184, 138, 0.1); color: var(--brand-accent-hover); }
        .bt-stakeholder-card:hover .bt-stakeholder-card__icon { transform: rotate(-6deg) scale(1.05); background: rgba(180, 131, 31, 0.15); }
        .bt-stakeholder-card h3 { margin: 8px 0 4px; font-family: 'Fraunces', serif; font-size: 1.25rem; color: var(--text-primary); letter-spacing: -0.01em; z-index: 1; transition: color 0.3s; }
        .bt-stakeholder-card p { margin: 0; font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); flex: 1; z-index: 1; transition: color 0.3s; }
        .bt-stakeholder-card__cta { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 0.85rem; font-weight: 600; color: var(--brand-primary); letter-spacing: 0.01em; z-index: 1; transition: gap 0.3s, color 0.3s; }
        [data-theme="dark"] .bt-stakeholder-card__cta { color: var(--brand-accent-hover); }
        .bt-stakeholder-card:hover .bt-stakeholder-card__cta { gap: 12px; }
        .bt-stakeholder-card:focus-visible { outline: 2px solid var(--brand-accent); outline-offset: 3px; }

        /* ============ CTA ============ */
        .bt-cta { padding: clamp(80px, 8vw, 120px) 0; background: var(--bg-primary); transition: background-color 0.3s ease; }
        .bt-cta-inner { background: linear-gradient(135deg, var(--burgundy-deep) 0%, var(--burgundy-rich) 100%); border-radius: 24px; padding: clamp(48px, 6vw, 80px) 24px; text-align: center; position: relative; overflow: hidden; border: 1px solid var(--brand-accent); box-shadow: 0 30px 80px -20px rgba(61, 9, 16, 0.5); }
        .bt-cta-inner::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(227, 184, 138, 0.2), transparent 60%); pointer-events: none; }
        .bt-cta-inner h2 { font-family: 'Fraunces', serif; font-size: clamp(2rem, 4vw, 3rem); color: var(--camel-light); margin: 0 0 16px; position: relative; z-index: 1; }
        .bt-cta-inner p { color: var(--gold-accent-dark-bright); font-size: 1.1rem; margin: 0 auto 32px; max-width: 50ch; position: relative; z-index: 1; }
        .bt-cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
        .bt-cta .bt-btn--primary { background: var(--gold-accent-light); color: var(--burgundy-deep); box-shadow: var(--shadow-md); }
        .bt-cta .bt-btn--primary:hover { background: var(--gold-accent-dark-bright); }
        .bt-cta .bt-btn--outline { border-color: var(--camel-light); color: var(--camel-light); }
        .bt-cta .bt-btn--outline:hover { border-color: var(--gold-accent-dark-bright); background: rgba(255,255,255,0.1); }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 1024px) {
          .bt-about-grid { grid-template-columns: 1fr; gap: 48px; }
          .bt-benefits-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .bt-nav-links, .bt-nav-actions { display: none; }
          .bt-nav-burger { display: block; }
          .bt-benefits-grid { grid-template-columns: 1fr; }
          .hero-stats-dock { flex-wrap: wrap; gap: 24px; padding: 24px; width: 100%; }
          .dock-divider { display: none; }
          .dock-item { flex: 1 1 40%; }
          .hero { padding: 100px 24px 40px; }
          .hiw-track { flex-direction: column; align-items: flex-start; gap: 0; padding: 0; }
          .hiw-node { flex-direction: row; align-items: center; gap: 20px; width: 100%; }
          .hiw-node:hover, .hiw-node.is-active { transform: translateX(6px); }
          .hiw-orb { flex-shrink: 0; }
          .hiw-label { text-align: left; font-size: 1.1rem; }
          .hiw-conn { width: 2px; height: 40px; margin: 0; margin-left: 31px; flex: none; }
          .hiw-line-base, .hiw-line-fill { width: 2px; height: 100%; left: 0; top: 0; bottom: 0; right: auto; }
          .hiw-line-fill { transform-origin: top; transform: scaleY(0); }
          .hiw-conn.is-filled .hiw-line-fill { transform: scaleY(1); }
          .hiw-line-pulse { width: 100%; height: 20px; top: 0; left: 0; right: 0; background: linear-gradient(180deg, transparent, rgba(255,255,255,0.9), transparent); filter: blur(2px); }
          .hiw-conn.is-filled .hiw-line-pulse { animation: hiw-pulse-v 2s linear infinite; }
          @keyframes hiw-pulse-v { 0% { top: -20px; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
          .hiw-arrow { right: auto; bottom: -6px; top: auto; left: 50%; transform: translateX(-50%) translateY(10px) rotate(90deg); }
          .hiw-conn.is-filled .hiw-arrow { transform: translateX(-50%) translateY(0) rotate(90deg); }
        }
        @media (max-width: 480px) {
          .hero-cta-group { flex-direction: column; width: 100%; align-items: stretch; }
          .bt-btn { justify-content: center; }
          .bt-section-title { font-size: 2rem; }
        }

        /* ============ ACCESSIBILITY & REDUCED MOTION ============ */
        @media (prefers-reduced-motion: reduce) {
          .hero-anim, .hero-spotlight, .hero-grid, .particle, .hero-title-shimmer, .scroll-line, .badge-dot, .bt-eyebrow__dot, .hiw-line-pulse { animation: none !important; }
          .hero-anim, .bt-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .bt-btn, .bt-pillar, .bt-stakeholder-card, .bt-benefit-card, .hiw-node, .hiw-line-fill { transition: none !important; }
          .hero-video { animation: none; opacity: 1; transform: none; }
          .hero-trust-grid { opacity: 1 !important; transform: none !important; }
        }
        :focus-visible { outline: 2px solid var(--brand-accent); outline-offset: 3px; }
      `}</style>
    </div>
  )
}