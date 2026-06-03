import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'blood.png', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'LifeLink - Urgent Blood App',
        short_name: 'LifeLink',
        description: 'Connecting blood donors with those in urgent need.',
        theme_color: '#B91C1C', // Using the primary red from the app
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'blood.png', // Assuming this is your main logo in public/
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'blood.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'blood.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/blood\.syedomer\.me\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://blood.syedomer.me',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://blood.syedomer.me',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
