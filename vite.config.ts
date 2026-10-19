import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/codigo-pt/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Código — exame de condução',
        short_name: 'Código',
        description: 'Practice the Portuguese driving theory exam with EN/UK translations',
        theme_color: '#1c5fd4',
        background_color: '#f5f6f8',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [
          { urlPattern: /\/data\/.*\.json$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'data' } },
          {
            urlPattern: /\/img\/.*\.jpg$/,
            handler: 'CacheFirst',
            options: { cacheName: 'img', expiration: { maxEntries: 6000 } },
          },
        ],
      },
    }),
  ],
})
