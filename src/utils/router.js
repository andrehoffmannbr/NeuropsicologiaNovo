import authService from '../services/auth.js'

export const ROUTES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  CLIENTS: 'clients',
  APPOINTMENTS: 'appointments',
  ALL_CLIENTS: 'all-clients',
  CLIENT_REPORTS: 'client-reports',
  DOCUMENTS: 'documents',
  FINANCIAL: 'financial',
  INVENTORY: 'inventory',
  INTERNS: 'interns'
}

export const ROUTE_PERMISSIONS = {
  [ROUTES.LOGIN]: ['public'],
  [ROUTES.DASHBOARD]: ['authenticated'],
  [ROUTES.CLIENTS]: ['clients'],
  [ROUTES.APPOINTMENTS]: ['appointments', 'own-appointments'],
  [ROUTES.ALL_CLIENTS]: ['clients'],
  [ROUTES.CLIENT_REPORTS]: ['reports'],
  [ROUTES.DOCUMENTS]: ['documents'],
  [ROUTES.FINANCIAL]: ['coordinator-only'],
  [ROUTES.INVENTORY]: ['coordinator-only'],
  [ROUTES.INTERNS]: ['coordinator-only']
}

class Router {
  constructor() {
    this.currentRoute = ROUTES.LOGIN
    this.listeners = []
  }

  // Registrar listener para mudanças de rota
  onRouteChange(callback) {
    this.listeners.push(callback)
  }

  // Notificar mudança de rota
  notifyRouteChange() {
    this.listeners.forEach(listener => listener(this.currentRoute))
  }

  // Navegar para uma rota
  navigateTo(route) {
    if (this.canAccessRoute(route)) {
      this.currentRoute = route
      this.notifyRouteChange()
      this.updateURL(route)
    } else {
      console.warn(`Acesso negado para a rota: ${route}`)
      this.navigateTo(ROUTES.DASHBOARD)
    }
  }

  // Verificar se pode acessar uma rota
  canAccessRoute(route) {
    const requiredPermissions = ROUTE_PERMISSIONS[route]
    
    if (!requiredPermissions) return false
    
    // Rota pública (como login)
    if (requiredPermissions.includes('public')) {
      return true
    }
    
    // Verificar se usuário está autenticado
    const currentUser = authService.currentUser
    if (!currentUser) {
      return route === ROUTES.LOGIN
    }
    
    // Rota que requer apenas autenticação
    if (requiredPermissions.includes('authenticated')) {
      return true
    }
    
    // Rota apenas para coordenador
    if (requiredPermissions.includes('coordinator-only')) {
      return authService.isCoordinator()
    }
    
    // Verificar permissões específicas
    return requiredPermissions.some(permission => 
      authService.hasPermission(permission)
    )
  }

  // Obter rota atual
  getCurrentRoute() {
    return this.currentRoute
  }

  // Obter rota inicial baseada no usuário
  getInitialRoute() {
    const user = authService.currentUser
    
    if (!user) {
      return ROUTES.LOGIN
    }
    
    return ROUTES.DASHBOARD  // Dashboard como página inicial
  }

  // Atualizar URL sem recarregar a página
  updateURL(route) {
    const url = new URL(window.location)
    url.searchParams.set('page', route)
    window.history.pushState({}, '', url)
  }

  // Obter rota da URL
  getRouteFromURL() {
    const urlParams = new URLSearchParams(window.location.search)
    const route = urlParams.get('page')
    
    if (route && Object.values(ROUTES).includes(route)) {
      return route
    }
    
    return this.getInitialRoute()
  }

  // Inicializar roteamento
  init() {
    // Verificar rota inicial
    this.currentRoute = this.getRouteFromURL()
    
    // Escutar mudanças na URL
    window.addEventListener('popstate', () => {
      this.currentRoute = this.getRouteFromURL()
      this.notifyRouteChange()
    })
    
    // Escutar mudanças de autenticação
    authService.onAuthStateChange((user) => {
      if (!user) {
        this.navigateTo(ROUTES.LOGIN)
      } else if (this.currentRoute === ROUTES.LOGIN) {
        this.navigateTo(ROUTES.DASHBOARD)
      }
    })
  }
}

export const router = new Router()
export default router 