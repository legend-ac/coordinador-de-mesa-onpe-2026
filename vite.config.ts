import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Coordinador de Mesa - ONPE 2026',
          short_name: 'ONPE Mesas',
          description: 'Control oficial de miembros de mesas 51, 52 y 53, asistencia y WhatsApp directo ONPE 2026.',
          theme_color: '#00223A',
          background_color: '#00223A',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Dividir el bundle grande (~2.5MB) en chunks más pequeños cargados bajo demanda.
      // Esto reduce el JS crítico inicial de 2.5MB → ~300KB → carga en <1s.
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            // Firebase — se necesita para auth + Firestore (cargado al inicio pero en chunk separado)
            if (id.includes('/node_modules/firebase') || id.includes('/node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            // ExcelJS — solo se necesita al exportar/importar Excel
            if (id.includes('/node_modules/exceljs')) {
              return 'vendor-excel';
            }
            // jsPDF — solo al generar informes PDF
            if (id.includes('/node_modules/jspdf')) {
              return 'vendor-pdf';
            }
            // JSZip — solo al descargar ZIP
            if (id.includes('/node_modules/jszip')) {
              return 'vendor-zip';
            }
            // QRCode — solo al mostrar códigos QR
            if (id.includes('/node_modules/qrcode')) {
              return 'vendor-qr';
            }
            // Lucide icons — grandes, van en su propio chunk
            if (id.includes('/node_modules/lucide-react')) {
              return 'vendor-icons';
            }
          },
        },
      },
      // Aumentar límite de aviso para chunks grandes de vendors
      chunkSizeWarningLimit: 600,
    },
  };
});
