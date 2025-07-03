import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@supabase/supabase-js'],
          charts: ['chart.js'],
          utils: ['jspdf', 'jspdf-autotable', 'xlsx']
        }
      }
    }
  },
  define: {
    'process.env': {}
  }
}) 