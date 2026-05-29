import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/vinyl-tracker/',
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'VinylTracker',
        short_name: 'Vinyl',
        description: 'Offline-first vinyl collection manager',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/vinyl-tracker/',
        scope: '/vinyl-tracker/',
        icons: [
          { src: '/vinyl-tracker/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/vinyl-tracker/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/vinyl-tracker/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
