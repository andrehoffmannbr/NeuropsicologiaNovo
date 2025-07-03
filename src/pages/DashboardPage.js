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
          <button class="btn btn-secondary" id="btn-back-overview-documents">
            <i data-lucide="arrow-left"></i>
            Voltar ao Dashboard
          </button>
        </div>

        <div class="documents-tabs">
          <button class="tab-btn active" id="tab-reports-form">Novo Laudo</button>
          <button class="tab-btn" id="tab-reports-list">Laudos Criados</button>
        </div>

        <div class="reports-form" id="reports-form-section">
          <h3>Criar Novo Laudo</h3>
          <form id="reports-form">
            <div class="form-row">
              <div class="form-group">
                <label>Cliente</label>
                <select name="client_id" id="client-select" required>
                  <option value="">Selecione um cliente</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tipo de Laudo</label>
                <select name="report_type" required>
                  <option value="">Selecione</option>
                  <option value="avaliacao_neuropsicologica">Avaliação Neuropsicológica</option>
                  <option value="relatorio_psicologico">Relatório Psicológico</option>
                  <option value="parecer_tecnico">Parecer Técnico</option>
                  <option value="laudo_pericial">Laudo Pericial</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Data do Laudo</label>
                <input type="date" name="report_date" required>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select name="status">
                  <option value="rascunho">Rascunho</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="entregue">Entregue</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Queixa Principal</label>
              <textarea name="main_complaint" rows="3" placeholder="Descreva a queixa principal do cliente..."></textarea>
            </div>
            <div class="form-group">
              <label>Histórico</label>
              <textarea name="history" rows="3" placeholder="Histórico clínico, familiar e social..."></textarea>
            </div>
            <div class="form-group">
              <label>Avaliação/Observações</label>
              <textarea name="assessment" rows="4" placeholder="Resultados da avaliação, observações comportamentais..."></textarea>
            </div>
            <div class="form-group">
              <label>Conclusão</label>
              <textarea name="conclusion" rows="3" placeholder="Conclusão diagnóstica e recomendações..."></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="clear-reports-form">Limpar</button>
              <button type="submit" class="btn btn-primary">Salvar Laudo</button>
            </div>
          </form>
        </div>

        <div class="reports-list" id="reports-list-section" style="display: none;">
          <h3>Laudos Criados</h3>
          <div class="reports-container" id="reports-container">
            <div class="loading-spinner">Carregando laudos...</div>
          </div>
        </div>
      </div>
    `

    this.setupDocumentsEventListeners()
  }

  setupDocumentsEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-documents')
    const form = this.element.querySelector('#reports-form')
    const clearBtn = this.element.querySelector('#clear-reports-form')
    const tabForm = this.element.querySelector('#tab-reports-form')
    const tabList = this.element.querySelector('#tab-reports-list')

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
        this.saveReport(form)
      })
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        form.reset()
      })
    }

    // Tabs navigation
    if (tabForm) {
      tabForm.addEventListener('click', () => {
        this.switchReportsTab('form')
      })
    }

    if (tabList) {
      tabList.addEventListener('click', () => {
        this.switchReportsTab('list')
        this.loadReports()
      })
    }

    // Carregar clientes para o select
    this.loadClientsForReports()
  }

  switchReportsTab(tab) {
    const formSection = this.element.querySelector('#reports-form-section')
    const listSection = this.element.querySelector('#reports-list-section')
    const tabForm = this.element.querySelector('#tab-reports-form')
    const tabList = this.element.querySelector('#tab-reports-list')

    if (tab === 'form') {
      formSection.style.display = 'block'
      listSection.style.display = 'none'
      tabForm.classList.add('active')
      tabList.classList.remove('active')
    } else {
      formSection.style.display = 'none'
      listSection.style.display = 'block'
      tabForm.classList.remove('active')
      tabList.classList.add('active')
    }
  }

  async loadClientsForReports() {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error

      const clientSelect = this.element.querySelector('#client-select')
      if (clientSelect && clients) {
        clientSelect.innerHTML = '<option value="">Selecione um cliente</option>' +
          clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('')
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  async loadReports() {
    try {
      const { data: reports, error } = await supabase
        .from('reports')
        .select(`
          *,
          clients (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const reportsContainer = this.element.querySelector('#reports-container')
      if (reports && reports.length > 0) {
        reportsContainer.innerHTML = reports.map(report => `
          <div class="report-card">
            <div class="report-header">
              <h4>${report.report_type.replace('_', ' ').toUpperCase()}</h4>
              <span class="status-badge status-${report.status}">${report.status}</span>
            </div>
            <div class="report-info">
              <p><strong>Cliente:</strong> ${report.clients?.name || 'Cliente não encontrado'}</p>
              <p><strong>Data:</strong> ${new Date(report.report_date).toLocaleDateString('pt-BR')}</p>
              <p><strong>Queixa:</strong> ${report.main_complaint || 'Não especificada'}</p>
              <p><strong>Criado em:</strong> ${new Date(report.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="report-actions">
              <button class="btn btn-sm btn-outline" onclick="this.viewReport('${report.id}')">Ver Detalhes</button>
            </div>
          </div>
        `).join('')
      } else {
        reportsContainer.innerHTML = '<p class="no-data">Nenhum laudo encontrado</p>'
      }
    } catch (error) {
      console.error('Erro ao carregar laudos:', error)
      const reportsContainer = this.element.querySelector('#reports-container')
      reportsContainer.innerHTML = '<p class="error">Erro ao carregar laudos</p>'
    }
  }

  async saveReport(form) {
    try {
      const formData = new FormData(form)
      const reportData = Object.fromEntries(formData)
      
      // Adicionar dados do usuário logado
      const currentUser = await authService.getCurrentUser()
      reportData.created_by = currentUser.id
      
      const { error } = await supabase
        .from('reports')
        .insert([reportData])

      if (error) throw error

      toast.success('Laudo salvo com sucesso!')
      form.reset()
      
      // Se estiver na aba de listagem, recarregar os laudos
      const tabList = this.element.querySelector('#tab-reports-list')
      if (tabList && tabList.classList.contains('active')) {
        this.loadReports()
      }
    } catch (error) {
      console.error('Erro ao salvar laudo:', error)
      toast.error('Erro ao salvar laudo')
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

        <div class="financial-tabs">
          <button class="tab-btn active" id="tab-form">Nova Transação</button>
          <button class="tab-btn" id="tab-list">Transações Recentes</button>
        </div>

        <div class="financial-form" id="financial-form-section">
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

        <div class="financial-list" id="financial-list-section" style="display: none;">
          <h3>Transações Recentes</h3>
          <div class="transactions-list" id="transactions-list">
            <div class="loading-spinner">Carregando transações...</div>
          </div>
        </div>
      </div>
    `

    this.setupFinancialEventListeners()
  }

  setupFinancialEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-financial')
    const form = this.element.querySelector('#financial-form')
    const clearBtn = this.element.querySelector('#clear-financial-form')
    const tabForm = this.element.querySelector('#tab-form')
    const tabList = this.element.querySelector('#tab-list')

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

    // Tabs navigation
    if (tabForm) {
      tabForm.addEventListener('click', () => {
        this.switchFinancialTab('form')
      })
    }

    if (tabList) {
      tabList.addEventListener('click', () => {
        this.switchFinancialTab('list')
        this.loadTransactions()
      })
    }
  }

  switchFinancialTab(tab) {
    const formSection = this.element.querySelector('#financial-form-section')
    const listSection = this.element.querySelector('#financial-list-section')
    const tabForm = this.element.querySelector('#tab-form')
    const tabList = this.element.querySelector('#tab-list')

    if (tab === 'form') {
      formSection.style.display = 'block'
      listSection.style.display = 'none'
      tabForm.classList.add('active')
      tabList.classList.remove('active')
    } else {
      formSection.style.display = 'none'
      listSection.style.display = 'block'
      tabForm.classList.remove('active')
      tabList.classList.add('active')
    }
  }

  async loadTransactions() {
    try {
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const transactionsList = this.element.querySelector('#transactions-list')
      if (transactions && transactions.length > 0) {
        transactionsList.innerHTML = transactions.map(transaction => `
          <div class="transaction-card">
            <div class="transaction-info">
              <h4>${transaction.description}</h4>
              <p><strong>Categoria:</strong> ${transaction.category}</p>
              <p><strong>Tipo:</strong> ${transaction.transaction_type}</p>
            </div>
            <div class="transaction-amount ${transaction.transaction_type}">
              ${transaction.transaction_type === 'receita' ? '+' : '-'} R$ ${parseFloat(transaction.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </div>
            <div class="transaction-status">
              <span class="status-badge status-${transaction.payment_status}">${transaction.payment_status}</span>
            </div>
            <div class="transaction-date">
              ${new Date(transaction.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        `).join('')
      } else {
        transactionsList.innerHTML = '<p class="no-data">Nenhuma transação encontrada</p>'
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      const transactionsList = this.element.querySelector('#transactions-list')
      transactionsList.innerHTML = '<p class="error">Erro ao carregar transações</p>'
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
      
      // Recarregar dados do dashboard
      await this.loadDashboardData()
      
      // Se estiver na aba de listagem, recarregar as transações
      const tabList = this.element.querySelector('#tab-list')
      if (tabList && tabList.classList.contains('active')) {
        this.loadTransactions()
      }
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

        <div class="inventory-tabs">
          <button class="tab-btn active" id="tab-inventory-form">Novo Item</button>
          <button class="tab-btn" id="tab-inventory-list">Itens do Estoque</button>
        </div>

        <div class="inventory-form" id="inventory-form-section">
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

        <div class="inventory-list" id="inventory-list-section" style="display: none;">
          <h3>Itens do Estoque</h3>
          <div class="items-list" id="items-list">
            <div class="loading-spinner">Carregando itens...</div>
          </div>
        </div>
      </div>
    `

    this.setupInventoryEventListeners()
  }

  setupInventoryEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-inventory')
    const form = this.element.querySelector('#inventory-form')
    const clearBtn = this.element.querySelector('#clear-inventory-form')
    const tabForm = this.element.querySelector('#tab-inventory-form')
    const tabList = this.element.querySelector('#tab-inventory-list')

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

    // Tabs navigation
    if (tabForm) {
      tabForm.addEventListener('click', () => {
        this.switchInventoryTab('form')
      })
    }

    if (tabList) {
      tabList.addEventListener('click', () => {
        this.switchInventoryTab('list')
        this.loadInventoryItems()
      })
    }
  }

  switchInventoryTab(tab) {
    const formSection = this.element.querySelector('#inventory-form-section')
    const listSection = this.element.querySelector('#inventory-list-section')
    const tabForm = this.element.querySelector('#tab-inventory-form')
    const tabList = this.element.querySelector('#tab-inventory-list')

    if (tab === 'form') {
      formSection.style.display = 'block'
      listSection.style.display = 'none'
      tabForm.classList.add('active')
      tabList.classList.remove('active')
    } else {
      formSection.style.display = 'none'
      listSection.style.display = 'block'
      tabForm.classList.remove('active')
      tabList.classList.add('active')
    }
  }

  async loadInventoryItems() {
    try {
      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const itemsList = this.element.querySelector('#items-list')
      if (items && items.length > 0) {
        itemsList.innerHTML = items.map(item => `
          <div class="item-card">
            <div class="item-info">
              <h4>${item.name}</h4>
              <p><strong>Categoria:</strong> ${item.category}</p>
              <p><strong>Descrição:</strong> ${item.description || 'Sem descrição'}</p>
              <p><strong>Localização:</strong> ${item.location || 'Não informada'}</p>
            </div>
            <div class="item-quantity">
              <span class="quantity ${item.quantity <= item.minimum_stock ? 'low-stock' : ''}">${item.quantity}</span>
              <small>unidades</small>
            </div>
            <div class="item-status">
              ${item.quantity <= item.minimum_stock ? 
                '<span class="status-badge status-warning">Estoque Baixo</span>' : 
                '<span class="status-badge status-success">OK</span>'
              }
            </div>
            <div class="item-price">
              ${item.unit_price ? `R$ ${parseFloat(item.unit_price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Sem preço'}
            </div>
          </div>
        `).join('')
      } else {
        itemsList.innerHTML = '<p class="no-data">Nenhum item encontrado no estoque</p>'
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
      const itemsList = this.element.querySelector('#items-list')
      itemsList.innerHTML = '<p class="error">Erro ao carregar itens do estoque</p>'
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
      
      // Se estiver na aba de listagem, recarregar os itens
      const tabList = this.element.querySelector('#tab-inventory-list')
      if (tabList && tabList.classList.contains('active')) {
        this.loadInventoryItems()
      }
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

        <div class="interns-tabs">
          <button class="tab-btn active" id="tab-supervision-form">Agendar Supervisão</button>
          <button class="tab-btn" id="tab-supervision-list">Supervisões</button>
        </div>

        <div class="supervision-form" id="supervision-form-section">
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

        <div class="supervision-list" id="supervision-list-section" style="display: none;">
          <h3>Supervisões Agendadas</h3>
          <div class="supervisions-list" id="supervisions-list">
            <div class="loading-spinner">Carregando supervisões...</div>
          </div>
        </div>
      </div>
    `

    this.setupInternsEventListeners()
  }

  async setupInternsEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-interns')
    const form = this.element.querySelector('#supervision-form')
    const clearBtn = this.element.querySelector('#clear-supervision-form')
    const tabForm = this.element.querySelector('#tab-supervision-form')
    const tabList = this.element.querySelector('#tab-supervision-list')

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

    // Tabs navigation
    if (tabForm) {
      tabForm.addEventListener('click', () => {
        this.switchInternsTab('form')
      })
    }

    if (tabList) {
      tabList.addEventListener('click', () => {
        this.switchInternsTab('list')
        this.loadSupervisions()
      })
    }

    // Carregar supervisores (usuários com role coordinator/staff)
    await this.loadSupervisors()
  }

  switchInternsTab(tab) {
    const formSection = this.element.querySelector('#supervision-form-section')
    const listSection = this.element.querySelector('#supervision-list-section')
    const tabForm = this.element.querySelector('#tab-supervision-form')
    const tabList = this.element.querySelector('#tab-supervision-list')

    if (tab === 'form') {
      formSection.style.display = 'block'
      listSection.style.display = 'none'
      tabForm.classList.add('active')
      tabList.classList.remove('active')
    } else {
      formSection.style.display = 'none'
      listSection.style.display = 'block'
      tabForm.classList.remove('active')
      tabList.classList.add('active')
    }
  }

  async loadSupervisions() {
    try {
      const { data: supervisions, error } = await supabase
        .from('supervision_sessions')
        .select('*')
        .order('session_date', { ascending: false })

      if (error) throw error

      const supervisionsList = this.element.querySelector('#supervisions-list')
      if (supervisions && supervisions.length > 0) {
        supervisionsList.innerHTML = supervisions.map(supervision => `
          <div class="supervision-card">
            <div class="supervision-info">
              <h4>Supervisão ${supervision.intern_id}</h4>
              <p><strong>Supervisor:</strong> ${supervision.supervisor_id}</p>
              <p><strong>Data:</strong> ${new Date(supervision.session_date).toLocaleDateString('pt-BR')}</p>
              <p><strong>Horário:</strong> ${supervision.session_time}</p>
              <p><strong>Duração:</strong> ${supervision.duration_minutes} minutos</p>
              <p><strong>Tópicos:</strong> ${supervision.topics || 'Não especificado'}</p>
            </div>
            <div class="supervision-status">
              <span class="status-badge status-${supervision.status}">${supervision.status}</span>
            </div>
          </div>
        `).join('')
      } else {
        supervisionsList.innerHTML = '<p class="no-data">Nenhuma supervisão agendada</p>'
      }
    } catch (error) {
      console.error('Erro ao carregar supervisões:', error)
      const supervisionsList = this.element.querySelector('#supervisions-list')
      supervisionsList.innerHTML = '<p class="error">Erro ao carregar supervisões</p>'
    }
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
      
      // Se estiver na aba de listagem, recarregar as supervisões
      const tabList = this.element.querySelector('#tab-supervision-list')
      if (tabList && tabList.classList.contains('active')) {
        this.loadSupervisions()
      }
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