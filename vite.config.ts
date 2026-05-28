import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/vinyl-tracker/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\.discogs\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'discogs-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/i\.discogs\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'discogs-images', expiration: { maxEntries: 500 } },
          },
        ],
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
          { src: '/vinyl-tracker/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/vinyl-tracker/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
