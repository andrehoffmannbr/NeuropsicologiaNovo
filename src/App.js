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
    this.isInitialized = false
    this.pageRenderTimeout = null
    this.maxPageRenderTime = 8000
    
    if (!this.container) {
      throw new Error('Container #app não encontrado no DOM')
    }
    
    this.initializePages()
    this.setupEventListeners()
  }

  initializePages() {
    try {
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
      
      console.log('✅ App: Páginas inicializadas:', Array.from(this.pages.keys()))
    } catch (error) {
      console.error('❌ App: Erro ao inicializar páginas:', error)
      throw error
    }
  }

  showErrorPage(error, route) {
    console.error(`❌ App: Erro na página ${route}:`, error)
    
    this.container.innerHTML = `
      <div class="app-error-page">
        <div class="error-content">
          <i data-lucide="alert-triangle" class="error-icon"></i>
          <h2>Erro ao Carregar Página</h2>
          <p>Não foi possível carregar a página "${route}".</p>
          <div class="error-details">
            <p><strong>Erro:</strong> ${error.message}</p>
          </div>
          <div class="error-actions">
            <button class="btn btn-primary" onclick="window.location.reload()">
              <i data-lucide="refresh-cw"></i>
              Recarregar Página
            </button>
            <button class="btn btn-secondary" onclick="window.app.navigateToDashboard()">
              <i data-lucide="home"></i>
              Ir para Dashboard
            </button>
          </div>
        </div>
      </div>
    `
    
    if (window.lucide) {
      window.lucide.createIcons()
    }
    
    this.addErrorPageStyles()
  }

  navigateToDashboard() {
    router.navigateTo(ROUTES.DASHBOARD)
  }

  addErrorPageStyles() {
    const styleId = 'app-error-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .app-error-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
        background: #f8fafc;
      }

      .error-content {
        text-align: center;
        max-width: 500px;
        padding: 40px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .error-icon {
        width: 64px;
        height: 64px;
        color: #ef4444;
        margin: 0 auto 24px;
      }

      .error-content h2 {
        margin: 0 0 16px 0;
        color: #374151;
        font-size: 24px;
        font-weight: 600;
      }

      .error-content p {
        margin: 0 0 16px 0;
        color: #6b7280;
        font-size: 16px;
        line-height: 1.5;
      }

      .error-details {
        background: #f3f4f6;
        border-radius: 6px;
        padding: 16px;
        margin: 24px 0;
        text-align: left;
      }

      .error-details p {
        margin: 0;
        font-size: 14px;
        color: #374151;
      }

      .error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 24px;
      }

      .error-actions .btn {
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 500;
      }

      @media (max-width: 640px) {
        .error-actions {
          flex-direction: column;
        }
        
        .error-actions .btn {
          width: 100%;
        }
      }
    `
    document.head.appendChild(style)
  }

  setupEventListeners() {
    try {
      authService.onAuthStateChange((user) => {
        try {
          this.isAuthenticated = !!user
          this.handleAuthChange(user)
        } catch (error) {
          console.error('❌ App: Erro ao tratar mudança de autenticação:', error)
          toast.error('Erro no sistema de autenticação')
        }
      })

      router.onRouteChange(async (route) => {
        try {
          await this.handleRouteChange(route)
        } catch (error) {
          console.error('❌ App: Erro ao tratar mudança de rota:', error)
          this.showErrorPage(error, route)
        }
      })

      window.addEventListener('error', (event) => {
        console.error('❌ App: Erro global:', event.error)
        if (event.error && event.error.message) {
          toast.error('Erro no sistema: ' + event.error.message)
        }
      })

      window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ App: Promise rejeitada:', event.reason)
        toast.error('Erro de carregamento: ' + (event.reason?.message || 'Erro desconhecido'))
      })

    } catch (error) {
      console.error('❌ App: Erro ao configurar listeners:', error)
      throw error
    }
  }

  async init() {
    try {
      console.log('🔄 App: Iniciando aplicação...')
      
      if (this.isInitialized) {
        console.log('⚠️ App: Aplicação já inicializada')
        return
      }

      const authTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao verificar autenticação')), 5000)
      })

      const authCheck = authService.getCurrentUser()
      
      const currentUser = await Promise.race([authCheck, authTimeout])
      this.isAuthenticated = !!currentUser
      
      console.log('✅ App: Autenticação verificada:', this.isAuthenticated)
      
      const initialRoute = router.getCurrentRoute()
      console.log('🔄 App: Renderizando página inicial:', initialRoute)
      
      await this.renderPage(initialRoute)
      
      this.isInitialized = true
      console.log('✅ App: Aplicação inicializada com sucesso')
      
    } catch (error) {
      console.error('❌ App: Erro ao inicializar aplicação:', error)
      
      this.showInitializationError(error)
      
      setTimeout(() => {
        router.navigateTo(ROUTES.LOGIN)
      }, 2000)
    }
  }

  showInitializationError(error) {
    this.container.innerHTML = `
      <div class="app-init-error">
        <div class="init-error-content">
          <i data-lucide="alert-circle" class="init-error-icon"></i>
          <h2>Erro de Inicialização</h2>
          <p>Não foi possível inicializar o sistema.</p>
          <div class="init-error-details">
            <p><strong>Erro:</strong> ${error.message}</p>
          </div>
          <div class="init-error-actions">
            <button class="btn btn-primary" onclick="window.location.reload()">
              <i data-lucide="refresh-cw"></i>
              Recarregar Sistema
            </button>
          </div>
        </div>
      </div>
    `
    
    if (window.lucide) {
      window.lucide.createIcons()
    }
    
    if (!document.getElementById('init-error-styles')) {
      const style = document.createElement('style')
      style.id = 'init-error-styles'
      style.textContent = `
        .app-init-error {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background: #f8fafc;
        }

        .init-error-content {
          text-align: center;
          max-width: 500px;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .init-error-icon {
          width: 64px;
          height: 64px;
          color: #ef4444;
          margin: 0 auto 24px;
        }

        .init-error-content h2 {
          margin: 0 0 16px 0;
          color: #374151;
          font-size: 24px;
          font-weight: 600;
        }

        .init-error-content p {
          margin: 0 0 16px 0;
          color: #6b7280;
          font-size: 16px;
          line-height: 1.5;
        }

        .init-error-details {
          background: #f3f4f6;
          border-radius: 6px;
          padding: 16px;
          margin: 24px 0;
          text-align: left;
        }

        .init-error-details p {
          margin: 0;
          font-size: 14px;
          color: #374151;
        }

        .init-error-actions {
          margin-top: 24px;
        }

        .init-error-actions .btn {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
        }
      `
      document.head.appendChild(style)
    }
  }

  handleAuthChange(user) {
    try {
      console.log('🔄 App: Auth state changed:', user ? `Usuário: ${user.email}` : 'Logout')
      
      if (user) {
        console.log('👤 App: Perfil do usuário:', user.profile)
        toast.success(`Bem-vindo, ${authService.getUserName()}!`)
      } else {
        toast.info('Sessão encerrada')
      }
    } catch (error) {
      console.error('❌ App: Erro ao tratar mudança de autenticação:', error)
    }
  }

  async handleRouteChange(route) {
    console.log(`🔄 App: Tratando mudança de rota para: ${route}`)
    
    if (this.pageRenderTimeout) {
      clearTimeout(this.pageRenderTimeout)
    }

    const timeoutPromise = new Promise((_, reject) => {
      this.pageRenderTimeout = setTimeout(() => {
        reject(new Error('Timeout ao renderizar página'))
      }, this.maxPageRenderTime)
    })

    try {
      await Promise.race([
        this.renderPage(route),
        timeoutPromise
      ])

      if (this.pageRenderTimeout) {
        clearTimeout(this.pageRenderTimeout)
        this.pageRenderTimeout = null
      }

    } catch (error) {
      if (this.pageRenderTimeout) {
        clearTimeout(this.pageRenderTimeout)
        this.pageRenderTimeout = null
      }

      if (error.message === 'Timeout ao renderizar página') {
        console.error('❌ App: Timeout ao renderizar página:', route)
        toast.error('Página demorou muito para carregar. Tente novamente.')
        
        setTimeout(() => {
          router.navigateTo(ROUTES.DASHBOARD)
        }, 1000)
      } else {
        throw error
      }
    }
  }

  async renderPage(route) {
    try {
      console.log(`🔄 App: Renderizando página: ${route}`)
      console.log(`🔐 App: Usuário autenticado: ${this.isAuthenticated}`)
      
      const PageClass = this.pages.get(route)
      if (!PageClass) {
        console.error(`❌ App: Página não encontrada: ${route}`)
        throw new Error(`Página "${route}" não encontrada`)
      }

      if (route !== ROUTES.LOGIN && !this.isAuthenticated) {
        console.log(`⚠️ App: Redirecionando para login - rota: ${route}, autenticado: ${this.isAuthenticated}`)
        router.navigateTo(ROUTES.LOGIN)
        return
      }

      if (route === ROUTES.LOGIN) {
        console.log('🔑 App: Renderizando página de login')
        await this.renderLoginPage(PageClass)
      } else {
        console.log('🏠 App: Renderizando página com layout')
        await this.renderWithLayout(route, PageClass)
      }

      if (window.lucide) {
        window.lucide.createIcons()
      }
      
      console.log(`✅ App: Página ${route} renderizada com sucesso`)

    } catch (error) {
      console.error('❌ App: Erro ao renderizar página:', error)
      
      this.showErrorPage(error, route)
      
      if (route !== ROUTES.LOGIN) {
        setTimeout(() => {
          router.navigateTo(ROUTES.LOGIN)
        }, 3000)
      }
    }
  }

  async renderLoginPage(PageClass) {
    try {
      this.destroyCurrentStructure()
      this.container.innerHTML = ''
      
      const pageCreationTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao criar página de login')), 5000)
      })

      const pageCreation = (async () => {
        this.currentPage = new PageClass()
        await this.currentPage.render(this.container)
      })()

      await Promise.race([pageCreation, pageCreationTimeout])
      
    } catch (error) {
      console.error('❌ App: Erro ao renderizar página de login:', error)
      throw error
    }
  }

  async renderWithLayout(route, PageClass) {
    try {
      if (!this.layout) {
        this.container.innerHTML = ''
        this.layout = new Layout()
        await this.layout.render(this.container)
      }

      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        try {
          this.currentPage.destroy()
        } catch (error) {
          console.warn('⚠️ App: Erro ao destruir página atual:', error)
        }
      }

      const pageCreationTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao criar página')), 5000)
      })

      const pageCreation = (async () => {
        this.currentPage = new PageClass()

        const mainContent = this.layout.getMainContent()
        if (!mainContent) {
          throw new Error('Container principal do layout não encontrado')
        }

        mainContent.innerHTML = ''
        await this.currentPage.render(mainContent)
      })()

      await Promise.race([pageCreation, pageCreationTimeout])
      
    } catch (error) {
      console.error('❌ App: Erro ao renderizar página com layout:', error)
      throw error
    }
  }

  destroyCurrentStructure() {
    try {
      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        this.currentPage.destroy()
      }
    } catch (error) {
      console.warn('⚠️ App: Erro ao destruir página atual:', error)
    }

    try {
      if (this.layout && typeof this.layout.destroy === 'function') {
        this.layout.destroy()
      }
    } catch (error) {
      console.warn('⚠️ App: Erro ao destruir layout:', error)
    }

    this.currentPage = null
    this.layout = null
  }

  destroy() {
    try {
      console.log('🔄 App: Destruindo aplicação...')
      
      if (this.pageRenderTimeout) {
        clearTimeout(this.pageRenderTimeout)
        this.pageRenderTimeout = null
      }

      this.destroyCurrentStructure()
      
      this.container.innerHTML = ''
      
      this.isInitialized = false
      
      console.log('✅ App: Aplicação destruída com sucesso')
      
    } catch (error) {
      console.error('❌ App: Erro ao destruir aplicação:', error)
    }
  }
} 