import { useEffect, useRef } from 'react';

// Global background neural network — visible behind all content
export default function GlobalNeuralBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let nodes = [];
    const connectionDist = 200;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initNodes() {
      // More nodes for visibility
      const count = Math.floor((window.innerWidth * window.innerHeight) / 25000);
      nodes = [];
      for (let i = 0; i < Math.max(count, 30); i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.8 + 0.5,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.01 + Math.random() * 0.02,
        });
      }
    }

    // Signal particles
    const signals = [];
    function spawnSignal() {
      if (signals.length > 8) return;
      const a = Math.floor(Math.random() * nodes.length);
      let closest = -1;
      let closestDist = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        if (i === a) continue;
        const dx = nodes[i].x - nodes[a].x;
        const dy = nodes[i].y - nodes[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDist && dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
      if (closest >= 0) {
        signals.push({ a, b: closest, t: 0, speed: 0.008 + Math.random() * 0.012 });
      }
    }

    let frame = 0;
    let scrollY = 0;

    function onScroll() {
      scrollY = window.scrollY;
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      if (frame % 60 === 0) spawnSignal();

      // Move nodes
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = canvas.width + 10;
        if (n.x > canvas.width + 10) n.x = -10;
        if (n.y < -10) n.y = canvas.height + 10;
        if (n.y > canvas.height + 10) n.y = -10;
        n.pulsePhase += n.pulseSpeed;
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 180, 255, ${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        const pulse = 0.4 + Math.sin(n.pulsePhase) * 0.3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 200, 255, ${pulse})`;
        ctx.fill();

        // Subtle glow on larger nodes
        if (n.size > 1.5) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 200, 255, ${pulse * 0.08})`;
          ctx.fill();
        }
      });

      // Draw signals
      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        sig.t += sig.speed;
        if (sig.t >= 1) { signals.splice(s, 1); continue; }
        const na = nodes[sig.a];
        const nb = nodes[sig.b];
        const sx = na.x + (nb.x - na.x) * sig.t;
        const sy = na.y + (nb.y - na.y) * sig.t;
        const alpha = sig.t < 0.5 ? sig.t * 2 : (1 - sig.t) * 2;

        // Bright signal dot
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 180, ${alpha * 0.7})`;
        ctx.fill();

        // Signal glow
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 180, ${alpha * 0.15})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    }

    resize();
    initNodes();
    animate();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { resize(); initNodes(); });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="global-neural-bg"
      aria-hidden="true"
    />
  );
}
