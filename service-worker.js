var CACHE_NAME = "regie-live-v27";
var APP_SHELL = [
  "./",
  "./index.html",
  "./invite.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./background.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }
  // "Stale-while-revalidate" : on répond tout de suite avec la version en
  // cache si elle existe (ouverture instantanée), pendant qu'on va chercher
  // une version fraîche en arrière-plan (en ignorant le cache HTTP du
  // navigateur, GitHub Pages renvoie "cache-control: max-age=600") pour la
  // prochaine ouverture. On ne reste ainsi jamais bloqué plus d'une session
  // sur une version mise en cache trop tôt, sans payer le réseau à chaque fois.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var network = fetch(event.request.url, { cache: "no-store" })
        .then(function (response) {
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, response.clone());
          });
          return response;
        })
        .catch(function () {
          return cached;
        });
      return cached || network;
    })
  );
});
