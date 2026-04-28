/* ═══════════════════════════════════════════════════════
   PERSISTENT-PLAYER.JS  v2
   ✅ Audio persiste al navegar entre páginas (localStorage)
   ✅ Mini-player flotante en TODAS las páginas + index
   ✅ iOS Safari: touchend directo en cada botón
   ✅ Android Chrome: touch-action + wake lock
   ✅ Cola: si hay cola, al terminar canción va al siguiente
   ✅ Botón ✕ para cerrar/pausar en cualquier momento
═══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── Claves localStorage ──────────────────────── */
  var K_STATE = "ldr_pstate";
  var K_QUEUE = "ldr_queue";

  /* ─── Estado por defecto ────────────────────────── */
  var DEFAULT = {
    src: "", title: "", album: "", cover: "",
    time: 0, volume: 0.8, playing: false, slug: ""
  };

  /* ─── Storage helpers ───────────────────────────── */
  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(K_STATE));
      return Object.assign({}, DEFAULT, s || {});
    } catch (_) { return Object.assign({}, DEFAULT); }
  }

  function saveState(patch) {
    try {
      var s = Object.assign(loadState(), patch);
      localStorage.setItem(K_STATE, JSON.stringify(s));
    } catch (_) {}
  }

  function loadQueue() {
    try { return JSON.parse(localStorage.getItem(K_QUEUE)) || []; }
    catch (_) { return []; }
  }

  function saveQueue(q) {
    try { localStorage.setItem(K_QUEUE, JSON.stringify(q)); }
    catch (_) {}
  }

  /* ─── Exponer globalmente para player.js ──────── */
  window.LDR_PersistState = saveState;

  /* ═══════════════════════════════════════════════
     HELPERS DE UI
  ═══════════════════════════════════════════════ */
  function escHtml(s) {
    return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function el(id) { return document.getElementById(id); }

  /* Añadir listener táctil + click sin duplicar */
  function onTap(element, fn) {
    if (!element) return;
    var touched = false;
    element.addEventListener("touchend", function (e) {
      e.preventDefault();
      e.stopPropagation();
      touched = true;
      fn(e);
      // Resetear flag después de un tick
      setTimeout(function () { touched = false; }, 400);
    }, { passive: false });
    element.addEventListener("click", function (e) {
      if (touched) return; // ya lo manejó touchend
      fn(e);
    });
  }

  /* ═══════════════════════════════════════════════
     CONSTRUIR MINI-PLAYER
  ═══════════════════════════════════════════════ */
  var miniAudio  = null;   // audio element del mini-player (solo en index)
  var isAlbumPage = false; // true si la página ya tiene su propio player.js

  function buildMiniPlayer() {
    if (el("mini-player")) return; // ya existe

    var state = loadState();
    if (!state.src) return; // sin canción guardada, no mostrar

    /* ── Crear elemento ── */
    var mp = document.createElement("div");
    mp.id = "mini-player";
    mp.className = "mini-player";
    mp.setAttribute("role", "region");
    mp.setAttribute("aria-label", "Reproductor activo");

    var q = loadQueue();
    var badgeHtml = q.length > 0
      ? '<span class="mp-queue-badge" id="mp-queue-badge">' + q.length + '</span>'
      : '<span class="mp-queue-badge" id="mp-queue-badge" style="display:none">' + q.length + '</span>';

    mp.innerHTML =
      '<div class="mini-player__inner">' +
        '<img class="mini-player__cover" id="mp-cover"' +
          ' src="' + escHtml(state.cover) + '"' +
          ' alt="' + escHtml(state.album) + '"' +
          ' onerror="this.style.display=\'none\'" />' +
        '<div class="mini-player__info">' +
          '<span class="mini-player__title" id="mp-title">' + escHtml(state.title) + '</span>' +
          '<span class="mini-player__album" id="mp-album">' + escHtml(state.album) + '</span>' +
        '</div>' +
        '<div class="mini-player__controls">' +
          '<button class="mini-player__btn" id="mp-prev" type="button" aria-label="Anterior">⏮</button>' +
          '<button class="mini-player__btn mini-player__btn--play" id="mp-play" type="button"' +
            ' aria-label="' + (state.playing ? 'Pausar' : 'Reproducir') + '">' +
            (state.playing ? '⏸' : '▶') +
          '</button>' +
          '<button class="mini-player__btn" id="mp-next" type="button" aria-label="Siguiente">⏭</button>' +
          '<button class="mini-player__btn mini-player__btn--queue" id="mp-queue-btn" type="button" aria-label="Cola">' +
            '🎶' + badgeHtml +
          '</button>' +
          '<button class="mini-player__btn mini-player__btn--close" id="mp-close" type="button" aria-label="Cerrar">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="mini-player__progress-bar">' +
        '<div class="mini-player__progress-fill" id="mp-fill" style="width:0%"></div>' +
      '</div>';

    document.body.appendChild(mp);

    /* Mostrar con animación */
    requestAnimationFrame(function () {
      mp.classList.add("visible");
      document.body.classList.add("has-mini-player");
    });

    /* ── Determinar si hay player.js propio en esta página ── */
    isAlbumPage = !!document.getElementById("audio");

    if (isAlbumPage) {
      /* Páginas de álbum: sincronizar con player.js */
      bindToAlbumPlayer();
    } else {
      /* Index y otras páginas: crear audio propio */
      miniAudio = document.createElement("audio");
      miniAudio.id = "mp-audio";
      miniAudio.setAttribute("playsinline", "");
      miniAudio.setAttribute("webkit-playsinline", "");
      miniAudio.setAttribute("x-webkit-airplay", "allow");
      miniAudio.preload = "auto";
      document.body.appendChild(miniAudio);

      loadAndRestoreAudio(miniAudio, state);
      bindIndexControls(miniAudio);
    }

    /* Controles comunes (play, prev, next, queue, close) */
    bindCommonControls();
  }

  /* ── Cargar audio y restaurar posición ── */
  function loadAndRestoreAudio(audio, state) {
    if (!state.src) return;
    audio.volume = state.volume || 0.8;
    audio.src = state.src;
    audio.load();

    audio.addEventListener("loadedmetadata", function () {
      if (state.time > 1) audio.currentTime = state.time;
      if (state.playing) {
        audio.play().then(function () {
          updatePlayBtn(true);
        }).catch(function () {
          /* Autoplay bloqueado — usuario debe tocar play */
          saveState({ playing: false });
          updatePlayBtn(false);
        });
      }
    }, { once: true });

    /* Progreso */
    audio.addEventListener("timeupdate", function () {
      updateProgress(audio);
    });

    /* Al terminar: siguiente de cola */
    audio.addEventListener("ended", function () {
      advanceQueue(audio);
    });

    /* Sincronizar con Media Session API */
    setupMediaSession(state, audio);
  }

  /* ── Controles en páginas de álbum (delega a player.js) ── */
  function bindToAlbumPlayer() {
    var mainAudio = document.getElementById("audio");
    if (!mainAudio) return;

    /* Sincronizar progreso del mini-player con el audio del álbum */
    mainAudio.addEventListener("timeupdate", function () {
      updateProgress(mainAudio);
    });

    /* Escuchar eventos que emite player.js */
    document.addEventListener("ldr:play",  function () { updatePlayBtn(true);  });
    document.addEventListener("ldr:pause", function () { updatePlayBtn(false); });
    document.addEventListener("ldr:trackchange", function (e) {
      var d = e.detail;
      updateMiniInfo(d.title, d.album, d.cover);
      updateQueueBadge();
    });
  }

  /* ── Controles específicos del index (audio propio) ── */
  function bindIndexControls(audio) {
    /* Sincronizar pausa externa (llamada entrante iOS) */
    audio.addEventListener("pause", function () {
      if (!audio.ended) {
        updatePlayBtn(false);
        saveState({ playing: false });
      }
    });
    audio.addEventListener("play", function () {
      updatePlayBtn(true);
      saveState({ playing: true });
    });
  }

  /* ── Controles comunes: play, prev, next, queue, close ── */
  function bindCommonControls() {

    /* PLAY / PAUSA */
    onTap(el("mp-play"), function () {
      if (isAlbumPage) {
        /* Delegar al botón del player.js */
        var mainBtn = el("btn-play");
        if (mainBtn) mainBtn.click();
      } else {
        if (!miniAudio) return;
        if (miniAudio.paused) {
          miniAudio.play().then(function () {
            updatePlayBtn(true);
            saveState({ playing: true });
          }).catch(function () {});
        } else {
          miniAudio.pause();
          updatePlayBtn(false);
          saveState({ playing: false });
        }
      }
    });

    /* ANTERIOR */
    onTap(el("mp-prev"), function () {
      if (isAlbumPage) {
        var b = el("btn-prev");
        if (b) b.click();
      } else {
        if (miniAudio && miniAudio.currentTime > 3) {
          miniAudio.currentTime = 0;
        }
      }
    });

    /* SIGUIENTE */
    onTap(el("mp-next"), function () {
      if (isAlbumPage) {
        var b = el("btn-next");
        if (b) b.click();
      } else {
        if (miniAudio) advanceQueue(miniAudio);
      }
    });

    /* COLA */
    onTap(el("mp-queue-btn"), function () {
      /* Si el panel de cola existe (queue.js cargado), abrirlo */
      if (window.LDR_Queue && window.LDR_Queue.open) {
        window.LDR_Queue.open();
      } else {
        /* En el index sin queue.js: navegar al álbum activo */
        var state = loadState();
        if (state.slug) {
          window.location.href = "html/" + state.slug + ".html";
        }
      }
    });

    /* CERRAR */
    onTap(el("mp-close"), function () {
      /* Pausar audio */
      if (isAlbumPage) {
        var mainAudio = el("audio");
        if (mainAudio) mainAudio.pause();
        var b = el("btn-play");
        if (b) b.textContent = "▶";
      } else {
        if (miniAudio) { miniAudio.pause(); miniAudio.src = ""; }
      }

      /* Limpiar estado */
      saveState({ playing: false, src: "", title: "", time: 0 });

      /* Quitar mini-player del DOM */
      var mp = el("mini-player");
      if (mp) {
        mp.classList.remove("visible");
        setTimeout(function () { mp.remove(); }, 350);
      }
      document.body.classList.remove("has-mini-player");
    });
  }

  /* ─── Avanzar cola desde el index ──────────────── */
  function advanceQueue(audio) {
    var q = loadQueue();
    if (q.length === 0) {
      updatePlayBtn(false);
      saveState({ playing: false });
      return;
    }

    var next = q.shift();
    saveQueue(q);

    audio.src   = next.src;
    audio.load();
    audio.addEventListener("loadedmetadata", function () {
      audio.play().catch(function () {});
    }, { once: true });

    saveState({ src: next.src, title: next.title, album: next.album, cover: next.cover, time: 0, playing: true });
    updateMiniInfo(next.title, next.album, next.cover);
    updatePlayBtn(true);
    updateQueueBadge();
    setupMediaSession({ title: next.title, album: next.album, cover: next.cover }, audio);
  }

  /* ─── Media Session API (pantalla bloqueada) ──── */
  function setupMediaSession(state, audio) {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title:   state.title  || "Lana Del Rey",
      artist:  "Lana Del Rey",
      album:   state.album  || "",
      artwork: state.cover
        ? [{ src: state.cover, sizes: "512x512", type: "image/jpeg" }]
        : []
    });

    navigator.mediaSession.setActionHandler("play",  function () {
      audio && audio.play().catch(function(){});
      updatePlayBtn(true);
    });
    navigator.mediaSession.setActionHandler("pause", function () {
      audio && audio.pause();
      updatePlayBtn(false);
    });
    navigator.mediaSession.setActionHandler("nexttrack", function () {
      if (isAlbumPage) { var b = el("btn-next"); if (b) b.click(); }
      else if (miniAudio) advanceQueue(miniAudio);
    });
    navigator.mediaSession.setActionHandler("previoustrack", function () {
      if (isAlbumPage) { var b = el("btn-prev"); if (b) b.click(); }
      else if (miniAudio && miniAudio.currentTime > 3) miniAudio.currentTime = 0;
    });
  }

  /* ─── Actualizar UI ─────────────────────────── */
  function updatePlayBtn(playing) {
    var btn = el("mp-play");
    if (!btn) return;
    btn.textContent = playing ? "⏸" : "▶";
    btn.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    var mp = el("mini-player");
    if (mp) mp.classList.toggle("is-playing", playing);
  }

  function updateProgress(audio) {
    var fill = el("mp-fill");
    if (!fill || !audio || !audio.duration) return;
    fill.style.width = ((audio.currentTime / audio.duration) * 100) + "%";
  }

  function updateMiniInfo(title, album, cover) {
    var t = el("mp-title");
    var a = el("mp-album");
    var c = el("mp-cover");
    if (t) t.textContent = title || "";
    if (a) a.textContent = album || "";
    if (c && cover) { c.src = cover; c.style.display = ""; }
  }

  function updateQueueBadge() {
    var badge = el("mp-queue-badge");
    if (!badge) return;
    var q = loadQueue();
    if (q.length > 0) {
      badge.textContent = q.length > 99 ? "99+" : q.length;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  /* ─── Escuchar cambios de cola en otras pestañas ── */
  window.addEventListener("storage", function (e) {
    if (e.key === K_QUEUE) updateQueueBadge();
    if (e.key === K_STATE) {
      var state = loadState();
      updateMiniInfo(state.title, state.album, state.cover);
      updatePlayBtn(state.playing);
    }
  });

  /* ─── Exponer para que queue.js actualice el badge ── */
  window.LDR_MiniPlayer = {
    updateBadge: updateQueueBadge,
    updateInfo:  updateMiniInfo,
    show: function(state) {
      var mp = el("mini-player");
      if (!mp) { buildMiniPlayer(); return; }
      updateMiniInfo(state.title, state.album, state.cover);
      updatePlayBtn(state.playing);
      mp.classList.add("visible");
      document.body.classList.add("has-mini-player");
    }
  };

  /* ─── INIT ─────────────────────────────────── */
  function init() {
    buildMiniPlayer();

    /* Si hay estado pero no mini-player todavía
       (porque src estaba vacío al cargar), intentar de nuevo
       después de que player.js emita ldr:trackchange */
    document.addEventListener("ldr:trackchange", function () {
      if (!el("mini-player")) buildMiniPlayer();
      else {
        var state = loadState();
        updateMiniInfo(state.title, state.album, state.cover);
        updatePlayBtn(state.playing);
        var mp = el("mini-player");
        if (mp) mp.classList.add("visible");
        document.body.classList.add("has-mini-player");
      }
      updateQueueBadge();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
