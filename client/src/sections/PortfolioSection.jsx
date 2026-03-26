import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import AnimatedSection from '../components/AnimatedSection';
import CollapsibleSection from '../components/CollapsibleSection';
import TechIcon from '../components/TechIcon';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks/useAnalytics';

const categories = ['all', 'web', 'mobile', 'ai', 'backend'];

// Rich card entry animations — alternating directions
const cardVariants = [
  { opacity: 0, x: -80, y: 40, rotate: -3, scale: 0.9 },   // from left
  { opacity: 0, y: 60, scale: 0.85, filter: 'blur(8px)' },   // from bottom
  { opacity: 0, x: 80, y: 40, rotate: 3, scale: 0.9 },       // from right
];

export default function PortfolioSection() {
  const { projects } = useData();
  const { trackSection, trackProjectClick } = useAnalytics();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  useEffect(() => {
    if (isInView) trackSection('portfolio');
  }, [isInView, trackSection]);

  if (!projects || projects.length === 0) return null;

  const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);

  return (
    <div ref={sectionRef}>
      <CollapsibleSection
        id="portfolio"
        title="My"
        gradientWord="Portfolio"
        subtitle="Featured projects and work I'm proud of"
        defaultOpen={true}
      >
        <AnimatedSection delay={0.1} variant="fadeUp">
          <div className="portfolio-filters">
            {categories.map(cat => (
              <motion.button
                key={cat}
                className={`filter-btn ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
                whileTap={{ scale: 0.93 }}
                whileHover={{ y: -2 }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </motion.button>
            ))}
          </div>
        </AnimatedSection>

        <motion.div className="projects-grid" layout>
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project._id || project.title}
                className={`project-card ${project.featured ? 'featured' : ''}`}
                onClick={() => { setSelected(project); trackProjectClick(project._id); }}
                layout
                initial={cardVariants[i % 3]}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                  layout: { duration: 0.4 }
                }}
                whileHover={{ y: -10, scale: 1.02, boxShadow: '0 20px 50px rgba(0,212,255,0.08)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="project-thumbnail">
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.title} />
                  ) : (
                    <TechIcon name={project.techStack?.[0] || 'code'} size={48} />
                  )}
                  {project.featured && <span className="featured-badge">★ Featured</span>}
                </div>
                <div className="project-info">
                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-desc">{project.description}</p>
                  <div className="project-tech">
                    {project.techStack?.slice(0, 4).map(tech => (
                      <span key={tech} className="tech-tag">
                        <TechIcon name={tech} size={13} />
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="project-links">
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}>🔗 Live</a>
                    )}
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}>📂 GitHub</a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <Modal isOpen={!!selected} onClose={() => setSelected(null)}>
          {selected && (
            <div className="project-detail-modal">
              {selected.thumbnail && (
                <img src={selected.thumbnail} alt={selected.title}
                  style={{ width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-xl)', objectFit: 'cover', maxHeight: 300 }} />
              )}
              <h2>{selected.title}</h2>
              <p className="project-detail-desc">{selected.longDescription || selected.description}</p>
              <div className="project-tech" style={{ marginBottom: 'var(--space-xl)' }}>
                {selected.techStack?.map(tech => (
                  <span key={tech} className="tech-tag"><TechIcon name={tech} size={14} /> {tech}</span>
                ))}
              </div>
              <div className="project-detail-links">
                {selected.liveUrl && <a href={selected.liveUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer">View Live →</a>}
                {selected.githubUrl && <a href={selected.githubUrl} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">GitHub</a>}
              </div>
            </div>
          )}
        </Modal>
      </CollapsibleSection>
    </div>
  );
}
