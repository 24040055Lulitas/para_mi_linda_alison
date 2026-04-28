/* ═══════════════════════════════════════════════════════
   FAVORITES.JS — Sección de favoritas en index.html
   Renderiza las canciones guardadas con ♥
═══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const STORAGE_FAVS = "ldr_favorites";

  function loadFavs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_FAVS)) || []; }
    catch (_) { return []; }
  }
  function saveFavs(f) {
    try { localStorage.setItem(STORAGE_FAVS, JSON.stringify(f)); }
    catch (_) {}
  }

  /* ─── Mapeo de slug → ruta HTML ─── */
  const albumPages = {
    "Born to Die":    "../html/born-to-die.html",
    "Paradise":       "../html/paradise.html",
    "Ultraviolence":  "../html/ultraviolence.html",
    "Honeymoon":      "../html/honeymoon.html",
    "Lust for Life":  "../html/lust-for-life.html",
    "Norman Rockwell!":"../html/norman-rockwell.html",
    "Blue Banisters": "../html/blue-banisters.html",
    "Did You Know…":  "../html/did-you-know.html",
  };

  /* ─── Render principal ─── */
  function renderFavSection() {
    const section = document.getElementById("favorites-section");
    if (!section) return;

    const grid  = section.querySelector(".favorites__grid");
    const empty = section.querySelector(".favorites__empty");
    if (!grid) return;

    const favs = loadFavs();
    grid.innerHTML = "";

    if (favs.length === 0) {
      if (empty) empty.style.display = "block";
      grid.style.display = "none";
      return;
    }

    if (empty) empty.style.display = "none";
    grid.style.display = "grid";

    favs.forEach(fav => {
      const card = document.createElement("div");
      card.className = "fav-card";
      card.innerHTML = `
        <img class="fav-card__thumb" src="${fav.cover || ''}" alt="${escHtml(fav.title)}"
             onerror="this.src='assets/images/placeholder.jpg'" />
        <div class="fav-card__info">
          <div class="fav-card__title">${escHtml(fav.title)}</div>
          <div class="fav-card__album">${escHtml(fav.album)}</div>
        </div>
        <div class="fav-card__actions">
          <button class="fav-card__play" title="Añadir a cola">+Cola</button>
          <button class="fav-card__remove" title="Quitar de favoritas">♥</button>
        </div>
      `;

      // +Cola → agrega a queue
      card.querySelector(".fav-card__play").addEventListener("click", (e) => {
        e.stopPropagation();
        // Si estamos en iframe, decirle al shell que añada a la cola
        if (window.self !== window.top) {
          parent.postMessage({ type: "ADD_QUEUE",
            src: fav.src, title: fav.title, album: fav.album,
            cover: fav.cover, slug: fav.slug || "" }, "*");
        } else {
          const queue = JSON.parse(localStorage.getItem("ldr_queue") || "[]");
          queue.push({ ...fav, id: Date.now() + Math.random() });
          localStorage.setItem("ldr_queue", JSON.stringify(queue));
        }
        showToast(`+ Cola: ${fav.title}`);
      });

      // Quitar favorita
      card.querySelector(".fav-card__remove").addEventListener("click", (e) => {
        e.stopPropagation();
        let f = loadFavs();
        f = f.filter(x => x.src !== fav.src);
        saveFavs(f);
        renderFavSection();
        showToast("♡ Quitado de favoritas");
      });

      // Click en la tarjeta → ir al álbum (via postMessage si estamos en iframe)
      card.addEventListener("click", () => {
        const page = albumPages[fav.album];
        if (!page) return;
        if (window.self !== window.top) {
          // Estamos dentro del iframe — navegar el iframe sin romper el shell
          window.location.href = page;
        } else {
          window.location.href = page;
        }
      });

      grid.appendChild(card);
    });
  }

  /* ─── Toast ─── */
  let toastTimer = null;
  function showToast(msg) {
    let t = document.getElementById("toast-msg");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast-msg";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function escHtml(s) {
    return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  /* ─── Escuchar cambios de storage (otra pestaña) ─── */
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_FAVS) renderFavSection();
  });

  /* ─── Init ─── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderFavSection);
  } else {
    renderFavSection();
  }

  // Exponer para llamadas externas
  window.renderFavSection = renderFavSection;

})();
