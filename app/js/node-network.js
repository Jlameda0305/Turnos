/**
 * AIONEX — Node Network Background
 * Renders a subtle, slow-moving constellation of silver nodes and connections.
 * Purely decorative — no impact on application logic.
 * Aligned with AIONEX brand: "Arquitecturas Inteligentes" concept.
 */
(function () {
  'use strict';

  const bgEl = document.querySelector('.bg');
  if (!bgEl) return;

  const canvas = document.createElement('canvas');
  bgEl.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const CONFIG = {
    nodeCount: 45,
    maxDistance: 160,
    nodeMinRadius: 1,
    nodeMaxRadius: 2.5,
    speed: 0.15,
    nodeColor: 'rgba(201, 204, 209, VAR)',   // plateado with variable alpha
    lineColor: 'rgba(201, 204, 209, VAR)',
    nodeMinAlpha: 0.15,
    nodeMaxAlpha: 0.45,
    lineMaxAlpha: 0.08,
  };

  let nodes = [];
  let w, h;
  let animId;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createNodes() {
    nodes = [];
    for (let i = 0; i < CONFIG.nodeCount; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * CONFIG.speed,
        vy: (Math.random() - 0.5) * CONFIG.speed,
        r: CONFIG.nodeMinRadius + Math.random() * (CONFIG.nodeMaxRadius - CONFIG.nodeMinRadius),
        alpha: CONFIG.nodeMinAlpha + Math.random() * (CONFIG.nodeMaxAlpha - CONFIG.nodeMinAlpha),
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);

    // Update positions
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;

      // Wrap around edges
      if (n.x < -10) n.x = w + 10;
      if (n.x > w + 10) n.x = -10;
      if (n.y < -10) n.y = h + 10;
      if (n.y > h + 10) n.y = -10;
    }

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.maxDistance) {
          const alpha = CONFIG.lineMaxAlpha * (1 - dist / CONFIG.maxDistance);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(201, 204, 209, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    const t = time * 0.001;
    for (const n of nodes) {
      const pulseAlpha = n.alpha + Math.sin(t + n.pulseOffset) * 0.1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 204, 209, ${Math.max(0.05, pulseAlpha)})`;
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }

  function init() {
    resize();
    createNodes();
    animId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    // Redistribute nodes on big resize
    if (nodes.length > 0) {
      nodes.forEach(n => {
        if (n.x > w) n.x = Math.random() * w;
        if (n.y > h) n.y = Math.random() * h;
      });
    }
  });

  // Reduce animation when tab is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      animId = requestAnimationFrame(draw);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
