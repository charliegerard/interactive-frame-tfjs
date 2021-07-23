self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open("sw-cache").then(function (cache) {
      return cache.add("index.html");
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match("event.request").then(function (response) {
      return response || fetch(event.request);
    })
  );
});
