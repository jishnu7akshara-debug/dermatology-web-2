# Aurelle — Skin & Hair Clinic Website

A production-ready, ultra-fast website for **Aurelle Skin & Hair Clinic**.

## 🚀 Speed & Performance Optimizations

1. **Next-Gen Image Formats (WebP)**:
   - Converted all photography and product packshots to **WebP**, slashing asset sizes by **up to 94%** on packshots (e.g. from ~400 KB down to 18–22 KB) and cutting the total payload from ~2.5 MB to **<900 KB**.
   - Original PNG/JPEG files are retained as instant fallbacks via `onerror="this.onerror=null;this.src='...'"` handlers.
2. **Layout Shift Prevention (Zero CLS)**:
   - Every `<img>` tag now has explicit `width` and `height` attributes and aspect ratios to prevent Cumulative Layout Shifts during loading.
3. **Optimized LCP (Largest Contentful Paint)**:
   - The hero images are preloaded in the `<head>` using `<link rel="preload" as="image" href="..." fetchpriority="high">`.
   - Hero images feature `loading="eager"`, `fetchpriority="high"`, and `decoding="async"`.
4. **Deferred Loading & Async Decoding**:
   - All below-the-fold images (treatments, product carousel, doctors, booking) use `loading="lazy"` and `decoding="async"`, freeing up network and CPU time on initial load.
5. **Layout-Thrashing-Free Smooth Scroll**:
   - Eliminated synchronous DOM forced reflows (`getBoundingClientRect()` layout thrashing) by batching geometry reads and style writes.
   - Reduced rendering cost for offscreen content using CSS `content-visibility: auto`.
6. **Production HTTP Web Server (`server.js`)**:
   - Zero-dependency Node.js HTTP server.
   - Built-in **Brotli** and **Gzip** compression for text, HTML, and CSS assets.
   - Aggressive static caching with `Cache-Control: public, max-age=31536000, immutable`.
   - Smart ETag support with `304 Not Modified` responses.
   - Modern HTTP Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

---

## 💻 Running the Website

### Option 1: Using npm (Node.js)
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Option 2: Running directly with Node
```bash
node server.js
```

### Option 3: Verification Test
```bash
npm test
```
Tests all 18 image endpoints and measures transfer speeds and status codes.
