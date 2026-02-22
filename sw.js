self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const { title, body } = event.data || {};
  if (!title) return;
  self.registration.showNotification(title, {
    title,
    body: body || 'Nuovo segnale CoinSage Alpha'
  });
});
