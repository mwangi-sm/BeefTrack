import logo from '../../assets/BTheader.png'
import './Footer.css'

export function Footer({ onEnroll, onLogin }) {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src={logo} alt="BeefTrace" className="footer-logo" />
          <p>
            A digital livestock traceability system giving every stakeholder in the beef
            supply chain — from farm to plate — timely, trustworthy information.
          </p>
        </div>

        <div className="footer-col">
          <h4>Quick links</h4>
          <ul>
            <li><a href="#about">About BeefTrace</a></li>
            <li><button onClick={onEnroll}>Enroll as a stakeholder</button></li>
            <li><button onClick={onLogin}>I already have an account</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul className="footer-contact">
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /><path d="M4 6l8 7 8-7" /></svg>
              info@beeftrace.africa
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 2 .6 2.9a2 2 0 01-.5 2.1L8 10a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.9.5 2.9.6a2 2 0 011.7 2z" /></svg>
              +254 720 197 800
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.5-7-10a7 7 0 0114 0c0 5.5-7 10-7 10z" /><circle cx="12" cy="11" r="2.5" /></svg>
              JKUAT, Juja, Kenya
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>A JHUB Africa initiative</h4>
          <p className="footer-note">
            Built at Jomo Kenyatta University of Agriculture and Technology to strengthen
            transparency, food safety and disease surveillance across Kenya's beef value chain.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} BeefTrace. All rights reserved.</span>
        <span>JHUB Africa · Innovations for transformation</span>
      </div>
    </footer>
  )
}

export default Footer
