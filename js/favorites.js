/* ═══════════════════════════════════════════════════════
   FAVORITES.JS — Sección de favoritas
   ✅ Tap/Click corto  → reproduce la canción directamente
   ✅ Hold 500ms       → navega al álbum de esa canción
   ✅ +Cola            → añade a la cola del shell
   ✅ ♥                → quita de favoritas
   ✅ iOS Safari + Android Chrome + Desktop
═══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var STORAGE_FAVS = "ldr_favorites";
  var inFrame = (window.self !== window.top);

  /* ── Storage ── */
  function loadFavs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_FAVS)) || []; }
    catch (_) { return []; }
  }
  function saveFavs(f) {
    try { localStorage.setItem(STORAGE_FAVS, JSON.stringify(f)); }
    catch (_) {}
  }

  /* ── Mapeo album label → archivo HTML (relativo a html/) ── */
  var albumFiles = {
    "Born to Die":       "born-to-die.html",
    "Paradise":          "paradise.html",
    "Ultraviolence":     "ultraviolence.html",
    "Honeymoon":         "honeymoon.html",
    "Lust for Life":     "lust-for-life.html",
    "Norman Rockwell!":  "norman-rockwell.html",
    "Blue Banisters":    "blue-banisters.html",
    "Did You Know\u2026":"did-you-know.html",
  };

  /* ── Navegar al álbum ── */
  function goToAlbum(fav) {
    // Obtener el nombre de archivo limpio (sin rutas, solo "born-to-die.html")
    var file = albumFiles[fav.album] || (fav.slug ? fav.slug + ".html" : null);
    if (!file) return;
    // Asegurarse de que sea solo el nombre, sin prefijos
    file = file.replace("html/", "").replace("../html/", "");
    if (inFrame) {
      // Enviar al shell — app.html construirá la URL absoluta
      parent.postMessage({ type: "NAVIGATE", href: file }, "*");
    } else {
      window.location.href = "html/" + file;
    }
  }

  /* ── Reproducir favorita en el shell ── */
  function playFav(fav) {
    if (inFrame) {
      parent.postMessage({
        type:     "PLAY_TRACK",
        src:      fav.src,
        title:    fav.title,
        album:    fav.album,
        cover:    fav.cover,
        slug:     fav.slug || "",
        playlist: [],
        idx:      0,
      }, "*");
    }
    showToast("\u25B6 " + fav.title);
  }

  /* ── Añadir a cola ── */
  function addToQueue(fav) {
    if (inFrame) {
      parent.postMessage({
        type:  "ADD_QUEUE",
        src:   fav.src,
        title: fav.title,
        album: fav.album,
        cover: fav.cover,
        slug:  fav.slug || "",
      }, "*");
    } else {
      var q = JSON.parse(localStorage.getItem("ldr_queue") || "[]");
      q.push({ src: fav.src, title: fav.title, album: fav.album,
               cover: fav.cover, slug: fav.slug || "",
               id: Date.now() + Math.random() });
      localStorage.setItem("ldr_queue", JSON.stringify(q));
    }
    showToast("+ Cola: " + fav.title);
  }

  /* ── Quitar de favoritas ── */
  function removeFav(src) {
    saveFavs(loadFavs().filter(function (x) { return x.src !== src; }));
    renderFavSection();
    showToast("\u2661 Quitado de favoritas");
  }

  /* ════════════════════════════════════════════════════
     INTERACCIÓN de tarjeta favorita
     - Click/Tap = reproducir canción
     - Botón "Ir al álbum" = navegar al álbum
     Sin hold (causa problemas en todos los browsers)
  ════════════════════════════════════════════════════ */
  function attachInteraction(card, fav) {
    /* Click principal = reproducir */
    function handlePlay(e) {
      if (e.target.closest(".fav-card__actions")) return;
      playFav(fav);
    }

    var touched = false;
    card.addEventListener("touchend", function(e) {
      if (e.target.closest(".fav-card__actions")) return;
      e.preventDefault();
      touched = true;
      playFav(fav);
      setTimeout(function() { touched = false; }, 500);
    }, { passive: false });

    card.addEventListener("click", function(e) {
      if (e.target.closest(".fav-card__actions")) return;
      if (touched) return;
      playFav(fav);
    });
  }


  /* ════════════════════════════════════════════════════
     RENDER SECCIÓN
  ════════════════════════════════════════════════════ */
  function renderFavSection() {
    var section = document.getElementById("favorites-section");
    if (!section) return;

    var grid  = section.querySelector(".favorites__grid");
    var empty = section.querySelector(".favorites__empty");
    if (!grid) return;

    var favs = loadFavs();
    grid.innerHTML = "";

    if (favs.length === 0) {
      if (empty) empty.style.display = "block";
      grid.style.display = "none";
      return;
    }

    if (empty) empty.style.display = "none";
    grid.style.display = "grid";

    favs.forEach(function (fav) {
      var card = document.createElement("div");
      card.className = "fav-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "Reproducir " + fav.title + ". Mantén para ir al álbum.");

      card.innerHTML =
        '<img class="fav-card__thumb" src="' + escHtml(fav.cover || "") + '"' +
             ' alt="" onerror="this.style.display=\'none\'" />' +
        '<div class="fav-card__info">' +
          '<div class="fav-card__title">' + escHtml(fav.title) + '</div>' +
          '<div class="fav-card__album">' + escHtml(fav.album) + '</div>' +
        '</div>' +
        '<div class="fav-card__actions">' +
          '<button class="fav-card__play" type="button" aria-label="Añadir a la cola">+Cola</button>' +
          '<button class="fav-card__remove" type="button" aria-label="Quitar de favoritas">\u2665</button>' +
        '</div>' +
        '<div class="fav-card__hold-hint">Mantén para ir al álbum</div>';

      /* ─ Botón +Cola ─ */
      var btnCola = card.querySelector(".fav-card__play");
      function doQueue(e) {
        e.preventDefault(); e.stopPropagation();
        addToQueue(fav);
        var orig = btnCola.textContent;
        btnCola.textContent = "\u2713";
        setTimeout(function () { btnCola.textContent = orig; }, 1400);
      }
      btnCola.addEventListener("touchend", function (e) {
        e.preventDefault(); e.stopPropagation(); doQueue(e);
      }, { passive: false });
      btnCola.addEventListener("click", doQueue);

      /* ─ Botón 💿 ir al álbum ─ */
      var btnAlbum = card.querySelector(".fav-card__album-link");
      function doAlbum(e) {
        e.preventDefault(); e.stopPropagation();
        goToAlbum(fav);
      }
      btnAlbum.addEventListener("touchend", function (e) {
        e.preventDefault(); e.stopPropagation(); doAlbum(e);
      }, { passive: false });
      btnAlbum.addEventListener("click", doAlbum);

      /* ─ Botón ♥ quitar ─ */
      var btnRemove = card.querySelector(".fav-card__remove");
      function doRemove(e) {
        e.preventDefault(); e.stopPropagation();
        removeFav(fav.src);
      }
      btnRemove.addEventListener("touchend", function (e) {
        e.preventDefault(); e.stopPropagation(); doRemove(e);
      }, { passive: false });
      btnRemove.addEventListener("click", doRemove);

      /* ─ Interacción principal: tap=play, hold=álbum ─ */
      attachInteraction(card, fav);

      grid.appendChild(card);
    });

    injectCardStyles();
  }

  /* ── Estilos de las tarjetas ── */
  function injectCardStyles() {
    if (document.getElementById("fav-interaction-styles")) return;
    var s = document.createElement("style");
    s.id = "fav-interaction-styles";
    s.textContent =
      ".fav-card { cursor: pointer; user-select: none; -webkit-user-select: none;" +
        "transition: transform 0.15s, box-shadow 0.15s; position: relative; overflow: hidden; }" +
      ".fav-card:hover { transform: translateY(-2px);" +
        "box-shadow: 0 6px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1); }" +
      ".fav-card:active { transform: scale(0.97); }" +
      /* Botón de ir al álbum — estilo diferente para distinguirlo */
      ".fav-card__album-link {" +
        "background: none; border: none;" +
        "color: rgba(240,232,224,0.4); font-size: 1rem;" +
        "cursor: pointer; padding: 4px 6px; border-radius: 6px;" +
        "transition: color 0.2s, background 0.2s;" +
        "touch-action: manipulation; -webkit-tap-highlight-color: transparent;" +
        "min-width: 36px; min-height: 36px;" +
        "display: inline-flex; align-items: center; justify-content: center;" +
      "}" +
      ".fav-card__album-link:hover { color: var(--color-gold, #c9a96e); background: rgba(255,255,255,0.06); }" +
      /* Todos los botones de acción táctiles */
      ".fav-card__play, .fav-card__remove, .fav-card__album-link {" +
        "touch-action: manipulation; -webkit-tap-highlight-color: transparent;" +
        "min-width: 36px; min-height: 36px; position: relative; z-index: 2;" +
      "}";
    document.head.appendChild(s);
  }

  /* ── Toast ── */
  var toastTimer = null;
  function showToast(msg) {
    var t = document.getElementById("toast-msg");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast-msg";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function escHtml(s) {
    return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ── Escuchar cambios de storage (otra pestaña) ── */
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_FAVS) renderFavSection();
  });

  /* ── Escuchar cuando el shell confirma cambio de favorita ── */
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "FAV_UPDATE") {
      renderFavSection();
    }
  });

  /* ── Init ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderFavSection);
  } else {
    renderFavSection();
  }

  window.renderFavSection = renderFavSection;

})();
