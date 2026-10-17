'use strict';

// tools/build-share.cjs replaces these three values in the generated bundle only.
const VERSION = "web-6fda23639c1ee396";
const PRECACHE = ["art.mjs","assets/audio/music/cozy_loop.wav","assets/audio/sfx/bubble.wav","assets/audio/sfx/coin.wav","assets/audio/sfx/fever_end.wav","assets/audio/sfx/fever_start.wav","assets/audio/sfx/go.wav","assets/audio/sfx/idle_chirp.wav","assets/audio/sfx/invalid.wav","assets/audio/sfx/pop.wav","assets/audio/sfx/purchase.wav","assets/audio/sfx/ready.wav","assets/audio/sfx/result.wav","assets/audio/sfx/select.wav","assets/audio/sfx/shuffle.wav","assets/audio/sfx/skill.wav","assets/audio/sfx/tap.wav","assets/audio/sfx/time_up.wav","assets/audio/sfx/time_warning.wav","assets/catalog.json","assets/characters.json","assets/font/plush-lower.png","assets/font/plush-stitch.json","assets/font/plush-upper.png","assets/idle/ember.png","assets/idle/luna.png","assets/idle/mint.png","assets/idle/stitch.png","assets/idle/sunny.png","assets/native-art.json","assets/native-bodies.json","assets/native-effects/gameplay-effects.png","assets/native-home/information-patch.png","assets/native-powers/catalog.json","assets/native-powers/ember.png","assets/native-powers/luna.png","assets/native-powers/mint.png","assets/native-powers/stitch.png","assets/native-powers/sunny.png","assets/native-repairs/256/ember.png","assets/native-repairs/256/luna.png","assets/native-repairs/256/mint.png","assets/native-repairs/256/stitch.png","assets/native-repairs/256/sunny.png","assets/native-stage/geometry.json","assets/native-stage/stage.png","assets/puffy/controls.png","assets/puffy/effects.png","assets/puffy/icons.png","assets/scenes-v1/fabric-background.png","assets/scenes-v1/information-panel.png","effects.mjs","game.mjs","icon.png","idle.mjs","index.html","manifest.webmanifest","physics.mjs","rules.mjs","style.css"];
const FILES = new Set([".nojekyll","art.mjs","assets/audio/music/cozy_loop.wav","assets/audio/sfx/bubble.wav","assets/audio/sfx/coin.wav","assets/audio/sfx/fever_end.wav","assets/audio/sfx/fever_start.wav","assets/audio/sfx/go.wav","assets/audio/sfx/idle_chirp.wav","assets/audio/sfx/invalid.wav","assets/audio/sfx/pop.wav","assets/audio/sfx/purchase.wav","assets/audio/sfx/ready.wav","assets/audio/sfx/result.wav","assets/audio/sfx/select.wav","assets/audio/sfx/shuffle.wav","assets/audio/sfx/skill.wav","assets/audio/sfx/tap.wav","assets/audio/sfx/time_up.wav","assets/audio/sfx/time_warning.wav","assets/catalog.json","assets/characters.json","assets/font/plush-lower.png","assets/font/plush-stitch.json","assets/font/plush-upper.png","assets/idle/ember.png","assets/idle/luna.png","assets/idle/mint.png","assets/idle/stitch.png","assets/idle/sunny.png","assets/native-art.json","assets/native-bodies.json","assets/native-effects/gameplay-effects.png","assets/native-home/information-patch.png","assets/native-powers/catalog.json","assets/native-powers/ember.png","assets/native-powers/luna.png","assets/native-powers/mint.png","assets/native-powers/stitch.png","assets/native-powers/sunny.png","assets/native-repairs/256/ember.png","assets/native-repairs/256/luna.png","assets/native-repairs/256/mint.png","assets/native-repairs/256/stitch.png","assets/native-repairs/256/sunny.png","assets/native-stage/geometry.json","assets/native-stage/stage.png","assets/puffy/controls.png","assets/puffy/effects.png","assets/puffy/icons.png","assets/scenes-v1/fabric-background.png","assets/scenes-v1/information-panel.png","build.json","effects.mjs","game.mjs","icon.png","idle.mjs","index.html","manifest.webmanifest","physics.mjs","rules.mjs","style.css","sw.js"]);
const SCOPE = new URL(self.registration.scope);
const PREFIX = `plush-pop-share:${encodeURIComponent(SCOPE.pathname)}:`;
const CACHE = PREFIX + VERSION;
const absolute = path => new URL(path, SCOPE).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    if (VERSION.startsWith('__')) throw new Error('Build the companion before registering its service worker.');
    const cache = await caches.open(CACHE);
    try {
      // Keep mobile connections responsive while preparing the offline starters.
      for (let i = 0; i < PRECACHE.length; i += 4) {
        await cache.addAll(PRECACHE.slice(i, i + 4).map(path => new Request(absolute(path), {cache: 'reload'})));
      }
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
    // Updates wait until existing game tabs close, avoiding mixed source versions.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function ranged(response, header) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return response;
  const buffer = await response.arrayBuffer();
  const length = buffer.byteLength;
  const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(length - 1, Number(match[2])) : length - 1;
  if (start > end || start >= length) {
    return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${length}`}});
  }
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${length}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(buffer.slice(start, end + 1), {status: 206, statusText: 'Partial Content', headers});
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  let relative;
  try { relative = decodeURIComponent(url.pathname.slice(SCOPE.pathname.length)); } catch { return; }
  if (relative === '') relative = 'index.html';
  // Only this build's public files can enter its cache; unrelated URLs stay untouched.
  if (!FILES.has(relative) || relative === 'sw.js') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = absolute(relative);
    let response = await cache.match(key);
    if (!response) {
      response = await fetch(request);
      if (response.ok && response.status === 200 && response.type !== 'opaque') {
        try { await cache.put(key, response.clone()); } catch { /* Storage pressure must not stop online play. */ }
      }
    }
    const range = request.headers.get('range');
    return range && response.status === 200 ? ranged(response, range) : response;
  })());
});
