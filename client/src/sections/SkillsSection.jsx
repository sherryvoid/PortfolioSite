import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import AnimatedSection from '../components/AnimatedSection';
import CollapsibleSection from '../components/CollapsibleSection';
import TechIcon from '../components/TechIcon';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks/useAnalytics';

const fallbackSkills = [
  { name: 'React', category: 'frontend', icon: 'react' },
  { name: 'JavaScript', category: 'frontend', icon: 'javascript' },
  { name: 'TypeScript', category: 'frontend', icon: 'typescript' },
  { name: 'HTML/CSS', category: 'frontend', icon: 'html5' },
  { name: 'Node.js', category: 'backend', icon: 'nodejs' },
  { name: 'Express', category: 'backend', icon: 'express' },
  { name: 'Python', category: 'backend', icon: 'python' },
  { name: 'MongoDB', category: 'database', icon: 'mongodb' },
  { name: 'PostgreSQL', category: 'database', icon: 'postgresql' },
  { name: 'Docker', category: 'devops', icon: 'docker' },
  { name: 'Git', category: 'tools', icon: 'git' },
  { name: 'Firebase', category: 'backend', icon: 'firebase' },
];

const categoryLabels = {
  all: 'All',
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  devops: 'DevOps',
  tools: 'Tools',
  frameworks: 'Frameworks'
};

const getSkillColor = (name) => {
  const n = name.toLowerCase();
  if (n.includes('react') || n.includes('sql') || n.includes('tailwind')) return 'linear-gradient(135deg, #00d4ff, #0055ff, #00d4ff)';
  if (n.includes('node') || n.includes('mongo') || n.includes('vue')) return 'linear-gradient(135deg, #10b981, #047857, #10b981)';
  if (n.includes('aws') || n.includes('git') || n.includes('html')) return 'linear-gradient(135deg, #f97316, #ea580c, #f97316)';
  if (n.includes('python')) return 'linear-gradient(135deg, #fbbf24, #0284c7, #fbbf24)';
  if (n.includes('typescript') || n.includes('docker') || n.includes('css')) return 'linear-gradient(135deg, #3b82f6, #1d4ed8, #3b82f6)';
  if (n.includes('graphql') || n.includes('figma')) return 'linear-gradient(135deg, #ec4899, #db2777, #ec4899)';
  if (n.includes('javascript') || n.includes('js')) return 'linear-gradient(135deg, #facc15, #ca8a04, #facc15)';
  return 'linear-gradient(135deg, #00d4ff, #8a2be2, #00d4ff)'; // sci-fi default
};

const getSkillGlowColor = (name) => {
  const n = name.toLowerCase();
  if (n.includes('react') || n.includes('sql') || n.includes('tailwind')) return 'rgba(0, 212, 255, 0.6)';
  if (n.includes('node') || n.includes('mongo') || n.includes('vue')) return 'rgba(16, 185, 129, 0.6)';
  if (n.includes('aws') || n.includes('git') || n.includes('html')) return 'rgba(249, 115, 22, 0.6)';
  if (n.includes('python')) return 'rgba(251, 191, 36, 0.6)';
  if (n.includes('typescript') || n.includes('docker') || n.includes('css')) return 'rgba(59, 130, 246, 0.6)';
  if (n.includes('graphql') || n.includes('figma')) return 'rgba(236, 72, 153, 0.6)';
  if (n.includes('javascript') || n.includes('js')) return 'rgba(250, 204, 21, 0.6)';
  return 'rgba(138, 43, 226, 0.6)'; 
};

export default function SkillsSection() {
  const { skills: apiSkills } = useData();
  const { trackSection } = useAnalytics();
  const [filter, setFilter] = useState('all');
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    if (isInView) trackSection('skills');
  }, [isInView, trackSection]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use 18 placeholder items if the list is smaller, so we can showcase the 6-5-6 grid beautifully
  let displaySkills = apiSkills && apiSkills.length > 0 ? apiSkills : fallbackSkills;
  
  // If the user hasn't added 17 skills (6+5+6), let's tile them to show the layout or use what's there
  if (displaySkills.length < 17 && filter === 'all') {
    // optional: tile them to fill the grid to demonstrate the massive honeycomb look
    const missing = 17 - displaySkills.length;
    displaySkills = [...displaySkills, ...fallbackSkills.slice(0, missing)];
  }

  const categories = ['all', ...new Set((apiSkills && apiSkills.length > 0 ? apiSkills : fallbackSkills).map(s => s.category))];
  const filtered = filter === 'all' ? displaySkills : displaySkills.filter(s => s.category === filter);

  // Chunking logic for 6 - 5 - 6 pattern with parity tracking
  const honeycombRows = useMemo(() => {
    let evenSize = 6;
    let oddSize = 5;
    if (windowWidth < 480) { evenSize = 3; oddSize = 2; }
    else if (windowWidth < 768) { evenSize = 4; oddSize = 3; }
    else if (windowWidth < 1024) { evenSize = 5; oddSize = 4; }

    const rows = [];
    let i = 0;
    let isEvenRow = true;
    while (i < filtered.length) {
      const size = isEvenRow ? evenSize : oddSize;
      rows.push({
        items: filtered.slice(i, i + size),
        expectedSize: size
      });
      i += size;
      isEvenRow = !isEvenRow;
    }
    return rows;
  }, [filtered, windowWidth]);

  return (
    <div ref={sectionRef}>
      <CollapsibleSection
        id="skills"
        title="Tech"
        gradientWord="Stack"
        subtitle="The tools and technologies I work with"
        defaultOpen={true}
      >
        <AnimatedSection delay={0.1} variant="fadeUp">
          <div className="honeycomb-filters">
            {categories.map(cat => (
              <motion.button
                key={cat}
                className={`filter-btn ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
                whileTap={{ scale: 0.93 }}
                whileHover={{ y: -2 }}
                layout
              >
                {categoryLabels[cat] || cat}
              </motion.button>
            ))}
          </div>
        </AnimatedSection>

        {/* The Expertise Hive Container */}
        <div className="hive-container">
          <AnimatePresence mode="popLayout">
            {honeycombRows.map((rowObj, r) => {
              const { items, expectedSize } = rowObj;
              // If actual item count has different parity than expected, 
              // we inject 1 invisible spacer to push the visual center over by half a slot!
              const needsOffset = (items.length % 2) !== (expectedSize % 2);

              return (
                <motion.div 
                  className="hive-row" 
                  key={`row-${r}-${filter}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: r * 0.1, duration: 0.3 }}
                >
                  {needsOffset && (
                    <div className="hex-outer-glow invisible" style={{ visibility: 'hidden', pointerEvents: 'none' }}>
                      <div className="hex-wrapper"></div>
                    </div>
                  )}
                  {items.map((skill, index) => (
                    <motion.div
                      key={`${skill.name}-${index}`}
                      className="hex-outer-glow"
                      layout
                      style={{ 
                         '--hex-border-color': getSkillColor(skill.name),
                         '--hex-glow-color': getSkillGlowColor(skill.name) 
                      }}
                    >
                      <div className="hex-wrapper">
                        <div className="hex-inner">
                          <div className="hex-icon">
                            <TechIcon name={skill.icon || skill.name} size={55} />
                          </div>
                          <span className="hex-label">{skill.name}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CollapsibleSection>
    </div>
  );
}
