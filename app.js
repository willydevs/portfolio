import * as THREE from "three";

const canvas = document.querySelector("#journey-canvas");
const customCursor = document.querySelector(".custom-cursor");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0.8, 11);

const group = new THREE.Group();
scene.add(group);

const pathMaterial = new THREE.MeshStandardMaterial({
  color: 0x66e3d1,
  emissive: 0x123b36,
  roughness: 0.34,
  metalness: 0.28,
});

const accentMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x66e3d1, emissive: 0x082b26, roughness: 0.35, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: 0xf2c45b, emissive: 0x2c2106, roughness: 0.4, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: 0xff7a90, emissive: 0x2d0b12, roughness: 0.42, metalness: 0.18 }),
  new THREE.MeshStandardMaterial({ color: 0x8fdd78, emissive: 0x112c0b, roughness: 0.4, metalness: 0.22 }),
];

class HelixCurve extends THREE.Curve {
  getPoint(t, target = new THREE.Vector3()) {
    const turns = 3.6;
    const angle = t * Math.PI * 2 * turns;
    const radius = 1.35 + Math.sin(t * Math.PI * 5) * 0.18;
    const x = Math.cos(angle) * radius;
    const y = (0.5 - t) * 11.2;
    const z = Math.sin(angle) * radius * 0.64;
    return target.set(x, y, z);
  }
}

const helix = new HelixCurve();
const tube = new THREE.Mesh(new THREE.TubeGeometry(helix, 220, 0.026, 12, false), pathMaterial);
group.add(tube);

const nodeGeometry = new THREE.IcosahedronGeometry(0.22, 2);
const nodes = [];
const nodePositions = [0.05, 0.25, 0.46, 0.68, 0.9];

nodePositions.forEach((position, index) => {
  const node = new THREE.Mesh(nodeGeometry, accentMaterials[index % accentMaterials.length]);
  helix.getPoint(position, node.position);
  node.scale.setScalar(index === 4 ? 1.45 : 1);
  nodes.push(node);
  group.add(node);
});

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 720;
const positions = new Float32Array(particleCount * 3);
const speeds = [];

for (let i = 0; i < particleCount; i += 1) {
  const i3 = i * 3;
  positions[i3] = (Math.random() - 0.5) * 18;
  positions[i3 + 1] = (Math.random() - 0.5) * 13;
  positions[i3 + 2] = (Math.random() - 0.5) * 10;
  speeds.push(0.12 + Math.random() * 0.45);
}

particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({
    color: 0xd6fff8,
    size: 0.018,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  }),
);
scene.add(particles);

const ambient = new THREE.AmbientLight(0xffffff, 0.58);
const key = new THREE.DirectionalLight(0xaffff4, 2.4);
key.position.set(3.4, 4.8, 5.6);
const warm = new THREE.PointLight(0xf2c45b, 2.4, 12);
warm.position.set(-3.6, -1, 4);
scene.add(ambient, key, warm);

let scrollProgress = 0;
let targetProgress = 0;
const pointer = new THREE.Vector2();

function updateScroll() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  targetProgress = window.scrollY / maxScroll;

  const contact = document.querySelector("#contato");
  if (contact) {
    const rect = contact.getBoundingClientRect();
    const distanceIntoContact = Math.max(0, window.innerHeight - rect.top);
    const fade = Math.min(distanceIntoContact / window.innerHeight, 1);
    canvas.style.setProperty("--canvas-opacity", `${1 - fade * 0.56}`);
  }
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;

  if (customCursor && event.pointerType !== "touch") {
    document.body.classList.add("has-custom-cursor");
    customCursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  }
});

window.addEventListener("pointerleave", () => {
  document.body.classList.remove("has-custom-cursor");
});

const projectShowcase = window.__projectShowcaseReady ? null : document.querySelector("[data-project-showcase]");
if (projectShowcase) {
  const viewport = projectShowcase.querySelector(".showcase-viewport");
  const slides = [...projectShowcase.querySelectorAll("[data-project-slide]")];
  const dotsRoot = projectShowcase.querySelector("[data-project-dots]");
  const previousButton = projectShowcase.querySelector("[data-project-prev]");
  const nextButton = projectShowcase.querySelector("[data-project-next]");
  let currentSlide = 0;
  let pointerStartX = 0;

  const dots = slides.map((slide, index) => {
    const dot = document.createElement("button");
    dot.className = "showcase-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Ver projeto ${index + 1}`);
    dot.addEventListener("click", () => setSlide(index));
    dotsRoot?.append(dot);
    return dot;
  });

  function setSlide(nextSlide) {
    const nextIndex = (nextSlide + slides.length) % slides.length;
    if (nextIndex === currentSlide) return;

    const direction = nextIndex > currentSlide || (currentSlide === slides.length - 1 && nextIndex === 0) ? 1 : -1;
    slides[currentSlide]?.classList.toggle("is-exiting-left", direction > 0);
    slides[currentSlide]?.classList.remove("is-current");
    slides[nextIndex]?.classList.remove("is-exiting-left");
    slides[nextIndex]?.classList.add("is-current");
    dots[currentSlide]?.classList.remove("is-active");
    dots[nextIndex]?.classList.add("is-active");
    dots[currentSlide]?.setAttribute("aria-current", "false");
    dots[nextIndex]?.setAttribute("aria-current", "true");

    window.setTimeout(() => {
      slides.forEach((slide) => slide.classList.remove("is-exiting-left"));
    }, 560);

    currentSlide = nextIndex;
  }

  function moveSlide(step) {
    setSlide(currentSlide + step);
  }

  dots[0]?.classList.add("is-active");
  dots[0]?.setAttribute("aria-current", "true");
  previousButton?.addEventListener("click", () => moveSlide(-1));
  nextButton?.addEventListener("click", () => moveSlide(1));
  viewport?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") moveSlide(-1);
    if (event.key === "ArrowRight") moveSlide(1);
  });
  viewport?.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
    viewport.setPointerCapture?.(event.pointerId);
  });
  viewport?.addEventListener("pointerup", (event) => {
    const dragDistance = event.clientX - pointerStartX;
    if (Math.abs(dragDistance) > 56) {
      moveSlide(dragDistance > 0 ? -1 : 1);
    }
  });
}

document.querySelectorAll("a, button, .timeline-card, .memory-card, .project-card, .showcase-card, .lane, .signal-panel div").forEach((target) => {
  target.addEventListener("pointerenter", () => customCursor?.classList.add("is-hovering"));
  target.addEventListener("pointerleave", () => customCursor?.classList.remove("is-hovering"));
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.22 },
);

document.querySelectorAll(".timeline-card, .memory-card").forEach((card) => observer.observe(card));

document.querySelectorAll(".signal-panel div, .timeline-card, .memory-card, .project-card, .showcase-card, .lane").forEach((surface) => {
  surface.addEventListener("pointermove", (event) => {
    const rect = surface.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    surface.style.setProperty("--hover-x", `${x}%`);
    surface.style.setProperty("--hover-y", `${y}%`);
  });
});

const memoryLightbox = document.querySelector("[data-memory-lightbox]");
if (memoryLightbox) {
  const lightboxImage = memoryLightbox.querySelector("[data-memory-lightbox-img]");
  const lightboxMeta = memoryLightbox.querySelector("[data-memory-lightbox-meta]");
  const lightboxTitle = memoryLightbox.querySelector("[data-memory-lightbox-title]");
  const lightboxStory = memoryLightbox.querySelector("[data-memory-lightbox-story]");
  const closeButtons = memoryLightbox.querySelectorAll("[data-memory-close]");

  function closeMemoryLightbox() {
    memoryLightbox.classList.remove("is-open");
    memoryLightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("memory-lightbox-open");
  }

  document.querySelectorAll("[data-memory-src]").forEach((card) => {
    card.addEventListener("click", () => {
      const src = card.dataset.memorySrc;
      const title = card.dataset.memoryTitle || "";
      const meta = card.dataset.memoryMeta || "";
      const story = card.dataset.memoryStory || "";

      if (lightboxImage && src) {
        lightboxImage.src = src;
        lightboxImage.alt = title;
      }
      if (lightboxMeta) lightboxMeta.textContent = meta;
      if (lightboxTitle) lightboxTitle.textContent = title;
      if (lightboxStory) lightboxStory.textContent = story;

      memoryLightbox.classList.add("is-open");
      memoryLightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("memory-lightbox-open");
    });
  });

  closeButtons.forEach((button) => button.addEventListener("click", closeMemoryLightbox));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && memoryLightbox.classList.contains("is-open")) {
      closeMemoryLightbox();
    }
  });
}

function animate(time = 0) {
  const seconds = time * 0.001;
  scrollProgress += (targetProgress - scrollProgress) * 0.07;

  group.rotation.y = -0.5 + scrollProgress * Math.PI * 1.45 + pointer.x * 0.12;
  group.rotation.x = 0.18 + pointer.y * 0.05;
  group.position.y = scrollProgress * 3.4 - 1.5;
  const contactDrift = Math.max(0, scrollProgress - 0.78) * 6;
  group.position.x = (window.innerWidth < 760 ? 2.1 : 3.35) + contactDrift;

  nodes.forEach((node, index) => {
    node.rotation.x = seconds * (0.55 + index * 0.08);
    node.rotation.y = seconds * (0.7 + index * 0.06);
    const pulse = 1 + Math.sin(seconds * 2.4 + index) * 0.08;
    node.scale.setScalar((index === 4 ? 1.45 : 1) * pulse);
  });

  const particlePositions = particleGeometry.attributes.position.array;
  for (let i = 0; i < particleCount; i += 1) {
    const yIndex = i * 3 + 1;
    particlePositions[yIndex] += speeds[i] * 0.006;
    if (particlePositions[yIndex] > 6.8) {
      particlePositions[yIndex] = -6.8;
    }
  }
  particleGeometry.attributes.position.needsUpdate = true;

  particles.rotation.y = seconds * 0.025;
  particles.rotation.x = Math.sin(seconds * 0.16) * 0.04;

  camera.position.z = 10.4 - scrollProgress * 1.4;
  camera.lookAt(0.4, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

resize();
updateScroll();
animate();
