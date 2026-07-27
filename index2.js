// Fayl nomi 'sw.js' — bu haqiqiy Service Worker fayli, u index.js orqali navigator.serviceWorker.register('sw.js') bilan ro'yxatdan o'tkaziladi.
// ESLATMA: bu faylni oddiy <script> sifatida HTML ichiga ulash XATO edi (self.addEventListener('install'...) window kontekstida hech narsa qilmaydi).
// Endi u faqat Service Worker sifatida ishlatiladi.
// Bozor narxlari — oddiy "app shell" keshlash orqali offline ishlashni ta'minlaydi.
// Narx ma'lumotlarining o'zi window.storage orqali saqlanadi (bu fayl bilan bog'liq emas);
// bu service worker faqat HTML/CSS/JS qobig'ini keshlab, internetsiz ochilishga yordam beradi.

const CACHE_NAME = 'bozor-narxlari-v1';
const APP_SHELL = ['./', './index.html', './index.css', './index.js', './manifest.json'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => { })
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
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const network = fetch(event.request)
                .then((res) => {
                    if (res && res.ok) {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});