/* ═══════════════════════════════════════════════════════
   PLAYER.JS — Versión iframe
   NO controla audio directamente.
   Se comunica con app.html (el shell) via postMessage.
   El shell tiene el único <audio> real de la app.
═══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var tracklistItems = document.querySelectorAll(".tracklist__item");
  if (tracklistItems.length === 0) return;

  var albumSlug  = document.body.dataset.album || "";
  var albumLabel = "";
  var inFrame    = (window.self !== window.top);

  /* ── Enviar al shell ── */
  function post(msg) {
    try { parent.postMessage(msg, "*"); } catch (_) {}
  }

  /* ── Resolver URL absoluta (para que el shell pueda usar el src) ── */
  function absUrl(relative) {
    if (!relative) return "";
    // Si ya es absoluta, devolverla tal cual
    if (relative.startsWith("http") || relative.startsWith("blob")) return relative;
    // Crear URL absoluta desde el contexto del iframe
    try {
      return new URL(relative, window.location.href).href;
    } catch (_) {
      return relative;
    }
  }

  /* ── Obtener portada del álbum ── */
  function getCover() {
    var img = document.querySelector(".album-hero__cover") ||
              document.querySelector(".player__thumb");
    return img ? img.src : "";
  }

  function getAlbumLabel() {
    if (albumLabel) return albumLabel;
    var el = document.querySelector(".player__song-album");
    albumLabel = el ? el.textContent.trim() : "";
    return albumLabel;
  }

  /* ── Playlist del álbum ── */
  var playlist = Array.from(tracklistItems).map(function (item, i) {
    return {
      src:   item.dataset.src || "",
      title: (item.querySelector(".tracklist__title") || {}).textContent || ("Pista " + (i + 1)),
    };
  });

  /* ── Marcar activo ── */
  function setActive(src) {
    tracklistItems.forEach(function (item) {
      item.classList.toggle("active", item.dataset.src === src);
    });
  }

  /* ── Reproducir item ── */
  function playItem(item, i) {
    var src   = item.dataset.src || "";
    var title = (item.querySelector(".tracklist__title") || {}).textContent || "";
    setActive(src);
    // Resolver URLs absolutas para que el shell pueda reproducirlas
    var absSrc = absUrl(src);
    var absCover = absUrl(getCover());
    var absPlaylist = playlist.map(function(t) {
      return { src: absUrl(t.src), title: t.title };
    });
    post({
      type:     "PLAY_TRACK",
      src:      absSrc,
      title:    title,
      album:    getAlbumLabel(),
      cover:    absCover,
      slug:     albumSlug,
      playlist: absPlaylist,
      idx:      i,
    });
  }

  /* ── Eventos en tracklist ── */
  tracklistItems.forEach(function (item, i) {
    var touchMoved = false, tx = 0, ty = 0;

    item.addEventListener("touchstart", function (e) {
      touchMoved = false;
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    }, { passive: true });

    item.addEventListener("touchmove", function (e) {
      if (Math.abs(e.touches[0].clientX - tx) > 6 ||
          Math.abs(e.touches[0].clientY - ty) > 6) touchMoved = true;
    }, { passive: true });

    item.addEventListener("touchend", function (e) {
      if (touchMoved) return;
      var t = e.target;
      if (t.classList.contains("btn-fav") || t.classList.contains("btn-queue") ||
          t.closest(".tracklist__actions")) return;
      e.preventDefault();
      playItem(item, i);
    });

    item.addEventListener("click", function (e) {
      var t = e.target;
      if (t.classList.contains("btn-fav") || t.classList.contains("btn-queue") ||
          t.closest(".tracklist__actions")) return;
      playItem(item, i);
    });
  });

  /* ── Mensajes del shell ── */
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || !d.type) return;

    if (d.type === "TRACK_ACTIVE") setActive(d.src);

    if (d.type === "FAV_UPDATE") {
      var btn = document.querySelector('.btn-fav[data-src="' + d.src + '"]');
      if (btn) {
        btn.innerHTML = d.isFav ? "♥" : "♡";
        btn.classList.toggle("is-fav", d.isFav);
      }
    }
  });

  /* ── Botones de acción en cada canción ── */
  function initButtons() {
    tracklistItems.forEach(function (item) {
      var src   = item.dataset.src || "";
      var title = (item.querySelector(".tracklist__title") || {}).textContent || "";
      if (!src || item.querySelector(".tracklist__actions")) return;

      var actions = document.createElement("div");
      actions.className = "tracklist__actions";

      /* Favorita */
      var btnFav = document.createElement("button");
      btnFav.type = "button";
      btnFav.className = "btn-fav";
      btnFav.setAttribute("data-src", src);
      btnFav.setAttribute("aria-label", "Favorita");
      btnFav.innerHTML = "♡";

      function doFav(e) {
        e.preventDefault(); e.stopPropagation();
        post({ type: "TOGGLE_FAV", src: absUrl(src), title: title,
               album: getAlbumLabel(), cover: absUrl(getCover()), slug: albumSlug });
      }
      btnFav.addEventListener("touchend", doFav, { passive: false });
      btnFav.addEventListener("click",    doFav);

      /* Cola */
      var btnQ = document.createElement("button");
      btnQ.type = "button";
      btnQ.className = "btn-queue";
      btnQ.setAttribute("aria-label", "Añadir a la cola");
      btnQ.innerHTML = "+Cola";

      function doQueue(e) {
        e.preventDefault(); e.stopPropagation();
        post({ type: "ADD_QUEUE", src: absUrl(src), title: title,
               album: getAlbumLabel(), cover: absUrl(getCover()), slug: albumSlug });
        btnQ.classList.add("in-queue");
        setTimeout(function () { btnQ.classList.remove("in-queue"); }, 1500);
      }
      btnQ.addEventListener("touchend", doQueue, { passive: false });
      btnQ.addEventListener("click",    doQueue);

      actions.appendChild(btnFav);
      actions.appendChild(btnQ);
      var dur = item.querySelector(".tracklist__duration");
      if (dur) item.insertBefore(actions, dur); else item.appendChild(actions);

      // Preguntar al shell si es favorita
      post({ type: "CHECK_FAV", src: absUrl(src) });
    });
  }

  /* ── Ocultar player sticky local (el shell tiene el global) ── */
  function hideLocalPlayer() {
    var p = document.getElementById("player");
    if (p) p.style.display = "none";
    var a = document.getElementById("audio");
    if (a) { a.pause(); a.src = ""; a.remove(); }
  }

  /* ── Init ── */
  function init() {
    if (inFrame) hideLocalPlayer();
    initButtons();
    post({ type: "GET_QUEUE_COUNT" });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", function () {
    albumLabel = getAlbumLabel();
  });

})();
