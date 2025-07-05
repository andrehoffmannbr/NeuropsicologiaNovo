import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    host: true, // Para mobile testing
    cors: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    
    // 🚀 Otimizações de Performance
    rollupOptions: {
      output: {
        // Code splitting inteligente
        manualChunks: {
          'vendor': ['@supabase/supabase-js'],
          'charts': ['chart.js'],
          'utils': ['jspdf', 'jspdf-autotable', 'xlsx'],
          'components': [
            './src/components/LoadingSkeleton.js',
            './src/components/Layout.js',
            './src/components/toast.js'
          ],
          'services': [
            './src/utils/cache.js',
            './src/utils/pagination.js',
            './src/utils/analytics.js',
            './src/utils/helpers.js'
          ]
        },
        // Nomear chunks para melhor cache
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // Minificação avançada
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.warn'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    // Otimizações de tamanho
    chunkSizeWarningLimit: 1000,
    
    // Assets inline pequenos
    assetsInlineLimit: 4096,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Reportar tamanho do bundle
    reportCompressedSize: true,
    
    // Target para melhor suporte
    target: ['es2020', 'chrome80', 'firefox78', 'safari13']
  },
  
  // 🔧 Otimizações de desenvolvimento
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'chart.js', 'jspdf', 'jspdf-autotable', 'xlsx'],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // 🔧 Resolve aliases
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@utils': '/src/utils',
      '@services': '/src/services',
      '@styles': '/src/styles'
    }
  },
  
  // 🔧 CSS configurações
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [
        // Autoprefixer automático
        {
          postcssPlugin: 'internal:charset-removal',
          AtRule: {
            charset: (atRule) => {
              if (atRule.name === 'charset') {
                atRule.remove()
              }
            }
          }
        }
      ]
    }
  },
  
  // 🔧 Define variáveis globais
  define: {
    'process.env': {},
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  
  // 🔧 Configurações do preview
  preview: {
    port: 5000,
    host: true,
    cors: true
  },
  
  // 🔧 Configurações PWA
  plugins: [
    // Plugin personalizado para PWA
    {
      name: 'pwa-config',
      configureServer(server) {
        // Configurar headers para PWA
        server.middlewares.use((req, res, next) => {
          if (req.url === '/manifest.json') {
            res.setHeader('Content-Type', 'application/manifest+json')
          }
          if (req.url === '/sw.js') {
            res.setHeader('Content-Type', 'application/javascript')
            res.setHeader('Service-Worker-Allowed', '/')
          }
          next()
        })
      }
    }
  ]
}) 