import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'DisciplineOS',
        short_name: 'DisciplineOS',
        description: 'Personal Discipline Tracking System',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcuts: [
          { name: 'Tasks', url: '/tasks', icons: [{ src: 'icon-192x192.png', sizes: '192x192' }] },
          { name: 'PMO Tracker', url: '/pmo', icons: [{ src: 'icon-192x192.png', sizes: '192x192' }] },
          { name: 'Sleep', url: '/sleep', icons: [{ src: 'icon-192x192.png', sizes: '192x192' }] },
        ],
        widgets: [
          {
            name: 'DisciplineOS Widget',
            description: 'Track your discipline at a glance',
            tag: 'discipline-widget',
            type: 'application/widget',
            sources: [
              {
                src: '/widget.html',
                sizes: { width: 300, height: 200 },
              },
            ],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
