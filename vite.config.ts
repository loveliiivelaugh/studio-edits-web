import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/favicon.ico', 'assets/apple-touch-icon.png'],
      manifest: {
        name: 'Woodward Studios',
        short_name: 'Studio',
        description: 'AI video edits + creative tools',
        theme_color: '#050816',
        background_color: '#050816',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/assets/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/assets/maskable-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@api': path.resolve(__dirname, './src/utilities/api'),
      '@store': path.resolve(__dirname, './src/utilities/store'),
      '@scripts': path.resolve(__dirname, './src/utilities/scripts'),
      '@helpers': path.resolve(__dirname, './src/utilities/helpers'),
      '@components': path.resolve(__dirname, './src/components'),
      '@custom': path.resolve(__dirname, './src/components/Custom'),
      '@mui2': path.resolve(__dirname, './src/components/Mui'),
      '@lib': path.resolve(__dirname, './src/utilities/lib'),
      '@theme': path.resolve(__dirname, './src/utilities/theme'),
      '@utilities': path.resolve(__dirname, './src/utilities'),
      '@config': path.resolve(__dirname, './src/utilities/config'),
      '@assets': path.resolve(__dirname, './src/utilities/assets'),
    }
  },
  server: {
    proxy: {
      '/api/notion/webhook': {
        target: 'http://localhost:5250/api/v1/webhook',
        changeOrigin: true,
      },
    },
  }
})
