import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import GlobalNeuralBg from '../components/GlobalNeuralBg';
import { useData } from '../context/DataContext';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'Skills', href: '#skills' },
  { label: 'Certifications', href: '#certifications' },
];

export default function PublicLayout({ children }) {
  const { profile } = useData();
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = profile?.name || 'Portfolio';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Global subtle neural network background */}
      <GlobalNeuralBg />

      {/* Scroll progress */}
      <motion.div className="scroll-progress" style={{ scaleX: scrollProgress }} />

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#home" className="navbar-logo" onClick={() => setMobileOpen(false)}>
          {'<'}{displayName}{' />'}
        </a>

        {/* Desktop nav */}
        <ul className="navbar-links">
          {navLinks.map(link => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
          <li><a href="#contact" className="navbar-cta">Contact</a></li>
          <li><ThemeToggle /></li>
        </ul>

        {/* Mobile menu button */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="mobile-menu-btn-wrapper" style={{ display: 'none' }}>
            <ThemeToggle />
          </div>
          <button
            className={`mobile-menu-btn ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.06 }}
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a
              href="#contact"
              className="btn btn-primary"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: navLinks.length * 0.06 }}
              style={{ marginTop: 'var(--space-md)' }}
            >
              Contact Me
            </motion.a>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ marginTop: 'var(--space-md)' }}
            >
              <ThemeToggle />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content */}
      <main style={{ position: 'relative', zIndex: 1 }}>{children || <Outlet />}</main>

      {/* Footer */}
      <footer className="footer" style={{ position: 'relative', zIndex: 1 }}>
        <p>© {new Date().getFullYear()} {displayName}. Crafted with ❤️ and modern tech.</p>
      </footer>
    </>
  );
}
