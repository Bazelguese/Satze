import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { cpSync, existsSync, readFileSync, statSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * La campagna verso Cael è la pagina in prototipi/campagna-cael, aperta dal gioco in un frame:
 * in sviluppo Vite la serve dalla radice, nella build va copiata accanto all'app.
 */
const PROTOTYPE_TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.json': 'application/json' }
let prototypeIsBuild = false
const campaignPrototype = {
  name: 'satze-campaign-prototype',
  // in sviluppo la pagina va servita così com'è: la trasformazione HTML di Vite ne rovina lo script
  configureServer(server) {
    const root = resolve(__dirname, 'prototipi')
    server.middlewares.use('/prototipi', (req, res, next) => {
      const path = resolve(root, '.' + decodeURIComponent((req.url || '/').split('?')[0]))
      if (!path.startsWith(root) || !existsSync(path) || !statSync(path).isFile()) return next()
      const ext = path.slice(path.lastIndexOf('.'))
      res.setHeader('Content-Type', PROTOTYPE_TYPES[ext] || 'application/octet-stream')
      res.end(readFileSync(path))
    })
  },
  configResolved(config) { prototypeIsBuild = config.command === 'build' },
  closeBundle() {
    if (!prototypeIsBuild) return
    const from = resolve(__dirname, 'prototipi/campagna-cael')
    if (existsSync(from)) cpSync(from, resolve(__dirname, 'dist/prototipi/campagna-cael'), { recursive: true })
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), campaignPrototype],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  base: './', // Importante per Electron: usa path relativi
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },
  // Su Windows Node può mettere l'ascolto solo su [::1]: senza questo, molti client
  // usano 127.0.0.1 e ottengono ERR_CONNECTION_REFUSED (es. Simple Browser / alcuni tool).
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
})
