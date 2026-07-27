var CACHE_NAME = "regie-live-v21";
var APP_SHELL = [
  "./",
  "./index.html",
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
  // Réseau en priorité, et on ignore le cache HTTP du navigateur
  // (GitHub Pages renvoie "cache-control: max-age=600") : les liens/mot de
  // passe/PIN peuvent changer, on ne doit jamais rester bloqué sur une
  // version mise en cache trop tôt. Le cache ne sert que de secours hors-ligne.
  event.respondWith(
    fetch(event.request.url, { cache: "no-store" })
      .then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(function () {
        return caches.match(event.request);
      })
  );
});
