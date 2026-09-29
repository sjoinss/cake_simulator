// 앱으로 설치했을 때 인터넷이 끊겨도 한 번 열어 본 게임은 켜지게 하는 서비스 워커.
// 항상 네트워크를 먼저 쓰고(업데이트가 바로 반영되게) 실패할 때만 저장해 둔 사본을 쓴다.
const CACHE = "cake-tycoon-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // 처음 여는 주소라도 게임 화면은 하나뿐이라 시작 페이지를 대신 보여준다
        if (request.mode === "navigate") {
          const start = await caches.match(self.registration.scope);
          if (start) return start;
        }
        return Response.error();
      }),
  );
});
