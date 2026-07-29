const showcase = document.querySelector("[data-project-showcase]");

if (showcase) {
  window.__projectShowcaseReady = true;

  const viewport = showcase.querySelector(".showcase-viewport");
  const slides = [...showcase.querySelectorAll("[data-project-slide]")];
  const dotsRoot = showcase.querySelector("[data-project-dots]");
  const previousButton = showcase.querySelector("[data-project-prev]");
  const nextButton = showcase.querySelector("[data-project-next]");
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

  showcase.querySelectorAll(".showcase-card").forEach((surface) => {
    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      surface.style.setProperty("--hover-x", `${x}%`);
      surface.style.setProperty("--hover-y", `${y}%`);
    });
  });
}
