import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import AnimatedSection from '../components/AnimatedSection';
import CollapsibleSection from '../components/CollapsibleSection';

export default function EducationSection() {
  const { profile } = useData();
  const education = profile?.education || [];

  if (!education.length) return null;

  return (
    <CollapsibleSection
      id="education"
      title="Academic"
      gradientWord="Journey"
      subtitle="My formal educational background"
    >
      <div className="education-grid" style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        {education.map((item, idx) => (
          <AnimatedSection key={idx} delay={idx * 0.1} variant={idx % 2 === 0 ? 'fadeLeft' : 'fadeRight'}>
            <motion.div 
              className="education-card"
              style={{
                background: 'var(--bg-secondary)',
                padding: 'var(--space-xl)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
              }}
              whileHover={{ scale: 1.01, boxShadow: '0 0 40px rgba(0, 212, 255, 0.08)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                background: 'var(--accent-primary)',
                boxShadow: '0 0 20px var(--accent-primary)'
              }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)' }}>
                    {item.degree} in {item.field}
                  </h3>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                    🏢 {item.institution}
                  </p>
                </div>
                <div style={{ background: 'rgba(0, 212, 255, 0.1)', color: 'var(--accent-primary)', padding: '6px 12px', borderRadius: '100px', fontSize: '0.9rem', fontWeight: 600 }}>
                  {item.year || 'N/A'}
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
        ))}
      </div>
    </CollapsibleSection>
  );
}
