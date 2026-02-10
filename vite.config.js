import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

const THEME_COLOR = '#FF8E53'
const BACKGROUND_COLOR = '#FFF9F0'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    // 👇 local dev = "/", GitHub Pages = "/impostor-game/"
    base: isProd ? '/impostor-game/' : '/',

    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'autoUpdate',

        includeAssets: [
          'icons/icon-180.png',
          'icons/icon-192.png',
          'icons/icon-512.png',
        ],

        manifest: {
          name: 'Impostor!',
          short_name: 'Impostor',

          // 👇 must match base
          start_url: isProd ? '/impostor-game/' : '/',
          scope: isProd ? '/impostor-game/' : '/',

          display: 'standalone',
          theme_color: THEME_COLOR,
          background_color: BACKGROUND_COLOR,

          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },

        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
      }),
    ],
  }
})
