// 📊 Sistema de Paginação Inteligente para otimizar consultas grandes
export default class PaginationManager {
  constructor(options = {}) {
    this.defaultPageSize = options.defaultPageSize || 20
    this.maxPageSize = options.maxPageSize || 100
    this.prefetchPages = options.prefetchPages || 1 // Páginas para pré-carregar
    this.cache = new Map() // Cache local para páginas
    this.loadingPages = new Set() // Páginas sendo carregadas
  }

  // 🔧 Configurar paginação para uma consulta
  async paginate(fetchFunction, options = {}) {
    const config = {
      page: options.page || 1,
      pageSize: Math.min(options.pageSize || this.defaultPageSize, this.maxPageSize),
      filters: options.filters || {},
      orderBy: options.orderBy || null,
      orderDirection: options.orderDirection || 'asc',
      ...options
    }

    const cacheKey = this.generateCacheKey(config)
    
    // Verificar cache primeiro
    if (this.cache.has(cacheKey)) {
      console.log(`✅ Pagination: Cache hit para página ${config.page}`)
      const cached = this.cache.get(cacheKey)
      
      // Pré-carregar próximas páginas em background
      this.prefetchNextPages(fetchFunction, config)
      
      return cached
    }

    // Verificar se já está carregando
    if (this.loadingPages.has(cacheKey)) {
      console.log(`⏳ Pagination: Aguardando carregamento da página ${config.page}`)
      return this.waitForPage(cacheKey)
    }

    // Carregar página
    return this.loadPage(fetchFunction, config)
  }

  // 🔧 Carregar uma página específica
  async loadPage(fetchFunction, config) {
    const cacheKey = this.generateCacheKey(config)
    this.loadingPages.add(cacheKey)

    try {
      console.log(`🔄 Pagination: Carregando página ${config.page}`)
      
      const startTime = performance.now()
      
      // Calcular offset
      const offset = (config.page - 1) * config.pageSize
      
      // Executar consulta
      const result = await fetchFunction({
        ...config,
        offset,
        limit: config.pageSize
      })

      const endTime = performance.now()
      const loadTime = Math.round(endTime - startTime)

      // Processar resultado
      const paginatedResult = {
        data: result.data || [],
        page: config.page,
        pageSize: config.pageSize,
        totalCount: result.totalCount || result.data?.length || 0,
        totalPages: Math.ceil((result.totalCount || 0) / config.pageSize),
        hasNextPage: false,
        hasPreviousPage: config.page > 1,
        loadTime,
        timestamp: Date.now()
      }

      // Calcular se tem próxima página
      paginatedResult.hasNextPage = config.page < paginatedResult.totalPages

      // Salvar no cache
      this.cache.set(cacheKey, paginatedResult)
      
      console.log(`✅ Pagination: Página ${config.page} carregada em ${loadTime}ms`)
      
      // Pré-carregar próximas páginas
      this.prefetchNextPages(fetchFunction, config)
      
      return paginatedResult

    } catch (error) {
      console.error(`❌ Pagination: Erro ao carregar página ${config.page}:`, error)
      throw error
    } finally {
      this.loadingPages.delete(cacheKey)
    }
  }

  // 🔧 Pré-carregar páginas adjacentes
  async prefetchNextPages(fetchFunction, config) {
    const pagesToPrefetch = []
    
    // Próximas páginas
    for (let i = 1; i <= this.prefetchPages; i++) {
      const nextPage = config.page + i
      const nextConfig = { ...config, page: nextPage }
      const nextCacheKey = this.generateCacheKey(nextConfig)
      
      if (!this.cache.has(nextCacheKey) && !this.loadingPages.has(nextCacheKey)) {
        pagesToPrefetch.push(nextConfig)
      }
    }

    // Páginas anteriores (se aplicável)
    for (let i = 1; i <= this.prefetchPages; i++) {
      const prevPage = config.page - i
      if (prevPage > 0) {
        const prevConfig = { ...config, page: prevPage }
        const prevCacheKey = this.generateCacheKey(prevConfig)
        
        if (!this.cache.has(prevCacheKey) && !this.loadingPages.has(prevCacheKey)) {
          pagesToPrefetch.push(prevConfig)
        }
      }
    }

    // Carregar em background
    pagesToPrefetch.forEach(pageConfig => {
      setTimeout(() => {
        this.loadPage(fetchFunction, pageConfig).catch(error => {
          console.warn(`⚠️ Pagination: Erro no pré-carregamento da página ${pageConfig.page}:`, error)
        })
      }, 100) // Pequeno delay para não interferir com carregamento principal
    })
  }

  // 🔧 Aguardar carregamento de página
  async waitForPage(cacheKey, timeout = 10000) {
    const startTime = Date.now()
    
    while (this.loadingPages.has(cacheKey)) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout aguardando carregamento da página')
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return this.cache.get(cacheKey)
  }

  // 🔧 Gerar chave de cache
  generateCacheKey(config) {
    const keyParts = [
      `page:${config.page}`,
      `size:${config.pageSize}`,
      `filters:${JSON.stringify(config.filters)}`,
      `order:${config.orderBy}-${config.orderDirection}`
    ]
    
    return keyParts.join('|')
  }

  // 🔧 Navegação simplificada
  async goToPage(fetchFunction, page, currentConfig) {
    return this.paginate(fetchFunction, {
      ...currentConfig,
      page
    })
  }

  async nextPage(fetchFunction, currentResult, currentConfig) {
    if (!currentResult.hasNextPage) {
      return currentResult
    }
    
    return this.goToPage(fetchFunction, currentResult.page + 1, currentConfig)
  }

  async previousPage(fetchFunction, currentResult, currentConfig) {
    if (!currentResult.hasPreviousPage) {
      return currentResult
    }
    
    return this.goToPage(fetchFunction, currentResult.page - 1, currentConfig)
  }

  async firstPage(fetchFunction, currentConfig) {
    return this.goToPage(fetchFunction, 1, currentConfig)
  }

  async lastPage(fetchFunction, currentResult, currentConfig) {
    return this.goToPage(fetchFunction, currentResult.totalPages, currentConfig)
  }

  // 🔧 Busca com paginação
  async search(fetchFunction, query, config = {}) {
    const searchConfig = {
      ...config,
      filters: {
        ...config.filters,
        search: query
      },
      page: 1 // Resetar para primeira página em busca
    }

    // Limpar cache relacionado à busca anterior
    this.invalidateSearch()
    
    return this.paginate(fetchFunction, searchConfig)
  }

  // 🔧 Invalidar cache de busca
  invalidateSearch() {
    const searchKeys = [...this.cache.keys()].filter(key => 
      key.includes('search:')
    )
    
    searchKeys.forEach(key => this.cache.delete(key))
  }

  // 🔧 Invalidar cache específico
  invalidate(filters = {}) {
    const filterString = JSON.stringify(filters)
    const keysToRemove = [...this.cache.keys()].filter(key => 
      key.includes(filterString)
    )
    
    keysToRemove.forEach(key => this.cache.delete(key))
    
    console.log(`🗑️ Pagination: ${keysToRemove.length} páginas invalidadas`)
  }

  // 🔧 Limpar todo o cache
  clearCache() {
    const size = this.cache.size
    this.cache.clear()
    this.loadingPages.clear()
    
    console.log(`🗑️ Pagination: Cache limpo (${size} páginas)`)
  }

  // 🔧 Estatísticas da paginação
  getStats() {
    return {
      cachedPages: this.cache.size,
      loadingPages: this.loadingPages.size,
      totalMemoryEstimate: this.estimateMemoryUsage()
    }
  }

  // 🔧 Estimar uso de memória
  estimateMemoryUsage() {
    try {
      const data = [...this.cache.values()]
      const serialized = JSON.stringify(data)
      return new Blob([serialized]).size
    } catch (error) {
      return 'N/A'
    }
  }

  // 🔧 Componente de UI para paginação
  static createPaginationUI(result, onPageChange) {
    const { page, totalPages, hasNextPage, hasPreviousPage } = result
    
    return `
      <div class="pagination-container">
        <div class="pagination-info">
          <span>Página ${page} de ${totalPages}</span>
          <span class="pagination-total">${result.totalCount} itens</span>
        </div>
        
        <div class="pagination-controls">
          <button 
            class="pagination-btn ${!hasPreviousPage ? 'disabled' : ''}" 
            ${!hasPreviousPage ? 'disabled' : ''}
            onclick="if(${hasPreviousPage}) { ${onPageChange}(1) }"
          >
            <i data-lucide="chevrons-left"></i>
          </button>
          
          <button 
            class="pagination-btn ${!hasPreviousPage ? 'disabled' : ''}" 
            ${!hasPreviousPage ? 'disabled' : ''}
            onclick="if(${hasPreviousPage}) { ${onPageChange}(${page - 1}) }"
          >
            <i data-lucide="chevron-left"></i>
          </button>
          
          <span class="pagination-current">
            ${Math.max(1, page - 2)} ... ${Math.min(totalPages, page + 2)}
          </span>
          
          <button 
            class="pagination-btn ${!hasNextPage ? 'disabled' : ''}" 
            ${!hasNextPage ? 'disabled' : ''}
            onclick="if(${hasNextPage}) { ${onPageChange}(${page + 1}) }"
          >
            <i data-lucide="chevron-right"></i>
          </button>
          
          <button 
            class="pagination-btn ${!hasNextPage ? 'disabled' : ''}" 
            ${!hasNextPage ? 'disabled' : ''}
            onclick="if(${hasNextPage}) { ${onPageChange}(${totalPages}) }"
          >
            <i data-lucide="chevrons-right"></i>
          </button>
        </div>
        
        <div class="pagination-size-selector">
          <select class="pagination-size" onchange="${onPageChange}(1, this.value)">
            <option value="10" ${result.pageSize === 10 ? 'selected' : ''}>10 por página</option>
            <option value="20" ${result.pageSize === 20 ? 'selected' : ''}>20 por página</option>
            <option value="50" ${result.pageSize === 50 ? 'selected' : ''}>50 por página</option>
            <option value="100" ${result.pageSize === 100 ? 'selected' : ''}>100 por página</option>
          </select>
        </div>
      </div>
    `
  }

  // 🔧 Estilos CSS para paginação
  static addPaginationStyles() {
    if (document.getElementById('pagination-styles')) return

    const style = document.createElement('style')
    style.id = 'pagination-styles'
    style.textContent = `
      .pagination-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 0;
        border-top: 1px solid #e0e0e0;
        margin-top: 16px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .pagination-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 14px;
        color: #6b7280;
      }

      .pagination-total {
        font-size: 12px;
        color: #9ca3af;
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pagination-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .pagination-btn:hover:not(.disabled) {
        background: #f3f4f6;
        border-color: #9ca3af;
      }

      .pagination-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .pagination-current {
        padding: 0 12px;
        font-size: 14px;
        color: #374151;
        font-weight: 500;
      }

      .pagination-size-selector select {
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 14px;
        cursor: pointer;
      }

      @media (max-width: 640px) {
        .pagination-container {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .pagination-controls {
          justify-content: center;
        }

        .pagination-info {
          text-align: center;
        }
      }
    `
    document.head.appendChild(style)
  }
}

// Auto-inicializar estilos
PaginationManager.addPaginationStyles()

// Instância global
export const globalPagination = new PaginationManager() 