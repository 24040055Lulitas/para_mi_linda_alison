# 🌹 Lana Del Rey — Para Alison

Una página web fan hecha con amor, dedicada a **Alison**.

---

## 📁 Estructura de archivos

```
lana-del-rey-alison/
│
├── index.html                  ← Página principal (grid de álbumes)
│
├── html/                       ← Una página HTML por álbum
│   ├── born-to-die.html
│   ├── paradise.html
│   ├── ultraviolence.html
│   ├── honeymoon.html
│   ├── lust-for-life.html
│   ├── norman-rockwell.html
│   ├── blue-banisters.html
│   └── did-you-know.html
│
├── css/
│   ├── reset.css               ← Reset universal
│   ├── variables.css           ← Tokens de diseño (colores, fuentes, etc.)
│   ├── global.css              ← Estilos base y secciones comunes
│   ├── hero.css                ← Hero del index
│   ├── albums-grid.css         ← Grid de tarjetas de álbumes
│   ├── player.css              ← Reproductor de música (compartido)
│   ├── footer.css              ← Footer
│   ├── particles.css           ← Partículas decorativas
│   └── albums/                 ← Un CSS personalizado por álbum
│       ├── born-to-die.css
│       ├── paradise.css
│       ├── ultraviolence.css
│       ├── honeymoon.css
│       ├── lust-for-life.css
│       ├── norman-rockwell.css
│       ├── blue-banisters.css
│       └── did-you-know.css
│
├── js/
│   ├── main.js                 ← Animaciones del index
│   ├── player.js               ← Lógica del reproductor (universal)
│   └── particles.js            ← Partículas flotantes
│
└── assets/
    ├── images/
    │   ├── albums/             ← Portadas de cada álbum (JPG/WebP)
    │   │   ├── born-to-die.jpg
    │   │   ├── paradise.jpg
    │   │   └── ... (una por álbum)
    │   ├── ldr/                ← Fotos de Lana para fondos
    │   │   ├── hero-bg.jpg         ← Fondo del hero principal
    │   │   ├── born-to-die-bg.jpg  ← Fondo de la página de cada álbum
    │   │   └── ...
    │   └── alison/             ← Fotos de Alison
    │       └── main.jpg            ← Foto principal en la sección de dedicatoria
    │
    └── mp3/                    ← Canciones organizadas por álbum
        ├── born-to-die/
        │   ├── 01-born-to-die.mp3
        │   ├── 02-off-to-the-races.mp3
        │   └── ...
        ├── paradise/
        ├── ultraviolence/
        ├── honeymoon/
        ├── lust-for-life/
        ├── norman-rockwell/
        ├── blue-banisters/
        └── did-you-know/
```

---

## 🖼️ Imágenes que necesitas agregar

### Para el index:
- `assets/images/ldr/hero-bg.jpg` → Foto de fondo del hero principal

### Para cada álbum (en `assets/images/albums/`):
- `born-to-die.jpg`
- `paradise.jpg`
- `ultraviolence.jpg`
- `honeymoon.jpg`
- `lust-for-life.jpg`
- `norman-rockwell.jpg`
- `blue-banisters.jpg`
- `did-you-know.jpg`

### Fondos de páginas de álbumes (en `assets/images/ldr/`):
- `born-to-die-bg.jpg`
- `paradise-bg.jpg`
- `ultraviolence-bg.jpg`
- `honeymoon-bg.jpg`
- `lust-for-life-bg.jpg`
- `norman-rockwell-bg.jpg`
- `blue-banisters-bg.jpg`
- `did-you-know-bg.jpg`

### Foto de Alison:
- `assets/images/alison/main.jpg` → Se muestra en la sección de dedicatoria

---

## 🎵 Cómo agregar canciones

1. Coloca los MP3 en `assets/mp3/[nombre-album]/`
2. Abre el HTML del álbum en `html/[nombre-album].html`
3. Descomenta el bloque de ejemplo dentro de `<div class="tracklist">`
4. Ajusta el número, `data-src`, título y duración por cada canción

---

## ✏️ Personalización por álbum

Cada álbum tiene su propio CSS en `css/albums/[nombre-album].css`.
Puedes cambiar:
- `--player-accent` → color del reproductor
- `background-color` del body
- Fondos y overlays del hero

---

## ⌨️ Atajos de teclado del reproductor

| Tecla       | Acción          |
|-------------|-----------------|
| `Espacio`   | Play / Pausa    |
| `→`         | Siguiente pista |
| `←`         | Pista anterior  |
| `↑`         | Subir volumen   |
| `↓`         | Bajar volumen   |

---

## 🚀 Deploy a GitHub Pages

1. Sube todo el proyecto a un repositorio de GitHub
2. Ve a **Settings → Pages**
3. Selecciona la rama `main` y carpeta `/ (root)`
4. ¡Listo! Tu página estará en `https://[usuario].github.io/[repositorio]/`

> **Nota:** Los archivos de audio MP3 pueden ser grandes. Considera usar Git LFS
> o subir los archivos de audio por separado si GitHub rechaza archivos grandes.

---

*Hecho con 🌹 para Alison*
