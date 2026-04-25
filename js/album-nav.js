/* ═══════════════════════════════════════════════════════
   ALBUM-NAV.JS — Navegación entre álbumes
   Genera la tira de pills + flechas prev/next
   Se inyecta automáticamente en cada página de álbum
═══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── Orden y datos de los álbumes ─── */
  const ALBUMS = [
    { slug: "born-to-die",    name: "Born to Die",     year: "2012", file: "born-to-die.html"    },
    { slug: "paradise",       name: "Paradise",         year: "2012", file: "paradise.html"       },
    { slug: "ultraviolence",  name: "Ultraviolence",    year: "2014", file: "ultraviolence.html"  },
    { slug: "honeymoon",      name: "Honeymoon",        year: "2015", file: "honeymoon.html"      },
    { slug: "lust-for-life",  name: "Lust for Life",    year: "2017", file: "lust-for-life.html"  },
    { slug: "norman-rockwell",name: "Norman Rockwell!",  year: "2019", file: "norman-rockwell.html"},
    { slug: "blue-banisters", name: "Blue Banisters",   year: "2021", file: "blue-banisters.html" },
    { slug: "did-you-know",   name: "Did You Know…",    year: "2023", file: "did-you-know.html"   },
  ];

  const currentSlug = document.body.dataset.album || "";
  const currentIdx  = ALBUMS.findIndex(a => a.slug === currentSlug);
  if (currentIdx === -1) return; // No es página de álbum

  const prev = currentIdx > 0                ? ALBUMS[currentIdx - 1] : null;
  const next = currentIdx < ALBUMS.length - 1 ? ALBUMS[currentIdx + 1] : null;

  /* ─── Ruta relativa de portada ─── */
  function coverPath(slug) {
    return `../assets/images/albums/${slug}.jpg`;
  }

  /* ─── Crear tira de pills ─── */
  function buildStrip() {
    const strip = document.createElement("div");
    strip.className = "album-nav-strip";
    strip.setAttribute("aria-label", "Navegar entre álbumes");

    const label = document.createElement("span");
    label.className = "album-nav-strip__label";
    label.textContent = "Álbumes";
    strip.appendChild(label);

    const pills = document.createElement("div");
    pills.className = "album-nav-strip__albums";

    ALBUMS.forEach(album => {
      const isCurrent = album.slug === currentSlug;
      const pill = document.createElement(isCurrent ? "span" : "a");
      pill.className = "album-nav-pill" + (isCurrent ? " current" : "");

      if (!isCurrent) {
        pill.href  = album.file;
        pill.title = `${album.name} (${album.year})`;
      }

      pill.innerHTML = `
        <img src="${coverPath(album.slug)}"
             alt="${album.name}"
             onerror="this.style.display='none'" />
        <span>${album.name}</span>
      `;

      pills.appendChild(pill);
    });

    strip.appendChild(pills);
    return strip;
  }

  /* ─── Crear flechas prev / next ─── */
  function buildArrows() {
    const arrows = document.createElement("div");
    arrows.className = "album-nav-arrows";
    arrows.setAttribute("aria-label", "Álbum anterior y siguiente");

    if (prev) {
      const a = document.createElement("a");
      a.href      = prev.file;
      a.className = "album-arrow album-arrow--prev";
      a.title     = `Anterior: ${prev.name}`;
      a.innerHTML = `
        <img class="album-arrow__thumb"
             src="${coverPath(prev.slug)}"
             alt="${prev.name}"
             onerror="this.style.display='none'" />
        <div class="album-arrow__text">
          <span class="album-arrow__dir">← Anterior</span>
          <span class="album-arrow__name">${prev.name}</span>
          <span class="album-arrow__year">${prev.year}</span>
        </div>
      `;
      arrows.appendChild(a);
    } else {
      // Placeholder vacío para mantener el layout
      arrows.appendChild(document.createElement("div"));
    }

    if (next) {
      const a = document.createElement("a");
      a.href      = next.file;
      a.className = "album-arrow album-arrow--next";
      a.title     = `Siguiente: ${next.name}`;
      a.innerHTML = `
        <div class="album-arrow__text">
          <span class="album-arrow__dir">Siguiente →</span>
          <span class="album-arrow__name">${next.name}</span>
          <span class="album-arrow__year">${next.year}</span>
        </div>
        <img class="album-arrow__thumb"
             src="${coverPath(next.slug)}"
             alt="${next.name}"
             onerror="this.style.display='none'" />
      `;
      arrows.appendChild(a);
    }

    return arrows;
  }

  /* ─── Inyectar antes del player ─── */
  function inject() {
    const main   = document.querySelector(".album-main");
    const player = document.querySelector(".player");
    if (!main || !player) return;

    const strip  = buildStrip();
    const arrows = buildArrows();

    // Insertar al final del main, antes del player
    main.appendChild(strip);
    main.appendChild(arrows);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

})();
