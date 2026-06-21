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
        short_name: 'D/OS',
        description: 'Personal Discipline Tracking System',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        id: '/',
        lang: 'en',
        categories: ['productivity', 'health', 'lifestyle'],
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,webmanifest}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              backgroundSync: { name: 'api-queue' },
            },
          },
          {
            urlPattern: /^https?:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
  },
});
