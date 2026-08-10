import { Fragment, useState } from 'react'
import { roles } from '../../data/roles'
import { Icon } from '../../components/icons'
import { Footer } from './Footer'
import longhornImg from '../../assets/longhorn.jpg'
import logo from '../../assets/BTheader.png'

// Minimal, dependency-free line-art icons for the About overview columns.
function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="2.25" />
      <circle cx="19" cy="18" r="2.25" />
      <path d="M6.8 7.6c0 4 2 4 5.2 4s5.2 0 5.2 4" strokeDasharray="1 4" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l6.5 2.4v5.3c0 4.4-2.7 7.6-6.5 8.8-3.8-1.2-6.5-4.4-6.5-8.8V5.9L12 3.5z" />
      <path d="M9.2 12.1l1.9 1.9 3.7-3.9" />
    </svg>
  )
}

function NetworkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="2.25" />
      <circle cx="5.5" cy="17.5" r="2.25" />
      <circle cx="18.5" cy="17.5" r="2.25" />
      <path d="M10.5 8L7.3 15.4M13.5 8l3.2 7.4" />
    </svg>
  )
}

const overviewColumns = [
  {
    title: 'The Journey',
    Icon: RouteIcon,
    items: [
      { term: 'Farm', desc: 'Origin & health logging.' },
      { term: 'Transit', desc: 'Route & ownership tracking.' },
      { term: 'Processing', desc: 'Slaughter & batch creation.' },
      { term: 'Retail', desc: 'Verified consumer product.' },
    ],
  },
  {
    title: 'The Value',
    Icon: ShieldIcon,
    items: [
      { term: 'Transparency', desc: 'Eliminates blind spots.' },
      { term: 'Safety', desc: 'Enforces health standards.' },
      { term: 'Control', desc: 'Rapid disease mitigation.' },
      { term: 'Efficiency', desc: 'Targeted product recalls.' },
    ],
  },
  {
    title: 'The Network',
    Icon: NetworkIcon,
    items: [
      { term: 'Handlers', desc: 'Farmers & transporters.' },
      { term: 'Oversight', desc: 'Veterinary inspectors.' },
      { term: 'Sales', desc: 'Processors & retailers.' },
      { term: 'Consumers', desc: 'Everyday shoppers.' },
    ],
  },
]

// Single safe scroll helper — replaces the three separate
// document.getElementById(...).scrollIntoView(...) call sites,
// all of which now null-check consistently.
function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function Intro({ onPickRole, onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null)

  return (
    <>
      {/* Skip link — first focusable element on the page. Lets keyboard/screen
          reader users bypass the hero image + scroll-cue button and land
          directly on the About section's real content. Visually hidden until
          focused; move the .skip-link / .visually-hidden rules below into your
          global stylesheet when convenient — kept inline here so this works
          immediately without touching your CSS file. */}
      <a href="#about" className="skip-link">
        Skip to main content
      </a>
      <style>{`
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .skip-link {
          position: absolute;
          top: -100%;
          left: 0;
          z-index: 1000;
          padding: 12px 20px;
          background: var(--cream-50, #fff);
          color: var(--ink, #111);
          font-weight: 600;
          text-decoration: none;
          transition: top 0.15s ease;
        }
        .skip-link:focus {
          top: 0;
        }
        .tag-card:focus-visible,
        .btn:focus-visible,
        .hero-scroll-cue:focus-visible {
          outline: 3px solid var(--accent, #4b8a3f);
          outline-offset: 3px;
        }
        .site-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          padding: 20px 32px;
          pointer-events: none; /* only the buttons inside should be clickable */
        }
        .site-header .btn {
          pointer-events: auto;
        }
        @media (max-width: 640px) {
          .site-header {
            padding: 14px 16px;
            gap: 8px;
          }
        }

        /* --- Role selection screen: enterprise card redesign --- */
        .section-head h2.enroll-title {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .tag-card {
          position: relative;
          cursor: pointer;
          border: 2px solid transparent;
          background: var(--card-bg, #fff);
          transition: all 0.2s ease-in-out;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .tag-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
        }
        .tag-card.is-selected {
          border-color: var(--maroon, #7A1F2B);
          background: rgba(122, 31, 43, 0.05);
          box-shadow: 0 14px 28px rgba(122, 31, 43, 0.16);
        }
        .tag-icon-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(122, 31, 43, 0.08);
          margin-bottom: 14px;
        }
        .tag-card.is-selected .tag-icon-badge {
          background: rgba(122, 31, 43, 0.14);
        }
        .continue-bar {
          display: flex;
          justify-content: center;
          margin-top: 40px;
        }
        .continue-btn {
          width: 100%;
          max-width: 340px;
          padding: 14px 24px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          font-size: 15px;
          background: var(--maroon, #7A1F2B);
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 6px 16px rgba(122, 31, 43, 0.25);
        }
        .continue-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(122, 31, 43, 0.3);
        }
        .continue-btn:disabled {
          background: #d8d8d8;
          color: #9a9a9a;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* --- About BeefTrace: 3-column overview grid --- */
        .about-headline {
          text-align: center;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          font-weight: 700;
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          letter-spacing: -0.01em;
          margin: 0 0 3rem;
        }
        .about-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        @media (max-width: 992px) {
          .about-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .about-grid {
            grid-template-columns: 1fr;
          }
        }
        .about-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border: 1px solid #1e1c1a;
          border-radius: 12px;
          padding: 2rem 1.5rem;
        }
        .about-col-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(122, 31, 43, 0.08);
          color: var(--maroon, #7a1f2b);
          margin-bottom: 1rem;
        }
        .about-col-icon svg {
          width: 28px;
          height: 28px;
        }
        .about-col-title {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem;
        }
        .about-col-list {
          list-style: none;
          margin: 0;
          padding: 0;
          text-align: left;
          width: 100%;
        }
        .about-col-list li {
          line-height: 1.6;
          padding: 0.4rem 0;
          border-bottom: 1px solid #f1f1f1;
        }
        .about-col-list li:last-child {
          border-bottom: none;
        }
        .about-term {
          font-weight: 700;
          color: #111827;
        }
        .about-desc {
          color: #4b5563;
        }
      `}</style>

      {/* Persistent top-right nav — same btn/btn-primary/btn-outline classes as
          the About section's CTAs, so it's styled identically. Fixed so it's
          reachable the instant the page loads, without waiting to scroll past
          the hero. The About section's own Get Started / Login buttons are
          left exactly as they were. */}
      <header className="site-header">
        <button className="btn btn-primary" onClick={() => scrollToId('enroll-section')}>
          Get Started
        </button>
        <button className="btn btn-outline" onClick={onLogin}>Login</button>
      </header>

      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${longhornImg})` }} aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-content">
          {/* h1 gives the page a real heading landmark for screen readers and
              search engines — previously the only text on the page lived inside
              an <img alt>, which isn't exposed as a heading. The logo image is
              now treated as decorative (empty alt) since its text is duplicated
              by the accessible h1 right below it. */}
          <img src={logo} alt="" className="hero-logo" />
          <h1 className="visually-hidden">BeefTrace — Digital Livestock Traceability System</h1>
        </div>

        <button className="hero-scroll-cue" onClick={() => scrollToId('about')} aria-label="Scroll to learn more">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </section>

      <section className="about" id="about">
        <div className="about-inner">
          <p className="eyebrow">About BeefTrace</p>
          <h2 className="about-headline">Complete visibility, farm to plate.</h2>

          <div className="about-grid">
            {overviewColumns.map(({ title, Icon, items }) => (
              <div className="about-col" key={title}>
                <div className="about-col-icon" aria-hidden="true">
                  <Icon />
                </div>
                <h3 className="about-col-title">{title}</h3>
                <ul className="about-col-list">
                  {items.map(({ term, desc }) => (
                    <li key={term}>
                      <span className="about-term">{term}:</span>{' '}
                      <span className="about-desc">{desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="about-cta">
            <button className="btn btn-primary" onClick={() => scrollToId('enroll-section')}>
              Get Started
            </button>
            <button className="btn btn-outline" onClick={onLogin}>Login </button>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="hero-inner">
          <p className="eyebrow">How it works</p>
          <h2 style={{ color: 'var(--cream-50)', fontSize: 26, fontWeight: 600, margin: '8px 0 4px' }}>
            One record, every stage of the journey
          </h2>
          {/* Ordered list: this is a real sequence (stage 1 of 7, 2 of 7, ...),
              so screen readers should announce it as one. The connector dots
              and lines are purely decorative and are hidden from assistive
              tech so they aren't announced as separate list content. */}
          <ol className="chain-strip">
            {roles.map((r, i) => (
              <Fragment key={r.name}>
                <li className="chain-node">
                  <div className="dot" aria-hidden="true"></div>
                  <p>{r.name}</p>
                </li>
                {i < roles.length - 1 && <div className="chain-line" aria-hidden="true"></div>}
              </Fragment>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" id="enroll-section">
        <div className="section-head">
          <p className="eyebrow">Enroll</p>
          <h2 className="enroll-title">Where do you sit in the chain?</h2>
          <p>Select your role in the supply chain to access your customized dashboard.</p>
        </div>
        <div className="tag-grid">
          {roles.map((r) => {
            const isSelected = selectedRole?.name === r.name
            return (
              <button
                className={`tag-card${isSelected ? ' is-selected' : ''}`}
                style={{ textAlign: 'left' }}
                key={r.name}
                aria-pressed={isSelected}
                onClick={() => setSelectedRole(r)}
              >
                <div className="tag-icon-badge">
                  <Icon className="tag-icon" size={26}>{r.icon}</Icon>
                </div>
                <h3>{r.name}</h3>
                <p>{r.desc}</p>
              </button>
            )
          })}
        </div>

        <div className="continue-bar">
          <button
            className="continue-btn"
            disabled={!selectedRole}
            onClick={() => selectedRole && onPickRole(selectedRole)}
          >
            Continue
          </button>
        </div>
      </section>

      <Footer onEnroll={() => scrollToId('enroll-section')} onLogin={onLogin} />
    </>
  )
}
