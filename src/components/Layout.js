import authService from '../services/auth.js'
import router, { ROUTES } from '../utils/router.js'
import toast from './toast.js'

export default class Layout {
  constructor() {
    this.element = null
    this.currentRoute = null
    this.currentSection = null
  }

  render(container) {
    this.element = document.createElement('div')
    this.element.className = 'app-layout'
    
    this.element.innerHTML = `
      <header class="app-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="app-title">Sistema de Neuropsicologia</h1>
          </div>
          <div class="header-right">
            <div class="user-info">
              <span class="user-role" id="user-role">Coordenador</span>
              <span class="user-name" id="user-name">(Coordenador)</span>
              <button class="btn btn-accent btn-sm" id="logout-btn">
                <i data-lucide="log-out"></i>
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav class="app-nav">
        <div class="nav-content">
          <div class="nav-tabs" id="nav-tabs">
            <!-- Tabs serão inseridas dinamicamente -->
          </div>
        </div>
      </nav>

      <main class="app-main">
        <div class="main-content" id="main-content">
          <!-- Conteúdo da página será inserido aqui -->
        </div>
      </main>
    `

    container.appendChild(this.element)
    this.setupEventListeners()
    this.updateUserInfo()
    this.renderNavigationTabs()
  }

  setupEventListeners() {
    // Logout
    const logoutBtn = this.element.querySelector('#logout-btn')
    logoutBtn.addEventListener('click', () => this.handleLogout())

    // Navigation tabs
    const navTabs = this.element.querySelector('#nav-tabs')
    navTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.nav-tab')
      if (tab) {
        const section = tab.dataset.section
        if (section) {
          // Navegar para o dashboard com seção específica
          this.currentSection = section
          router.navigateTo(ROUTES.DASHBOARD)
          
          // Disparar evento personalizado para o dashboard saber qual seção mostrar
          window.dispatchEvent(new CustomEvent('dashboard-section-change', {
            detail: { section }
          }))
        }
      }
    })

    // Listen for route changes
    router.onRouteChange((route) => {
      this.currentRoute = route
      this.updateActiveTab()
    })

    // Set initial route
    this.currentRoute = router.getCurrentRoute()
    this.updateActiveTab()
  }

  async handleLogout() {
    try {
      await authService.logout()
      router.navigateTo(ROUTES.LOGIN)
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  updateUserInfo() {
    const userName = authService.getUserName()
    const userRole = authService.getUserRole()
    
    const userNameEl = this.element.querySelector('#user-name')
    const userRoleEl = this.element.querySelector('#user-role')
    
    if (userNameEl) userNameEl.textContent = `(${userName})`
    if (userRoleEl) {
      const roleLabels = {
        coordinator: 'Coordenador',
        staff: 'Funcionário', 
        intern: 'Estagiário'
      }
      userRoleEl.textContent = roleLabels[userRole] || 'Usuário'
    }
  }

  renderNavigationTabs() {
    const navTabs = this.element.querySelector('#nav-tabs')
    const userRole = authService.getUserRole()
    
    // Define as abas baseadas no role do usuário
    const tabs = this.getTabsForRole(userRole)
    
    navTabs.innerHTML = tabs.map(tab => `
      <button class="nav-tab" data-section="${tab.section}">
        <i data-lucide="${tab.icon}"></i>
        <span class="nav-tab-text">${tab.label}</span>
      </button>
    `).join('')
  }

  getTabsForRole(role) {
    const allTabs = [
      { section: 'clients', icon: 'user-plus', label: 'Cadastrar Cliente' },
      { section: 'appointments', icon: 'calendar', label: 'Agenda do Dia' },
      { section: 'all-clients', icon: 'users', label: 'Todos os pacientes' },
      { section: 'reports', icon: 'bar-chart-3', label: 'Relatório de Clientes' },
      { section: 'documents', icon: 'file-text', label: 'Laudos' },
      { section: 'financial', icon: 'dollar-sign', label: 'Financeiro' },
      { section: 'inventory', icon: 'package', label: 'Estoque' },
      { section: 'interns', icon: 'graduation-cap', label: 'Estagiários' }
    ]

    // Filtrar abas baseado nas permissões
    return allTabs.filter(tab => {
      if (role === 'coordinator') {
        return true // Coordenador vê todas as abas
      } else if (role === 'staff') {
        return !['financial', 'inventory', 'interns'].includes(tab.section)
      } else if (role === 'intern') {
        return ['appointments', 'all-clients'].includes(tab.section)
      }
      return false
    })
  }

  updateActiveTab() {
    const tabs = this.element.querySelectorAll('.nav-tab')
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.section === this.currentSection)
    })
  }

  getMainContent() {
    return this.element.querySelector('#main-content')
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 