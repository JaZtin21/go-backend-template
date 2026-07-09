import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs';
import path from 'path';

// Custom plugin that writes the exact build time to your public folder
const generateVersionFile = () => ({
  name: 'generate-version-file',
  buildStart() {
    const versionData = { version: `build-${Date.now()}` };
    const filePath = path.resolve(__dirname, 'public/version.json');
    fs.writeFileSync(filePath, JSON.stringify(versionData));
  }
});

// 🚨 CHANGE THIS LINE: Wrap the configuration object inside an arrow function block
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      generateVersionFile(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: mode === 'development', // 🧠 Now 'mode' is safely defined and accessible here!
          type: 'module',
        },
        workbox: {
          runtimeCaching: [
            {
              // 🚀 Targets MapLibre Vector Tile packets (.pbf) and Style JSON sheets
              urlPattern: /^https:\/\/api\.maptiler\.com\/.*\.(json|pbf)/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'maptiler-vector-cache',
                matchOptions: {
                  ignoreSearch: true,
                },
                expiration: {
                  // Vector files are highly compressed data; 1,500 entries covers huge regional territories
                  maxEntries: 3500,
                  maxAgeSeconds: 60 * 60 * 24 * 30,  // 📅 Extended to 30 days so returning users never hit your quota
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'Tindahan',
          short_name: 'Tindahan',
          description: 'Tindahan app to find local shops and products in your area',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: 'screenshot-desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Desktop App View'
            },
            {
              src: 'screenshot-mobile.png',
              sizes: '648x1334',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Mobile App View'
            }
          ]
        }
      })
    ],
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
      allowedHosts: true
    },
  };
});
