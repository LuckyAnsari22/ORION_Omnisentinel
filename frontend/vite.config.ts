import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

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
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },

  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
})
