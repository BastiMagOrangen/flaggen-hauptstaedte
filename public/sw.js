// shortcut: network-first, so slow connections wait for the network before the cache answers; upgrade to stale-while-revalidate if that hurts.
const CACHE = "flags-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const codes = await (await fetch("flags/list.json")).json();
      const cache = await caches.open(CACHE);
      await cache.addAll(["./", ...codes.map((c) => `flags/${c}.png`)]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(r, copy));
        }
        return res;
      })
      .catch(() => caches.match(r, { ignoreSearch: true })),
  );
});
