/// <reference lib="webworker" />

/**
 * Service worker: depois do primeiro carregamento a página funciona sem internet.
 *
 * É o que sustenta a promessa de que a foto não sai do aparelho: se nem a rede é
 * usada depois de abrir, não há para onde a foto ir.
 */

const escopo = self as unknown as ServiceWorkerGlobalScope;

// Suba esta versão a cada publicação: o service worker apaga os caches antigos
// no activate, e é assim que a página nova chega a quem já tinha visitado.
const CACHE = "casca-v4";

const CASCA = [
  "./",
  "./index.html",
  "./estilo.css",
  "./app.js",
  "./worker.js",
  "./zip.js",
  "./formato.js",
  "./i18n.js",
  "./tipos.js",
  "./vendor/libheif-bundle.mjs",
  "./manifest.webmanifest",
  "./icone.svg",
];

escopo.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CASCA))
      .then(() => escopo.skipWaiting()),
  );
});

escopo.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave))))
      .then(() => escopo.clients.claim()),
  );
});

escopo.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== "GET" || new URL(requisicao.url).origin !== escopo.location.origin) return;

  // Navegação vai primeiro na rede: assim uma versão nova aparece no primeiro
  // carregamento, e o cache só entra quando não há internet.
  if (requisicao.mode === "navigate") {
    evento.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          const copia = resposta.clone();
          void caches.open(CACHE).then((cache) => cache.put("./index.html", copia));
          return resposta;
        })
        .catch(() => caches.match("./index.html").then((guardado) => guardado ?? Response.error())),
    );
    return;
  }

  // Arquivo vai do cache na hora e é atualizado atrás, sem travar a página.
  // Assim uma publicação nova chega na visita seguinte, mesmo sem trocar a
  // versão do cache na mão.
  evento.respondWith(
    caches.match(requisicao).then((guardado) => {
      const rede = fetch(requisicao)
        .then((resposta) => {
          if (resposta.ok && resposta.type === "basic") {
            const copia = resposta.clone();
            void caches.open(CACHE).then((cache) => cache.put(requisicao, copia));
          }
          return resposta;
        })
        .catch(() => guardado ?? Response.error());

      return guardado ?? rede;
    }),
  );
});
