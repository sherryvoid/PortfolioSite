import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import AnimatedSection from '../components/AnimatedSection';
import CollapsibleSection from '../components/CollapsibleSection';
import TechIcon from '../components/TechIcon';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks/useAnalytics';

const fallbackSkills = [
  { name: 'React', category: 'frontend', proficiency: 90, icon: 'react' },
  { name: 'JavaScript', category: 'frontend', proficiency: 92, icon: 'javascript' },
  { name: 'TypeScript', category: 'frontend', proficiency: 80, icon: 'typescript' },
  { name: 'HTML/CSS', category: 'frontend', proficiency: 95, icon: 'html5' },
  { name: 'Node.js', category: 'backend', proficiency: 88, icon: 'nodejs' },
  { name: 'Express', category: 'backend', proficiency: 85, icon: 'express' },
  { name: 'Python', category: 'backend', proficiency: 75, icon: 'python' },
  { name: 'MongoDB', category: 'database', proficiency: 82, icon: 'mongodb' },
  { name: 'PostgreSQL', category: 'database', proficiency: 70, icon: 'postgresql' },
  { name: 'Docker', category: 'devops', proficiency: 65, icon: 'docker' },
  { name: 'Git', category: 'tools', proficiency: 90, icon: 'git' },
  { name: 'Firebase', category: 'backend', proficiency: 72, icon: 'firebase' },
];

const categoryLabels = {
  all: 'All',
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  devops: 'DevOps',
  tools: 'Tools'
};

export default function SkillsSection() {
  const { skills: apiSkills } = useData();
  const { trackSection } = useAnalytics();
  const [filter, setFilter] = useState('all');
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  useEffect(() => {
    if (isInView) trackSection('skills');
  }, [isInView, trackSection]);

  const skills = apiSkills && apiSkills.length > 0 ? apiSkills : fallbackSkills;
  const categories = ['all', ...new Set(skills.map(s => s.category))];
  const filtered = filter === 'all' ? skills : skills.filter(s => s.category === filter);

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

        {/* True Honeycomb Layout — staggered rows like the reference */}
        <div className="hive-wrapper">
          <motion.div className="hive" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((skill, i) => (
                <motion.div
                  key={skill._id || skill.name}
                  className="hive-cell"
                  layout
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{
                    delay: i * 0.06,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    layout: { duration: 0.4 }
                  }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Outer hex border glow */}
                  <div className="hive-hex-border">
                    <div className="hive-hex-bg">
                      <div className="hive-hex-content">
                        <div className="hive-icon">
                          <TechIcon name={skill.icon || skill.name} size={48} />
                        </div>
                        <span className="hive-name">{skill.name}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
