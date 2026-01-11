import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginString from 'vite-plugin-string'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vitePluginString()
  ],

  server: {
    port: 5174,
    host: true,
    proxy: {
      // Proxy Guardian AI requests
      '/api/guardian': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/guardian/, ''),
      },
      // Proxy Visualky requests
      '/api/visualky': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/visualky/, ''),
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false
  },

  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
})
