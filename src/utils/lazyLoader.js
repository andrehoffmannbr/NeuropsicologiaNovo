// 🚀 Sistema de Lazy Loading para Páginas
import LoadingSkeleton from '../components/LoadingSkeleton.js'

class LazyLoader {
  constructor() {
    this.cache = new Map()
    this.loading = new Set()
    this.preloadQueue = []
    this.isPreloading = false
    
    // Configurações
    this.preloadDelay = 1000 // Delay antes de pré-carregar
    this.maxPreloads = 3     // Máximo de páginas pré-carregadas
    
    console.log('🚀 LazyLoader: Inicializado')
  }

  // 🔧 Carregar página sob demanda
  async loadPage(pageName, showSkeleton = true) {
    try {
      // Verificar cache primeiro
      if (this.cache.has(pageName)) {
        console.log(`✅ LazyLoader: Cache hit para ${pageName}`)
        return this.cache.get(pageName)
      }

      // Verificar se já está carregando
      if (this.loading.has(pageName)) {
        console.log(`⏳ LazyLoader: Aguardando carregamento de ${pageName}`)
        return this.waitForLoad(pageName)
      }

      // Mostrar skeleton se solicitado
      if (showSkeleton) {
        this.showPageSkeleton(pageName)
      }

      // Marcar como carregando
      this.loading.add(pageName)
      
      console.log(`🔄 LazyLoader: Carregando ${pageName}...`)
      const startTime = performance.now()

      // Carregar módulo
      const module = await this.importPage(pageName)
      
      const endTime = performance.now()
      const loadTime = Math.round(endTime - startTime)
      
      console.log(`✅ LazyLoader: ${pageName} carregado em ${loadTime}ms`)
      
      // Salvar no cache
      this.cache.set(pageName, module)
      
      // Remover do loading
      this.loading.delete(pageName)
      
      // Agendar pré-carregamento de páginas relacionadas
      this.schedulePreload(pageName)
      
      return module
      
    } catch (error) {
      console.error(`❌ LazyLoader: Erro ao carregar ${pageName}:`, error)
      
      // Remover do loading
      this.loading.delete(pageName)
      
      // Retornar página de erro
      return this.getErrorPage(pageName, error)
    }
  }

  // 🔧 Importar página dinamicamente
  async importPage(pageName) {
    const pageMap = {
      'dashboard': () => import('../pages/DashboardPage.js'),
      'clientes': () => import('../pages/ClientsPage.js'),
      'todos-clientes': () => import('../pages/AllClientsPage.js'),
      'agendamentos': () => import('../pages/AppointmentsPage.js'),
      'relatorios': () => import('../pages/ClientReportsPage.js'),
      'financeiro': () => import('../pages/FinancialPage.js'),
      'estoque': () => import('../pages/InventoryPage.js'),
      'documentos': () => import('../pages/DocumentsPage.js'),
      'colaboradores': () => import('../pages/ColaboradoresPage.js'),
      'estagiarios': () => import('../pages/InternsPage.js'),
      'login': () => import('../pages/LoginPage.js')
    }

    const importFunc = pageMap[pageName]
    if (!importFunc) {
      throw new Error(`Página '${pageName}' não encontrada`)
    }

    const module = await importFunc()
    return module.default || module
  }

  // 🔧 Mostrar skeleton da página
  showPageSkeleton(pageName) {
    const container = document.getElementById('app-content')
    if (!container) return

    const skeletonMap = {
      'dashboard': LoadingSkeleton.createStatsSkeleton(),
      'clientes': LoadingSkeleton.createTableSkeleton(8, 5),
      'todos-clientes': LoadingSkeleton.createTableSkeleton(10, 6),
      'agendamentos': LoadingSkeleton.createCardSkeleton(6),
      'relatorios': LoadingSkeleton.createFormSkeleton(),
      'financeiro': LoadingSkeleton.createStatsSkeleton(),
      'estoque': LoadingSkeleton.createTableSkeleton(12, 4),
      'documentos': LoadingSkeleton.createCardSkeleton(4),
      'colaboradores': LoadingSkeleton.createTableSkeleton(6, 4),
      'estagiarios': LoadingSkeleton.createTableSkeleton(8, 3)
    }

    const skeleton = skeletonMap[pageName] || LoadingSkeleton.createCardSkeleton(3)
    
    container.innerHTML = `
      <div class="lazy-loading-container">
        <div class="lazy-loading-header">
          <div class="lazy-loading-title">
            <div class="skeleton-line" style="width: 200px; height: 24px;"></div>
          </div>
        </div>
        ${skeleton}
      </div>
    `
  }

  // 🔧 Aguardar carregamento
  async waitForLoad(pageName, timeout = 10000) {
    const startTime = Date.now()
    
    while (this.loading.has(pageName)) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout aguardando carregamento de ${pageName}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return this.cache.get(pageName)
  }

  // 🔧 Agendar pré-carregamento
  schedulePreload(currentPage) {
    const preloadMap = {
      'dashboard': ['clientes', 'agendamentos'],
      'clientes': ['todos-clientes', 'relatorios'],
      'agendamentos': ['clientes', 'dashboard'],
      'relatorios': ['clientes', 'financeiro'],
      'financeiro': ['relatorios', 'estoque'],
      'colaboradores': ['estagiarios', 'dashboard'],
      'estoque': ['financeiro', 'documentos']
    }

    const pagesToPreload = preloadMap[currentPage] || []
    
    pagesToPreload.forEach((pageName, index) => {
      if (!this.cache.has(pageName) && !this.loading.has(pageName)) {
        setTimeout(() => {
          this.preloadPage(pageName)
        }, this.preloadDelay * (index + 1))
      }
    })
  }

  // 🔧 Pré-carregar página
  async preloadPage(pageName) {
    if (this.isPreloading) return
    
    try {
      this.isPreloading = true
      console.log(`🔄 LazyLoader: Pré-carregando ${pageName}...`)
      
      await this.loadPage(pageName, false) // Sem skeleton
      
      console.log(`✅ LazyLoader: ${pageName} pré-carregado`)
      
    } catch (error) {
      console.warn(`⚠️ LazyLoader: Erro no pré-carregamento de ${pageName}:`, error)
    } finally {
      this.isPreloading = false
    }
  }

  // 🔧 Página de erro
  getErrorPage(pageName, error) {
    return {
      init: () => {
        const container = document.getElementById('app-content')
        if (!container) return

        container.innerHTML = `
          <div class="error-page">
            <div class="error-content">
              <div class="error-icon">
                <i data-lucide="alert-triangle" style="width: 64px; height: 64px; color: #ef4444;"></i>
              </div>
              <h2>Erro ao Carregar Página</h2>
              <p>Não foi possível carregar a página '<strong>${pageName}</strong>'.</p>
              <p class="error-message">${error.message}</p>
              <div class="error-actions">
                <button onclick="location.reload()" class="btn btn-primary">
                  <i data-lucide="refresh-cw"></i>
                  Tentar Novamente
                </button>
                <button onclick="window.router.navigate('dashboard')" class="btn btn-secondary">
                  <i data-lucide="home"></i>
                  Voltar ao Dashboard
                </button>
              </div>
            </div>
          </div>
        `
        
        // Inicializar ícones
        if (window.lucide) {
          window.lucide.createIcons()
        }
      }
    }
  }

  // 🔧 Limpar cache
  clearCache() {
    const size = this.cache.size
    this.cache.clear()
    console.log(`🗑️ LazyLoader: Cache limpo (${size} páginas)`)
  }

  // 🔧 Invalidar página específica
  invalidatePage(pageName) {
    if (this.cache.has(pageName)) {
      this.cache.delete(pageName)
      console.log(`🔄 LazyLoader: Página '${pageName}' invalidada`)
    }
  }

  // 🔧 Estatísticas do loader
  getStats() {
    return {
      cachedPages: this.cache.size,
      loadingPages: this.loading.size,
      preloadQueueSize: this.preloadQueue.length,
      isPreloading: this.isPreloading,
      cachedPageNames: [...this.cache.keys()],
      loadingPageNames: [...this.loading]
    }
  }

  // 🔧 Pré-carregar páginas críticas
  async preloadCriticalPages() {
    const criticalPages = ['dashboard', 'clientes', 'agendamentos']
    
    console.log('🔄 LazyLoader: Pré-carregando páginas críticas...')
    
    for (const pageName of criticalPages) {
      if (!this.cache.has(pageName)) {
        try {
          await this.preloadPage(pageName)
          // Pequeno delay entre carregamentos
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.warn(`⚠️ LazyLoader: Erro ao pré-carregar ${pageName}:`, error)
        }
      }
    }
    
    console.log('✅ LazyLoader: Páginas críticas pré-carregadas')
  }
}

// 🔧 Instância global
const lazyLoader = new LazyLoader()

// 🔧 Expor para debug
if (typeof window !== 'undefined') {
  window.lazyLoader = lazyLoader
}

export default lazyLoader 