import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import AnimatedSection from '../components/AnimatedSection';
import CollapsibleSection from '../components/CollapsibleSection';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks/useAnalytics';

function AnimatedCounter({ target, duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function AboutSection() {
  const { profile } = useData();
  const { trackSection } = useAnalytics();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  useEffect(() => {
    if (isInView) trackSection('about');
  }, [isInView, trackSection]);

  const bio = profile?.bio || 'Passionate software developer with expertise in building modern web applications. I specialize in React, Node.js, and cloud technologies. I love turning complex problems into simple, beautiful, and intuitive solutions.';
  const timeline = profile?.aboutTimeline || [];
  const profileImage = profile?.photo || '/images/profile.png';

  return (
    <div ref={sectionRef}>
      <CollapsibleSection
        id="about"
        title="About"
        gradientWord="Me"
        subtitle="Get to know me and my journey"
        defaultOpen={true}
      >
        <div className="about-grid">
          {/* Profile Image — flies in from bottom-left */}
          <div style={{ alignSelf: 'stretch', height: '100%' }}>
            <div style={{ position: 'sticky', top: '120px', height: 'fit-content' }}>
              <AnimatedSection variant="flyBottomLeft" delay={0.15}>
                <div className="about-illustration-wrapper">
                  <div className="profile-image-frame">
                <img
                  src={profileImage}
                  alt={`${profile?.name || 'Developer'} — Software Developer`}
                  className="profile-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="profile-image-placeholder" style={{ display: 'none' }}>
                  <span>📸</span>
                  <p>Upload your photo to<br /><code>client/public/images/profile.png</code></p>
                </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>

          {/* Bio + Stats — flies in from bottom-right */}
          <AnimatedSection variant="flyBottomRight" delay={0.25}>
            <div className="about-bio">
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{bio}</p>
            </div>

            {/* Stats — each from a different direction */}
            <div className="about-stats">
              {[
                { key: 'yearsExperience', label: 'Years Exp', fallback: 3, variant: 'dropIn', delay: 0.3 },
                { key: 'projectsCompleted', label: 'Projects', fallback: 15, variant: 'scaleIn', delay: 0.4 },
                { key: 'happyClients', label: 'Clients', fallback: 10, variant: 'dropIn', delay: 0.5 },
              ].map(({ key, label, fallback, variant, delay }) => (
                <AnimatedSection key={key} variant={variant} delay={delay}>
                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -6, scale: 1.04, boxShadow: '0 0 30px rgba(0,212,255,0.12)' }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <div className="stat-number">
                      <AnimatedCounter target={profile?.stats?.[key] || fallback} />+
                    </div>
                    <div className="stat-label">{label}</div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>

            {timeline.length > 0 && (
              <div className="timeline">
                {timeline.map((item, i) => (
                  <AnimatedSection key={i} delay={0.15 * i} variant={i % 2 === 0 ? 'fadeLeft' : 'fadeRight'}>
                    <div className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-year">{item.year}</div>
                      <div className="timeline-title">{item.title}</div>
                      <div className="timeline-desc" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{item.description}</div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            )}
          </AnimatedSection>
        </div>
      </CollapsibleSection>
    </div>
  );
}
