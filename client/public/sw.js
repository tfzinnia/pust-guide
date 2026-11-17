/* Public app shell only. API responses, credentials, and complaint evidence are never cached here. */
const SHELL = "pust-shell-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      const response = await fetch("/index.html", { cache: "reload" });
      if (!response.ok) throw new Error("App shell unavailable");
      const html = await response.clone().text();
      await cache.put("/index.html", response);
      const assets = [
        ...html.matchAll(/(?:src|href)="([^"\s]+\.(?:js|css))"/g),
      ].map((match) => match[1]);
      await cache.addAll([
        "/manifest.webmanifest",
        "/app-icon.svg",
        "/favicon.svg",
        ...assets,
      ]);
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("pust-shell-") && key !== SHELL)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_DOCUMENTS")
    event.waitUntil(caches.delete("pust-documents-v1"));
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/")
  )
    return;
  if (request.mode === "navigate")
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL);
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put("/index.html", response.clone());
          return response;
        } catch {
          return (await cache.match("/index.html")) || Response.error();
        }
      })(),
    );
  else if (
    url.pathname.startsWith("/assets/") ||
    ["/app-icon.svg", "/favicon.svg", "/manifest.webmanifest"].includes(
      url.pathname,
    )
  )
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL),
          stored = await cache.match(request);
        if (stored) return stored;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      })(),
    );
});
