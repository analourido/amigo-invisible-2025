const CACHE_NAME = "noche-cine-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",

  // imágenes base
  "./img/fondo.jpg",
  "img/poster-enredados.jpeg",
    "./img/poster-matilda.jpg",
    "./img/rapunzel.png",
  "./img/rapunzel_closed.png",
  "./img/rapunzel_open.png",

  // audios si los usas
  "./sfx/tap.mp3",
  "./sfx/sparkle.mp3",
  "./sfx/snap-good.mp3",
  "./sfx/snap-bad.mp3",
  "./sfx/pop.mp3",

  // iconos (mínimo)
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/source.png",
];

// Install: precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: limpia cachés viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para assets, network-first para HTML
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo mismo origen
  if (url.origin !== location.origin) return;

  // HTML: network-first (para que cambios se vean)
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Resto: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
