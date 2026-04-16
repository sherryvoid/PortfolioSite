import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ParticleBackground from '../components/ParticleBackground';
import HeroIllustration from '../components/HeroIllustration';
import { useData } from '../context/DataContext';

export default function HeroSection() {
  const { profile } = useData();

  const name = profile?.name || 'Developer';
  const greeting = profile?.heroGreeting || 'Welcome to my portfolio';
  const availability = profile?.availability || profile?.status || 'Available for Work';
  const heroDesignation = profile?.heroDesignation || 'Full Stack Software Developer';
  const heroAbout = profile?.heroAbout || profile?.bio?.substring(0, 140) || 'Building the future with modern web technologies. Turning complex problems into elegant solutions.';

  return (
    <section className="hero" id="home">
      <ParticleBackground />

      <div className="hero-grid">
        {/* Left: Text content */}
        <motion.div
          className="hero-text"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="hero-status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="hero-status-dot" />
            {availability}
          </motion.div>

          <motion.p
            className="hero-greeting"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {greeting}
          </motion.p>

          <motion.h1
            className="hero-name"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            Hello, I'm <span className="gradient-text">{name}</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}
          >
            {heroDesignation}
          </motion.p>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
          >
            {heroAbout}
          </motion.p>

          <motion.div
            className="hero-cta-group"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <a href="#portfolio" className="btn btn-primary">View My Work →</a>
            <a href="#contact" className="btn btn-secondary">Get In Touch</a>
          </motion.div>
        </motion.div>

        {/* Right: Illustration */}
        <motion.div
          className="hero-illustration-wrapper"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-orbit-ring">
            {['⚛️', '🧠', '🎮', '☁️'].map((icon, i) => (
              <div key={i} className="orbit-icon" style={{
                '--orbit-speed': `${18 + i * 4}s`,
                top: '50%', left: '50%',
                transform: `rotate(${i * 90}deg) translateX(var(--orbit-radius)) rotate(-${i * 90}deg)`
              }}>
                {icon}
              </div>
            ))}
          </div>
          <HeroIllustration />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="hero-scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <div className="scroll-mouse" />
        <span>Scroll</span>
      </motion.div>
    </section>
  );
}
