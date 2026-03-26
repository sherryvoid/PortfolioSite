import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import AnimatedSection from '../components/AnimatedSection';
import CollapsibleSection from '../components/CollapsibleSection';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks/useAnalytics';
import api from '../api/axiosConfig';

// Hexagonal info card component
function HexInfoCard({ icon, label, value, delay = 0 }) {
  return (
    <motion.div
      className="hex-info-card"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.03 }}
    >
      <div className="hex-shape">
        <div className="hex-icon">{icon}</div>
      </div>
      <div className="hex-info-text">
        <span className="hex-label">{label}</span>
        <span className="hex-value">{value}</span>
      </div>
    </motion.div>
  );
}

// Hexagonal social link
function HexSocialLink({ href, children, delay = 0 }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hex-social-link"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.a>
  );
}

export default function ContactSection() {
  const { profile } = useData();
  const { trackSection } = useAnalytics();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isInView) trackSection('contact');
  }, [isInView, trackSection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/contact', form);
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus(null), 4000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus(null), 4000);
    }
    setLoading(false);
  };

  return (
    <div ref={sectionRef}>
      <CollapsibleSection
        id="contact"
        title="Get In"
        gradientWord="Touch"
        subtitle="Have a project in mind? Let's work together!"
        defaultOpen={true}
      >
        {/* Hexagonal info strip */}
        <div className="hex-info-strip">
          <HexInfoCard
            icon="📧"
            label="EMAIL"
            value={profile?.email || 'contact@portfolio.com'}
            delay={0.1}
          />
          <HexInfoCard
            icon="📍"
            label="LOCATION"
            value={profile?.location || 'Pakistan'}
            delay={0.2}
          />
          <HexInfoCard
            icon="🚀"
            label="STATUS"
            value="Available for Work"
            delay={0.3}
          />
        </div>

        {/* Main contact layout */}
        <div className="contact-hex-layout">
          {/* Form in hexagonal frame */}
          <AnimatedSection variant="fadeLeft" delay={0.2}>
            <div className="hex-form-frame">
              <div className="hex-frame-corner hex-frame-tl" />
              <div className="hex-frame-corner hex-frame-tr" />
              <div className="hex-frame-corner hex-frame-bl" />
              <div className="hex-frame-corner hex-frame-br" />

              <div className="hex-form-header">
                <div className="hex-form-indicator" />
                <span>SECURE_CHANNEL</span>
              </div>

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <input type="text" className="form-input hex-input" placeholder="John Doe"
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Email</label>
                    <input type="email" className="form-input hex-input" placeholder="john@example.com"
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input type="text" className="form-input hex-input" placeholder="Project Inquiry"
                    value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea hex-input" placeholder="Tell me about your project..."
                    value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                </div>

                {status === 'success' && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="form-status-msg success">
                    ✅ Transmission successful. I'll respond shortly.
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="form-status-msg error">
                    ⚠️ Transmission failed. Please retry.
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  className="btn btn-primary hex-submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? '⟳ Transmitting...' : '⬡ Send Transmission →'}
                </motion.button>
              </form>
            </div>
          </AnimatedSection>

          {/* Social links in hex grid */}
          <AnimatedSection variant="fadeRight" delay={0.3}>
            <div className="hex-social-grid">
              <div className="hex-social-header">
                <span>CONNECT_WITH_ME</span>
              </div>
              <div className="hex-social-links">
                {profile?.social?.github && (
                  <HexSocialLink href={profile.social.github} delay={0.1}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    <span>GitHub</span>
                  </HexSocialLink>
                )}
                {profile?.social?.linkedin && (
                  <HexSocialLink href={profile.social.linkedin} delay={0.2}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    <span>LinkedIn</span>
                  </HexSocialLink>
                )}
                {profile?.social?.twitter && (
                  <HexSocialLink href={profile.social.twitter} delay={0.3}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    <span>X / Twitter</span>
                  </HexSocialLink>
                )}
              </div>

              {/* Decorative hex grid background */}
              <svg className="hex-bg-pattern" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="100,10 170,45 170,115 100,150 30,115 30,45" stroke="rgba(0,212,255,0.08)" strokeWidth="0.5" fill="none" />
                <polygon points="100,30 150,55 150,105 100,130 50,105 50,55" stroke="rgba(0,212,255,0.05)" strokeWidth="0.5" fill="none" />
                <polygon points="100,50 130,65 130,95 100,110 70,95 70,65" stroke="rgba(0,212,255,0.03)" strokeWidth="0.5" fill="none" />
              </svg>
            </div>
          </AnimatedSection>
        </div>
      </CollapsibleSection>
    </div>
  );
}
