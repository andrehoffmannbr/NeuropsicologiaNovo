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
      <header class="app-header fundacao-header">
        <div class="header-content">
          <div class="header-left">
            <div class="logo-container">
              <img src="/img/logosistema.jpg" alt="Fundação Dom Bosco" class="header-logo">
            </div>
            <nav class="main-navigation">
              <button class="nav-scroll-btn left" id="nav-scroll-left">
                <i data-lucide="chevron-left"></i>
              </button>
              <div class="nav-tabs" id="nav-tabs">
                <!-- Tabs serão inseridas dinamicamente -->
              </div>
              <button class="nav-scroll-btn right" id="nav-scroll-right">
                <i data-lucide="chevron-right"></i>
              </button>
            </nav>
          </div>
          <div class="header-right">
            <button class="nav-toggle mobile-menu-btn" id="nav-toggle">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div class="user-info">
              <div class="user-details">
                <span class="user-role" id="user-role">Coordenador</span>
                <span class="user-name" id="user-name">(Coordenador)</span>
              </div>
              <button class="btn btn-logout" id="logout-btn">
                <i data-lucide="log-out"></i>
                <span class="logout-text">Sair</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Menu Mobile -->
        <div class="mobile-nav" id="mobile-nav">
          <div class="mobile-nav-content">
            <div class="mobile-nav-tabs" id="mobile-nav-tabs">
              <!-- Tabs mobile serão inseridas dinamicamente -->
            </div>
          </div>
        </div>
      </header>

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

    // Menu mobile toggle
    const navToggle = this.element.querySelector('#nav-toggle')
    const mobileNav = this.element.querySelector('#mobile-nav')
    
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active')
      mobileNav.classList.toggle('open')
      document.body.classList.toggle('mobile-nav-open')
    })

    // Navigation scroll buttons
    const navScrollLeft = this.element.querySelector('#nav-scroll-left')
    const navScrollRight = this.element.querySelector('#nav-scroll-right')
    const navTabs = this.element.querySelector('#nav-tabs')
    
    if (navScrollLeft && navScrollRight && navTabs) {
      navScrollLeft.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Scroll inteligente baseado na largura visível
        const scrollAmount = Math.max(200, navTabs.clientWidth * 0.3)
        navTabs.scrollBy({ 
          left: -scrollAmount, 
          behavior: 'smooth' 
        })
        
        // Atualizar indicadores após scroll
        setTimeout(() => {
          this.updateScrollIndicators()
        }, 300)
      })
      
      navScrollRight.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Scroll inteligente baseado na largura visível
        const scrollAmount = Math.max(200, navTabs.clientWidth * 0.3)
        navTabs.scrollBy({ 
          left: scrollAmount, 
          behavior: 'smooth' 
        })
        
        // Atualizar indicadores após scroll
        setTimeout(() => {
          this.updateScrollIndicators()
        }, 300)
      })
      
      // Adicionar suporte a touch/swipe em dispositivos móveis
      let startX = 0
      let isScrolling = false
      
      navTabs.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX
        isScrolling = false
      })
      
      navTabs.addEventListener('touchmove', (e) => {
        if (!startX) return
        
        const currentX = e.touches[0].clientX
        const diffX = startX - currentX
        
        if (Math.abs(diffX) > 10) {
          isScrolling = true
          navTabs.scrollLeft += diffX * 0.5
        }
      })
      
      navTabs.addEventListener('touchend', () => {
        startX = 0
        if (isScrolling) {
          this.updateScrollIndicators()
        }
      })
    }

    // Navigation tabs (desktop)
    navTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.nav-tab')
      if (tab) {
        this.handleTabClick(tab)
      }
    })

    // Navigation tabs (mobile)
    const mobileNavTabs = this.element.querySelector('#mobile-nav-tabs')
    mobileNavTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.nav-tab')
      if (tab) {
        this.handleTabClick(tab)
        // Fechar menu mobile após clique
        navToggle.classList.remove('active')
        mobileNav.classList.remove('open')
        document.body.classList.remove('mobile-nav-open')
      }
    })

    // Fechar menu mobile ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-content') && mobileNav.classList.contains('open')) {
        navToggle.classList.remove('active')
        mobileNav.classList.remove('open')
        document.body.classList.remove('mobile-nav-open')
      }
    })

    // Fechar menu mobile com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        navToggle.classList.remove('active')
        mobileNav.classList.remove('open')
        document.body.classList.remove('mobile-nav-open')
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

  handleTabClick(tab) {
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

  async handleLogout() {
    try {
      await authService.logout()
      router.navigateTo(ROUTES.LOGIN)
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  updateUserInfo() {
    console.log('🔧 DEBUG Layout - updateUserInfo chamado');
    
    const userName = authService.getUserName()
    const userRole = authService.getUserRole()
    
    console.log('🔧 DEBUG Layout - userName:', userName);
    console.log('🔧 DEBUG Layout - userRole:', userRole);
    
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
    console.log('🔧 DEBUG Layout - renderNavigationTabs chamado');
    
    const navTabs = this.element.querySelector('#nav-tabs')
    const mobileNavTabs = this.element.querySelector('#mobile-nav-tabs')
    const mainNavigation = this.element.querySelector('.main-navigation')
    
    const userRole = authService.getUserRole()
    console.log('🔧 DEBUG Layout - userRole antes de getTabsForRole:', userRole);
    
    // Define as abas baseadas no role do usuário
    const tabs = this.getTabsForRole(userRole)
    console.log('🔧 DEBUG Layout - tabs retornadas:', tabs);
    
    // Renderizar tabs para desktop
    navTabs.innerHTML = tabs.map(tab => `
      <button class="nav-tab" data-section="${tab.section}">
        <i data-lucide="${tab.icon}"></i>
        <span class="nav-tab-text">${tab.label}</span>
      </button>
    `).join('')
    
    // Renderizar tabs para mobile
    mobileNavTabs.innerHTML = tabs.map(tab => `
      <button class="nav-tab mobile-nav-tab" data-section="${tab.section}">
        <i data-lucide="${tab.icon}"></i>
        <span class="nav-tab-text">${tab.label}</span>
      </button>
    `).join('')
    
    // Configurar indicadores de scroll
    this.setupScrollIndicators()
    
    console.log('🔧 DEBUG Layout - HTML das tabs inserido em ambos os menus');
  }

  setupScrollIndicators() {
    const navTabs = this.element.querySelector('#nav-tabs')
    const mainNavigation = this.element.querySelector('.main-navigation')
    
    if (!navTabs || !mainNavigation) return
    
    // Criar método reutilizável para atualizar indicadores
    this.updateScrollIndicators = () => {
      const scrollLeft = navTabs.scrollLeft
      const scrollWidth = navTabs.scrollWidth
      const clientWidth = navTabs.clientWidth
      
      // Verifica se há scroll disponível à esquerda
      if (scrollLeft > 5) {
        mainNavigation.classList.add('has-scroll-left')
      } else {
        mainNavigation.classList.remove('has-scroll-left')
      }
      
      // Verifica se há scroll disponível à direita
      if (scrollLeft + clientWidth < scrollWidth - 5) {
        mainNavigation.classList.add('has-scroll-right')
      } else {
        mainNavigation.classList.remove('has-scroll-right')
      }
      
      // Debug para desenvolvimento
      console.log('📍 Scroll indicators:', {
        scrollLeft,
        scrollWidth,
        clientWidth,
        hasScrollLeft: scrollLeft > 5,
        hasScrollRight: scrollLeft + clientWidth < scrollWidth - 5
      })
    }
    
    // Atualizar indicadores no scroll
    navTabs.addEventListener('scroll', this.updateScrollIndicators)
    
    // Atualizar indicadores no redimensionamento da janela
    window.addEventListener('resize', () => {
      setTimeout(this.updateScrollIndicators, 100)
    })
    
    // Observador de mudanças no DOM (quando tabs são adicionadas/removidas)
    const observer = new MutationObserver(() => {
      setTimeout(this.updateScrollIndicators, 50)
    })
    
    observer.observe(navTabs, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    })
    
    // Atualizar indicadores inicialmente
    setTimeout(this.updateScrollIndicators, 100)
    
    // Cleanup observer no destroy
    this.scrollObserver = observer
  }

  getTabsForRole(role) {
    console.log('🔧 DEBUG Layout - Role recebido:', role);
    
    const allTabs = [
      { section: 'clients', icon: 'user-plus', label: 'Cadastrar Cliente' },
      { section: 'appointments', icon: 'calendar', label: 'Agenda do Dia' },
      { section: 'all-clients', icon: 'users', label: 'Todos os pacientes' },
      { section: 'prontuario', icon: 'file-text', label: 'Prontuário' },
      { section: 'reports', icon: 'bar-chart-3', label: 'Relatório de Clientes' },
      { section: 'documents', icon: 'file-text', label: 'Laudos' },
      { section: 'financial', icon: 'dollar-sign', label: 'Financeiro' },
      { section: 'inventory', icon: 'package', label: 'Estoque' },
      { section: 'interns', icon: 'graduation-cap', label: 'Estagiários' },
      { section: 'colaboradores', icon: 'users-cog', label: 'Colaboradores' }
    ]

    console.log('🔧 DEBUG Layout - Todas as tabs:', allTabs);

    // TEMPORÁRIO: Forçar exibição de todas as abas para debug
    if (role === 'coordinator' || role === 'staff' || role === 'intern' || !role) {
      console.log('🔧 DEBUG Layout - Mostrando todas as abas (DEBUG MODE)');
      return allTabs; // Mostrar todas as abas temporariamente
    }

    // Filtrar abas baseado nas permissões (código original)
    const filteredTabs = allTabs.filter(tab => {
      if (role === 'coordinator') {
        return true // Coordenador vê todas as abas
      } else if (role === 'staff') {
        return !['financial', 'inventory', 'interns', 'colaboradores'].includes(tab.section)
      } else if (role === 'intern') {
        return ['appointments', 'all-clients'].includes(tab.section)
      }
      return false
    });

    console.log('🔧 DEBUG Layout - Tabs filtradas:', filteredTabs);
    return filteredTabs;
  }

  updateActiveTab() {
    const allTabs = this.element.querySelectorAll('.nav-tab')
    allTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.section === this.currentSection)
    })
  }

  getMainContent() {
    return this.element.querySelector('#main-content')
  }

  destroy() {
    // Cleanup scroll observer
    if (this.scrollObserver) {
      this.scrollObserver.disconnect()
      this.scrollObserver = null
    }
    
    // Cleanup scroll update function
    if (this.updateScrollIndicators) {
      this.updateScrollIndicators = null
    }
    
    if (this.element) {
      this.element.remove()
    }
  }
} 