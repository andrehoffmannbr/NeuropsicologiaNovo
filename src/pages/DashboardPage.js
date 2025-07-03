import dashboardService from '../services/dashboard.js'
import toast from '../components/toast.js'
import router, { ROUTES } from '../utils/router.js'
import authService from '../services/auth.js'
import supabase from '../config/supabase.js'

export default class DashboardPage {
  constructor() {
    this.element = null
    this.currentSection = 'overview'
    this.dashboardData = null
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'dashboard-page'
    
    container.appendChild(this.element)

    // Escutar mudanças de seção
    window.addEventListener('dashboard-section-change', (e) => {
      this.currentSection = e.detail.section
      this.renderContent()
    })

    // Carregar dados do dashboard
    await this.loadDashboardData()
    this.renderContent()
  }

  async loadDashboardData() {
    try {
      // Carregar dados usando os métodos corretos do dashboardService
      const [stats, todayAppointments, recentActivities] = await Promise.all([
        dashboardService.getStatistics(),
        dashboardService.getTodayAppointments(),
        dashboardService.getRecentActivities()
      ])

      this.dashboardData = {
        stats,
        todayAppointments: todayAppointments.map(appointment => ({
          time: dashboardService.formatTime(appointment.appointment_time),
          client_name: appointment.clients?.name || 'Nome não encontrado',
          type: appointment.appointment_type,
          status: appointment.status
        })),
        recentActivities: recentActivities.map(activity => ({
          icon: activity.type === 'cliente' ? 'user-plus' : 'calendar-plus',
          description: activity.description,
          time: dashboardService.formatDate(activity.timestamp)
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      toast.error('Erro ao carregar dados do dashboard')
      this.dashboardData = {
        stats: { activeClients: 0, todayAppointments: 0, pendingReports: 0, monthlyRevenue: 0 },
        todayAppointments: [],
        recentActivities: []
      }
    }
  }

  renderContent() {
    if (!this.element) return

    switch (this.currentSection) {
      case 'overview':
      default:
        this.renderOverview()
        break
      case 'clients':
        this.renderClientsSection()
        break
      case 'appointments':
        this.renderAppointmentsSection()
        break
      case 'all-clients':
        this.renderAllClientsSection()
        break
      case 'reports':
        this.renderReportsSection()
        break
      case 'documents':
        this.renderDocumentsSection()
        break
      case 'financial':
        this.renderFinancialSection()
        break
      case 'inventory':
        this.renderInventorySection()
        break
      case 'interns':
        this.renderInternsSection()
        break
    }
  }

  renderOverview() {
    // Verificar se os dados do dashboard estão carregados
    if (!this.dashboardData) {
      this.element.innerHTML = `
        <div class="dashboard-header">
          <h2 class="dashboard-title">Dashboard</h2>
          <p class="dashboard-subtitle">Carregando dados...</p>
        </div>
        <div class="loading-spinner"></div>
      `
      return
    }

    const { stats, todayAppointments, recentActivities } = this.dashboardData

    this.element.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Dashboard</h2>
        <p class="dashboard-subtitle">Visão geral do sistema</p>
      </div>

      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="users"></i>
          </div>
          <div class="stat-info">
            <h3 class="stat-number">${stats.activeClients}</h3>
            <p class="stat-label">Clientes Ativos</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="calendar"></i>
          </div>
          <div class="stat-info">
            <h3 class="stat-number">${stats.todayAppointments}</h3>
            <p class="stat-label">Consultas Hoje</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="file-text"></i>
          </div>
          <div class="stat-info">
            <h3 class="stat-number">${stats.pendingReports}</h3>
            <p class="stat-label">Relatórios Pendentes</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="dollar-sign"></i>
          </div>
          <div class="stat-info">
            <h3 class="stat-number">R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}</h3>
            <p class="stat-label">Receita Mensal</p>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="dashboard-section">
          <h3>Agendamentos de Hoje</h3>
          <div class="appointments-list">
            ${todayAppointments.length > 0 ? 
              todayAppointments.map(appointment => `
                <div class="appointment-card">
                  <div class="appointment-time">${appointment.time}</div>
                  <div class="appointment-info">
                    <h4>${appointment.client_name}</h4>
                    <p>${appointment.type}</p>
                  </div>
                  <div class="appointment-status status-${appointment.status}">
                    ${appointment.status}
                  </div>
                </div>
              `).join('') : 
              '<p class="no-data">Nenhum agendamento para hoje</p>'
            }
          </div>
        </div>

        <div class="dashboard-section">
          <h3>Atividades Recentes</h3>
          <div class="activities-list">
            ${recentActivities.length > 0 ? 
              recentActivities.map(activity => `
                <div class="activity-card">
                  <div class="activity-icon">
                    <i data-lucide="${activity.icon}"></i>
                  </div>
                  <div class="activity-info">
                    <p>${activity.description}</p>
                    <small>${activity.time}</small>
                  </div>
                </div>
              `).join('') : 
              '<p class="no-data">Nenhuma atividade recente</p>'
            }
          </div>
        </div>
      </div>

      <div class="dashboard-actions">
        <button class="btn btn-primary" id="dashboard-btn-clients">
          <i data-lucide="user-plus"></i>
          Cadastrar Cliente
        </button>
        <button class="btn btn-secondary" id="dashboard-btn-appointments">
          <i data-lucide="calendar"></i>
          Ver Agenda
        </button>
        <button class="btn btn-secondary" id="dashboard-btn-all-clients">
          <i data-lucide="users"></i>
          Todos os Clientes
        </button>
        ${authService.isCoordinator() ? `
          <button class="btn btn-secondary" id="dashboard-btn-financial">
            <i data-lucide="dollar-sign"></i>
            Financeiro
          </button>
        ` : ''}
      </div>
    `

    // Adicionar event listeners
    this.setupOverviewEventListeners()
  }

  setupOverviewEventListeners() {
    const btnClients = this.element.querySelector('#dashboard-btn-clients')
    const btnAppointments = this.element.querySelector('#dashboard-btn-appointments')
    const btnAllClients = this.element.querySelector('#dashboard-btn-all-clients')
    const btnFinancial = this.element.querySelector('#dashboard-btn-financial')

    if (btnClients) {
      btnClients.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'clients' }
        }))
      })
    }

    if (btnAppointments) {
      btnAppointments.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'appointments' }
        }))
      })
    }

    if (btnAllClients) {
      btnAllClients.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'all-clients' }
        }))
      })
    }

    if (btnFinancial) {
      btnFinancial.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'financial' }
        }))
      })
    }
  }

  renderClientsSection() {
    this.element.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Cadastro de Clientes</h2>
        <p class="dashboard-subtitle">Adicione novos clientes ao sistema</p>
      </div>

      <div class="clients-section">
        <div class="section-actions">
          <button class="btn btn-primary" id="btn-new-client">
            <i data-lucide="user-plus"></i>
            Novo Cliente
          </button>
          <button class="btn btn-secondary" id="btn-back-overview">
            <i data-lucide="arrow-left"></i>
            Voltar ao Dashboard
          </button>
        </div>

        <div class="quick-stats">
          <div class="stat-card">
            <h3>${this.dashboardData.stats.activeClients}</h3>
            <p>Clientes Ativos</p>
          </div>
          <div class="stat-card">
            <h3>0</h3>
            <p>Novos Este Mês</p>
          </div>
        </div>

        <div class="recent-clients">
          <h3>Clientes Recentes</h3>
          <p>Para ver todos os clientes, acesse "Todos os pacientes"</p>
          <button class="btn btn-outline" id="btn-view-all-clients">
            Ver Todos os Clientes
          </button>
        </div>
      </div>
    `

    this.setupClientsEventListeners()
  }

  setupClientsEventListeners() {
    const btnNewClient = this.element.querySelector('#btn-new-client')
    const btnBackOverview = this.element.querySelector('#btn-back-overview')
    const btnViewAllClients = this.element.querySelector('#btn-view-all-clients')

    if (btnNewClient) {
      btnNewClient.addEventListener('click', () => {
        router.navigateTo(ROUTES.CLIENTS)
      })
    }

    if (btnBackOverview) {
      btnBackOverview.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'overview' }
        }))
      })
    }

    if (btnViewAllClients) {
      btnViewAllClients.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'all-clients' }
        }))
      })
    }
  }

  renderAppointmentsSection() {
    // Verificar se os dados do dashboard estão carregados
    if (!this.dashboardData || !this.dashboardData.todayAppointments) {
      this.element.innerHTML = `
        <div class="dashboard-header">
          <h2 class="dashboard-title">Agenda do Dia</h2>
          <p class="dashboard-subtitle">Carregando dados...</p>
        </div>
        <div class="loading-spinner"></div>
      `
      return
    }

    this.element.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Agenda do Dia</h2>
        <p class="dashboard-subtitle">Gerencie os agendamentos de hoje</p>
      </div>

      <div class="appointments-section">
        <div class="section-actions">
          <button class="btn btn-primary" id="btn-new-appointment">
            <i data-lucide="calendar-plus"></i>
            Novo Agendamento
          </button>
          <button class="btn btn-secondary" id="btn-back-overview-appointments">
            <i data-lucide="arrow-left"></i>
            Voltar ao Dashboard
          </button>
        </div>

        <div class="today-appointments">
          <h3>Agendamentos de Hoje</h3>
          <div class="appointments-list">
            ${this.dashboardData.todayAppointments.length > 0 ? 
              this.dashboardData.todayAppointments.map(appointment => `
                <div class="appointment-card">
                  <div class="appointment-time">${appointment.time}</div>
                  <div class="appointment-info">
                    <h4>${appointment.client_name}</h4>
                    <p>${appointment.type}</p>
                  </div>
                  <div class="appointment-status status-${appointment.status}">
                    ${appointment.status}
                  </div>
                  <div class="appointment-actions">
                    <button class="btn btn-sm btn-outline">Editar</button>
                    <button class="btn btn-sm btn-success">Confirmar</button>
                  </div>
                </div>
              `).join('') : 
              '<p class="no-data">Nenhum agendamento para hoje</p>'
            }
          </div>
        </div>

        <div class="calendar-actions">
          <p>Para ver a agenda completa e gerenciar agendamentos:</p>
          <button class="btn btn-outline" id="btn-full-calendar">
            <i data-lucide="external-link"></i>
            Abrir Calendário Completo
          </button>
        </div>
      </div>
    `

    this.setupAppointmentsEventListeners()
  }

  setupAppointmentsEventListeners() {
    const btnNewAppointment = this.element.querySelector('#btn-new-appointment')
    const btnBackOverview = this.element.querySelector('#btn-back-overview-appointments')
    const btnFullCalendar = this.element.querySelector('#btn-full-calendar')

    if (btnNewAppointment) {
      btnNewAppointment.addEventListener('click', () => {
        router.navigateTo(ROUTES.APPOINTMENTS)
      })
    }

    if (btnBackOverview) {
      btnBackOverview.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'overview' }
        }))
      })
    }

    if (btnFullCalendar) {
      btnFullCalendar.addEventListener('click', () => {
        router.navigateTo(ROUTES.APPOINTMENTS)
      })
    }
  }

  renderAllClientsSection() {
    // Verificar se os dados do dashboard estão carregados
    if (!this.dashboardData || !this.dashboardData.stats) {
      this.element.innerHTML = `
        <div class="dashboard-header">
          <h2 class="dashboard-title">Todos os Pacientes</h2>
          <p class="dashboard-subtitle">Carregando dados...</p>
        </div>
        <div class="loading-spinner"></div>
      `
      return
    }

    this.element.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Todos os Pacientes</h2>
        <p class="dashboard-subtitle">Lista completa de clientes</p>
      </div>

      <div class="all-clients-section">
        <div class="section-actions">
          <button class="btn btn-primary" id="btn-new-client-all">
            <i data-lucide="user-plus"></i>
            Novo Cliente
          </button>
          <button class="btn btn-secondary" id="btn-back-overview-all">
            <i data-lucide="arrow-left"></i>
            Voltar ao Dashboard
          </button>
        </div>

        <div class="clients-stats">
          <div class="stat-card">
            <h3>${this.dashboardData.stats.activeClients}</h3>
            <p>Total de Clientes</p>
          </div>
          <div class="stat-card">
            <h3>0</h3>
            <p>Clientes Ativos</p>
          </div>
          <div class="stat-card">
            <h3>0</h3>
            <p>Novos Este Mês</p>
          </div>
        </div>

        <div class="clients-actions">
          <p>Para gerenciar clientes, utilize as funcionalidades completas:</p>
          <button class="btn btn-outline" id="btn-open-clients-list">
            <i data-lucide="external-link"></i>
            Abrir Lista Completa
          </button>
        </div>
      </div>
    `

    this.setupAllClientsEventListeners()
  }

  setupAllClientsEventListeners() {
    const btnNewClient = this.element.querySelector('#btn-new-client-all')
    const btnBackOverview = this.element.querySelector('#btn-back-overview-all')
    const btnOpenClientsList = this.element.querySelector('#btn-open-clients-list')

    if (btnNewClient) {
      btnNewClient.addEventListener('click', () => {
        router.navigateTo(ROUTES.CLIENTS)
      })
    }

    if (btnBackOverview) {
      btnBackOverview.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'overview' }
        }))
      })
    }

    if (btnOpenClientsList) {
      btnOpenClientsList.addEventListener('click', () => {
        router.navigateTo(ROUTES.ALL_CLIENTS)
      })
    }
  }

  renderReportsSection() {
    // Verificar se os dados do dashboard estão carregados
    if (!this.dashboardData || !this.dashboardData.stats) {
      this.element.innerHTML = `
        <div class="dashboard-header">
          <h2 class="dashboard-title">Relatórios de Clientes</h2>
          <p class="dashboard-subtitle">Carregando dados...</p>
        </div>
        <div class="loading-spinner"></div>
      `
      return
    }

    this.element.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Relatórios de Clientes</h2>
        <p class="dashboard-subtitle">Gere e gerencie relatórios</p>
      </div>

      <div class="reports-section">
        <div class="section-actions">
          <button class="btn btn-primary" disabled>
            <i data-lucide="file-plus"></i>
            Novo Relatório
          </button>
          <button class="btn btn-secondary" id="btn-back-overview-reports">
            <i data-lucide="arrow-left"></i>
            Voltar ao Dashboard
          </button>
        </div>

        <div class="reports-stats">
          <div class="stat-card">
            <h3>${this.dashboardData.stats.pendingReports}</h3>
            <p>Relatórios Pendentes</p>
          </div>
          <div class="stat-card">
            <h3>0</h3>
            <p>Finalizados Este Mês</p>
          </div>
        </div>

        <div class="reports-info">
          <p>Módulo de relatórios em desenvolvimento</p>
          <p>Em breve você poderá gerar relatórios detalhados dos clientes</p>
        </div>
      </div>
    `

    this.setupReportsEventListeners()
  }

  setupReportsEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-reports')

    if (btnBackOverview) {
      btnBackOverview.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'overview' }
        }))
      })
    }
  }

  renderDocumentsSection() {
    this.element.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Laudos</h2>
        <p class="dashboard-subtitle">Gerencie laudos e documentos</p>
      </div>

      <div class="documents-section">
        <div class="section-actions">
          <button class="btn btn-primary" disabled>
            <i data-lucide="file-plus"></i>
            Novo Laudo
          </button>
          <button class="btn btn-secondary" id="btn-back-overview-documents">
            <i data-lucide="arrow-left"></i>
            Voltar ao Dashboard
          </button>
        </div>

        <div class="documents-info">
          <p>Módulo de laudos em desenvolvimento</p>
          <p>Em breve você poderá criar e gerenciar laudos neuropsicológicos</p>
        </div>
      </div>
    `

    this.setupDocumentsEventListeners()
  }

  setupDocumentsEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-documents')

    if (btnBackOverview) {
      btnBackOverview.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'overview' }
        }))
      })
    }
  }

  renderFinancialSection() {
    // Verificar se os dados do dashboard estão carregados
    if (!this.dashboardData || !this.dashboardData.stats) {
      this.element.innerHTML = `
        <div class="dashboard-header">
          <h2 class="dashboard-title">Controle Financeiro</h2>
          <p class="dashboard-subtitle">Carregando dados...</p>
        </div>
        <div class="loading-spinner"></div>
      `
      return
    }

    this.element.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Controle Financeiro</h2>
        <p class="dashboard-subtitle">Gerencie receitas e despesas</p>
      </div>

      <div class="financial-section">
        <div class="section-actions">
          <button class="btn btn-secondary" id="btn-back-overview-financial">
            <i data-lucide="arrow-left"></i>
            Voltar ao Dashboard
          </button>
        </div>

        <div class="financial-stats">
          <div class="stat-card">
            <h3>R$ ${this.dashboardData.stats.monthlyRevenue.toLocaleString('pt-BR')}</h3>
            <p>Receita Mensal</p>
          </div>
          <div class="stat-card">
            <h3>R$ 0</h3>
            <p>Despesas Mensais</p>
          </div>
          <div class="stat-card">
            <h3>R$ ${this.dashboardData.stats.monthlyRevenue.toLocaleString('pt-BR')}</h3>
            <p>Saldo Mensal</p>
          </div>
        </div>

        <div class="financial-form">
          <h3>Nova Transação</h3>
          <form id="financial-form">
            <div class="form-row">
              <div class="form-group">
                <label>Tipo</label>
                <select name="transaction_type" required>
                  <option value="">Selecione</option>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>
              <div class="form-group">
                <label>Categoria</label>
                <select name="category" required>
                  <option value="">Selecione</option>
                  <option value="Consulta">Consulta</option>
                  <option value="Avaliação">Avaliação</option>
                  <option value="Material">Material</option>
                  <option value="Aluguel">Aluguel</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Descrição</label>
                <input type="text" name="description" required>
              </div>
              <div class="form-group">
                <label>Valor</label>
                <input type="number" name="amount" step="0.01" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Forma de Pagamento</label>
                <select name="payment_method">
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select name="payment_status">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="clear-financial-form">Limpar</button>
              <button type="submit" class="btn btn-primary">Salvar Transação</button>
            </div>
          </form>
        </div>
      </div>
    `

    this.setupFinancialEventListeners()
  }

  setupFinancialEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-financial')
    const form = this.element.querySelector('#financial-form')
    const clearBtn = this.element.querySelector('#clear-financial-form')

    if (btnBackOverview) {
      btnBackOverview.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'overview' }
        }))
      })
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        this.saveTransaction(form)
      })
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        form.reset()
      })
    }
  }

  async saveTransaction(form) {
    try {
      const formData = new FormData(form)
      const transactionData = Object.fromEntries(formData)
      
      // Adicionar dados do usuário logado
      const currentUser = await authService.getCurrentUser()
      transactionData.created_by = currentUser.id
      
      const { error } = await supabase
        .from('financial_transactions')
        .insert([transactionData])

      if (error) throw error

      toast.success('Transação salva com sucesso!')
      form.reset()
      await this.loadDashboardData()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      toast.error('Erro ao salvar transação')
    }
  }

  renderInventorySection() {
    this.element.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Controle de Estoque</h2>
        <p class="dashboard-subtitle">Gerencie itens e materiais</p>
      </div>

      <div class="inventory-section">
        <div class="section-actions">
          <button class="btn btn-secondary" id="btn-back-overview-inventory">
            <i data-lucide="arrow-left"></i>
            Voltar ao Dashboard
          </button>
        </div>

        <div class="inventory-stats">
          <div class="stat-card">
            <h3>0</h3>
            <p>Total de Itens</p>
          </div>
          <div class="stat-card">
            <h3>0</h3>
            <p>Estoque Baixo</p>
          </div>
          <div class="stat-card">
            <h3>R$ 0</h3>
            <p>Valor Total</p>
          </div>
        </div>

        <div class="inventory-form">
          <h3>Novo Item de Estoque</h3>
          <form id="inventory-form">
            <div class="form-row">
              <div class="form-group">
                <label>Nome do Item</label>
                <input type="text" name="name" required>
              </div>
              <div class="form-group">
                <label>Categoria</label>
                <select name="category" required>
                  <option value="">Selecione</option>
                  <option value="Material de Escritório">Material de Escritório</option>
                  <option value="Material Clínico">Material Clínico</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Limpeza">Limpeza</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Descrição</label>
                <input type="text" name="description">
              </div>
              <div class="form-group">
                <label>Quantidade</label>
                <input type="number" name="quantity" required min="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Estoque Mínimo</label>
                <input type="number" name="minimum_stock" min="0" value="0">
              </div>
              <div class="form-group">
                <label>Preço Unitário</label>
                <input type="number" name="unit_price" step="0.01" min="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Fornecedor</label>
                <input type="text" name="supplier">
              </div>
              <div class="form-group">
                <label>Localização</label>
                <input type="text" name="location">
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="clear-inventory-form">Limpar</button>
              <button type="submit" class="btn btn-primary">Salvar Item</button>
            </div>
          </form>
        </div>
      </div>
    `

    this.setupInventoryEventListeners()
  }

  setupInventoryEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-inventory')
    const form = this.element.querySelector('#inventory-form')
    const clearBtn = this.element.querySelector('#clear-inventory-form')

    if (btnBackOverview) {
      btnBackOverview.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'overview' }
        }))
      })
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        this.saveInventoryItem(form)
      })
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        form.reset()
      })
    }
  }

  async saveInventoryItem(form) {
    try {
      const formData = new FormData(form)
      const itemData = Object.fromEntries(formData)
      
      // Adicionar dados do usuário logado
      const currentUser = await authService.getCurrentUser()
      itemData.created_by = currentUser.id
      
      const { error } = await supabase
        .from('inventory_items')
        .insert([itemData])

      if (error) throw error

      toast.success('Item de estoque salvo com sucesso!')
      form.reset()
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      toast.error('Erro ao salvar item de estoque')
    }
  }

  renderInternsSection() {
    this.element.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">Estagiários</h2>
        <p class="dashboard-subtitle">Gerencie estagiários e supervisões</p>
      </div>

      <div class="interns-section">
        <div class="section-actions">
          <button class="btn btn-secondary" id="btn-back-overview-interns">
            <i data-lucide="arrow-left"></i>
            Voltar ao Dashboard
          </button>
        </div>

        <div class="interns-stats">
          <div class="stat-card">
            <h3>0</h3>
            <p>Estagiários Ativos</p>
          </div>
          <div class="stat-card">
            <h3>0</h3>
            <p>Supervisões Esta Semana</p>
          </div>
        </div>

        <div class="supervision-form">
          <h3>Agendar Supervisão</h3>
          <form id="supervision-form">
            <div class="form-row">
              <div class="form-group">
                <label>Estagiário</label>
                <select name="intern_id" id="intern-select" required>
                  <option value="">Selecione um estagiário</option>
                </select>
              </div>
              <div class="form-group">
                <label>Supervisor</label>
                <select name="supervisor_id" id="supervisor-select" required>
                  <option value="">Selecione um supervisor</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Data da Supervisão</label>
                <input type="date" name="session_date" required>
              </div>
              <div class="form-group">
                <label>Horário</label>
                <input type="time" name="session_time" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Duração (minutos)</label>
                <input type="number" name="duration_minutes" value="60" min="15" max="240">
              </div>
              <div class="form-group">
                <label>Status</label>
                <select name="status">
                  <option value="agendado">Agendado</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Tópicos a Discutir</label>
              <textarea name="topics" rows="3" placeholder="Casos, dúvidas, objetivos da supervisão..."></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="clear-supervision-form">Limpar</button>
              <button type="submit" class="btn btn-primary">Agendar Supervisão</button>
            </div>
          </form>
        </div>
      </div>
    `

    this.setupInternsEventListeners()
  }

  async setupInternsEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-interns')
    const form = this.element.querySelector('#supervision-form')
    const clearBtn = this.element.querySelector('#clear-supervision-form')

    if (btnBackOverview) {
      btnBackOverview.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'overview' }
        }))
      })
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        this.saveSupervision(form)
      })
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        form.reset()
      })
    }

    // Carregar supervisores (usuários com role coordinator/staff)
    await this.loadSupervisors()
  }

  async loadSupervisors() {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, name, role')
        .in('role', ['coordinator', 'staff'])

      if (error) throw error

      const supervisorSelect = this.element.querySelector('#supervisor-select')
      if (supervisorSelect && users) {
        supervisorSelect.innerHTML = '<option value="">Selecione um supervisor</option>' +
          users.map(user => `<option value="${user.id}">${user.name} (${user.role})</option>`).join('')
      }

      // Para estagiários, seria necessário ter dados na tabela user_profiles
      const internSelect = this.element.querySelector('#intern-select')
      if (internSelect) {
        internSelect.innerHTML = '<option value="">Selecione um estagiário</option><option value="intern1">Estagiário de Exemplo</option>'
      }
    } catch (error) {
      console.error('Erro ao carregar supervisores:', error)
    }
  }

  async saveSupervision(form) {
    try {
      const formData = new FormData(form)
      const supervisionData = Object.fromEntries(formData)
      
      // Adicionar dados do usuário logado
      const currentUser = await authService.getCurrentUser()
      supervisionData.created_by = currentUser.id
      
      const { error } = await supabase
        .from('supervision_sessions')
        .insert([supervisionData])

      if (error) throw error

      toast.success('Supervisão agendada com sucesso!')
      form.reset()
    } catch (error) {
      console.error('Erro ao agendar supervisão:', error)
      toast.error('Erro ao agendar supervisão')
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 