// 🚀 Sistema de Cache Local para otimizar performance
class CacheManager {
  constructor() {
    this.cache = new Map()
    this.timestamps = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5 minutos default
    
    // Configurações específicas por tipo de dados
    this.ttlConfig = {
      'dashboard-stats': 2 * 60 * 1000,        // 2 minutos
      'user-profile': 30 * 60 * 1000,          // 30 minutos
      'client-list': 5 * 60 * 1000,            // 5 minutos
      'appointment-list': 3 * 60 * 1000,       // 3 minutos
      'financial-data': 10 * 60 * 1000,        // 10 minutos
      'system-config': 60 * 60 * 1000,         // 1 hora
    }

    // Limpeza automática a cada 10 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 10 * 60 * 1000)
  }

  // 🔧 Gerar chave única para cache
  generateKey(type, params = {}) {
    const paramsString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    return `${type}${paramsString ? `_${paramsString}` : ''}`
  }

  // 🔧 Verificar se cache é válido
  isValid(key) {
    if (!this.cache.has(key) || !this.timestamps.has(key)) {
      return false
    }

    const timestamp = this.timestamps.get(key)
    const ttl = this.getTTL(key)
    const now = Date.now()

    return (now - timestamp) < ttl
  }

  // 🔧 Obter TTL baseado no tipo de dados
  getTTL(key) {
    for (const [type, ttl] of Object.entries(this.ttlConfig)) {
      if (key.startsWith(type)) {
        return ttl
      }
    }
    return this.defaultTTL
  }

  // 🔧 Salvar no cache
  set(type, data, params = {}) {
    try {
      const key = this.generateKey(type, params)
      
      // Clonar dados para evitar mutação
      const clonedData = JSON.parse(JSON.stringify(data))
      
      this.cache.set(key, clonedData)
      this.timestamps.set(key, Date.now())
      
      console.log(`✅ Cache: Dados salvos - ${key}`)
      
      // Limitar tamanho do cache (máximo 100 entradas)
      if (this.cache.size > 100) {
        this.cleanup(true)
      }
      
    } catch (error) {
      console.error('❌ Cache: Erro ao salvar dados:', error)
    }
  }

  // 🔧 Obter do cache
  get(type, params = {}) {
    try {
      const key = this.generateKey(type, params)
      
      if (!this.isValid(key)) {
        console.log(`⚠️ Cache: Dados expirados ou não encontrados - ${key}`)
        this.delete(key)
        return null
      }

      const data = this.cache.get(key)
      console.log(`✅ Cache: Dados encontrados - ${key}`)
      
      // Retornar cópia para evitar mutação
      return JSON.parse(JSON.stringify(data))
      
    } catch (error) {
      console.error('❌ Cache: Erro ao obter dados:', error)
      return null
    }
  }

  // 🔧 Verificar se existe no cache e é válido
  has(type, params = {}) {
    const key = this.generateKey(type, params)
    return this.isValid(key)
  }

  // 🔧 Deletar entrada específica
  delete(type, params = {}) {
    const key = typeof type === 'string' && !params ? type : this.generateKey(type, params)
    
    this.cache.delete(key)
    this.timestamps.delete(key)
    
    console.log(`🗑️ Cache: Entrada removida - ${key}`)
  }

  // 🔧 Limpar cache expirado
  cleanup(force = false) {
    let removed = 0
    const now = Date.now()
    
    for (const [key, timestamp] of this.timestamps.entries()) {
      const ttl = this.getTTL(key)
      const isExpired = (now - timestamp) > ttl
      
      if (isExpired || force) {
        this.cache.delete(key)
        this.timestamps.delete(key)
        removed++
        
        if (force && removed >= 20) break // Remover no máximo 20 por vez
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 Cache: ${removed} entradas removidas`)
    }
  }

  // 🔧 Limpar todo o cache
  clear() {
    const size = this.cache.size
    this.cache.clear()
    this.timestamps.clear()
    console.log(`🗑️ Cache: Todo o cache limpo (${size} entradas)`)
  }

  // 🔧 Invalidar cache por tipo
  invalidateByType(type) {
    let removed = 0
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(type)) {
        this.delete(key)
        removed++
      }
    }
    
    console.log(`🔄 Cache: ${removed} entradas do tipo '${type}' invalidadas`)
  }

  // 🔧 Obter estatísticas do cache
  getStats() {
    const stats = {
      entries: this.cache.size,
      types: {},
      memoryUsage: 0
    }

    // Contar por tipo
    for (const key of this.cache.keys()) {
      const type = key.split('_')[0]
      stats.types[type] = (stats.types[type] || 0) + 1
    }

    // Estimar uso de memória (aproximado)
    try {
      const serialized = JSON.stringify([...this.cache.values()])
      stats.memoryUsage = new Blob([serialized]).size
    } catch (error) {
      stats.memoryUsage = 'N/A'
    }

    return stats
  }

  // 🔧 Cache com fallback para função
  async getOrFetch(type, fetchFunction, params = {}, forceRefresh = false) {
    try {
      // Verificar cache primeiro (se não forçar refresh)
      if (!forceRefresh) {
        const cachedData = this.get(type, params)
        if (cachedData !== null) {
          return { data: cachedData, fromCache: true }
        }
      }

      // Buscar dados
      console.log(`🔄 Cache: Buscando dados frescos - ${type}`)
      const freshData = await fetchFunction(params)
      
      // Salvar no cache
      this.set(type, freshData, params)
      
      return { data: freshData, fromCache: false }
      
    } catch (error) {
      console.error(`❌ Cache: Erro ao buscar dados - ${type}:`, error)
      
      // Tentar retornar dados expirados como fallback
      const key = this.generateKey(type, params)
      const expiredData = this.cache.get(key)
      
      if (expiredData) {
        console.log(`⚠️ Cache: Usando dados expirados como fallback - ${type}`)
        return { data: expiredData, fromCache: true, expired: true }
      }
      
      throw error
    }
  }

  // 🔧 Pré-carregar dados importantes
  async preload(type, fetchFunction, params = {}) {
    try {
      if (!this.has(type, params)) {
        console.log(`🔄 Cache: Pré-carregando - ${type}`)
        const data = await fetchFunction(params)
        this.set(type, data, params)
      }
    } catch (error) {
      console.error(`❌ Cache: Erro no pré-carregamento - ${type}:`, error)
    }
  }

  // 🔧 Destruir cache manager
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    this.clear()
    console.log('🗑️ Cache: Cache Manager destruído')
  }
}

// 🔧 Instância global do cache
const cacheManager = new CacheManager()

// 🔧 Funções auxiliares para uso específico
export const CacheUtils = {
  // Cache para dados do dashboard
  dashboardStats: {
    get: () => cacheManager.get('dashboard-stats'),
    set: (data) => cacheManager.set('dashboard-stats', data),
    invalidate: () => cacheManager.invalidateByType('dashboard-stats')
  },

  // Cache para perfil do usuário
  userProfile: {
    get: (userId) => cacheManager.get('user-profile', { userId }),
    set: (data, userId) => cacheManager.set('user-profile', data, { userId }),
    invalidate: (userId) => cacheManager.delete('user-profile', { userId })
  },

  // Cache para lista de clientes
  clientList: {
    get: (filters = {}) => cacheManager.get('client-list', filters),
    set: (data, filters = {}) => cacheManager.set('client-list', data, filters),
    invalidate: () => cacheManager.invalidateByType('client-list')
  },

  // Cache para agendamentos
  appointments: {
    get: (date) => cacheManager.get('appointment-list', { date }),
    set: (data, date) => cacheManager.set('appointment-list', data, { date }),
    invalidate: () => cacheManager.invalidateByType('appointment-list')
  }
}

// 🔧 Expor para debug
if (typeof window !== 'undefined') {
  window.cacheManager = cacheManager
  window.cacheUtils = CacheUtils
}

export default cacheManager 