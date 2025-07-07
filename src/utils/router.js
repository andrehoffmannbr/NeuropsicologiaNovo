import authService from '../services/auth.js'

export const ROUTES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  CLIENTS: 'clients',
  APPOINTMENTS: 'appointments',
  ALL_CLIENTS: 'all-clients',
  MEUS_CLIENTES: 'meus-clientes',
  CLIENT_REPORTS: 'client-reports',
  DOCUMENTS: 'documents',
  FINANCIAL: 'financial',
  INVENTORY: 'inventory',
  INTERNS: 'interns',
  COLABORADORES: 'colaboradores',
  PRONTUARIO: 'prontuario'
}

export const ROUTE_PERMISSIONS = {
  [ROUTES.LOGIN]: ['public'],
  [ROUTES.DASHBOARD]: ['authenticated'],
  [ROUTES.CLIENTS]: ['clients'],
  [ROUTES.APPOINTMENTS]: ['appointments', 'own-appointments'],
  [ROUTES.ALL_CLIENTS]: ['clients'],
  [ROUTES.MEUS_CLIENTES]: ['own-clients'],
  [ROUTES.CLIENT_REPORTS]: ['reports'],
  [ROUTES.DOCUMENTS]: ['documents'],
  [ROUTES.FINANCIAL]: ['coordinator-only'],
  [ROUTES.INVENTORY]: ['coordinator-only'],
  [ROUTES.INTERNS]: ['coordinator-only'],
  [ROUTES.COLABORADORES]: ['coordinator-only'],
  [ROUTES.PRONTUARIO]: ['clients', 'reports']
}

class Router {
  constructor() {
    this.currentRoute = ROUTES.LOGIN
    this.listeners = []
    this.isNavigating = false
    this.navigationTimeout = null
    this.maxNavigationTime = 10000
  }

  showLoadingState() {
    let loadingElement = document.querySelector('.route-loading')
    if (!loadingElement) {
      loadingElement = document.createElement('div')
      loadingElement.className = 'route-loading'
      loadingElement.innerHTML = `
        <div class="route-loading-content">
          <div class="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      `
      document.body.appendChild(loadingElement)
    }
    loadingElement.style.display = 'flex'
  }

  hideLoadingState() {
    const loadingElement = document.querySelector('.route-loading')
    if (loadingElement) {
      loadingElement.style.display = 'none'
    }
  }

  showTimeoutError() {
    this.hideLoadingState()
    
    let errorElement = document.querySelector('.route-error')
    if (!errorElement) {
      errorElement = document.createElement('div')
      errorElement.className = 'route-error'
      errorElement.innerHTML = `
        <div class="route-error-content">
          <i data-lucide="alert-triangle"></i>
          <h3>Timeout de Carregamento</h3>
          <p>A página demorou muito para carregar. Tente novamente.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">
            <i data-lucide="refresh-cw"></i>
            Recarregar Página
          </button>
        </div>
      `
      document.body.appendChild(errorElement)
    }
    errorElement.style.display = 'flex'
    
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }

  hideError() {
    const errorElement = document.querySelector('.route-error')
    if (errorElement) {
      errorElement.style.display = 'none'
    }
  }

  onRouteChange(callback) {
    this.listeners.push(callback)
  }

  async notifyRouteChange() {
    console.log(`🔄 Router: Notificando mudança para ${this.currentRoute}`)
    
    this.showLoadingState()
    this.hideError()
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        this.navigationTimeout = setTimeout(() => {
          reject(new Error('Timeout de navegação'))
        }, this.maxNavigationTime)
      })

      const navigationPromise = Promise.all(
        this.listeners.map(listener => {
          return Promise.resolve(listener(this.currentRoute))
        })
      )

      await Promise.race([navigationPromise, timeoutPromise])
      
      if (this.navigationTimeout) {
        clearTimeout(this.navigationTimeout)
        this.navigationTimeout = null
      }

      setTimeout(() => {
        this.hideLoadingState()
      }, 500)

    } catch (error) {
      console.error('❌ Router: Erro durante navegação:', error)
      
      if (error.message === 'Timeout de navegação') {
        this.showTimeoutError()
      } else {
        this.hideLoadingState()
        if (window.toast) {
          window.toast.error('Erro ao carregar página. Tente novamente.')
        }
      }
    } finally {
      this.isNavigating = false
      
      if (this.navigationTimeout) {
        clearTimeout(this.navigationTimeout)
        this.navigationTimeout = null
      }
    }
  }

  async navigateTo(route) {
    if (this.isNavigating) {
      console.log('⚠️ Router: Navegação já em andamento, ignorando...')
      return
    }

    console.log(`🔄 Router: Navegando para ${route}`)
    this.isNavigating = true

    try {
      if (!this.canAccessRoute(route)) {
        console.warn(`❌ Router: Acesso negado para a rota: ${route}`)
        
        const fallbackRoute = this.getFallbackRoute()
        if (fallbackRoute !== route) {
          this.isNavigating = false
          await this.navigateTo(fallbackRoute)
          return
        } else {
          throw new Error('Não foi possível encontrar uma rota válida')
        }
      }

      this.currentRoute = route
      
      this.updateURL(route)
      
      await this.notifyRouteChange()

    } catch (error) {
      console.error('❌ Router: Erro durante navegação:', error)
      this.isNavigating = false
      
      const fallbackRoute = this.getFallbackRoute()
      if (fallbackRoute !== route) {
        setTimeout(() => {
          this.navigateTo(fallbackRoute)
        }, 1000)
      }
    }
  }

  getFallbackRoute() {
    const currentUser = authService.currentUser
    if (!currentUser) {
      return ROUTES.LOGIN
    }
    return ROUTES.DASHBOARD
  }

  canAccessRoute(route) {
    const requiredPermissions = ROUTE_PERMISSIONS[route]
    
    if (!requiredPermissions) {
      console.warn(`❌ Router: Rota ${route} não tem permissões definidas`)
      return false
    }
    
    if (requiredPermissions.includes('public')) {
      return true
    }
    
    const currentUser = authService.currentUser
    if (!currentUser) {
      return route === ROUTES.LOGIN
    }
    
    if (requiredPermissions.includes('authenticated')) {
      return true
    }
    
    if (requiredPermissions.includes('coordinator-only')) {
      return authService.isCoordinator()
    }
    
    return requiredPermissions.some(permission => 
      authService.hasPermission(permission)
    )
  }

  getCurrentRoute() {
    return this.currentRoute
  }

  getInitialRoute() {
    const user = authService.currentUser
    
    if (!user) {
      return ROUTES.LOGIN
    }
    
    return ROUTES.DASHBOARD
  }

  updateURL(route) {
    try {
      const url = new URL(window.location)
      url.searchParams.set('page', route)
      window.history.pushState({ route }, '', url)
    } catch (error) {
      console.error('❌ Router: Erro ao atualizar URL:', error)
    }
  }

  getRouteFromURL() {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const route = urlParams.get('page')
      
      if (route && Object.values(ROUTES).includes(route)) {
        return route
      }
      
      return this.getInitialRoute()
    } catch (error) {
      console.error('❌ Router: Erro ao obter rota da URL:', error)
      return this.getInitialRoute()
    }
  }

  init() {
    try {
      this.currentRoute = this.getRouteFromURL()
      console.log(`🔄 Router: Rota inicial - ${this.currentRoute}`)
      
      let popstateTimeout
      window.addEventListener('popstate', (event) => {
        clearTimeout(popstateTimeout)
        popstateTimeout = setTimeout(() => {
          const newRoute = this.getRouteFromURL()
          if (newRoute !== this.currentRoute) {
            this.navigateTo(newRoute)
          }
        }, 100)
      })
      
      let authTimeout
      authService.onAuthStateChange((user) => {
        clearTimeout(authTimeout)
        authTimeout = setTimeout(() => {
          if (!user) {
            this.navigateTo(ROUTES.LOGIN)
          } else if (this.currentRoute === ROUTES.LOGIN) {
            this.navigateTo(ROUTES.DASHBOARD)
          }
        }, 100)
      })

      this.addRouterStyles()

    } catch (error) {
      console.error('❌ Router: Erro durante inicialização:', error)
      this.currentRoute = ROUTES.LOGIN
    }
  }

  addRouterStyles() {
    const styleId = 'router-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .route-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
      }

      .route-loading-content {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .route-loading-content .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .route-loading-content p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
        font-weight: 500;
      }

      .route-error {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.98);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
      }

      .route-error-content {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        max-width: 400px;
        padding: 24px;
        border-radius: 8px;
        background: white;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .route-error-content i {
        width: 48px;
        height: 48px;
        color: #f59e0b;
      }

      .route-error-content h3 {
        margin: 0;
        color: #374151;
        font-size: 18px;
        font-weight: 600;
      }

      .route-error-content p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }
}

export const router = new Router()
export default router 