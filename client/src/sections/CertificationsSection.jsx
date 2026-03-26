import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import AnimatedSection from '../components/AnimatedSection';
import CollapsibleSection from '../components/CollapsibleSection';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks/useAnalytics';

export default function CertificationsSection() {
  const { certifications } = useData();
  const { trackSection } = useAnalytics();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  useEffect(() => {
    if (isInView) trackSection('certifications');
  }, [isInView, trackSection]);

  const hasCerts = certifications && certifications.length > 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div ref={sectionRef}>
      <CollapsibleSection
        id="certifications"
        title="My"
        gradientWord="Certifications"
        subtitle="Professional certifications and achievements"
        defaultOpen={true}
      >
        {hasCerts ? (
          <div className="certs-grid">
            {certifications.map((cert, i) => {
              const entryVariants = [
                { opacity: 0, x: -60, y: 30, rotate: -4, scale: 0.85 },
                { opacity: 0, y: 60, scale: 0.8, filter: 'blur(8px)' },
                { opacity: 0, x: 60, y: 30, rotate: 4, scale: 0.85 },
              ];
              return (
              <motion.div
                key={cert._id || i}
                className="cert-card"
                initial={entryVariants[i % 3]}
                animate={isInView ? { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: 'blur(0px)' } : {}}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, scale: 1.03, boxShadow: '0 16px 40px rgba(0,212,255,0.08)' }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="cert-badge">
                  {cert.badgeImage ? (
                    <img src={cert.badgeImage} alt={cert.title} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
                  ) : (
                    '🏆'
                  )}
                </div>
                <h3 className="cert-title">{cert.title}</h3>
                <p className="cert-issuer">{cert.issuer}</p>
                <p className="cert-date">
                  Issued: {formatDate(cert.issueDate)}
                  {cert.expiryDate && ` · Exp: ${formatDate(cert.expiryDate)}`}
                </p>
                {cert.credentialUrl && (
                  <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="cert-verify">
                    Verify Credential →
                  </a>
                )}
              </motion.div>
              );
            })}
          </div>
        ) : (
          <AnimatedSection variant="blurIn" delay={0.2}>
            <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-md)' }}>🎓</p>
              <p>Certifications coming soon — currently pursuing advanced certifications in AI and cloud technologies.</p>
            </div>
          </AnimatedSection>
        )}
      </CollapsibleSection>
    </div>
  );
}
