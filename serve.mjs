// 本地静态服务器:预览 plugins-site(端口 8099)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, relative, isAbsolute } from 'node:path'

const ROOT = 'G:\\deepseek\\workspace\\plugins-site'
const PORT = Number(process.env.PORT || 8099)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x')
    let p = decodeURIComponent(url.pathname)
    if (p.endsWith('/')) p += 'index.html'
    const file = join(ROOT, normalize(p).replace(/^([/\\])+/, ''))
    const rel = relative(ROOT, file)
    if (rel.startsWith('..') || isAbsolute(rel)) { res.writeHead(403).end('forbidden'); return }
    const buf = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(buf)
  } catch (e) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 ' + req.url)
  }
}).listen(PORT, '127.0.0.1', () => console.log(`plugins-site preview: http://127.0.0.1:${PORT}/`))
