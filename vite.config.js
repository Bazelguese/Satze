import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  base: './', // Importante per Electron: usa path relativi
  // Nomi di funzioni e componenti conservati nel bundle minificato: il registratore di
  // prestazioni (F10) li mostra al posto di sigle illeggibili. Costo: qualche KB.
  esbuild: { keepNames: true },
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
