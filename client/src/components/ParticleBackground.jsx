import { useEffect, useRef, useCallback } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  const handleMouse = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { ...mouseRef.current, active: false };
  }, []);

  const handleTouch = useCallback((e) => {
    if (e.touches.length > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top, active: true };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let w, h;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };

    class Particle {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.baseSize = Math.random() * 1.8 + 0.4;
        this.size = this.baseSize;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.4 + 0.15;
        this.baseOpacity = this.opacity;
        // Color variation: mostly cyan, some purple
        this.hue = Math.random() > 0.7 ? 270 : 190;
        this.sat = this.hue === 270 ? 70 : 100;
      }

      update() {
        const mouse = mouseRef.current;

        // Autonomous movement
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
        this.x = Math.max(0, Math.min(w, this.x));
        this.y = Math.max(0, Math.min(h, this.y));

        // Mouse interaction: gravitational pull
        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 200;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 0.015;
            this.vx += dx * force;
            this.vy += dy * force;
            // Brighten near cursor
            this.opacity = this.baseOpacity + (1 - dist / maxDist) * 0.5;
            this.size = this.baseSize + (1 - dist / maxDist) * 2;
          } else {
            this.opacity += (this.baseOpacity - this.opacity) * 0.05;
            this.size += (this.baseSize - this.size) * 0.05;
          }

          // Damping
          this.vx *= 0.98;
          this.vy *= 0.98;
        } else {
          this.opacity += (this.baseOpacity - this.opacity) * 0.02;
          this.size += (this.baseSize - this.size) * 0.02;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, 60%, ${this.opacity})`;
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const isMobile = w < 768;
      const count = isMobile
        ? Math.min(40, Math.floor((w * h) / 25000))
        : Math.min(100, Math.floor((w * h) / 12000));
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    const drawConnections = () => {
      const mouse = mouseRef.current;
      const connectionDist = 160;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            let alpha = 0.06 * (1 - dist / connectionDist);

            // Brighten connections near cursor
            if (mouse.active) {
              const midX = (particles[i].x + particles[j].x) / 2;
              const midY = (particles[i].y + particles[j].y) / 2;
              const mouseDist = Math.sqrt((mouse.x - midX) ** 2 + (mouse.y - midY) ** 2);
              if (mouseDist < 180) {
                alpha += (1 - mouseDist / 180) * 0.2;
              }
            }

            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 212, 255, ${Math.min(alpha, 0.3)})`;
            ctx.lineWidth = alpha > 0.1 ? 0.8 : 0.4;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Draw connection to mouse if close
        if (mouse.active) {
          const dx = mouse.x - particles[i].x;
          const dy = mouse.y - particles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const alpha = (1 - dist / 200) * 0.25;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
    };

    const drawCursorGlow = () => {
      const mouse = mouseRef.current;
      if (!mouse.active) return;

      const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.06)');
      gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.02)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 160, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      drawCursorGlow();
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      animationId = requestAnimationFrame(animate);
    };

    resize();
    init();
    animate();

    const el = canvas.parentElement || window;
    el.addEventListener('mousemove', handleMouse, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('touchmove', handleTouch, { passive: true });
    el.addEventListener('touchend', handleMouseLeave);
    window.addEventListener('resize', () => { resize(); init(); });

    return () => {
      cancelAnimationFrame(animationId);
      el.removeEventListener('mousemove', handleMouse);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('touchmove', handleTouch);
      el.removeEventListener('touchend', handleMouseLeave);
      window.removeEventListener('resize', resize);
    };
  }, [handleMouse, handleMouseLeave, handleTouch]);

  return <canvas ref={canvasRef} className="particle-canvas" style={{ pointerEvents: 'auto' }} />;
}
