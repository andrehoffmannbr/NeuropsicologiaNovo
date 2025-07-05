// 📊 Sistema de Analytics e Monitoramento de Performance
class AnalyticsManager {
  constructor() {
    this.events = []
    this.performanceMetrics = []
    this.userSession = this.generateSessionId()
    this.startTime = Date.now()
    this.isEnabled = true
    
    // Configurações
    this.maxEvents = 1000 // Máximo de eventos armazenados
    this.batchSize = 50 // Tamanho do lote para envio
    this.flushInterval = 30000 // Enviar dados a cada 30 segundos
    
    this.init()
  }

  // 🔧 Inicializar analytics
  init() {
    try {
      // Configurar flush automático
      this.flushTimer = setInterval(() => {
        this.flush()
      }, this.flushInterval)

      // Escutar eventos de performance
      this.setupPerformanceTracking()
      
      // Escutar eventos de navegação
      this.setupNavigationTracking()
      
      // Escutar erros
      this.setupErrorTracking()
      
      // Escutar visibilidade da página
      this.setupVisibilityTracking()

      console.log('✅ Analytics: Sistema inicializado')
      
    } catch (error) {
      console.error('❌ Analytics: Erro na inicialização:', error)
      this.isEnabled = false
    }
  }

  // 🔧 Gerar ID de sessão único
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 🔧 Registrar evento personalizado
  track(eventName, properties = {}) {
    if (!this.isEnabled) return

    try {
      const event = {
        id: this.generateEventId(),
        name: eventName,
        properties: {
          ...properties,
          timestamp: Date.now(),
          sessionId: this.userSession,
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      }

      this.events.push(event)
      this.trimEvents()

      console.log(`📊 Analytics: Evento registrado - ${eventName}`, properties)

      // Flush se necessário
      if (this.events.length >= this.batchSize) {
        this.flush()
      }
      
    } catch (error) {
      console.error('❌ Analytics: Erro ao registrar evento:', error)
    }
  }

  // 🔧 Gerar ID de evento
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  // 🔧 Rastrear performance de página
  trackPagePerformance(pageName) {
    if (!this.isEnabled) return

    try {
      const navigation = performance.getEntriesByType('navigation')[0]
      const paint = performance.getEntriesByType('paint')
      
      const metrics = {
        page: pageName,
        sessionId: this.userSession,
        timestamp: Date.now(),
        
        // Métricas de navegação
        dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
        tcp: Math.round(navigation.connectEnd - navigation.connectStart),
        request: Math.round(navigation.responseStart - navigation.requestStart),
        response: Math.round(navigation.responseEnd - navigation.responseStart),
        dom: Math.round(navigation.domContentLoadedEventEnd - navigation.responseEnd),
        load: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        
        // Métricas de renderização
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        
        // Métricas de recursos
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      }

      this.performanceMetrics.push(metrics)
      
      console.log(`⚡ Analytics: Métricas de performance - ${pageName}`, metrics)
      
    } catch (error) {
      console.error('❌ Analytics: Erro ao rastrear performance:', error)
    }
  }

  // 🔧 Rastrear tempo de permanência
  trackTimeOnPage(pageName, startTime) {
    if (!this.isEnabled) return

    const timeSpent = Date.now() - startTime
    
    this.track('page_time_spent', {
      page: pageName,
      timeSpent,
      timeSpentFormatted: this.formatTime(timeSpent)
    })
  }

  // 🔧 Rastrear cliques em elementos
  trackClick(element, customData = {}) {
    if (!this.isEnabled) return

    const elementInfo = {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      text: element.textContent?.substring(0, 100) || '',
      ...customData
    }

    this.track('element_click', elementInfo)
  }

  // 🔧 Rastrear erros de JavaScript
  trackError(error, context = {}) {
    if (!this.isEnabled) return

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      filename: error.filename,
      line: error.lineno,
      column: error.colno,
      context
    }

    this.track('javascript_error', errorInfo)
  }

  // 🔧 Rastrear métricas de negócio
  trackBusinessMetric(metric, value, unit = '') {
    if (!this.isEnabled) return

    this.track('business_metric', {
      metric,
      value,
      unit,
      businessContext: true
    })
  }

  // 🔧 Configurar rastreamento de performance
  setupPerformanceTracking() {
    // Observer para largest contentful paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              this.track('largest_contentful_paint', {
                value: entry.startTime,
                element: entry.element?.tagName || 'unknown'
              })
            }
          }
        })
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('⚠️ Analytics: PerformanceObserver não suportado')
      }
    }
  }

  // 🔧 Configurar rastreamento de navegação
  setupNavigationTracking() {
    // Rastrear mudanças de rota
    let currentRoute = window.location.pathname
    
    const trackRouteChange = () => {
      const newRoute = window.location.pathname
      if (newRoute !== currentRoute) {
        this.track('route_change', {
          from: currentRoute,
          to: newRoute
        })
        currentRoute = newRoute
      }
    }

    // Escutar mudanças na URL
    window.addEventListener('popstate', trackRouteChange)
    
    // Interceptar pushState e replaceState
    const originalPushState = history.pushState
    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      setTimeout(trackRouteChange, 0)
    }
  }

  // 🔧 Configurar rastreamento de erros
  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.trackError(event.error || {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: 'Unhandled Promise Rejection',
        reason: event.reason
      })
    })
  }

  // 🔧 Configurar rastreamento de visibilidade
  setupVisibilityTracking() {
    let sessionStart = Date.now()
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const sessionTime = Date.now() - sessionStart
        this.track('session_pause', {
          sessionTime,
          sessionTimeFormatted: this.formatTime(sessionTime)
        })
      } else {
        sessionStart = Date.now()
        this.track('session_resume')
      }
    })
  }

  // 🔧 Limitar número de eventos
  trimEvents() {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }

  // 🔧 Enviar dados para servidor (simulação)
  async flush() {
    if (!this.isEnabled || this.events.length === 0) return

    try {
      const eventsToSend = [...this.events]
      const metricsToSend = [...this.performanceMetrics]
      
      // Em produção, enviar para seu endpoint de analytics
      console.log('📤 Analytics: Enviando dados', {
        events: eventsToSend.length,
        metrics: metricsToSend.length,
        sessionId: this.userSession
      })

      // Simular envio (remover em produção)
      await this.simulateUpload(eventsToSend, metricsToSend)
      
      // Limpar dados enviados
      this.events = []
      this.performanceMetrics = []
      
    } catch (error) {
      console.error('❌ Analytics: Erro ao enviar dados:', error)
    }
  }

  // 🔧 Simular upload (substituir por API real)
  async simulateUpload(events, metrics) {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Em produção, fazer POST para seu endpoint:
    /*
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events,
        metrics,
        sessionId: this.userSession
      })
    })
    
    if (!response.ok) {
      throw new Error('Falha ao enviar analytics')
    }
    */
  }

  // 🔧 Formatar tempo
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  // 🔧 Obter estatísticas da sessão
  getSessionStats() {
    const currentTime = Date.now()
    const sessionDuration = currentTime - this.startTime
    
    return {
      sessionId: this.userSession,
      sessionDuration,
      sessionDurationFormatted: this.formatTime(sessionDuration),
      eventsCount: this.events.length,
      metricsCount: this.performanceMetrics.length,
      isEnabled: this.isEnabled,
      currentUrl: window.location.href,
      userAgent: navigator.userAgent
    }
  }

  // 🔧 Gerar relatório de performance
  getPerformanceReport() {
    if (this.performanceMetrics.length === 0) {
      return { message: 'Nenhuma métrica de performance disponível' }
    }

    const metrics = this.performanceMetrics
    const latest = metrics[metrics.length - 1]
    
    const avgMetrics = {
      dns: this.calculateAverage(metrics, 'dns'),
      tcp: this.calculateAverage(metrics, 'tcp'),
      request: this.calculateAverage(metrics, 'request'),
      response: this.calculateAverage(metrics, 'response'),
      dom: this.calculateAverage(metrics, 'dom'),
      load: this.calculateAverage(metrics, 'load'),
      firstPaint: this.calculateAverage(metrics, 'firstPaint'),
      firstContentfulPaint: this.calculateAverage(metrics, 'firstContentfulPaint')
    }

    return {
      latest,
      averages: avgMetrics,
      totalPages: metrics.length,
      recommendations: this.generateRecommendations(avgMetrics)
    }
  }

  // 🔧 Calcular média
  calculateAverage(metrics, field) {
    const values = metrics.map(m => m[field]).filter(v => v > 0)
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
  }

  // 🔧 Gerar recomendações
  generateRecommendations(metrics) {
    const recommendations = []
    
    if (metrics.dns > 100) {
      recommendations.push('DNS lookup demorado - considere usar um DNS mais rápido')
    }
    
    if (metrics.request > 500) {
      recommendations.push('Tempo de requisição alto - otimize o backend')
    }
    
    if (metrics.firstContentfulPaint > 2000) {
      recommendations.push('First Contentful Paint lento - otimize recursos críticos')
    }
    
    if (metrics.dom > 1000) {
      recommendations.push('Processamento DOM lento - reduza complexidade do HTML/CSS')
    }
    
    return recommendations
  }

  // 🔧 Destruir analytics
  destroy() {
    try {
      // Enviar dados finais
      this.flush()
      
      // Limpar timers
      if (this.flushTimer) {
        clearInterval(this.flushTimer)
      }
      
      // Limpar dados
      this.events = []
      this.performanceMetrics = []
      this.isEnabled = false
      
      console.log('🗑️ Analytics: Sistema destruído')
      
    } catch (error) {
      console.error('❌ Analytics: Erro ao destruir:', error)
    }
  }
}

// 🔧 Classe para métricas específicas do negócio
export class BusinessAnalytics {
  static trackClientAction(action, clientId, details = {}) {
    analytics.track('client_action', {
      action,
      clientId,
      ...details,
      category: 'business'
    })
  }

  static trackAppointmentAction(action, appointmentId, details = {}) {
    analytics.track('appointment_action', {
      action,
      appointmentId,
      ...details,
      category: 'business'
    })
  }

  static trackUserProductivity(feature, timeSpent, efficiency = null) {
    analytics.track('user_productivity', {
      feature,
      timeSpent,
      efficiency,
      category: 'productivity'
    })
  }

  static trackSystemUsage(module, action, performance = {}) {
    analytics.track('system_usage', {
      module,
      action,
      performance,
      category: 'usage'
    })
  }
}

// 🔧 Instância global
const analytics = new AnalyticsManager()

// 🔧 Expor para uso global
if (typeof window !== 'undefined') {
  window.analytics = analytics
  window.businessAnalytics = BusinessAnalytics
}

export default analytics
export { BusinessAnalytics } 