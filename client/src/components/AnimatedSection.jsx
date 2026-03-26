import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

// Rich futuristic animation variants — elements assemble from different directions
const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 60, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
  },
  fadeDown: {
    hidden: { opacity: 0, y: -50, filter: 'blur(6px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -80, rotateY: 8, filter: 'blur(6px)' },
    visible: { opacity: 1, x: 0, rotateY: 0, filter: 'blur(0px)' }
  },
  fadeRight: {
    hidden: { opacity: 0, x: 80, rotateY: -8, filter: 'blur(6px)' },
    visible: { opacity: 1, x: 0, rotateY: 0, filter: 'blur(0px)' }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.7, filter: 'blur(10px)' },
    visible: { opacity: 1, scale: 1, filter: 'blur(0px)' }
  },
  blurIn: {
    hidden: { opacity: 0, filter: 'blur(16px)', y: 30 },
    visible: { opacity: 1, filter: 'blur(0px)', y: 0 }
  },
  // New: element flies in from bottom-left corner
  flyBottomLeft: {
    hidden: { opacity: 0, x: -100, y: 80, rotate: -5, scale: 0.8 },
    visible: { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }
  },
  // New: element flies in from bottom-right corner
  flyBottomRight: {
    hidden: { opacity: 0, x: 100, y: 80, rotate: 5, scale: 0.8 },
    visible: { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }
  },
  // New: element drops from top with bounce
  dropIn: {
    hidden: { opacity: 0, y: -100, scale: 0.85 },
    visible: { opacity: 1, y: 0, scale: 1 }
  },
  // New: spin + scale in (for icons/badges)
  spinIn: {
    hidden: { opacity: 0, scale: 0, rotate: -180 },
    visible: { opacity: 1, scale: 1, rotate: 0 }
  },
  // New: slide + flip from perspective
  flipUp: {
    hidden: { opacity: 0, y: 50, rotateX: 45, transformPerspective: 800 },
    visible: { opacity: 1, y: 0, rotateX: 0 }
  },
};

export default function AnimatedSection({
  children,
  delay = 0,
  variant = 'fadeUp',
  duration = 0.8,
  className = '',
  once = true,
  amount = 0.12,
  stagger = false,
  ...props
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  const selectedVariant = variants[variant] || variants.fadeUp;

  if (stagger) {
    return (
      <motion.div
        ref={ref}
        className={className}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1, delayChildren: delay } }
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={selectedVariant}
      transition={{
        delay,
        duration,
        ease: [0.16, 1, 0.3, 1]
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Export a child variant for use with stagger
export function AnimatedChild({ children, variant = 'fadeUp', className = '', ...props }) {
  const selectedVariant = variants[variant] || variants.fadeUp;
  return (
    <motion.div
      className={className}
      variants={selectedVariant}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
