import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 8080,
    host: '0.0.0.0',
    // Mirror the /itunes-api rewrite in vercel.json so dev and prod both hit
    // iTunes same-origin (its CDN caches CORS headers per URL, breaking
    // cross-origin fetches from any second origin)
    proxy: {
      '/itunes-api': {
        target: 'https://itunes.apple.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/itunes-api/, ''),
      },
    },
  },
})
