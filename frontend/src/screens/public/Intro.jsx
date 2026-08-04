import { Fragment } from 'react'
import { roles } from '../../data/roles'
import { Icon, IconPaths } from '../../components/icons'
import { Footer } from './Footer'
import longhornImg from '../../assets/longhorn.jpg'
import logo from '../../assets/BTheader.png'

export function Intro({ onPickRole, onLogin }) {
  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${longhornImg})` }} />
        <div className="hero-overlay" />

        <div className="hero-content">
          <img src={logo} alt="BeefTrace — Digital Livestock Traceability System" className="hero-logo" />
        </div>

        <button className="hero-scroll-cue" onClick={scrollToAbout} aria-label="Scroll to learn more">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </section>

      <section className="about" id="about">
        <div className="about-inner">
          <p className="eyebrow">About BeefTrace</p>
          <h2>Complete visibility, farm to plate</h2>

          <p>
            BeefTrace is a digital livestock traceability system designed to provide complete visibility
            across the beef supply chain. BeefTrace enables users to track the entire lifecycle of an
            animal — from its registration on the farm, through transportation, trading, slaughter,
            processing and retail, to the final beef product purchased by the consumer.
          </p>
          <p>
            By recording every stage of the supply chain in a secure and traceable manner, the system
            helps address challenges such as limited product transparency, food safety concerns, disease
            outbreaks and inefficient product recalls.
          </p>
          <p>
            BeefTrace serves farmers, traders, transporters, veterinary inspectors, slaughterhouses,
            processors, retailers, regulatory authorities, and consumers, providing each stakeholder with
            timely access to relevant traceability information.
          </p>

          <div className="about-cta">
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById('enroll-section').scrollIntoView({ behavior: 'smooth' })}
            >
              Enroll as a stakeholder
            </button>
            <button className="btn btn-outline" onClick={onLogin}>I already have an account</button>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="hero-inner">
          <p className="eyebrow">How it works</p>
          <h2 style={{ color: 'var(--cream-50)', fontSize: 26, fontWeight: 600, margin: '8px 0 4px' }}>
            One record, every stage of the journey
          </h2>
          <div className="chain-strip">
            {roles.map((r, i) => (
              <Fragment key={r.name}>
                <div className="chain-node">
                  <div className="dot"></div>
                  <p>{r.name}</p>
                </div>
                {i < roles.length - 1 && <div className="chain-line"></div>}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="enroll-section">
        <div className="section-head">
          <p className="eyebrow">Enroll as</p>
          <h2>Where do you sit in the chain?</h2>
          <p>Pick the role that matches what you do. It decides the form you fill in next and the dashboard you land on — each one only asks for what that role actually needs.</p>
        </div>
        <div className="tag-grid">
          {roles.map((r) => (
            <button className="tag-card" style={{ textAlign: 'left' }} key={r.name} onClick={() => onPickRole(r)}>
              <Icon className="tag-icon" size={38} style={{ marginBottom: 14 }}>{r.icon}</Icon>
              <h3>{r.name}</h3>
              <p>{r.desc}</p>
              <span className="pick">
                View {r.name} dashboard
                <Icon size={13}>{IconPaths.arrowRight}</Icon>
              </span>
            </button>
          ))}
        </div>
      </section>

      <Footer onEnroll={() => document.getElementById('enroll-section').scrollIntoView({ behavior: 'smooth' })} onLogin={onLogin} />
    </>
  )
}
