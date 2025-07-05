// 🚀 Service Worker para Cache Offline e Performance
const CACHE_NAME = 'neuropsico-v1.2.0'
const STATIC_CACHE = 'neuropsico-static-v1.2.0'
const DYNAMIC_CACHE = 'neuropsico-dynamic-v1.2.0'

// Assets críticos para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/App.js',
  '/src/styles/main.css',
  '/src/styles/layout.css',
  '/src/styles/dashboard.css',
  '/src/components/Layout.js',
  '/src/components/toast.js',
  '/src/utils/router.js',
  '/src/utils/helpers.js',
  '/src/config/supabase.js',
  '/src/services/auth.js',
  '/public/favicon.svg',
  '/public/img/logosistema.jpg',
  '/public/img/logologin.jpg'
]

// Assets dinâmicos para cache
const DYNAMIC_ASSETS = [
  '/src/pages/',
  '/src/services/',
  '/src/components/',
  '/src/utils/'
]

// URLs que devem sempre ir para rede
const NETWORK_FIRST = [
  '/api/',
  'supabase.co',
  'https://neuropsicologia-novo.vercel.app'
]

// 🔧 Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Instalando service worker...')
  
  event.waitUntil(
    Promise.all([
      // Cache de assets estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 SW: Cacheando assets estáticos...')
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { cache: 'reload' })
        }))
      }),
      
      // Forçar ativação imediata
      self.skipWaiting()
    ])
  )
})

// 🔧 Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Ativando service worker...')
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ SW: Removendo cache antigo:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Assumir controle imediato
      self.clients.claim()
    ])
  )
})

// 🔧 Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return
  }
  
  // Ignorar requisições de extensões do Chrome
  if (url.protocol === 'chrome-extension:') {
    return
  }
  
  // Estratégia baseada no tipo de recurso
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request))
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirstStrategy(request))
  } else if (isDynamicAsset(request)) {
    event.respondWith(staleWhileRevalidateStrategy(request))
  } else {
    event.respondWith(networkFirstStrategy(request))
  }
})

// 🔧 Verificar se é asset estático
function isStaticAsset(request) {
  const url = new URL(request.url)
  return STATIC_ASSETS.some(asset => url.pathname.includes(asset)) ||
         url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/)
}

// 🔧 Verificar se é requisição de API
function isAPIRequest(request) {
  const url = new URL(request.url)
  return NETWORK_FIRST.some(pattern => 
    url.href.includes(pattern) || url.pathname.includes(pattern)
  )
}

// 🔧 Verificar se é asset dinâmico
function isDynamicAsset(request) {
  const url = new URL(request.url)
  return DYNAMIC_ASSETS.some(pattern => url.pathname.includes(pattern))
}

// 🔧 Estratégia Cache First (para assets estáticos)
async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('📦 SW: Cache hit para:', request.url)
      return cachedResponse
    }
    
    console.log('🌐 SW: Buscando da rede:', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone()
      cache.put(request, responseClone)
    }
    
    return networkResponse
    
  } catch (error) {
    console.error('❌ SW: Erro no cache first:', error)
    return new Response('Recurso não disponível offline', { status: 503 })
  }
}

// 🔧 Estratégia Network First (para APIs)
async function networkFirstStrategy(request) {
  try {
    console.log('🌐 SW: Network first para:', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      const responseClone = networkResponse.clone()
      cache.put(request, responseClone)
    }
    
    return networkResponse
    
  } catch (error) {
    console.warn('⚠️ SW: Rede falhou, tentando cache:', error)
    
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    return new Response('Serviço indisponível', { status: 503 })
  }
}

// 🔧 Estratégia Stale While Revalidate (para assets dinâmicos)
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Buscar da rede em background
  const networkPromise = fetch(request).then(response => {
    if (response && response.status === 200) {
      const responseClone = response.clone()
      cache.put(request, responseClone)
    }
    return response
  }).catch(error => {
    console.warn('⚠️ SW: Erro na revalidação:', error)
  })
  
  // Retornar cache imediatamente se disponível
  if (cachedResponse) {
    console.log('📦 SW: Stale while revalidate hit para:', request.url)
    return cachedResponse
  }
  
  // Caso contrário, aguardar rede
  return networkPromise
}

// 🔧 Limpeza periódica do cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCaches()
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// 🔧 Limpar caches antigos
async function cleanOldCaches() {
  const cacheNames = await caches.keys()
  const oldCaches = cacheNames.filter(cacheName => 
    cacheName !== STATIC_CACHE && 
    cacheName !== DYNAMIC_CACHE && 
    cacheName !== CACHE_NAME
  )
  
  await Promise.all(oldCaches.map(cacheName => {
    console.log('🗑️ SW: Limpando cache antigo:', cacheName)
    return caches.delete(cacheName)
  }))
}

// 🔧 Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Implementar sincronização de dados offline
  console.log('🔄 SW: Executando sincronização em background...')
}

// 🔧 Notificações push (futuro)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/public/favicon.svg',
      badge: '/public/favicon.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// 🔧 Logging para debug
console.log('🚀 SW: Service Worker carregado e pronto!')

// 🔧 Expor informações do cache
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    const cacheNames = await caches.keys()
    const cacheInfo = {}
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      cacheInfo[cacheName] = keys.length
    }
    
    event.ports[0].postMessage({
      cacheInfo,
      version: CACHE_NAME
    })
  }
}) 