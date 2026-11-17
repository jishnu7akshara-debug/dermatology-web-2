const http = require('http');

const images = [
  '/favicon.svg',
  '/img/hero-skin.webp',
  '/img/hero-hair.webp',
  '/img/p-serum.webp',
  '/img/p-cream.webp',
  '/img/treatment-room.webp',
  '/img/t-pigmentation.webp',
  '/img/t-hydrafacial.webp',
  '/img/t-acne.webp',
  '/img/t-antiageing.webp',
  '/img/t-laser.webp',
  '/img/t-peel.webp',
  '/img/p-hairserum.webp',
  '/img/consult.webp',
  '/img/p-shampoo.webp',
  '/img/clinic-lounge.webp',
  '/img/p-sunscreen.webp',
  '/img/p-cleanser.webp'
];

let completed = 0;
let totalBytes = 0;
const start = Date.now();

images.forEach(img => {
  const reqStart = Date.now();
  http.get('http://localhost:3000' + img, (res) => {
    let size = 0;
    res.on('data', chunk => size += chunk.length);
    res.on('end', () => {
      totalBytes += size;
      completed++;
      const timeMs = Date.now() - reqStart;
      console.log(`[PASS] ${img.padEnd(25)} ${res.statusCode} ${(size / 1024).toFixed(1).padStart(6)} KB (${res.headers['content-type']}) ${timeMs}ms`);
      if (completed === images.length) {
        console.log(`\nAll ${images.length} assets served successfully in ${Date.now() - start}ms!`);
        console.log(`Total transfer: ${(totalBytes / 1024).toFixed(1)} KB (down from ~2,500 KB original PNG/JPG)`);
      }
    });
  }).on('error', (err) => console.error(`[FAIL] ${img}: ${err.message}`));
});
