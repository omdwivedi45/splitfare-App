import { Link } from 'react-router-dom'
import styles from './Landing.module.css'

export default function Landing() {
  return (
    <div className={styles.page}>
      <div className={styles.heroGrid} />
      <div className={styles.orb1} /><div className={styles.orb2} />

      <section className={styles.hero}>
        <div className={styles.badge}><span className={styles.dot} /> Now Live in 24 Cities · India</div>
        <h1 className={styles.h1}>Share the Road.<br /><span className="accent">Split the Fare.</span></h1>
        <p className={styles.sub}>SplitFare connects vehicle owners with co-riders going the same way. Same origin, same destination — split the cost, save the planet.</p>
        <div className={styles.heroBtns}>
          <Link to="/register" className="btn btn-primary btn-lg">Get Started Free →</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </section>

      <div className={styles.statsBar}>
        {[['84,200+','Rides Completed'],['47%','Average Savings'],['12,800+','Active Users'],['320 Tons','CO₂ Saved']].map(([v,l],i) => (
          <div key={i} className={styles.stat}>
            <div className={styles.statVal}>{v}</div>
            <div className={styles.statLabel}>{l}</div>
          </div>
        ))}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className="section-tag">How It Works</div>
          <h2 className="section-title">Genius Simple. Ridiculously Fair.</h2>
          <p className="section-sub">Post your ride, get matched in seconds, travel together, split automatically.</p>
        </div>
        <div className={styles.stepsGrid}>
          {[
            { n:'01', icon:'📍', title:'Set Your Journey', desc:'Enter origin & destination. Pick your role — driver or rider. Set your departure time.' },
            { n:'02', icon:'🔍', title:'Get Matched', desc:'Our algorithm finds the best match based on route overlap, timing, and ratings. Instant.' },
            { n:'03', icon:'🚘', title:'Ride Together', desc:'Accept the match, track in real-time, meet at the pickup point. Both reach destination.' },
            { n:'04', icon:'💸', title:'Auto Split Fare', desc:'Fare calculated on distance and riders. Pay digitally via UPI or Razorpay. Clean.' },
          ].map((s,i) => (
            <div key={i} className={styles.stepCard}>
              <div className={styles.stepNum}>{s.n}</div>
              <div className={styles.stepIcon}>{s.icon}</div>
              <div className={styles.stepTitle}>{s.title}</div>
              <div className={styles.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} style={{ background: 'var(--bg2)', padding: '80px 0' }}>
        <div className={styles.sectionHeader}>
          <div className="section-tag">Features</div>
          <h2 className="section-title">Built for Modern India</h2>
        </div>
        <div className={styles.featGrid}>
          {[
            { icon:'⚡', title:'Instant Matching', desc:'Sub-second route overlap detection.' },
            { icon:'🗺️', title:'Live GPS Tracking', desc:'Real-time tracking with OpenStreetMap.' },
            { icon:'🛡️', title:'Verified Users', desc:'Aadhaar, PAN, DL — admin-verified.' },
            { icon:'💳', title:'UPI & Razorpay', desc:'Pay via UPI, PhonePe, Google Pay.' },
            { icon:'👥', title:'Multi-Rider Splits', desc:'Split 2, 3, or 4 ways.' },
            { icon:'🌿', title:'CO₂ Tracker', desc:'See your environmental impact per ride.' },
            { icon:'⭐', title:'Rating System', desc:'Build trust with community ratings.' },
            { icon:'📱', title:'Real-time Alerts', desc:'Socket.IO live notifications.' },
          ].map((f,i) => (
            <div key={i} className={styles.featCard}>
              <div className={styles.featIcon}>{f.icon}</div>
              <div className={styles.featTitle}>{f.title}</div>
              <div className={styles.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaOrb} />
        <h2 className="section-title" style={{ textAlign:'center' }}>Ready to Split Your First Fare?</h2>
        <p className="section-sub" style={{ textAlign:'center', margin:'16px auto 40px', maxWidth:480 }}>Join thousands of commuters saving money every day. Free to join, always.</p>
        <div style={{ display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          <Link to="/register" className="btn btn-primary btn-lg">Create Free Account →</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLogo}>⚡ SplitFare</div>
        <div className={styles.footerText}>© 2025 SplitFare. Built with ❤️ for India's commuters.</div>
      </footer>
    </div>
  )
}
