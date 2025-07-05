// 🏥 Sistema de Health Check e Monitoramento
import { supabase } from '../config/supabase.js'

class HealthCheckManager {
  constructor() {
    this.checks = new Map()
    this.results = new Map()
    this.lastCheck = null
    this.checkInterval = null
    this.isRunning = false
    
    // Configurações
    this.config = {
      interval: 5 * 60 * 1000, // 5 minutos
      timeout: 10000,          // 10 segundos timeout
      retries: 3,             // 3 tentativas
      alertThreshold: 3       // Alerta após 3 falhas consecutivas
    }
    
    this.setupChecks()
    console.log('🏥 HealthCheck: Sistema inicializado')
  }

  // 🔧 Configurar checks
  setupChecks() {
    // Check de conectividade Supabase
    this.addCheck('supabase_connection', {
      name: 'Conexão Supabase',
      description: 'Verifica conectividade com banco de dados',
      timeout: 5000,
      critical: true,
      check: this.checkSupabaseConnection.bind(this)
    })

    // Check de autenticação
    this.addCheck('auth_service', {
      name: 'Serviço de Autenticação',
      description: 'Verifica funcionamento do sistema de auth',
      timeout: 3000,
      critical: true,
      check: this.checkAuthService.bind(this)
    })

    // Check de cache local
    this.addCheck('local_cache', {
      name: 'Cache Local',
      description: 'Verifica funcionamento do cache',
      timeout: 1000,
      critical: false,
      check: this.checkLocalCache.bind(this)
    })

    // Check de localStorage
    this.addCheck('local_storage', {
      name: 'Local Storage',
      description: 'Verifica acesso ao localStorage',
      timeout: 1000,
      critical: false,
      check: this.checkLocalStorage.bind(this)
    })

    // Check de memória
    this.addCheck('memory_usage', {
      name: 'Uso de Memória',
      description: 'Verifica uso de memória do JavaScript',
      timeout: 1000,
      critical: false,
      check: this.checkMemoryUsage.bind(this)
    })

    // Check de performance
    this.addCheck('performance', {
      name: 'Performance',
      description: 'Verifica métricas de performance',
      timeout: 2000,
      critical: false,
      check: this.checkPerformance.bind(this)
    })

    // Check de service worker
    this.addCheck('service_worker', {
      name: 'Service Worker',
      description: 'Verifica status do service worker',
      timeout: 2000,
      critical: false,
      check: this.checkServiceWorker.bind(this)
    })

    // Check de conectividade de rede
    this.addCheck('network', {
      name: 'Conectividade de Rede',
      description: 'Verifica status da conexão de rede',
      timeout: 3000,
      critical: true,
      check: this.checkNetworkConnectivity.bind(this)
    })
  }

  // 🔧 Adicionar check personalizado
  addCheck(id, config) {
    this.checks.set(id, {
      id,
      name: config.name,
      description: config.description,
      timeout: config.timeout || 5000,
      critical: config.critical || false,
      check: config.check,
      retries: config.retries || this.config.retries,
      lastResult: null,
      consecutiveFailures: 0,
      totalRuns: 0,
      totalFailures: 0
    })
  }

  // 🔧 Executar todos os checks
  async runAllChecks() {
    console.log('🔍 HealthCheck: Executando verificações...')
    
    const startTime = Date.now()
    const results = new Map()
    const promises = []

    // Executar checks em paralelo
    for (const [id, checkConfig] of this.checks) {
      promises.push(this.runSingleCheck(id, checkConfig))
    }

    // Aguardar todos os checks
    const checkResults = await Promise.allSettled(promises)
    
    // Processar resultados
    let index = 0
    for (const [id] of this.checks) {
      const result = checkResults[index]
      
      if (result.status === 'fulfilled') {
        results.set(id, result.value)
      } else {
        results.set(id, {
          id,
          status: 'error',
          message: 'Falha na execução do check',
          error: result.reason,
          timestamp: Date.now(),
          duration: 0
        })
      }
      
      index++
    }

    const endTime = Date.now()
    const totalDuration = endTime - startTime

    // Salvar resultados
    this.results = results
    this.lastCheck = {
      timestamp: endTime,
      duration: totalDuration,
      total: results.size,
      passed: [...results.values()].filter(r => r.status === 'healthy').length,
      failed: [...results.values()].filter(r => r.status === 'unhealthy').length,
      warnings: [...results.values()].filter(r => r.status === 'warning').length
    }

    console.log(`✅ HealthCheck: Verificações concluídas em ${totalDuration}ms`)
    
    // Processar alertas
    this.processAlerts()
    
    return this.getHealthReport()
  }

  // 🔧 Executar check individual
  async runSingleCheck(id, checkConfig) {
    const startTime = Date.now()
    
    try {
      // Executar check com timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), checkConfig.timeout)
      })
      
      const checkPromise = checkConfig.check()
      const result = await Promise.race([checkPromise, timeoutPromise])
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Atualizar estatísticas
      checkConfig.totalRuns++
      checkConfig.consecutiveFailures = 0
      checkConfig.lastResult = {
        ...result,
        id,
        timestamp: endTime,
        duration
      }
      
      return checkConfig.lastResult
      
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Atualizar estatísticas de falha
      checkConfig.totalRuns++
      checkConfig.totalFailures++
      checkConfig.consecutiveFailures++
      
      const failureResult = {
        id,
        status: 'unhealthy',
        message: `Check falhou: ${error.message}`,
        error: error.message,
        timestamp: endTime,
        duration,
        critical: checkConfig.critical
      }
      
      checkConfig.lastResult = failureResult
      return failureResult
    }
  }

  // 🔧 Check: Conexão Supabase
  async checkSupabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('count')
        .limit(1)
      
      if (error) throw error
      
      return {
        status: 'healthy',
        message: 'Conexão com Supabase OK',
        details: { connected: true }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Falha na conexão com Supabase',
        error: error.message
      }
    }
  }

  // 🔧 Check: Serviço de Auth
  async checkAuthService() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return {
          status: 'warning',
          message: 'Usuário não autenticado',
          details: { authenticated: false }
        }
      }
      
      return {
        status: 'healthy',
        message: 'Serviço de autenticação OK',
        details: { 
          authenticated: true,
          userId: session.user.id,
          expiresAt: session.expires_at
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Falha no serviço de autenticação',
        error: error.message
      }
    }
  }

  // 🔧 Check: Cache Local
  async checkLocalCache() {
    try {
      if (!window.cacheManager) {
        return {
          status: 'warning',
          message: 'Cache manager não disponível'
        }
      }
      
      const stats = window.cacheManager.getStats()
      
      return {
        status: 'healthy',
        message: 'Cache local funcionando',
        details: stats
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Falha no cache local',
        error: error.message
      }
    }
  }

  // 🔧 Check: Local Storage
  async checkLocalStorage() {
    try {
      const testKey = '_healthcheck_test'
      const testValue = Date.now().toString()
      
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      
      if (retrieved !== testValue) {
        throw new Error('Dados não correspondem')
      }
      
      return {
        status: 'healthy',
        message: 'Local Storage funcionando',
        details: { available: true }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Falha no Local Storage',
        error: error.message
      }
    }
  }

  // 🔧 Check: Uso de Memória
  async checkMemoryUsage() {
    try {
      if (!performance.memory) {
        return {
          status: 'warning',
          message: 'Informações de memória não disponíveis'
        }
      }
      
      const memory = performance.memory
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024)
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      
      const usagePercent = (usedMB / limitMB) * 100
      
      let status = 'healthy'
      let message = `Memória: ${usedMB}MB de ${limitMB}MB (${usagePercent.toFixed(1)}%)`
      
      if (usagePercent > 80) {
        status = 'unhealthy'
        message = `Alto uso de memória: ${usagePercent.toFixed(1)}%`
      } else if (usagePercent > 60) {
        status = 'warning'
        message = `Uso moderado de memória: ${usagePercent.toFixed(1)}%`
      }
      
      return {
        status,
        message,
        details: {
          used: usedMB,
          total: totalMB,
          limit: limitMB,
          usagePercent: usagePercent.toFixed(1)
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Falha na verificação de memória',
        error: error.message
      }
    }
  }

  // 🔧 Check: Performance
  async checkPerformance() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0]
      
      if (!navigation) {
        return {
          status: 'warning',
          message: 'Dados de performance não disponíveis'
        }
      }
      
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      
      let status = 'healthy'
      let message = `Performance OK - Load: ${Math.round(loadTime)}ms`
      
      if (loadTime > 3000) {
        status = 'unhealthy'
        message = `Performance ruim - Load: ${Math.round(loadTime)}ms`
      } else if (loadTime > 1500) {
        status = 'warning'
        message = `Performance moderada - Load: ${Math.round(loadTime)}ms`
      }
      
      return {
        status,
        message,
        details: {
          loadTime: Math.round(loadTime),
          domContentLoaded: Math.round(domContentLoaded)
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Falha na verificação de performance',
        error: error.message
      }
    }
  }

  // 🔧 Check: Service Worker
  async checkServiceWorker() {
    try {
      if (!('serviceWorker' in navigator)) {
        return {
          status: 'warning',
          message: 'Service Worker não suportado'
        }
      }
      
      const registration = await navigator.serviceWorker.getRegistration()
      
      if (!registration) {
        return {
          status: 'warning',
          message: 'Service Worker não registrado'
        }
      }
      
      const state = registration.active?.state || 'unknown'
      
      return {
        status: state === 'activated' ? 'healthy' : 'warning',
        message: `Service Worker: ${state}`,
        details: { 
          state,
          scope: registration.scope
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Falha na verificação do Service Worker',
        error: error.message
      }
    }
  }

  // 🔧 Check: Conectividade de Rede
  async checkNetworkConnectivity() {
    try {
      const online = navigator.onLine
      
      if (!online) {
        return {
          status: 'unhealthy',
          message: 'Sem conexão de rede',
          details: { online: false }
        }
      }
      
      // Teste de conectividade real
      const testUrl = 'https://httpbin.org/get'
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache'
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          return {
            status: 'healthy',
            message: 'Conectividade de rede OK',
            details: { online: true, latency: 'good' }
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Falha na conectividade de rede',
        error: error.message
      }
    }
  }

  // 🔧 Processar alertas
  processAlerts() {
    const criticalFailures = []
    
    for (const [id, checkConfig] of this.checks) {
      if (checkConfig.critical && 
          checkConfig.consecutiveFailures >= this.config.alertThreshold) {
        criticalFailures.push({
          id,
          name: checkConfig.name,
          failures: checkConfig.consecutiveFailures,
          lastResult: checkConfig.lastResult
        })
      }
    }
    
    if (criticalFailures.length > 0) {
      this.sendAlert(criticalFailures)
    }
  }

  // 🔧 Enviar alerta
  sendAlert(failures) {
    console.error('🚨 HealthCheck: Alertas críticos:', failures)
    
    // Em produção, enviar para sistema de alertas
    const message = `${failures.length} check(s) crítico(s) falhando: ${failures.map(f => f.name).join(', ')}`
    
    // Mostrar notificação ao usuário
    if (window.showToast) {
      window.showToast(message, 'error', 10000)
    }
  }

  // 🔧 Obter relatório de saúde
  getHealthReport() {
    const checks = []
    
    for (const [id, checkConfig] of this.checks) {
      checks.push({
        id,
        name: checkConfig.name,
        description: checkConfig.description,
        critical: checkConfig.critical,
        lastResult: checkConfig.lastResult,
        consecutiveFailures: checkConfig.consecutiveFailures,
        successRate: checkConfig.totalRuns > 0 ? 
          ((checkConfig.totalRuns - checkConfig.totalFailures) / checkConfig.totalRuns * 100).toFixed(1) : 0
      })
    }
    
    const overallStatus = this.calculateOverallStatus(checks)
    
    return {
      timestamp: Date.now(),
      status: overallStatus,
      summary: this.lastCheck,
      checks
    }
  }

  // 🔧 Calcular status geral
  calculateOverallStatus(checks) {
    const criticalChecks = checks.filter(c => c.critical)
    const criticalFailed = criticalChecks.filter(c => 
      c.lastResult?.status === 'unhealthy'
    ).length
    
    if (criticalFailed > 0) {
      return 'unhealthy'
    }
    
    const anyWarnings = checks.some(c => 
      c.lastResult?.status === 'warning'
    )
    
    return anyWarnings ? 'warning' : 'healthy'
  }

  // 🔧 Iniciar monitoramento automático
  startMonitoring() {
    if (this.isRunning) return
    
    this.isRunning = true
    
    // Executar check inicial
    this.runAllChecks()
    
    // Configurar intervalo
    this.checkInterval = setInterval(() => {
      this.runAllChecks()
    }, this.config.interval)
    
    console.log(`🏥 HealthCheck: Monitoramento iniciado (intervalo: ${this.config.interval / 1000}s)`)
  }

  // 🔧 Parar monitoramento
  stopMonitoring() {
    if (!this.isRunning) return
    
    this.isRunning = false
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    
    console.log('🏥 HealthCheck: Monitoramento parado')
  }

  // 🔧 Obter estatísticas
  getStats() {
    return {
      totalChecks: this.checks.size,
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      interval: this.config.interval,
      results: this.results.size
    }
  }
}

// 🔧 Instância global
const healthCheck = new HealthCheckManager()

// 🔧 Expor para debug
if (typeof window !== 'undefined') {
  window.healthCheck = healthCheck
}

export default healthCheck 