import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig as defineVitestConfig } from 'vitest/config';

export default defineConfig(
  defineVitestConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Drive Time',
          short_name: 'Drive Time',
          display: 'standalone',
          lang: 'en',
          description:
            'When should I leave? Compare departure times and find the best one to avoid traffic.',
          orientation: 'portrait',
          categories: ['navigation', 'utilities'],
          id: '/',
          start_url: '/',
          scope: '/',
          background_color: '#101010',
          theme_color: '#101010',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//],
          // woff2 is outside the default glob; without it the app shell falls back to a system font offline.
          globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'],
          // Only crawlers and link previews fetch these; the installed app never needs them.
          globIgnores: ['og-image.png'],
          runtimeCaching: [
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: 'src/test/setup.ts',
      globalSetup: 'src/test/global-setup.ts',
      css: true,
    },
  }),
);
