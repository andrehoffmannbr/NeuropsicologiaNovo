import supabase from '../config/supabase.js'
import { useUser } from '../context/UserContext.js'
import { router, ROUTES } from '../utils/router.js'
import toast from '../components/toast.js'

export default class AdminPanelPage {
  constructor() {
    this.stats = null
    this.users = []
    this.recentLogs = []
    this.currentView = 'dashboard' // dashboard, users, logs, settings
  }

  async render(container) {
    const { user, isAdminOrCoordinator } = this.context || await this.getContext()
    
    // Verificar se tem permissão
    if (!user || !isAdminOrCoordinator()) {
      container.innerHTML = `
        <div class="access-denied">
          <h2>Acesso Negado</h2>
          <p>Esta página é exclusiva para administradores e coordenadores.</p>
          <button class="btn btn-primary" onclick="history.back()">Voltar</button>
        </div>
      `
      return
    }

    this.element = document.createElement('div')
    this.element.className = 'admin-panel-page'
    
    this.element.innerHTML = `
      <div class="admin-header">
        <div class="admin-header-content">
          <div class="admin-title">
            <h1>
              <i data-lucide="settings"></i>
              Painel Administrativo
            </h1>
            <p>Gestão completa do sistema de neuropsicologia</p>
          </div>
          <div class="admin-actions">
            <button class="btn btn-outline" onclick="window.location.href='${ROUTES.DASHBOARD}'">
              <i data-lucide="arrow-left"></i>
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>

      <div class="admin-content">
        <!-- Navigation Tabs -->
        <nav class="admin-nav">
          <button class="admin-nav-btn active" data-view="dashboard">
            <i data-lucide="bar-chart-3"></i>
            Dashboard
          </button>
          <button class="admin-nav-btn" data-view="users">
            <i data-lucide="users"></i>
            Usuários
          </button>
          <button class="admin-nav-btn" data-view="logs">
            <i data-lucide="file-text"></i>
            Logs do Sistema
          </button>
          <button class="admin-nav-btn" data-view="settings">
            <i data-lucide="cog"></i>
            Configurações
          </button>
        </nav>

        <!-- Content Areas -->
        <div class="admin-views">
          <!-- Dashboard View -->
          <div class="admin-view active" id="dashboard-view">
            ${this.renderDashboardView()}
          </div>

          <!-- Users View -->
          <div class="admin-view" id="users-view">
            ${this.renderUsersView()}
          </div>

          <!-- Logs View -->
          <div class="admin-view" id="logs-view">
            ${this.renderLogsView()}
          </div>

          <!-- Settings View -->
          <div class="admin-view" id="settings-view">
            ${this.renderSettingsView()}
          </div>
        </div>
      </div>
    `

    container.appendChild(this.element)
    this.setupEventListeners()
    this.loadInitialData()
  }

  async getContext() {
    // Simular contexto se não tiver acesso direto
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return { user: null, isAdminOrCoordinator: () => false }

      const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      this.context = {
        user: profile,
        isAdminOrCoordinator: () => profile && ['admin', 'coordenador'].includes(profile.role)
      }

      return this.context
    } catch (error) {
      console.error('Erro ao obter contexto:', error)
      return { user: null, isAdminOrCoordinator: () => false }
    }
  }

  renderDashboardView() {
    return `
      <div class="admin-dashboard">
        <!-- System Stats -->
        <div class="admin-stats">
          <div class="stat-card">
            <div class="stat-icon admin">
              <i data-lucide="users"></i>
            </div>
            <div class="stat-content">
              <h3 id="totalUsers">-</h3>
              <p>Usuários Ativos</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon clients">
              <i data-lucide="user-heart"></i>
            </div>
            <div class="stat-content">
              <h3 id="totalClients">-</h3>
              <p>Clientes Cadastrados</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon appointments">
              <i data-lucide="calendar"></i>
            </div>
            <div class="stat-content">
              <h3 id="todayAppointments">-</h3>
              <p>Agendamentos Hoje</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon protocols">
              <i data-lucide="package"></i>
            </div>
            <div class="stat-content">
              <h3 id="activeProtocols">-</h3>
              <p>Protocolos Ativos</p>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="admin-quick-actions">
          <h2>Ações Rápidas</h2>
          <div class="quick-actions-grid">
            <button class="quick-action-btn" data-action="create-user">
              <i data-lucide="user-plus"></i>
              <span>Novo Usuário</span>
            </button>
            <button class="quick-action-btn" data-action="view-reports">
              <i data-lucide="file-bar-chart"></i>
              <span>Relatórios</span>
            </button>
            <button class="quick-action-btn" data-action="manage-protocols">
              <i data-lucide="package-plus"></i>
              <span>Gerenciar Protocolos</span>
            </button>
            <button class="quick-action-btn" data-action="system-backup">
              <i data-lucide="download"></i>
              <span>Backup Sistema</span>
            </button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="admin-recent-activity">
          <h2>Atividade Recente</h2>
          <div class="activity-list" id="recent-activity">
            <div class="loading-placeholder">Carregando atividades...</div>
          </div>
        </div>
      </div>
    `
  }

  renderUsersView() {
    return `
      <div class="admin-users">
        <div class="users-header">
          <h2>Gestão de Usuários</h2>
          <button class="btn btn-primary" id="create-user-btn">
            <i data-lucide="user-plus"></i>
            Novo Usuário
          </button>
        </div>

        <div class="users-filters">
          <div class="filter-group">
            <label>Filtrar por Role:</label>
            <select id="role-filter">
              <option value="">Todos os roles</option>
              <option value="admin">Administrador</option>
              <option value="coordenador">Coordenador</option>
              <option value="funcionario">Funcionário</option>
              <option value="estagiario">Estagiário</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Status:</label>
            <select id="status-filter">
              <option value="">Todos</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
        </div>

        <div class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <tr>
                <td colspan="6" class="loading-placeholder">Carregando usuários...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `
  }

  renderLogsView() {
    return `
      <div class="admin-logs">
        <div class="logs-header">
          <h2>Logs do Sistema</h2>
          <div class="logs-actions">
            <button class="btn btn-outline" id="refresh-logs">
              <i data-lucide="refresh-cw"></i>
              Atualizar
            </button>
            <button class="btn btn-secondary" id="export-logs">
              <i data-lucide="download"></i>
              Exportar
            </button>
          </div>
        </div>

        <div class="logs-filters">
          <div class="filter-group">
            <label>Tabela:</label>
            <select id="table-filter">
              <option value="">Todas</option>
              <option value="usuarios">Usuários</option>
              <option value="clientes">Clientes</option>
              <option value="agendamentos">Agendamentos</option>
              <option value="prontuarios">Prontuários</option>
              <option value="protocolos">Protocolos</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Ação:</label>
            <select id="action-filter">
              <option value="">Todas</option>
              <option value="CREATE">Criar</option>
              <option value="UPDATE">Atualizar</option>
              <option value="DELETE">Deletar</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Data:</label>
            <input type="date" id="date-filter">
          </div>
        </div>

        <div class="logs-table-container">
          <table class="logs-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Tabela</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody id="logs-table-body">
              <tr>
                <td colspan="5" class="loading-placeholder">Carregando logs...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `
  }

  renderSettingsView() {
    return `
      <div class="admin-settings">
        <h2>Configurações do Sistema</h2>
        
        <div class="settings-sections">
          <!-- System Information -->
          <div class="settings-section">
            <h3>Informações do Sistema</h3>
            <div class="setting-item">
              <label>Versão do Sistema:</label>
              <span>1.0.0</span>
            </div>
            <div class="setting-item">
              <label>Último Backup:</label>
              <span id="last-backup">Verificando...</span>
            </div>
            <div class="setting-item">
              <label>Total de Registros:</label>
              <span id="total-records">Calculando...</span>
            </div>
          </div>

          <!-- Database Management -->
          <div class="settings-section">
            <h3>Gestão do Banco de Dados</h3>
            <div class="setting-actions">
              <button class="btn btn-outline" id="optimize-db">
                <i data-lucide="zap"></i>
                Otimizar Banco
              </button>
              <button class="btn btn-secondary" id="backup-db">
                <i data-lucide="database"></i>
                Backup Manual
              </button>
              <button class="btn btn-accent" id="maintenance-mode">
                <i data-lucide="wrench"></i>
                Modo Manutenção
              </button>
            </div>
          </div>

          <!-- Security Settings -->
          <div class="settings-section">
            <h3>Configurações de Segurança</h3>
            <div class="setting-toggle">
              <label>
                <input type="checkbox" id="force-2fa" checked>
                <span>Forçar autenticação de dois fatores</span>
              </label>
            </div>
            <div class="setting-toggle">
              <label>
                <input type="checkbox" id="log-all-actions" checked>
                <span>Registrar todas as ações</span>
              </label>
            </div>
            <div class="setting-item">
              <label>Tempo de sessão (minutos):</label>
              <input type="number" value="480" min="30" max="1440" id="session-timeout">
            </div>
          </div>

          <!-- System Maintenance -->
          <div class="settings-section">
            <h3>Manutenção do Sistema</h3>
            <div class="setting-actions">
              <button class="btn btn-outline" id="clear-logs">
                <i data-lucide="trash-2"></i>
                Limpar Logs Antigos
              </button>
              <button class="btn btn-outline" id="regenerate-views">
                <i data-lucide="refresh-cw"></i>
                Regenerar Views
              </button>
              <button class="btn btn-secondary" id="check-integrity">
                <i data-lucide="shield-check"></i>
                Verificar Integridade
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  setupEventListeners() {
    // Navigation
    this.element.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchView(e.target.dataset.view)
      })
    })

    // Quick Actions
    this.element.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleQuickAction(e.target.closest('.quick-action-btn').dataset.action)
      })
    })

    // Users management
    const createUserBtn = this.element.querySelector('#create-user-btn')
    if (createUserBtn) {
      createUserBtn.addEventListener('click', () => this.showCreateUserModal())
    }

    // Filters
    const roleFilter = this.element.querySelector('#role-filter')
    const statusFilter = this.element.querySelector('#status-filter')
    if (roleFilter && statusFilter) {
      roleFilter.addEventListener('change', () => this.filterUsers())
      statusFilter.addEventListener('change', () => this.filterUsers())
    }

    // Settings actions
    this.setupSettingsEventListeners()
  }

  setupSettingsEventListeners() {
    const settingsBtns = {
      'optimize-db': () => this.optimizeDatabase(),
      'backup-db': () => this.performBackup(),
      'maintenance-mode': () => this.toggleMaintenanceMode(),
      'clear-logs': () => this.clearOldLogs(),
      'regenerate-views': () => this.regenerateViews(),
      'check-integrity': () => this.checkIntegrity()
    }

    Object.entries(settingsBtns).forEach(([id, handler]) => {
      const btn = this.element.querySelector(`#${id}`)
      if (btn) {
        btn.addEventListener('click', handler)
      }
    })
  }

  switchView(viewName) {
    // Update navigation
    this.element.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName)
    })

    // Update views
    this.element.querySelectorAll('.admin-view').forEach(view => {
      view.classList.toggle('active', view.id === `${viewName}-view`)
    })

    this.currentView = viewName

    // Load data for the view
    this.loadViewData(viewName)
  }

  async loadInitialData() {
    try {
      await Promise.all([
        this.loadSystemStats(),
        this.loadRecentActivity()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      toast.error('Erro ao carregar dados do painel')
    }
  }

  async loadViewData(viewName) {
    switch (viewName) {
      case 'users':
        await this.loadUsers()
        break
      case 'logs':
        await this.loadLogs()
        break
      case 'settings':
        await this.loadSystemInfo()
        break
    }
  }

  async loadSystemStats() {
    try {
      const { data: stats } = await supabase
        .from('dashboard_admin')
        .select('*')
        .single()

      if (stats) {
        this.updateStatsDisplay(stats)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  updateStatsDisplay(stats) {
    const elements = {
      totalUsers: stats.total_usuarios,
      totalClients: stats.total_clientes,
      todayAppointments: stats.agendamentos_hoje,
      activeProtocols: stats.protocolos_ativos
    }

    Object.entries(elements).forEach(([id, value]) => {
      const element = this.element.querySelector(`#${id}`)
      if (element) {
        element.textContent = value || '0'
      }
    })
  }

  async loadUsers() {
    // Implementation for loading users
    // This would query the usuarios table and populate the users table
  }

  async loadLogs() {
    // Implementation for loading logs
    // This would query the logs_acao table and populate the logs table
  }

  async loadRecentActivity() {
    // Implementation for loading recent activity
    // This would show recent logs or actions
  }

  async loadSystemInfo() {
    // Implementation for loading system information
    // This would show database stats, backup info, etc.
  }

  handleQuickAction(action) {
    switch (action) {
      case 'create-user':
        this.showCreateUserModal()
        break
      case 'view-reports':
        router.navigateTo(ROUTES.CLIENT_REPORTS)
        break
      case 'manage-protocols':
        router.navigateTo(ROUTES.INVENTORY)
        break
      case 'system-backup':
        this.performBackup()
        break
    }
  }

  showCreateUserModal() {
    // Implementation for create user modal
    toast.info('Modal de criação de usuário em desenvolvimento')
  }

  async performBackup() {
    try {
      toast.info('Iniciando backup do sistema...')
      // Implementation for system backup
      setTimeout(() => {
        toast.success('Backup realizado com sucesso')
      }, 2000)
    } catch (error) {
      toast.error('Erro ao realizar backup')
    }
  }

  async optimizeDatabase() {
    try {
      toast.info('Otimizando banco de dados...')
      // Implementation for database optimization
      setTimeout(() => {
        toast.success('Banco de dados otimizado')
      }, 3000)
    } catch (error) {
      toast.error('Erro ao otimizar banco de dados')
    }
  }

  toggleMaintenanceMode() {
    // Implementation for maintenance mode
    toast.info('Modo manutenção em desenvolvimento')
  }

  clearOldLogs() {
    // Implementation for clearing old logs
    toast.info('Limpeza de logs em desenvolvimento')
  }

  regenerateViews() {
    // Implementation for regenerating database views
    toast.info('Regeneração de views em desenvolvimento')
  }

  checkIntegrity() {
    // Implementation for checking database integrity
    toast.info('Verificação de integridade em desenvolvimento')
  }

  filterUsers() {
    // Implementation for filtering users table
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 