/* ═══════════════════════════════════════════════════════
   QUEUE.JS — Sistema global: Cola + Favoritas
   Usa localStorage para persistir entre páginas
   Se carga en TODAS las páginas de álbum
═══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════
     STORAGE — clave base para todo
  ═══════════════════════════════════════════════════ */
  const STORAGE_QUEUE = "ldr_queue";
  const STORAGE_FAVS  = "ldr_favorites";

  /* ═══════════════════════════════════════════════════
     HELPERS DE STORAGE
  ═══════════════════════════════════════════════════ */
  function loadQueue() {
    try { return JSON.parse(localStorage.getItem(STORAGE_QUEUE)) || []; }
    catch (_) { return []; }
  }
  function saveQueue(q) {
    try { localStorage.setItem(STORAGE_QUEUE, JSON.stringify(q)); }
    catch (_) {}
  }
  function loadFavs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_FAVS)) || []; }
    catch (_) { return []; }
  }
  function saveFavs(f) {
    try { localStorage.setItem(STORAGE_FAVS, JSON.stringify(f)); }
    catch (_) {}
  }

  /* ═══════════════════════════════════════════════════
     DATOS DE ÁLBUM ACTUAL
  ═══════════════════════════════════════════════════ */
  const albumSlug  = document.body.dataset.album || "";
  const albumNames = {
    "born-to-die":    "Born to Die",
    "paradise":       "Paradise",
    "ultraviolence":  "Ultraviolence",
    "honeymoon":      "Honeymoon",
    "lust-for-life":  "Lust for Life",
    "norman-rockwell":"Norman Rockwell!",
    "blue-banisters": "Blue Banisters",
    "did-you-know":   "Did You Know…",
  };
  const albumName = albumNames[albumSlug] || albumSlug;

  // Portada del álbum actual
  function getAlbumCover() {
    const el = document.querySelector(".album-hero__cover, .player__thumb");
    return el ? el.src : "";
  }

  /* ═══════════════════════════════════════════════════
     TOAST — notificación temporal
  ═══════════════════════════════════════════════════ */
  let toastTimer = null;
  const toast = document.getElementById("toast-msg") || createToastEl();

  function createToastEl() {
    const el = document.createElement("div");
    el.id = "toast-msg";
    el.className = "toast";
    document.body.appendChild(el);
    return el;
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  /* ═══════════════════════════════════════════════════
     COLA — Panel + lógica
  ═══════════════════════════════════════════════════ */
  let queue = loadQueue();

  // Crear panel de cola si no existe
  const queueOverlay = document.getElementById("queue-overlay") || createQueuePanel();
  const queuePanel   = document.getElementById("queue-panel");
  const queueBody    = document.getElementById("queue-body");
  const queueCountEl = document.getElementById("queue-count");
  const btnQueueOpen = document.getElementById("btn-queue-open");
  const btnQueueClose= document.getElementById("queue-close");
  const btnQueueClear= document.getElementById("queue-clear");

  function createQueuePanel() {
    const overlay = document.createElement("div");
    overlay.id = "queue-overlay";
    overlay.className = "queue-overlay";

    const panel = document.createElement("div");
    panel.id = "queue-panel";
    panel.className = "queue-panel";
    panel.setAttribute("aria-label", "Cola de reproducción");

    panel.innerHTML = `
      <div class="queue-panel__header">
        <div>
          <span class="queue-panel__title">Cola</span>
          <span class="queue-panel__count" id="queue-count">0 canciones</span>
        </div>
        <button class="queue-panel__close" id="queue-close" title="Cerrar">✕</button>
      </div>
      <div class="queue-panel__body" id="queue-body"></div>
      <div class="queue-panel__footer">
        <button class="queue-btn-clear" id="queue-clear">Vaciar cola</button>
      </div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Cerrar al click en overlay
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeQueuePanel();
    });

    return overlay;
  }

  function openQueuePanel() {
    queueOverlay.classList.add("open");
    document.getElementById("queue-panel")?.classList.add("open");
    renderQueuePanel();
  }
  function closeQueuePanel() {
    queueOverlay.classList.remove("open");
    document.getElementById("queue-panel")?.classList.remove("open");
  }

  document.getElementById("queue-close")?.addEventListener("click", closeQueuePanel);
  document.getElementById("queue-clear")?.addEventListener("click", () => {
    queue = [];
    saveQueue(queue);
    updateQueueBadge();
    renderQueuePanel();
    showToast("Cola vaciada");
  });

  // Botón en player para abrir cola
  if (btnQueueOpen) {
    btnQueueOpen.addEventListener("click", openQueuePanel);
  }

  /* Añadir canción a la cola */
  function addToQueue(src, title, album, cover) {
    const item = { src, title, album, cover, id: Date.now() + Math.random() };
    // Evitar duplicados exactos consecutivos
    const last = queue[queue.length - 1];
    if (last && last.src === src) {
      showToast("Ya está en la cola ✓");
      return;
    }
    queue.push(item);
    saveQueue(queue);
    updateQueueBadge();
    renderQueuePanel();
    showToast(`+ Cola: ${title}`);
  }

  /* Quitar de la cola */
  function removeFromQueue(id) {
    queue = queue.filter(i => i.id !== id);
    saveQueue(queue);
    updateQueueBadge();
    renderQueuePanel();
  }

  /* Badge en botón del player */
  function updateQueueBadge() {
    if (!btnQueueOpen) return;
    const badge = btnQueueOpen.querySelector(".queue-badge");
    if (badge) badge.textContent = queue.length > 9 ? "9+" : queue.length;
    btnQueueOpen.classList.toggle("has-queue", queue.length > 0);
  }

  /* Renderizar items del panel */
  function renderQueuePanel() {
    const body = document.getElementById("queue-body");
    const countEl = document.getElementById("queue-count");
    if (!body) return;

    queue = loadQueue(); // re-leer por si otra pestaña actualizó
    if (countEl) countEl.textContent = queue.length + (queue.length === 1 ? " canción" : " canciones");

    if (queue.length === 0) {
      body.innerHTML = `
        <div class="queue-empty">
          <span class="queue-empty__icon">🎵</span>
          <span>La cola está vacía.<br>Agrega canciones con el botón <strong>+Cola</strong></span>
        </div>`;
      return;
    }

    body.innerHTML = "";
    queue.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "queue-item";
      div.innerHTML = `
        <div class="queue-item__info">
          <div class="queue-item__title">${escHtml(item.title)}</div>
          <div class="queue-item__album">${escHtml(item.album)}</div>
        </div>
        <button class="queue-item__remove" data-id="${item.id}" title="Quitar">✕</button>
      `;
      div.querySelector(".queue-item__info").addEventListener("click", () => {
        playFromQueue(idx);
      });
      div.querySelector(".queue-item__remove").addEventListener("click", (e) => {
        e.stopPropagation();
        removeFromQueue(item.id);
      });
      body.appendChild(div);
    });
  }

  /* Reproducir item de la cola (delega al player.js via evento) */
  function playFromQueue(idx) {
    const item = queue[idx];
    if (!item) return;
    // Dispara evento personalizado que player.js escucha
    document.dispatchEvent(new CustomEvent("queue:play", {
      detail: { src: item.src, title: item.title, idx }
    }));
    // Quitar de la cola después de reproducir
    removeFromQueue(item.id);
    closeQueuePanel();
  }

  /* Exponer función para que player.js pida siguiente de la cola */
  window.LDR_Queue = {
    hasNext:    () => loadQueue().length > 0,
    shiftNext:  () => {
      const q = loadQueue();
      if (q.length === 0) return null;
      const next = q.shift();
      saveQueue(q);
      queue = q;
      updateQueueBadge();
      renderQueuePanel();
      return next;
    },
    open: openQueuePanel,
  };

  /* ═══════════════════════════════════════════════════
     FAVORITAS — lógica
  ═══════════════════════════════════════════════════ */
  let favs = loadFavs();

  function isFav(src) { return favs.some(f => f.src === src); }

  function toggleFav(src, title, album, cover) {
    if (isFav(src)) {
      favs = favs.filter(f => f.src !== src);
      saveFavs(favs);
      showToast(`♡ Quitado de favoritas`);
      return false;
    } else {
      favs.push({ src, title, album, cover, id: Date.now() + Math.random() });
      saveFavs(favs);
      showToast(`♥ Guardado en favoritas`);
      return true;
    }
  }

  /* ═══════════════════════════════════════════════════
     INICIALIZAR BOTONES EN TRACKLIST
  ═══════════════════════════════════════════════════ */
  function initTrackButtons() {
    const items = document.querySelectorAll(".tracklist__item");
    if (items.length === 0) return;

    const cover = getAlbumCover();

    items.forEach(item => {
      const src   = item.dataset.src   || "";
      const title = item.querySelector(".tracklist__title")?.textContent.trim() || "";
      if (!src) return;

      // Contenedor de acciones
      const actions = document.createElement("div");
      actions.className = "tracklist__actions";

      // Botón favorita
      const btnFav = document.createElement("button");
      btnFav.className = "btn-fav" + (isFav(src) ? " is-fav" : "");
      btnFav.title = isFav(src) ? "Quitar de favoritas" : "Añadir a favoritas";
      btnFav.innerHTML = isFav(src) ? "♥" : "♡";
      btnFav.setAttribute("aria-label", "Favorita");
      // type="button" evita comportamientos raros en formularios / Safari
      btnFav.type = "button";

      function doFav(e) {
        e.stopPropagation();
        e.preventDefault();
        const added = toggleFav(src, title, albumName, cover);
        btnFav.innerHTML = added ? "♥" : "♡";
        btnFav.classList.toggle("is-fav", added);
        btnFav.title = added ? "Quitar de favoritas" : "Añadir a favoritas";
        if (typeof renderFavSection === "function") renderFavSection();
      }

      // iOS Safari necesita touchend en el botón para responder sin delay
      btnFav.addEventListener("touchend", (e) => { doFav(e); }, { passive: false });
      // Click como fallback para desktop y Android
      btnFav.addEventListener("click",    (e) => { doFav(e); });

      // Botón cola
      const btnQ = document.createElement("button");
      btnQ.className = "btn-queue";
      btnQ.title = "Añadir a la cola";
      btnQ.innerHTML = "+Cola";
      btnQ.setAttribute("aria-label", "Añadir a la cola");
      btnQ.type = "button";

      function doQueue(e) {
        e.stopPropagation();
        e.preventDefault();
        addToQueue(src, title, albumName, cover);
        btnQ.classList.add("in-queue");
        setTimeout(() => btnQ.classList.remove("in-queue"), 1500);
      }

      // iOS Safari: touchend directo en el botón
      btnQ.addEventListener("touchend", (e) => { doQueue(e); }, { passive: false });
      // Click como fallback
      btnQ.addEventListener("click",    (e) => { doQueue(e); });

      actions.appendChild(btnFav);
      actions.appendChild(btnQ);

      // Insertar antes de la duración
      const dur = item.querySelector(".tracklist__duration");
      if (dur) item.insertBefore(actions, dur);
      else item.appendChild(actions);
    });
  }

  /* ═══════════════════════════════════════════════════
     BOTÓN COLA EN EL PLAYER
  ═══════════════════════════════════════════════════ */
  function injectQueueButtonInPlayer() {
    const btns = document.querySelector(".player__buttons");
    if (!btns || document.getElementById("btn-queue-open")) return;

    const btn = document.createElement("button");
    btn.id = "btn-queue-open";
    btn.className = "player__btn player__btn--queue";
    btn.title = "Ver cola";
    btn.innerHTML = `🎶<span class="queue-badge">0</span>`;
    btn.setAttribute("aria-label", "Abrir cola de reproducción");

    btn.addEventListener("click", openQueuePanel);
    btns.appendChild(btn);
    updateQueueBadge();
  }

  /* ═══════════════════════════════════════════════════
     HELPER
  ═══════════════════════════════════════════════════ */
  function escHtml(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  /* ═══════════════════════════════════════════════════
     EXPONER globalmente para index.html
  ═══════════════════════════════════════════════════ */
  window.LDR_Favs = {
    load: loadFavs,
    toggle: toggleFav,
    isFav,
  };

  /* ═══════════════════════════════════════════════════
     INIT — espera a que el DOM esté listo
  ═══════════════════════════════════════════════════ */
  function init() {
    initTrackButtons();
    injectQueueButtonInPlayer();
    updateQueueBadge();
    renderQueuePanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
