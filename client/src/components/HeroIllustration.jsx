import { motion } from 'framer-motion';

// Pure SVG animated illustration of an AR/VR developer with holographic elements
export default function HeroIllustration() {
  return (
    <motion.svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 440, height: 'auto' }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
    >
      {/* Background glow */}
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#04070D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="grad3" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00FF88" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      <circle cx="250" cy="250" r="220" fill="url(#bgGlow)" />

      {/* Central AI brain */}
      <motion.g
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
      >
        {/* Brain outline */}
        <motion.path
          d="M250 140c-30 0-55 12-70 35-8 12-12 26-12 42 0 18 8 35 22 48l5 5c10 10 18 22 22 36 4 14 14 24 28 24h10c14 0 24-10 28-24 4-14 12-26 22-36l5-5c14-13 22-30 22-48 0-16-4-30-12-42-15-23-40-35-70-35z"
          stroke="url(#grad1)"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8, duration: 1.5, ease: 'easeInOut' }}
        />
        {/* Brain center line */}
        <motion.line
          x1="250" y1="148" x2="250" y2="325"
          stroke="url(#grad1)" strokeWidth="0.8" strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.5 }}
        />
        {/* Neural connections inside brain */}
        {[
          { x1: 220, y1: 180, x2: 250, y2: 200 },
          { x1: 280, y1: 180, x2: 250, y2: 200 },
          { x1: 250, y1: 200, x2: 230, y2: 240 },
          { x1: 250, y1: 200, x2: 270, y2: 240 },
          { x1: 230, y1: 240, x2: 250, y2: 280 },
          { x1: 270, y1: 240, x2: 250, y2: 280 },
          { x1: 210, y1: 210, x2: 230, y2: 240 },
          { x1: 290, y1: 210, x2: 270, y2: 240 },
        ].map((line, i) => (
          <motion.line
            key={i}
            {...line}
            stroke="url(#grad1)"
            strokeWidth="0.8"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3] }}
            transition={{ delay: 1 + i * 0.1, duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          />
        ))}
        {/* Neural nodes */}
        {[
          [220, 180], [280, 180], [250, 200], [230, 240],
          [270, 240], [250, 280], [210, 210], [290, 210]
        ].map(([cx, cy], i) => (
          <motion.circle
            key={`node-${i}`}
            cx={cx} cy={cy} r="3"
            fill="#00D4FF"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0.4, 1, 0.4], scale: 1 }}
            transition={{ delay: 1.2 + i * 0.08, duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
          />
        ))}
      </motion.g>

      {/* Floating code brackets */}
      <motion.text
        x="100" y="200"
        fill="#00D4FF"
        fontSize="28"
        fontFamily="monospace"
        opacity="0.5"
        animate={{ y: [200, 188, 200] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >{'</>'}</motion.text>

      <motion.text
        x="370" y="180"
        fill="#7C3AED"
        fontSize="22"
        fontFamily="monospace"
        opacity="0.4"
        animate={{ y: [180, 192, 180] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >{'{ }'}</motion.text>

      {/* Data stream particles */}
      {[0, 1, 2, 3, 4].map(i => (
        <motion.circle
          key={`stream-${i}`}
          cx={120 + i * 20}
          cy={350}
          r="2"
          fill="#00FF88"
          opacity="0.5"
          animate={{
            cx: [120 + i * 20, 380 - i * 15],
            cy: [350 - i * 10, 300 + i * 5],
            opacity: [0, 0.6, 0],
          }}
          transition={{ duration: 3, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Outer orbit ring */}
      <motion.circle
        cx="250" cy="250" r="200"
        stroke="url(#grad1)"
        strokeWidth="0.5"
        fill="none"
        strokeDasharray="6 10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2, rotate: 360 }}
        transition={{ opacity: { delay: 1 }, rotate: { duration: 60, repeat: Infinity, ease: 'linear' } }}
        style={{ transformOrigin: '250px 250px' }}
      />

      {/* Inner orbit ring */}
      <motion.circle
        cx="250" cy="250" r="130"
        stroke="url(#grad2)"
        strokeWidth="0.5"
        fill="none"
        strokeDasharray="4 8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15, rotate: -360 }}
        transition={{ opacity: { delay: 1.2 }, rotate: { duration: 45, repeat: Infinity, ease: 'linear' } }}
        style={{ transformOrigin: '250px 250px' }}
      />

      {/* VR headset outline */}
      <motion.g
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <motion.rect
          x="195" y="99" width="110" height="32" rx="12"
          stroke="url(#grad2)" strokeWidth="1.2" fill="rgba(124,58,237,0.05)"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.line
          x1="210" y1="110" x2="240" y2="110"
          stroke="#EC4899" strokeWidth="1" opacity="0.5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.line
          x1="260" y1="110" x2="290" y2="110"
          stroke="#EC4899" strokeWidth="1" opacity="0.5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
        />
      </motion.g>

      {/* Floating hex shapes */}
      <motion.polygon
        points="80,300 95,290 110,300 110,315 95,325 80,315"
        stroke="#7C3AED" strokeWidth="0.8" fill="none" opacity="0.3"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.polygon
        points="380,340 395,330 410,340 410,355 395,365 380,355"
        stroke="#00D4FF" strokeWidth="0.8" fill="none" opacity="0.25"
        animate={{ y: [0, 8, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 7, repeat: Infinity, delay: 1 }}
      />

      {/* Bottom data indicator */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2 }}
      >
        <rect x="200" y="370" width="100" height="4" rx="2" fill="rgba(0,212,255,0.15)" />
        <motion.rect
          x="200" y="370" width="60" height="4" rx="2" fill="url(#grad3)"
          animate={{ width: [30, 80, 50, 70, 30] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.g>
    </motion.svg>
  );
}
