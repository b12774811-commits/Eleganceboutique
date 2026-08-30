const CACHE_NAME = 'elegance-boutique-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './cover.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;

  // Pour la page elle-même (navigation) et le fichier index.html :
  // on va TOUJOURS chercher la dernière version sur le serveur en premier.
  // On ne se sert du cache que si le téléphone est hors-ligne.
  const isPage = event.request.mode === 'navigate' || event.request.url.endsWith('/index.html');
  if(isPage){
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Pour le reste (images, manifest...) : on affiche le cache tout de suite
  // si disponible (rapide), mais on va quand même chercher la version
  // à jour en arrière-plan pour la prochaine fois.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
