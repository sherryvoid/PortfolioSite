import { useState } from 'react';

const DEVICON_URL = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';
const SIMPLE_ICONS_URL = 'https://cdn.simpleicons.org';

export default function TechIcon({ name, size = 24 }) {
  const [src, setSrc] = useState(`${DEVICON_URL}/${name}/${name}-original.svg`);
  const [fallbackStage, setFallbackStage] = useState(0);

  const handleError = () => {
    if (fallbackStage === 0) {
      setSrc(`${DEVICON_URL}/${name}/${name}-plain.svg`);
      setFallbackStage(1);
    } else if (fallbackStage === 1) {
      setSrc(`${SIMPLE_ICONS_URL}/${name}`);
      setFallbackStage(2);
    } else {
      setSrc(null);
      setFallbackStage(3);
    }
  };

  if (!src) {
    return (
      <span style={{
        width: size, height: size, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.5, color: 'var(--text-muted)'
      }}>
        ⚡
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={handleError}
      style={{ objectFit: 'contain' }}
      loading="lazy"
    />
  );
}
