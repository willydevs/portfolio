(() => {
  const frame = document.querySelector(".portrait-frame");
  const image = frame?.querySelector("img");
  const canvas = frame?.querySelector(".portrait-dissolve-canvas");

  if (!frame || !image || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const sampler = document.createElement("canvas");
  const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
  const particles = [];
  const particleStep = 14;
  let dissolve = 0;
  let targetDissolve = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min = 0, max = 1) {
    return Math.min(Math.max(value, min), max);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function buildParticles() {
    if (!image.naturalWidth || !image.naturalHeight) return;

    sampler.width = image.naturalWidth;
    sampler.height = image.naturalHeight;
    samplerCtx.clearRect(0, 0, sampler.width, sampler.height);
    samplerCtx.drawImage(image, 0, 0, sampler.width, sampler.height);

    const data = samplerCtx.getImageData(0, 0, sampler.width, sampler.height).data;
    particles.length = 0;

    for (let y = 0; y < sampler.height; y += particleStep) {
      for (let x = 0; x < sampler.width; x += particleStep) {
        const index = (y * sampler.width + x) * 4;
        const alpha = data[index + 3];
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const brightness = (red + green + blue) / 3;

        if (alpha < 18 || brightness < 8) continue;

        const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const random = seed - Math.floor(seed);
        const angle = -0.95 + random * 1.9;
        const distance = 70 + random * 220;

        particles.push({
          x,
          y,
          r: red,
          g: green,
          b: blue,
          a: alpha / 255,
          threshold: clamp((x / sampler.width) * 0.58 + random * 0.32),
          dx: Math.cos(angle) * distance + 80,
          dy: Math.sin(angle) * distance - 40,
          size: 1.2 + random * 2.4,
        });
      }
    }
  }

  function resizeCanvas() {
    const rect = frame.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvasWidth = Math.max(1, Math.round(rect.width));
    canvasHeight = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(canvasWidth * ratio);
    canvas.height = Math.round(canvasHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function updateTarget() {
    const hero = document.querySelector(".hero");
    if (!hero || reduceMotion) {
      targetDissolve = 0;
      frame.style.setProperty("--portrait-dissolve", "0");
      return;
    }

    const rect = hero.getBoundingClientRect();
    const scrolledThroughHero = Math.max(0, -rect.top);
    targetDissolve = clamp(scrolledThroughHero / (window.innerHeight * 1.12));
  }

  function draw() {
    dissolve += (targetDissolve - dissolve) * 0.12;
    const progress = easeOutCubic(dissolve);
    frame.style.setProperty("--portrait-dissolve", progress.toFixed(4));

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (progress > 0.01 && particles.length > 0) {
      const scaleX = canvasWidth / sampler.width;
      const scaleY = canvasHeight / sampler.height;

      for (const particle of particles) {
        const local = clamp((progress - particle.threshold) / 0.34);
        if (local <= 0) continue;

        const drift = easeOutCubic(local);
        const x = particle.x * scaleX + particle.dx * drift;
        const y = particle.y * scaleY + particle.dy * drift;
        const alpha = particle.a * (1 - drift) * 0.92;
        const size = particle.size * (1 + drift * 1.5);

        ctx.fillStyle = `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${alpha})`;
        ctx.fillRect(x, y, size, size);
      }
    }

    requestAnimationFrame(draw);
  }

  function init() {
    buildParticles();
    resizeCanvas();
    updateTarget();
    draw();
  }

  window.addEventListener("scroll", updateTarget, { passive: true });
  window.addEventListener("resize", () => {
    resizeCanvas();
    updateTarget();
  });

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", (event) => {
    reduceMotion = event.matches;
    updateTarget();
  });

  if (image.complete) {
    init();
  } else {
    image.addEventListener("load", init, { once: true });
  }
})();
