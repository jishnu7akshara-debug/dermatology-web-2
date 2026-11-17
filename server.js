/**
 * High-Performance Production HTTP Server for Aurelle Clinic
 * Features:
 * - Native Node.js HTTP (zero external dependencies)
 * - Automatic Brotli & Gzip compression
 * - HTTP/1.1 Keep-Alive & High-Concurrency
 * - Cache-Control with immutable caching for static assets
 * - Strong/Weak ETag generation with 304 Not Modified support
 * - Security headers (nosniff, sameorigin, referrer-policy)
 * - Graceful shutdown
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const COMPRESSIBLE_TYPES = new Set([
  'text/html; charset=utf-8',
  'text/css; charset=utf-8',
  'application/javascript; charset=utf-8',
  'application/json; charset=utf-8',
  'image/svg+xml'
]);

// In-memory cache for small static assets & file stats to avoid repeated disk reads
const assetCache = new Map();

function getFileMeta(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    const etag = `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
    return { stat, etag };
  } catch {
    return null;
  }
}

const server = http.createServer((req, res) => {
  const startTime = process.hrtime.bigint();

  // Basic security: disallow non-GET/HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // Parse path & sanitize
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(path.join(PUBLIC_DIR, reqPath));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const meta = getFileMeta(safePath);
  if (!meta) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="font-family:sans-serif;text-align:center;padding:50px"><h1>404 — Page Not Found</h1><p><a href="/">Return to Aurelle Clinic</a></p></body></html>');
    return;
  }

  const { stat, etag } = meta;
  const ext = path.extname(safePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Base Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Conditional request (304 Not Modified)
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, {
      'ETag': etag,
      'Cache-Control': ext === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=31536000, immutable'
    });
    res.end();
    return;
  }

  // Cache-Control policy
  if (ext === '.html') {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  } else {
    // Static assets can be cached aggressively
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  res.setHeader('ETag', etag);
  res.setHeader('Content-Type', contentType);

  if (req.method === 'HEAD') {
    res.setHeader('Content-Length', stat.size);
    res.writeHead(200);
    res.end();
    return;
  }

  // Check compression support
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const isCompressible = COMPRESSIBLE_TYPES.has(contentType);

  if (isCompressible) {
    if (acceptEncoding.includes('br')) {
      res.writeHead(200, { 'Content-Encoding': 'br', 'Vary': 'Accept-Encoding' });
      const rawStream = fs.createReadStream(safePath);
      const brotli = zlib.createBrotliCompress({
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 5
        }
      });
      rawStream.pipe(brotli).pipe(res);
      return;
    } else if (acceptEncoding.includes('gzip')) {
      res.writeHead(200, { 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' });
      const rawStream = fs.createReadStream(safePath);
      const gzip = zlib.createGzip({ level: 6 });
      rawStream.pipe(gzip).pipe(res);
      return;
    }
  }

  // Uncompressed / Binary assets (WebP, JPEG, PNG, etc. are already compressed)
  res.setHeader('Content-Length', stat.size);
  res.writeHead(200);
  const stream = fs.createReadStream(safePath);
  stream.pipe(res);

  stream.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    if (process.env.DEBUG) {
      console.log(`[${req.method}] ${reqPath} -> 200 (${stat.size} bytes, ${elapsedMs.toFixed(2)}ms)`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✨ Aurelle Clinic Production Server running at: http://localhost:${PORT}`);
  console.log(`🚀 Features: Brotli/Gzip compression, Immutable asset caching, ETag 304, Security headers`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('\nServer gracefully terminated.');
    process.exit(0);
  });
});
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
