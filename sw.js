const CACHE='still-water-v2';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];

self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});

// Network first so a new deploy shows up right away, but give up after 3s on a slow connection and use the cached copy.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const net=fetch(e.request).then(r=>{
    if(r.ok&&(r.type==='basic'||r.type==='cors')){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}
    return r;
  });
  const cached=()=>caches.match(e.request).then(m=>m||(e.request.mode==='navigate'?caches.match('./index.html'):undefined));
  const slow=new Promise(res=>setTimeout(res,3000)).then(cached);
  e.respondWith(Promise.race([net.catch(cached),slow.then(m=>m||net)]).then(r=>r||net).catch(cached));
});
