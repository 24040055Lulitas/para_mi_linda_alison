/* ═══════════════════════════════════
   MAIN.JS — Script del index.html
═══════════════════════════════════ */
(function () {
  "use strict";

  // ── Animación de entrada en tarjetas al hacer scroll ──
  const cards = document.querySelectorAll(".album-card");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
            }, i * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    cards.forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(40px)";
      card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(card);
    });
  }

  // ── Smooth scroll al botón CTA ──
  const ctaBtn = document.querySelector(".hero__cta");
  if (ctaBtn) {
    ctaBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(ctaBtn.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

})();
