/* ToolTrack service worker — enables installable PWA + Web Push.
 * The `push` handler is ready for a real backend (VAPID) later; the app
 * also fires local notifications for the prototype reminder engine. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Server-initiated push (when a Supabase/edge backend is wired up).
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'ToolTrack', {
      body: data.body || '',
      icon: './icon.svg',
      badge: './icon.svg',
      tag: data.tag,
      data: { url: data.url || './' },
    }),
  );
});

// Tapping a notification focuses the app (deep-linking to the relevant view).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(url);
            } catch {
              /* cross-scope navigation not allowed — ignore */
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(url);
    })(),
  );
});
