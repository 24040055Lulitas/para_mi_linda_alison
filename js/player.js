/* ═══════════════════════════════════════════════════════
   PLAYER.JS — Reproductor universal
   ✅ Media Session API  → controles en pantalla bloqueada
   ✅ Wake Lock API      → evita suspensión Android Chrome
   ✅ iOS background     → audio continuo en iPhone
   ✅ Autoplay policy    → compatible con todos los navegadores
   ✅ Touch optimizado   → eventos táctiles nativos
═══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── Referencias DOM ────────────────────────────── */
  const audio          = document.getElementById("audio");
  const btnPlay        = document.getElementById("btn-play");
  const btnPrev        = document.getElementById("btn-prev");
  const btnNext        = document.getElementById("btn-next");
  const btnShuffle     = document.getElementById("btn-shuffle");
  const btnLoop        = document.getElementById("btn-loop");
  const progressBar    = document.getElementById("progress-bar");
  const progressFill   = document.getElementById("progress-fill");
  const timeCurrent    = document.getElementById("time-current");
  const timeTotal      = document.getElementById("time-total");
  const volumeSlider   = document.getElementById("volume");
  const volIcon        = document.getElementById("vol-icon");
  const playerTitle    = document.getElementById("player-title");
  const tracklistItems = document.querySelectorAll(".tracklist__item");

  if (!audio || !btnPlay || tracklistItems.length === 0) return;

  /* ─── Estado ─────────────────────────────────────── */
  let currentIndex = 0;
  let isPlaying    = false;
  let isShuffle    = false;
  let isLoop       = false;
  let wakeLock     = null;
  let isDragging   = false;

  /* ─── Pistas desde el DOM ────────────────────────── */
  const tracks = Array.from(tracklistItems).map((item, i) => ({
    index: i,
    src:   item.dataset.src || "",
    title: (item.querySelector(".tracklist__title")?.textContent || "Pista " + (i + 1)).trim(),
  }));

  /* ═══════════════════════════════════════════════════
     1. iOS — atributos para audio en background
  ═══════════════════════════════════════════════════ */
  audio.setAttribute("playsinline",        "");
  audio.setAttribute("webkit-playsinline", "");
  audio.setAttribute("x-webkit-airplay",   "allow");
  audio.preload = "auto";

  /* ═══════════════════════════════════════════════════
     2. WAKE LOCK — evita suspensión Android Chrome
  ═══════════════════════════════════════════════════ */
  async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } catch (_) {}
  }

  async function releaseWakeLock() {
    if (!wakeLock) return;
    try { await wakeLock.release(); } catch (_) {}
    wakeLock = null;
  }

  // Re-adquirir wake lock cuando la página regresa al foco
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && isPlaying) {
      await requestWakeLock();
    }
  });

  /* ═══════════════════════════════════════════════════
     3. MEDIA SESSION — pantalla bloqueada iOS / Android
  ═══════════════════════════════════════════════════ */
  function setupMediaSession(track) {
    if (!("mediaSession" in navigator)) return;

    const albumImg   = document.querySelector(".album-hero__cover, .player__thumb");
    const artworkSrc = albumImg ? albumImg.src : "";

    navigator.mediaSession.metadata = new MediaMetadata({
      title:   track.title,
      artist:  "Lana Del Rey",
      album:   document.title
                 .replace(" \u00b7 Para Alison", "")
                 .replace(" \u2014 Lana Del Rey", ""),
      artwork: artworkSrc
        ? [{ src: artworkSrc, sizes: "512x512", type: "image/jpeg" },
           { src: artworkSrc, sizes: "256x256", type: "image/jpeg" }]
        : [],
    });

    navigator.mediaSession.setActionHandler("play",          () => playAudio());
    navigator.mediaSession.setActionHandler("pause",         () => pauseAudio());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
    navigator.mediaSession.setActionHandler("nexttrack",     () => nextTrack());

    try {
      navigator.mediaSession.setActionHandler("seekto", (d) => {
        if (d.seekTime !== undefined) {
          audio.currentTime = d.seekTime;
          updateProgress();
        }
      });
      navigator.mediaSession.setActionHandler("seekbackward", (d) => {
        audio.currentTime = Math.max(0, audio.currentTime - (d.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler("seekforward", (d) => {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (d.seekOffset || 10));
      });
    } catch (_) {}
  }

  function updatePositionState() {
    if (!("mediaSession" in navigator) || !audio.duration || isNaN(audio.duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration:     audio.duration,
        playbackRate: audio.playbackRate,
        position:     Math.min(audio.currentTime, audio.duration),
      });
    } catch (_) {}
  }

  /* ═══════════════════════════════════════════════════
     4. HELPERS
  ═══════════════════════════════════════════════════ */
  function formatTime(secs) {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return m + ":" + s;
  }

  function updateProgress() {
    if (!audio.duration || isDragging) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressFill) progressFill.style.width = pct + "%";
    if (timeCurrent)  timeCurrent.textContent  = formatTime(audio.currentTime);
    updatePositionState();
  }

  /* ═══════════════════════════════════════════════════
     5. CARGAR PISTA
  ═══════════════════════════════════════════════════ */
  function loadTrack(index, autoPlay) {
    if (index < 0 || index >= tracks.length) return;
    currentIndex = index;
    const track  = tracks[index];

    // Cambiar src solo si es diferente
    const resolved = new URL(track.src, location.href).href;
    if (audio.src !== resolved) {
      audio.src = track.src;
      audio.load();
    }

    // UI
    if (playerTitle)  playerTitle.textContent  = track.title;
    if (progressFill) progressFill.style.width = "0%";
    if (timeCurrent)  timeCurrent.textContent  = "0:00";
    if (timeTotal)    timeTotal.textContent    = "0:00";

    // Tracklist
    tracklistItems.forEach((el, i) => el.classList.toggle("active", i === index));

    // Scroll al item activo
    const active = tracklistItems[index];
    if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Media Session
    setupMediaSession(track);

    autoPlay ? playAudio() : pauseAudio();
  }

  /* ═══════════════════════════════════════════════════
     6. PLAY / PAUSA
  ═══════════════════════════════════════════════════ */
  function playAudio() {
    if (!audio.src || audio.src === location.href) {
      loadTrack(0, true);
      return;
    }

    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        isPlaying = true;
        btnPlay.textContent = "⏸";
        if ("mediaSession" in navigator)
          navigator.mediaSession.playbackState = "playing";
        requestWakeLock();
      }).catch((err) => {
        console.warn("Autoplay bloqueado:", err.message);
        isPlaying = false;
        btnPlay.textContent = "▶";
      });
    }
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    btnPlay.textContent = "▶";
    if ("mediaSession" in navigator)
      navigator.mediaSession.playbackState = "paused";
    releaseWakeLock();
  }

  function togglePlay() {
    isPlaying ? pauseAudio() : playAudio();
  }

  /* ═══════════════════════════════════════════════════
     7. SIGUIENTE / ANTERIOR — con soporte de cola global
  ═══════════════════════════════════════════════════ */
  function nextTrack() {
    // Primero revisar si hay algo en la cola global
    if (window.LDR_Queue && window.LDR_Queue.hasNext()) {
      const qItem = window.LDR_Queue.shiftNext();
      if (qItem) {
        // Reproducir desde la cola: cambiar src directamente
        audio.src = qItem.src;
        audio.load();
        if (playerTitle) playerTitle.textContent = qItem.title;
        if (progressFill) progressFill.style.width = "0%";
        if (timeCurrent)  timeCurrent.textContent  = "0:00";
        if (timeTotal)    timeTotal.textContent    = "0:00";
        // Desmarcar tracklist (es de otro álbum posiblemente)
        tracklistItems.forEach(el => el.classList.remove("active"));
        setupMediaSession({ title: qItem.title, src: qItem.src });
        playAudio();
        return;
      }
    }

    // Si no hay cola, seguir con el álbum normal
    let next;
    if (isShuffle) {
      do { next = Math.floor(Math.random() * tracks.length); }
      while (next === currentIndex && tracks.length > 1);
    } else {
      next = (currentIndex + 1) % tracks.length;
    }
    loadTrack(next, isPlaying);
  }

  function prevTrack() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      if (progressFill) progressFill.style.width = "0%";
      return;
    }
    loadTrack((currentIndex - 1 + tracks.length) % tracks.length, isPlaying);
  }

  /* ═══════════════════════════════════════════════════
     8. EVENTOS DEL AUDIO
  ═══════════════════════════════════════════════════ */
  audio.addEventListener("timeupdate",     updateProgress);
  audio.addEventListener("loadedmetadata", () => {
    if (timeTotal) timeTotal.textContent = formatTime(audio.duration);
    updatePositionState();
  });

  audio.addEventListener("ended", () => {
    if (isLoop) { audio.currentTime = 0; playAudio(); }
    else          nextTrack();
  });

  audio.addEventListener("error", () => {
    isPlaying = false;
    btnPlay.textContent = "▶";
  });

  // Sincronizar estado cuando iOS pausa el audio externamente
  // (llamada entrante, AirPods desconectados, etc.)
  audio.addEventListener("pause", () => {
    if (isPlaying) {
      isPlaying = false;
      btnPlay.textContent = "▶";
      if ("mediaSession" in navigator)
        navigator.mediaSession.playbackState = "paused";
    }
  });

  audio.addEventListener("play", () => {
    if (!isPlaying) {
      isPlaying = true;
      btnPlay.textContent = "⏸";
      if ("mediaSession" in navigator)
        navigator.mediaSession.playbackState = "playing";
    }
  });

  /* ═══════════════════════════════════════════════════
     9. BARRA DE PROGRESO — mouse + touch
  ═══════════════════════════════════════════════════ */
  function seekTo(clientX) {
    if (!audio.duration || !progressBar) return;
    const rect  = progressBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    if (progressFill) progressFill.style.width = (ratio * 100) + "%";
    if (timeCurrent)  timeCurrent.textContent  = formatTime(audio.currentTime);
  }

  if (progressBar) {
    // Mouse
    progressBar.addEventListener("mousedown", (e) => { isDragging = true; seekTo(e.clientX); });
    document.addEventListener("mousemove",    (e) => { if (isDragging) seekTo(e.clientX); });
    document.addEventListener("mouseup",      ()  => { isDragging = false; });

    // Touch
    progressBar.addEventListener("touchstart", (e) => {
      e.preventDefault();
      isDragging = true;
      seekTo(e.touches[0].clientX);
    }, { passive: false });

    progressBar.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (isDragging) seekTo(e.touches[0].clientX);
    }, { passive: false });

    progressBar.addEventListener("touchend", () => { isDragging = false; });
  }

  /* ═══════════════════════════════════════════════════
     10. VOLUMEN
  ═══════════════════════════════════════════════════ */
  if (volumeSlider) {
    audio.volume = parseFloat(volumeSlider.value);
    volumeSlider.addEventListener("input", () => {
      audio.volume = parseFloat(volumeSlider.value);
      if (!volIcon) return;
      volIcon.textContent =
        audio.volume === 0 ? "🔇" : audio.volume < 0.5 ? "🔉" : "🔊";
    });
  }

  if (volIcon) {
    volIcon.addEventListener("click", () => {
      audio.muted = !audio.muted;
      volIcon.textContent = audio.muted ? "🔇" : "🔊";
    });
  }

  /* ═══════════════════════════════════════════════════
     11. TRACKLIST — touch sin delay + click
  ═══════════════════════════════════════════════════ */
  tracklistItems.forEach((item, i) => {
    let touchMoved = false;

    item.addEventListener("touchstart", () => { touchMoved = false; }, { passive: true });
    item.addEventListener("touchmove",  () => { touchMoved = true;  }, { passive: true });

    item.addEventListener("touchend", (e) => {
      if (touchMoved) return;
      e.preventDefault(); // evita el click sintético 300ms después
      if (i === currentIndex) togglePlay();
      else loadTrack(i, true);
    });

    item.addEventListener("click", () => {
      if (i === currentIndex) togglePlay();
      else loadTrack(i, true);
    });
  });

  /* ═══════════════════════════════════════════════════
     12. BOTONES
  ═══════════════════════════════════════════════════ */
  btnPlay.addEventListener("click",    togglePlay);
  btnNext.addEventListener("click",    nextTrack);
  btnPrev.addEventListener("click",    prevTrack);

  btnShuffle.addEventListener("click", () => {
    isShuffle = !isShuffle;
    btnShuffle.style.color      = isShuffle ? "var(--player-accent)" : "";
    btnShuffle.style.textShadow = isShuffle ? "0 0 10px var(--player-accent)" : "";
  });

  btnLoop.addEventListener("click", () => {
    isLoop = !isLoop;
    btnLoop.style.color      = isLoop ? "var(--player-accent)" : "";
    btnLoop.style.textShadow = isLoop ? "0 0 10px var(--player-accent)" : "";
  });

  /* ═══════════════════════════════════════════════════
     13. ATAJOS DE TECLADO
  ═══════════════════════════════════════════════════ */
  document.addEventListener("keydown", (e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    switch (e.code) {
      case "Space":     e.preventDefault(); togglePlay(); break;
      case "ArrowRight": e.preventDefault(); nextTrack();  break;
      case "ArrowLeft":  e.preventDefault(); prevTrack();  break;
      case "ArrowUp":
        e.preventDefault();
        if (volumeSlider) { volumeSlider.value = Math.min(1, +volumeSlider.value + 0.05); audio.volume = +volumeSlider.value; }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (volumeSlider) { volumeSlider.value = Math.max(0, +volumeSlider.value - 0.05); audio.volume = +volumeSlider.value; }
        break;
      case "KeyM":
        audio.muted = !audio.muted;
        if (volIcon) volIcon.textContent = audio.muted ? "🔇" : "🔊";
        break;
    }
  });

  /* ═══════════════════════════════════════════════════
     14. ESCUCHAR EVENTO DE COLA (queue.js)
  ═══════════════════════════════════════════════════ */
  document.addEventListener("queue:play", (e) => {
    const { src, title } = e.detail;
    audio.src = src;
    audio.load();
    if (playerTitle) playerTitle.textContent = title;
    if (progressFill) progressFill.style.width = "0%";
    if (timeCurrent)  timeCurrent.textContent  = "0:00";
    if (timeTotal)    timeTotal.textContent    = "0:00";
    tracklistItems.forEach(el => el.classList.remove("active"));
    setupMediaSession({ title, src });
    playAudio();
  });

  /* ═══════════════════════════════════════════════════
     15. INICIO — carga pista 0 sin autoplay
  ═══════════════════════════════════════════════════ */
  loadTrack(0, false);

})();
