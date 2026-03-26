import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CollapsibleSection({ title, subtitle, gradientWord, children, defaultOpen = true, id }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="section collapsible-section" id={id}>
      <motion.div
        className={`collapsible-header ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.002 }}
        whileTap={{ scale: 0.998 }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen); }}
      >
        {/* Decorative hex corners */}
        <div className="collapsible-corner collapsible-corner-tl" />
        <div className="collapsible-corner collapsible-corner-tr" />
        <div className="collapsible-corner collapsible-corner-bl" />
        <div className="collapsible-corner collapsible-corner-br" />

        <div className="collapsible-title-row">
          <div className="collapsible-line-left" />
          <h2>
            {title} <span className="gradient-text">{gradientWord}</span>
          </h2>
          <motion.div
            className="collapse-toggle"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <div className="collapsible-line-right" />
        </div>

        {subtitle && <p className="collapsible-subtitle">{subtitle}</p>}

        {/* Animated status indicator */}
        <div className="collapsible-status">
          <span className={`status-dot ${isOpen ? 'active' : ''}`} />
          <span className="status-text">{isOpen ? 'EXPANDED' : 'COLLAPSED'}</span>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="collapsible-content"
            initial={{ height: 0, opacity: 0, filter: 'blur(8px)' }}
            animate={{
              height: 'auto',
              opacity: 1,
              filter: 'blur(0px)',
              transition: {
                height: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.35, delay: 0.1 },
                filter: { duration: 0.4, delay: 0.1 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              filter: 'blur(6px)',
              transition: {
                opacity: { duration: 0.2 },
                filter: { duration: 0.2 },
                height: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 },
              },
            }}
            style={{ overflow: 'hidden' }}
          >
            <div className="collapsible-inner">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
