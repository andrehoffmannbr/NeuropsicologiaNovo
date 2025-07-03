import authService from './services/auth.js'
import router, { ROUTES } from './utils/router.js'
import toast from './components/toast.js'
import Layout from './components/Layout.js'
import LoginPage from './pages/LoginPage.js'
import DashboardPage from './pages/DashboardPage.js'
import ClientsPage from './pages/ClientsPage.js'
import AppointmentsPage from './pages/AppointmentsPage.js'
import AllClientsPage from './pages/AllClientsPage.js'
import ClientReportsPage from './pages/ClientReportsPage.js'
import DocumentsPage from './pages/DocumentsPage.js'
import FinancialPage from './pages/FinancialPage.js'
import InventoryPage from './pages/InventoryPage.js'
import InternsPage from './pages/InternsPage.js'
import ColaboradoresPage from './pages/ColaboradoresPage.js'

export default class App {
  constructor() {
    this.container = document.getElementById('app')
    this.currentPage = null
    this.layout = null
    this.isAuthenticated = false
    this.pages = new Map()
    
    this.initializePages()
    this.setupEventListeners()
  }

  // Inicializar páginas
  initializePages() {
    this.pages.set(ROUTES.LOGIN, LoginPage)
    this.pages.set(ROUTES.DASHBOARD, DashboardPage)
    this.pages.set(ROUTES.CLIENTS, ClientsPage)
    this.pages.set(ROUTES.APPOINTMENTS, AppointmentsPage)
    this.pages.set(ROUTES.ALL_CLIENTS, AllClientsPage)
    this.pages.set(ROUTES.CLIENT_REPORTS, ClientReportsPage)
    this.pages.set(ROUTES.DOCUMENTS, DocumentsPage)
    this.pages.set(ROUTES.FINANCIAL, FinancialPage)
    this.pages.set(ROUTES.INVENTORY, InventoryPage)
    this.pages.set(ROUTES.INTERNS, InternsPage)
    this.pages.set(ROUTES.COLABORADORES, ColaboradoresPage)
  }

  // Configurar event listeners
  setupEventListeners() {
    // Escutar mudanças de autenticação
    authService.onAuthStateChange((user) => {
      this.isAuthenticated = !!user
      this.handleAuthChange(user)
    })

    // Escutar mudanças de rota
    router.onRouteChange((route) => {
      this.handleRouteChange(route)
    })
  }

  // Inicializar aplicação
  async init() {
    try {
      // Verificar estado inicial de autenticação
      const currentUser = await authService.getCurrentUser()
      this.isAuthenticated = !!currentUser
      
      // Renderizar página inicial
      const initialRoute = router.getCurrentRoute()
      await this.renderPage(initialRoute)
      
    } catch (error) {
      console.error('Erro ao inicializar App:', error)
      toast.error('Erro ao carregar a aplicação')
    }
  }

  // Manipular mudanças de autenticação
  handleAuthChange(user) {
    console.log('🔄 Auth state changed:', user ? `Usuário: ${user.email}` : 'Logout')
    if (user) {
      console.log('👤 Perfil do usuário:', user.profile)
      toast.success(`Bem-vindo, ${authService.getUserName()}!`)
    } else {
      toast.info('Sessão encerrada')
    }
  }

  // Manipular mudanças de rota
  async handleRouteChange(route) {
    await this.renderPage(route)
  }

  // Renderizar página
  async renderPage(route) {
    try {
      console.log(`🔄 Renderizando página: ${route}`)
      console.log(`🔐 Usuário autenticado: ${this.isAuthenticated}`)
      
      // Verificar se a página existe
      const PageClass = this.pages.get(route)
      if (!PageClass) {
        console.error(`❌ Página não encontrada: ${route}`)
        router.navigateTo(ROUTES.DASHBOARD)
        return
      }

      // Verificar autenticação para páginas protegidas
      if (route !== ROUTES.LOGIN && !this.isAuthenticated) {
        console.log(`⚠️  Redirecionando para login - rota: ${route}, autenticado: ${this.isAuthenticated}`)
        router.navigateTo(ROUTES.LOGIN)
        return
      }

      // Para página de login, renderizar diretamente
      if (route === ROUTES.LOGIN) {
        console.log('🔑 Renderizando página de login')
        this.destroyCurrentStructure()
        this.container.innerHTML = ''
        
        this.currentPage = new PageClass()
        await this.currentPage.render(this.container)
      } else {
        // Para páginas autenticadas, usar o layout
        console.log('🏠 Renderizando página com layout')
        await this.renderWithLayout(route, PageClass)
      }

      // Atualizar ícones do Lucide
      if (window.lucide) {
        window.lucide.createIcons()
      }
      
      console.log(`✅ Página ${route} renderizada com sucesso`)

    } catch (error) {
      console.error('❌ Erro ao renderizar página:', error)
      toast.error('Erro ao carregar a página')
      
      // Fallback para página de login
      if (route !== ROUTES.LOGIN) {
        router.navigateTo(ROUTES.LOGIN)
      }
    }
  }

  // Renderizar página com layout
  async renderWithLayout(route, PageClass) {
    // Criar layout se não existir
    if (!this.layout) {
      this.container.innerHTML = ''
      this.layout = new Layout()
      this.layout.render(this.container)
    }

    // Destruir página atual
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy()
    }

    // Criar nova página
    this.currentPage = new PageClass()

    // Renderizar página no container do layout
    const mainContent = this.layout.getMainContent()
    mainContent.innerHTML = ''
    await this.currentPage.render(mainContent)
  }

  // Destruir estrutura atual
  destroyCurrentStructure() {
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy()
    }
    if (this.layout && typeof this.layout.destroy === 'function') {
      this.layout.destroy()
    }
    this.currentPage = null
    this.layout = null
  }

  // Destruir aplicação
  destroy() {
    this.destroyCurrentStructure()
    this.container.innerHTML = ''
  }
} 