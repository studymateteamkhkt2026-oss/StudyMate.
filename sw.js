/* StudyMate custom service worker + OneSignal Web SDK v16.
   Host this file at the site's root over HTTPS. Never put server REST keys here. */
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (err) {
  // If the CDN is temporarily unavailable, StudyMate's own offline/notification
  // handlers below remain available.
  console.warn('OneSignal worker SDK could not be loaded', err);
}

const CACHE_NAME = 'studymate-v35';
const urlsToCache = ['./index.html', './app.js', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('studymate-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(res => res || fetch(event.request).catch(() => res)));
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SHOW_ANTI_CHEAT') {
    event.waitUntil(self.registration.showNotification('StudyMate - Hỏi nhỏ nè! 🐾', {
      body: 'Cậu đang tra tài liệu hay nghỉ giải lao?',
      icon: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png',
      tag: 'studymate-pomodoro-choice',
      renotify: true,
      requireInteraction: true,
      actions: [
        { action: 'research', title: '📚 Tra tài liệu' },
        { action: 'play', title: '🌿 Giải lao' }
      ],
      data: { kind: 'pomodoro-choice' }
    }));
  }
});

self.addEventListener('notificationclick', event => {
  const action = event.action;
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = windows.find(c => c.visibilityState === 'visible') || windows[0];

    if (action === 'research' || action === 'play') {
      // Không focus/openWindow khi bấm nút hành động: tránh vòng lặp mở lại PWA.
      // Gửi lệnh cho trang đang giữ phiên Pomodoro chạy nền.
      const message = action === 'research'
        ? { type: 'POMODORO_RESEARCH' }
        : { type: 'POMODORO_BREAK' };
      if (client) {
        client.postMessage(message);
        await self.registration.showNotification(
          action === 'research' ? 'Tiếp tục học 📚' : 'Giải lao 5 phút 🌿',
          {
            body: action === 'research'
              ? 'Đã tiếp tục tính giờ trong nền. Khi muốn quay lại StudyMate, hãy mở ứng dụng thủ công nhé!'
              : 'Đồng hồ đang tạm dừng. Quay lại trong 5 phút để tiếp tục nhé!',
            icon: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png',
            tag: action === 'research' ? 'studymate-research-confirm' : 'studymate-break-reminder',
            renotify: true,
            silent: false,
            vibrate: action === 'research' ? [150, 80, 150] : [200, 100, 200]
          }
        );
      } else {
        // Không mở app tự động vì phiên Pomodoro không còn client để tiếp tục.
        await self.registration.showNotification('StudyMate không chạy nền', {
          body: 'Không tìm thấy phiên học đang chạy. Hãy mở StudyMate thủ công để bắt đầu hoặc khôi phục phiên học.',
          icon: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png',
          tag: 'studymate-no-active-session',
          silent: false
        });
      }
      return;
    }

    // Chỉ bấm vào phần thân thông báo mới mở/focus ứng dụng.
    if (client) await client.focus();
    else await self.clients.openWindow('./index.html');
  })());
});
