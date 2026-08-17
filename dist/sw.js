self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Force all clients to reload to fetch the new Vite bundle
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          try { client.navigate(client.url); } catch (err) { /* ignore */ }
        });
      });
    }).then(() => {
      return self.registration.unregister();
    })
  );
});
