// Offline cache สำหรับไฟล์ของแอปและไลบรารีที่กำหนดไว้
const CACHE="qr-generator-v2.0.1";
const ROOT=["./","./index.html","./style.css?v=2","./script.js?v=2","./manifest.webmanifest","./icon.svg"];
const EXTERNAL=["https://cdn.tailwindcss.com/3.4.17","https://cdn.jsdelivr.net/npm/qr-code-styling@1.6.0/lib/qr-code-styling.js"];
self.addEventListener("install",event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);await cache.addAll(ROOT);
 await Promise.allSettled(EXTERNAL.map(async url=>{const response=await fetch(url,{mode:"no-cors"});if(response.ok||response.type==="opaque")await cache.put(url,response);}));
 await self.skipWaiting();
})()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 for(const key of await caches.keys()) if(key.startsWith("qr-generator-")&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
 const request=event.request;if(request.method!=="GET")return;
 const local=new URL(request.url).origin===self.location.origin;
 if(!local&&!EXTERNAL.includes(request.url))return;
 event.respondWith((async()=>{
 const cache=await caches.open(CACHE);
 try{const response=await fetch(request);if(response.ok||response.type==="opaque")await cache.put(request,response.clone());return response;}
 catch{const saved=await cache.match(request);if(saved)return saved;if(request.mode==="navigate"){const home=await cache.match("./index.html");if(home)return home;}return Response.error();}
 })());
});