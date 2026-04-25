/* ═══════════════════════════════════
   PARTICLES.JS — Partículas flotantes
═══════════════════════════════════ */
(function () {
  "use strict";

  const container = document.getElementById("particles-container");
  if (!container) return;

  const PARTICLE_COUNT = 25;

  // Paleta de colores según el álbum
  const albumColors = {
    "born-to-die":    ["#9b59b6", "#c39bd3", "#7d3c98"],
    "paradise":       ["#27ae60", "#a9dfbf", "#1e8449"],
    "ultraviolence":  ["#c0a060", "#e8d5a3", "#8b7035"],
    "honeymoon":      ["#e8b4b8", "#fadbd8", "#c0392b"],
    "lust-for-life":  ["#4fc3f7", "#b3e5fc", "#0288d1"],
    "norman-rockwell":["#a8d8ea", "#d4e6f1", "#5dade2"],
    "blue-banisters": ["#5b8fd4", "#aed6f1", "#2471a3"],
    "did-you-know":   ["#d4a843", "#f9e79f", "#b7950b"],
  };

  const album   = document.body.dataset.album;
  const colors  = albumColors[album] || ["#c9a96e", "#f5efe8", "#e8a0a0"];

  function randomBetween(a, b) { return a + Math.random() * (b - a); }

  function createParticle() {
    const el = document.createElement("div");
    el.className = "particle";

    const size  = randomBetween(2, 6);
    const left  = randomBetween(0, 100);
    const dur   = randomBetween(12, 28);
    const delay = randomBetween(0, 20);
    const color = colors[Math.floor(Math.random() * colors.length)];

    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      background: ${color};
      opacity: 0;
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
      box-shadow: 0 0 ${size * 2}px ${color};
    `;

    return el;
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    container.appendChild(createParticle());
  }
})();
