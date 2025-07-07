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
        todayAppointments: todayAppointments, // Usar dados já formatados do serviço
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
      case 'colaboradores':
        this.renderColaboradoresSection()
        break
      case 'prontuario':
        this.renderProntuarioSection()
        break
      case 'meus-clientes':
        this.renderMeusClientesSection()
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
        <div class="dashboard-section agenda-section">
          <h3>
            <i data-lucide="calendar-days"></i>
            Agenda do Dia
          </h3>
          
          <div class="agenda-container">
            <div class="mini-calendar">
              <div class="calendar-header">
                <button class="calendar-nav" id="prevMonth">
                  <i data-lucide="chevron-left"></i>
                </button>
                <h4 id="currentMonth">${this.getCurrentMonthName()}</h4>
                <button class="calendar-nav" id="nextMonth">
                  <i data-lucide="chevron-right"></i>
                </button>
              </div>
              
              <div class="calendar-grid">
                <div class="calendar-weekdays">
                  <span>Dom</span>
                  <span>Seg</span>
                  <span>Ter</span>
                  <span>Qua</span>
                  <span>Qui</span>
                  <span>Sex</span>
                  <span>Sáb</span>
                </div>
                <div class="calendar-days" id="calendarDays">
                  ${this.generateCalendarDays()}
                </div>
              </div>
            </div>
            
            <div class="today-appointments">
              <div class="appointments-header">
                <h4>
                  <i data-lucide="clock"></i>
                  Hoje, ${new Date().toLocaleDateString('pt-BR', { 
                    day: 'numeric', 
                    month: 'long',
                    weekday: 'long'
                  })}
                </h4>
                <button class="btn btn-outline btn-sm" id="addAppointment">
                  <i data-lucide="plus"></i>
                  Agendar
                </button>
              </div>
              
              <div class="appointments-list">
                ${todayAppointments.length > 0 ? 
                  todayAppointments.map(appointment => `
                    <div class="appointment-card modern">
                      <div class="appointment-time">
                        <i data-lucide="clock"></i>
                        ${appointment.time}
                      </div>
                      <div class="appointment-info">
                        <h5>${appointment.client_name}</h5>
                        <p>${appointment.type}</p>
                      </div>
                      <div class="appointment-status status-${appointment.status}">
                        ${appointment.status}
                      </div>
                    </div>
                  `).join('') : 
                  `<div class="no-appointments">
                    <i data-lucide="calendar-x"></i>
                    <p>Nenhum agendamento para hoje</p>
                    <small>Aproveite para organizar sua agenda!</small>
                  </div>`
                }
              </div>
            </div>
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
    // Verificar se os dados do dashboard estão carregados
    if (!this.dashboardData || !this.dashboardData.stats) {
      this.element.innerHTML = `
        <div class="dashboard-header">
          <h2 class="dashboard-title">Cadastro de Clientes</h2>
          <p class="dashboard-subtitle">Carregando dados...</p>
        </div>
        <div class="loading-spinner"></div>
      `
      return
    }

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
          <h3>Gerenciar Clientes</h3>
          <p>Cadastre novos clientes ou visualize todos os registros</p>
          
          <div class="clients-actions">
            <button class="btn btn-primary" id="btn-new-client-direct">
              <i data-lucide="user-plus"></i>
              Cadastrar Cliente
            </button>
            <button class="btn btn-outline" id="btn-view-all-clients">
              <i data-lucide="users"></i>
              Ver Todos os Clientes
            </button>
          </div>
        </div>
      </div>
    `

    this.setupClientsEventListeners()
  }

  setupClientsEventListeners() {
    const btnNewClient = this.element.querySelector('#btn-new-client')
    const btnNewClientDirect = this.element.querySelector('#btn-new-client-direct')
    const btnBackOverview = this.element.querySelector('#btn-back-overview')
    const btnViewAllClients = this.element.querySelector('#btn-view-all-clients')

    if (btnNewClient) {
      btnNewClient.addEventListener('click', () => {
        router.navigateTo(ROUTES.CLIENTS)
      })
    }

    if (btnNewClientDirect) {
      btnNewClientDirect.addEventListener('click', () => {
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
        router.navigateTo(ROUTES.ALL_CLIENTS)
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
                <div class="appointment-card" data-appointment-id="${appointment.id}">
                  <div class="appointment-time">${appointment.time}</div>
                  <div class="appointment-info">
                    <h4>${appointment.client_name}</h4>
                    <p>${appointment.type}</p>
                    ${appointment.client_id ? `<small class="client-id">ID: ${appointment.client_id}</small>` : ''}
                  </div>
                  <div class="appointment-status status-${appointment.status}">
                    ${appointment.status}
                  </div>
                  <div class="appointment-actions">
                    ${authService.isCoordinator() ? `
                      <button class="btn btn-sm btn-outline appointment-edit-btn" data-appointment-id="${appointment.id}" title="Editar Agendamento">
                        <i data-lucide="edit-2"></i>
                        Editar
                      </button>
                      ${appointment.status !== 'confirmado' ? `
                        <button class="btn btn-sm btn-success appointment-confirm-btn" data-appointment-id="${appointment.id}" title="Confirmar Agendamento">
                          <i data-lucide="check"></i>
                          Confirmar
                        </button>
                      ` : `
                        <button class="btn btn-sm btn-success" disabled title="Já confirmado">
                          <i data-lucide="check-circle"></i>
                          Confirmado
                        </button>
                      `}
                      <button class="btn btn-sm btn-danger appointment-delete-btn" data-appointment-id="${appointment.id}" title="Deletar Agendamento">
                        <i data-lucide="trash-2"></i>
                        Deletar
                      </button>
                    ` : `
                      <span class="no-permissions">Apenas coordenadores podem gerenciar agendamentos</span>
                    `}
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

      <!-- Modal de Confirmação para Deletar -->
      <div class="modal" id="delete-appointment-modal" style="display: none;">
        <div class="modal-content">
          <h3>Confirmar Exclusão</h3>
          <p>Tem certeza que deseja deletar este agendamento? Esta ação não pode ser desfeita.</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="cancel-delete-btn">
              Cancelar
            </button>
            <button class="btn btn-danger" id="confirm-delete-btn">
              Deletar
            </button>
          </div>
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

    // Event listeners para os botões de ação dos agendamentos
    const editButtons = this.element.querySelectorAll('.appointment-edit-btn')
    const confirmButtons = this.element.querySelectorAll('.appointment-confirm-btn')
    const deleteButtons = this.element.querySelectorAll('.appointment-delete-btn')

    // Botões de Editar
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const appointmentId = e.target.closest('.appointment-edit-btn').dataset.appointmentId
        this.editAppointment(appointmentId)
      })
    })

    // Botões de Confirmar
    confirmButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const appointmentId = e.target.closest('.appointment-confirm-btn').dataset.appointmentId
        this.confirmAppointment(appointmentId)
      })
    })

    // Botões de Deletar
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const appointmentId = e.target.closest('.appointment-delete-btn').dataset.appointmentId
        this.showDeleteConfirmModal(appointmentId)
      })
    })

    // Modal de confirmação de deletar
    const modal = this.element.querySelector('#delete-appointment-modal')
    const cancelDeleteBtn = this.element.querySelector('#cancel-delete-btn')
    const confirmDeleteBtn = this.element.querySelector('#confirm-delete-btn')

    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', () => {
        modal.style.display = 'none'
        this.appointmentToDelete = null
      })
    }

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        if (this.appointmentToDelete) {
          this.deleteAppointment(this.appointmentToDelete)
        }
      })
    }

    // Fechar modal ao clicar fora
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none'
          this.appointmentToDelete = null
        }
      })
    }
  }

  // Método para editar agendamento
  editAppointment(appointmentId) {
    // Redirecionar para a página de agendamentos com o ID para edição
    router.navigateTo(`${ROUTES.APPOINTMENTS}?edit=${appointmentId}`)
  }

  // Método para confirmar agendamento
  async confirmAppointment(appointmentId) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmado' })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Agendamento confirmado com sucesso!')
      
      // Recarregar dados do dashboard
      await this.loadDashboardData()
      this.renderAppointmentsSection()
      
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error)
      toast.error('Erro ao confirmar agendamento')
    }
  }

  // Método para mostrar modal de confirmação de deletar
  showDeleteConfirmModal(appointmentId) {
    this.appointmentToDelete = appointmentId
    const modal = this.element.querySelector('#delete-appointment-modal')
    modal.style.display = 'flex'
  }

  // Método para deletar agendamento
  async deleteAppointment(appointmentId) {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Agendamento deletado com sucesso!')
      
      // Fechar modal
      const modal = this.element.querySelector('#delete-appointment-modal')
      modal.style.display = 'none'
      this.appointmentToDelete = null
      
      // Recarregar dados do dashboard
      await this.loadDashboardData()
      this.renderAppointmentsSection()
      
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error)
      toast.error('Erro ao deletar agendamento')
    }
  }

  renderAllClientsSection() {
    // Navegar diretamente para a página de todos os clientes
    // Evita confusão de navegação
    router.navigateTo(ROUTES.ALL_CLIENTS)
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
    console.log('🔧 DEBUG: setupDocumentsEventListeners chamado')
    
    const btnBackOverview = this.element.querySelector('#btn-back-overview-documents')
    const form = this.element.querySelector('#reports-form')
    const clearBtn = this.element.querySelector('#clear-reports-form')
    const tabForm = this.element.querySelector('#tab-reports-form')
    const tabList = this.element.querySelector('#tab-reports-list')

    console.log('🔧 DEBUG: Elementos encontrados:', {
      btnBackOverview: !!btnBackOverview,
      form: !!form,
      clearBtn: !!clearBtn,
      tabForm: !!tabForm,
      tabList: !!tabList
    })

    if (btnBackOverview) {
      btnBackOverview.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('dashboard-section-change', {
          detail: { section: 'overview' }
        }))
      })
    }

    if (form) {
      console.log('🔧 DEBUG: Adicionando event listener ao formulário')
      form.addEventListener('submit', (e) => {
        console.log('🔧 DEBUG: Formulário submetido!')
        e.preventDefault()
        this.saveReport(form)
      })
    } else {
      console.error('❌ DEBUG: Formulário #reports-form não encontrado!')
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
    console.log('🔧 DEBUG: saveReport chamado')
    try {
      const formData = new FormData(form)
      const reportData = Object.fromEntries(formData)
      console.log('🔧 DEBUG: Dados do formulário:', reportData)
      
      // Adicionar dados do usuário logado
      const currentUser = await authService.getCurrentUser()
      console.log('🔧 DEBUG: Usuário atual:', currentUser)
      reportData.created_by = currentUser.id
      
      console.log('🔧 DEBUG: Dados finais para inserir:', reportData)
      
      const { error } = await supabase
        .from('reports')
        .insert([reportData])

      if (error) {
        console.error('❌ DEBUG: Erro do Supabase:', error)
        throw error
      }

      console.log('✅ DEBUG: Laudo salvo com sucesso!')
      toast.success('Laudo salvo com sucesso!')
      form.reset()
      
      // Se estiver na aba de listagem, recarregar os laudos
      const tabList = this.element.querySelector('#tab-reports-list')
      if (tabList && tabList.classList.contains('active')) {
        this.loadReports()
      }
    } catch (error) {
      console.error('❌ DEBUG: Erro ao salvar laudo:', error)
      toast.error('Erro ao salvar laudo: ' + error.message)
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
                <label>Emitido por *</label>
                <select name="issued_by" id="issued-by-select" required>
                  <option value="">Selecione um colaborador</option>
                </select>
              </div>
              <div class="form-group">
                <label>Fornecedor</label>
                <input type="text" name="supplier">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Localização</label>
                <input type="text" name="location">
              </div>
              <div class="form-group">
                <!-- Campo vazio para manter layout -->
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
    this.loadCollaboradoresForInventory()
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

  async loadCollaboradoresForInventory() {
    try {
      const { data: colaboradores, error } = await supabase
        .from('colaboradores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error

      const issuedBySelect = this.element.querySelector('#issued-by-select')
      if (issuedBySelect && colaboradores) {
        issuedBySelect.innerHTML = '<option value="">Selecione um colaborador</option>'
        colaboradores.forEach(colaborador => {
          issuedBySelect.innerHTML += `<option value="${colaborador.id}">${colaborador.nome}</option>`
        })
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores para estoque:', error)
      // Se der erro, pelo menos mostra uma mensagem orientativa
      const issuedBySelect = this.element.querySelector('#issued-by-select')
      if (issuedBySelect) {
        issuedBySelect.innerHTML = '<option value="">Erro ao carregar colaboradores</option>'
      }
    }
  }

  async saveInventoryItem(form) {
    try {
      const formData = new FormData(form)
      const itemData = Object.fromEntries(formData)
      
      // Validação obrigatória do campo "Emitido por"
      if (!itemData.issued_by) {
        toast.error('Por favor, selecione quem está emitindo este item no estoque')
        return
      }
      
      // Adicionar dados do usuário logado
      const currentUser = await authService.getCurrentUser()
      itemData.created_by = currentUser.id
      
      const { error } = await supabase
        .from('inventory_items')
        .insert([itemData])

      if (error) throw error

      toast.success('Item de estoque salvo com sucesso!')
      form.reset()
      // Recarregar colaboradores após reset
      this.loadCollaboradoresForInventory()
      
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

  renderColaboradoresSection() {
    this.element.innerHTML = `
      <div class="section-header">
        <button class="btn btn-outline" id="btn-back-overview-colaboradores">
          <i data-lucide="arrow-left"></i>
          Voltar
        </button>
        <h2>Gestão de Colaboradores</h2>
        <p>Cadastre e gerencie colaboradores do sistema</p>
      </div>

      <div class="colaboradores-container">
        <div class="colaboradores-tabs">
          <button class="tab-btn active" id="tab-colaboradores-form">Cadastrar Colaborador</button>
          <button class="tab-btn" id="tab-colaboradores-list">Gerenciar Colaboradores</button>
        </div>

        <!-- SEÇÃO CADASTRO -->
        <div class="colaboradores-form-section" id="colaboradores-form-section">
          <div class="form-card">
            <h3>Cadastrar Novo Colaborador</h3>
            <form id="colaborador-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Nome Completo *</label>
                  <input type="text" name="nome" required placeholder="Digite o nome completo">
                </div>
                <div class="form-group">
                  <label>E-mail *</label>
                  <input type="email" name="email" required placeholder="email@exemplo.com">
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Telefone</label>
                  <input type="tel" name="telefone" placeholder="(11) 99999-9999">
                </div>
                <div class="form-group">
                  <label>Senha Temporária *</label>
                  <input type="password" name="senha" required placeholder="Mínimo 6 caracteres" minlength="6">
                </div>
              </div>

              <div class="form-group">
                <label>Cargo Inicial</label>
                <select name="cargo" disabled>
                  <option value="estagiario">Estagiário (padrão)</option>
                </select>
                <small>Novos colaboradores sempre começam como estagiários</small>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-outline" id="clear-colaborador-form">Limpar</button>
                <button type="submit" class="btn btn-primary">Cadastrar Colaborador</button>
              </div>
            </form>
          </div>
        </div>

        <!-- SEÇÃO LISTAGEM -->
        <div class="colaboradores-list-section" id="colaboradores-list-section" style="display: none;">
          <div class="listagem-header">
            <h3>Colaboradores Cadastrados</h3>
            <div class="filtros">
              <select id="filtro-cargo">
                <option value="">Todos os cargos</option>
                <option value="estagiario">Estagiários</option>
                <option value="funcionario">Funcionários</option>
                <option value="coordenador">Coordenadores</option>
              </select>
              <input type="text" id="busca-nome" placeholder="Buscar por nome..." class="search-input">
            </div>
          </div>

          <div class="colaboradores-stats">
            <div class="stat-card">
              <h4 id="total-colaboradores">0</h4>
              <p>Total</p>
            </div>
            <div class="stat-card">
              <h4 id="total-estagiarios">0</h4>
              <p>Estagiários</p>
            </div>
            <div class="stat-card">
              <h4 id="total-funcionarios">0</h4>
              <p>Funcionários</p>
            </div>
            <div class="stat-card">
              <h4 id="total-coordenadores">0</h4>
              <p>Coordenadores</p>
            </div>
          </div>

          <div class="colaboradores-lista" id="colaboradores-lista">
            <div class="loading-spinner">Carregando colaboradores...</div>
          </div>
        </div>
      </div>
    `

    this.setupColaboradoresEventListeners()
  }

  async setupColaboradoresEventListeners() {
    const btnBackOverview = this.element.querySelector('#btn-back-overview-colaboradores')
    const form = this.element.querySelector('#colaborador-form')
    const clearBtn = this.element.querySelector('#clear-colaborador-form')
    const tabForm = this.element.querySelector('#tab-colaboradores-form')
    const tabList = this.element.querySelector('#tab-colaboradores-list')
    const filtroCargo = this.element.querySelector('#filtro-cargo')
    const buscaNome = this.element.querySelector('#busca-nome')

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
        this.saveColaborador(form)
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
        this.switchColaboradoresTab('form')
      })
    }

    if (tabList) {
      tabList.addEventListener('click', () => {
        this.switchColaboradoresTab('list')
        this.loadColaboradores()
      })
    }

    // Filtros
    if (filtroCargo) {
      filtroCargo.addEventListener('change', () => this.filterColaboradores())
    }

    if (buscaNome) {
      buscaNome.addEventListener('input', () => this.filterColaboradores())
    }
  }

  switchColaboradoresTab(tab) {
    const formSection = this.element.querySelector('#colaboradores-form-section')
    const listSection = this.element.querySelector('#colaboradores-list-section')
    const tabForm = this.element.querySelector('#tab-colaboradores-form')
    const tabList = this.element.querySelector('#tab-colaboradores-list')

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

  async loadColaboradores() {
    try {
      const { data: colaboradores, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('ativo', true)
        .order('data_cadastro', { ascending: false })

      if (error) throw error

      this.renderColaboradoresList(colaboradores || [])
      this.updateColaboradoresStats(colaboradores || [])

    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
      const lista = this.element.querySelector('#colaboradores-lista')
      if (lista) {
        lista.innerHTML = '<p class="error">Erro ao carregar colaboradores</p>'
      }
    }
  }

  renderColaboradoresList(colaboradores) {
    const lista = this.element.querySelector('#colaboradores-lista')
    if (!lista) return

    if (colaboradores.length === 0) {
      lista.innerHTML = '<p class="no-data">Nenhum colaborador encontrado</p>'
      return
    }

    const currentUser = authService.getCurrentUser()
    const currentUserId = currentUser?.id

    lista.innerHTML = colaboradores.map(colaborador => `
      <div class="colaborador-card" data-cargo="${colaborador.cargo}" data-nome="${colaborador.nome.toLowerCase()}">
        <div class="colaborador-info">
          <div class="colaborador-header">
            <h4>${colaborador.nome}</h4>
            <span class="cargo-badge cargo-${colaborador.cargo}">${this.formatCargo(colaborador.cargo)}</span>
          </div>
          <div class="colaborador-details">
            <p><strong>E-mail:</strong> ${colaborador.email}</p>
            <p><strong>Telefone:</strong> ${colaborador.telefone || 'Não informado'}</p>
            <p><strong>Cadastrado em:</strong> ${new Date(colaborador.data_cadastro).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        
        <div class="colaborador-actions">
          ${colaborador.user_id !== currentUserId ? `
            <div class="promocao-container">
              <label>Promover para:</label>
              <select class="promocao-select" data-colaborador-id="${colaborador.id}">
                <option value="">Selecione...</option>
                ${colaborador.cargo !== 'funcionario' ? '<option value="funcionario">Funcionário</option>' : ''}
                ${colaborador.cargo !== 'coordenador' ? '<option value="coordenador">Coordenador</option>' : ''}
                ${colaborador.cargo !== 'estagiario' ? '<option value="estagiario">Estagiário</option>' : ''}
              </select>
              <button class="btn btn-sm btn-primary promocao-btn" data-colaborador-id="${colaborador.id}">
                <i data-lucide="arrow-up"></i>
                Promover
              </button>
            </div>
          ` : `
            <span class="self-indicator">Você</span>
          `}
        </div>
      </div>
    `).join('')

    // Adicionar event listeners para promoção
    this.setupPromocaoEventListeners()
  }

  setupPromocaoEventListeners() {
    const promocaoBtns = this.element.querySelectorAll('.promocao-btn')
    
    promocaoBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const colaboradorId = btn.dataset.colaboradorId
        const select = this.element.querySelector(`.promocao-select[data-colaborador-id="${colaboradorId}"]`)
        const novoCargo = select.value

        if (!novoCargo) {
          toast.error('Selecione um cargo para promover')
          return
        }

        await this.promoverColaborador(colaboradorId, novoCargo)
      })
    })
  }

  async promoverColaborador(colaboradorId, novoCargo) {
    try {
      // Usar a função SQL personalizada
      const { data, error } = await supabase
        .rpc('promover_colaborador', {
          colaborador_id: colaboradorId,
          novo_cargo: novoCargo
        })

      if (error) throw error

      if (data.success) {
        toast.success(`${data.colaborador} promovido para ${this.formatCargo(data.novo_cargo)} com sucesso!`)
        await this.loadColaboradores()
      } else {
        toast.error(data.error)
      }

    } catch (error) {
      console.error('Erro ao promover colaborador:', error)
      toast.error('Erro ao promover colaborador')
    }
  }

  formatCargo(cargo) {
    const cargos = {
      estagiario: 'Estagiário',
      funcionario: 'Funcionário',
      coordenador: 'Coordenador'
    }
    return cargos[cargo] || cargo
  }

  filterColaboradores() {
    const filtroCargo = this.element.querySelector('#filtro-cargo')?.value
    const buscaNome = this.element.querySelector('#busca-nome')?.value.toLowerCase()
    const cards = this.element.querySelectorAll('.colaborador-card')

    cards.forEach(card => {
      const cargo = card.dataset.cargo
      const nome = card.dataset.nome

      const matchCargo = !filtroCargo || cargo === filtroCargo
      const matchNome = !buscaNome || nome.includes(buscaNome)

      card.style.display = matchCargo && matchNome ? 'block' : 'none'
    })
  }

  updateColaboradoresStats(colaboradores) {
    const stats = {
      total: colaboradores.length,
      estagiarios: colaboradores.filter(c => c.cargo === 'estagiario').length,
      funcionarios: colaboradores.filter(c => c.cargo === 'funcionario').length,
      coordenadores: colaboradores.filter(c => c.cargo === 'coordenador').length
    }

    const totalEl = this.element.querySelector('#total-colaboradores')
    const estagiarios = this.element.querySelector('#total-estagiarios')
    const funcionarios = this.element.querySelector('#total-funcionarios')
    const coordenadores = this.element.querySelector('#total-coordenadores')

    if (totalEl) totalEl.textContent = stats.total
    if (estagiarios) estagiarios.textContent = stats.estagiarios
    if (funcionarios) funcionarios.textContent = stats.funcionarios
    if (coordenadores) coordenadores.textContent = stats.coordenadores
  }

  async saveColaborador(form) {
    try {
      const formData = new FormData(form)
      const dados = Object.fromEntries(formData)

      // Validações
      if (!dados.nome || !dados.email || !dados.senha) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      if (dados.senha.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres')
        return
      }

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dados.email,
        password: dados.senha,
        options: {
          data: {
            name: dados.nome
          }
        }
      })

      if (authError) {
        console.error('Erro auth:', authError)
        if (authError.message.includes('already registered')) {
          toast.error('Este e-mail já está cadastrado')
        } else {
          toast.error('Erro ao criar usuário: ' + authError.message)
        }
        return
      }

      // 2. Salvar dados na tabela colaboradores
      const { error: dbError } = await supabase
        .from('colaboradores')
        .insert([{
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone || null,
          cargo: 'estagiario',
          user_id: authData.user.id,
          ativo: true
        }])

      if (dbError) {
        console.error('Erro DB:', dbError)
        toast.error('Erro ao salvar dados do colaborador')
        return
      }

      toast.success(`Colaborador ${dados.nome} cadastrado com sucesso!`)
      form.reset()

      // Atualizar listagem se estiver visível
      const listSection = this.element.querySelector('#colaboradores-list-section')
      if (listSection && listSection.style.display !== 'none') {
        await this.loadColaboradores()
      }

    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error)
      toast.error('Erro inesperado ao cadastrar colaborador')
    }
  }

  getCurrentMonthName() {
    const now = new Date()
    return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  generateCalendarDays() {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const today = now.getDate()
    
    // Primeiro dia do mês
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    
    // Quantos dias tem o mês
    const daysInMonth = lastDay.getDate()
    
    // Que dia da semana começa o mês (0 = domingo)
    const startDay = firstDay.getDay()
    
    let daysHTML = ''
    
    // Dias vazios do início
    for (let i = 0; i < startDay; i++) {
      daysHTML += '<span class="calendar-day empty"></span>'
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today
      const hasAppointments = false // TODO: Implementar verificação de agendamentos
      
      daysHTML += `
        <span class="calendar-day ${isToday ? 'today' : ''} ${hasAppointments ? 'has-appointments' : ''}" 
              data-day="${day}">
          ${day}
        </span>
      `
    }
    
    return daysHTML
  }

  renderProntuarioSection() {
    // Redirecionar para a página dedicada do prontuário
    router.navigateTo(ROUTES.PRONTUARIO)
  }

  renderMeusClientesSection() {
    this.element.innerHTML = `
      <div class="section-header">
        <button class="btn btn-outline" id="btn-back-overview-meus-clientes">
          <i data-lucide="arrow-left"></i>
          Voltar
        </button>
        <h2>Meus Clientes</h2>
        <p>Visualize e gerencie apenas os clientes vinculados a você</p>
      </div>

      <div class="meus-clientes-container">
        <div class="quick-actions">
          <div class="action-card">
            <div class="action-icon">
              <i data-lucide="user-plus"></i>
            </div>
            <div class="action-content">
              <h3>Cadastrar Novo Cliente</h3>
              <p>Adicione um novo cliente ao seu atendimento</p>
              <button class="btn btn-primary" onclick="router.navigateTo('${ROUTES.CLIENTS}')">
                <i data-lucide="user-plus"></i>
                Cadastrar Cliente
              </button>
            </div>
          </div>

          <div class="action-card">
            <div class="action-icon">
              <i data-lucide="calendar-plus"></i>
            </div>
            <div class="action-content">
              <h3>Agendar Consulta</h3>
              <p>Agende consultas para seus clientes</p>
              <button class="btn btn-primary" onclick="router.navigateTo('${ROUTES.APPOINTMENTS}')">
                <i data-lucide="calendar-plus"></i>
                Agendar
              </button>
            </div>
          </div>

          <div class="action-card">
            <div class="action-icon">
              <i data-lucide="user-heart"></i>
            </div>
            <div class="action-content">
              <h3>Ver Meus Clientes</h3>
              <p>Visualize todos os clientes vinculados a você</p>
              <button class="btn btn-primary" id="btn-view-meus-clientes">
                <i data-lucide="user-heart"></i>
                Ver Clientes
              </button>
            </div>
          </div>
        </div>

        <div class="info-estagiario">
          <div class="info-card">
            <h3>Como Funciona o Sistema para Estagiários</h3>
            <div class="permissions-info">
              <div class="permission-item">
                <i data-lucide="check" class="permission-icon allowed"></i>
                <span>Cadastrar novos clientes</span>
              </div>
              <div class="permission-item">
                <i data-lucide="check" class="permission-icon allowed"></i>
                <span>Agendar consultas para seus clientes</span>
              </div>
              <div class="permission-item">
                <i data-lucide="check" class="permission-icon allowed"></i>
                <span>Ver e editar apenas seus clientes</span>
              </div>
              <div class="permission-item">
                <i data-lucide="x" class="permission-icon denied"></i>
                <span>Ver clientes de outros estagiários</span>
              </div>
              <div class="permission-item">
                <i data-lucide="x" class="permission-icon denied"></i>
                <span>Acessar financeiro ou relatórios gerais</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // Adicionar event listeners
    const btnBack = this.element.querySelector('#btn-back-overview-meus-clientes')
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.currentSection = 'overview'
        this.renderContent()
      })
    }

    const btnViewMeusClientes = this.element.querySelector('#btn-view-meus-clientes')
    if (btnViewMeusClientes) {
      btnViewMeusClientes.addEventListener('click', () => {
        // Criar instância da página MeusClientesPage
        import('../pages/MeusClientesPage.js').then(module => {
          const MeusClientesPage = module.default
          const page = new MeusClientesPage()
          const mainContent = document.querySelector('#main-content')
          if (mainContent) {
            mainContent.innerHTML = ''
            page.render(mainContent)
          }
        })
      })
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 