import supabase from '../config/supabase.js'
import { authService } from '../services/auth.js'
import { router, ROUTES } from '../utils/router.js'
import { toast } from '../components/toast.js'

export default class MeusClientesPage {
  constructor() {
    this.clients = []
    this.filteredClients = []
    this.currentPage = 1
    this.itemsPerPage = 10
    this.stats = null
  }

  async render(container) {
    // Verificar se usuário é estagiário
    const currentUser = await authService.getCurrentUser()
    if (!currentUser) {
      router.navigateTo(ROUTES.LOGIN)
      return
    }

    // Verificar se é estagiário
    const userRole = authService.getUserRole()
    if (userRole !== 'estagiario') {
      container.innerHTML = `
        <div class="access-denied">
          <h2>Acesso Negado</h2>
          <p>Esta página é exclusiva para estagiários.</p>
          <button class="btn btn-primary" onclick="history.back()">Voltar</button>
        </div>
      `
      return
    }

    this.element = document.createElement('div')
    this.element.className = 'meus-clientes-page'
    
    this.element.innerHTML = `
      <div class="page-header">
        <nav class="breadcrumb">
          <a href="javascript:void(0)" onclick="window.location.href='${ROUTES.DASHBOARD}'">
            <i data-lucide="home"></i>
            Dashboard
          </a>
          <i data-lucide="chevron-right"></i>
          <span>Meus Clientes</span>
        </nav>
        
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i data-lucide="user-heart"></i>
              Meus Clientes
            </h1>
            <p>Visualize e gerencie apenas os clientes vinculados a você</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline" onclick="window.location.href='${ROUTES.DASHBOARD}'">
              <i data-lucide="arrow-left"></i>
              Voltar
            </button>
            <button class="btn btn-primary" id="btn-new-client">
              <i data-lucide="user-plus"></i>
              Novo Cliente
            </button>
          </div>
        </div>
      </div>

      <div class="clients-content">
        <!-- Estatísticas do Estagiário -->
        <div class="estagiario-stats">
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="users"></i>
            </div>
            <div class="stat-content">
              <h3 id="totalMeusClientes">0</h3>
              <p>Meus Clientes</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="user-check"></i>
            </div>
            <div class="stat-content">
              <h3 id="clientesAtivos">0</h3>
              <p>Clientes Ativos</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="calendar"></i>
            </div>
            <div class="stat-content">
              <h3 id="agendamentosMes">0</h3>
              <p>Agendamentos Este Mês</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="calendar-check"></i>
            </div>
            <div class="stat-content">
              <h3 id="agendamentosHoje">0</h3>
              <p>Agendamentos Hoje</p>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filters-section">
          <div class="filters-header">
            <h2>
              <i data-lucide="filter"></i>
              Pesquisar e Filtrar
            </h2>
            <button class="btn btn-outline" id="clearFilters">
              <i data-lucide="x"></i>
              Limpar
            </button>
          </div>
          
          <div class="filters-grid">
            <div class="filter-group">
              <label for="searchInput">
                <i data-lucide="search"></i>
                Buscar Cliente
              </label>
              <div class="search-input-wrapper">
                <input type="text" id="searchInput" placeholder="Nome, CPF, telefone...">
                <i data-lucide="search" class="search-icon"></i>
              </div>
            </div>
            
            <div class="filter-group">
              <label for="typeFilter">
                <i data-lucide="users"></i>
                Tipo de Cliente
              </label>
              <select id="typeFilter">
                <option value="">Todos os tipos</option>
                <option value="adulto">Adulto</option>
                <option value="menor">Menor de Idade</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="statusFilter">
                <i data-lucide="activity"></i>
                Status
              </label>
              <select id="statusFilter">
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Lista de Clientes -->
        <div class="clients-table-container">
          <table class="clients-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Agendamentos</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="clientsTableBody">
              <!-- Dados serão carregados aqui -->
            </tbody>
          </table>
          
          <div class="table-empty" id="emptyState" style="display: none;">
            <i data-lucide="user-plus"></i>
            <h3>Nenhum cliente encontrado</h3>
            <p>Você ainda não cadastrou nenhum cliente ou nenhum cliente atende aos filtros.</p>
            <button class="btn btn-primary" id="btn-first-client">
              <i data-lucide="user-plus"></i>
              Cadastrar Primeiro Cliente
            </button>
          </div>
        </div>

        <!-- Paginação -->
        <div class="pagination" id="pagination">
          <!-- Paginação será gerada aqui -->
        </div>
      </div>

      <!-- Modal de Confirmação -->
      <div class="modal" id="confirmModal" style="display: none;">
        <div class="modal-content">
          <h3>Confirmar Ação</h3>
          <p id="confirmMessage">Tem certeza que deseja realizar esta ação?</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">
              Cancelar
            </button>
            <button class="btn btn-danger" id="confirmActionBtn">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    `

    container.appendChild(this.element)
    
    // Inicializar funcionalidades
    this.initializeEventListeners()
    await this.loadData()
  }

  initializeEventListeners() {
    // Busca e filtros
    const searchInput = this.element.querySelector('#searchInput')
    const typeFilter = this.element.querySelector('#typeFilter')
    const statusFilter = this.element.querySelector('#statusFilter')
    const clearFilters = this.element.querySelector('#clearFilters')

    searchInput.addEventListener('input', () => this.applyFilters())
    typeFilter.addEventListener('change', () => this.applyFilters())
    statusFilter.addEventListener('change', () => this.applyFilters())
    
    clearFilters.addEventListener('click', () => {
      searchInput.value = ''
      typeFilter.value = ''
      statusFilter.value = ''
      this.applyFilters()
    })

    // Botões de ação
    const btnNewClient = this.element.querySelector('#btn-new-client')
    const btnFirstClient = this.element.querySelector('#btn-first-client')
    
    btnNewClient.addEventListener('click', () => {
      router.navigateTo(ROUTES.CLIENTS)
    })
    
    if (btnFirstClient) {
      btnFirstClient.addEventListener('click', () => {
        router.navigateTo(ROUTES.CLIENTS)
      })
    }

    // Configurar ações globais
    window.viewMyClient = (clientId) => this.viewClient(clientId)
    window.editMyClient = (clientId) => this.editClient(clientId)
    window.scheduleForClient = (clientId) => this.scheduleForClient(clientId)
  }

  async loadData() {
    try {
      // Mostrar loading
      this.showLoading()
      
      // Carregar clientes usando a view personalizada
      await this.loadMeusClientes()
      
      // Carregar estatísticas
      await this.loadEstagiarioStats()
      
      // Renderizar dados
      this.renderTable()
      this.updateStats()
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados dos clientes')
    }
  }

  async loadMeusClientes() {
    try {
      const { data, error } = await supabase
        .from('meus_clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      this.clients = data || []
      this.filteredClients = [...this.clients]
      
    } catch (error) {
      console.error('Erro ao carregar meus clientes:', error)
      throw error
    }
  }

  async loadEstagiarioStats() {
    try {
      const { data, error } = await supabase
        .rpc('get_estagiario_stats')

      if (error) throw error

      this.stats = data || {
        total_clientes: 0,
        clientes_ativos: 0,
        agendamentos_mes: 0,
        agendamentos_hoje: 0
      }
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      this.stats = {
        total_clientes: 0,
        clientes_ativos: 0,
        agendamentos_mes: 0,
        agendamentos_hoje: 0
      }
    }
  }

  showLoading() {
    const tableBody = this.element.querySelector('#clientsTableBody')
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando seus clientes...</p>
          </td>
        </tr>
      `
    }
  }

  applyFilters() {
    const searchTerm = this.element.querySelector('#searchInput').value.toLowerCase()
    const typeFilter = this.element.querySelector('#typeFilter').value
    const statusFilter = this.element.querySelector('#statusFilter').value

    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !searchTerm || 
        client.name?.toLowerCase().includes(searchTerm) ||
        client.cpf?.toLowerCase().includes(searchTerm) ||
        client.phone?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm)

      const matchesType = !typeFilter || client.client_type === typeFilter
      const matchesStatus = !statusFilter || (client.status || 'ativo') === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })

    this.currentPage = 1
    this.renderTable()
  }

  renderTable() {
    const tableBody = this.element.querySelector('#clientsTableBody')
    const emptyState = this.element.querySelector('#emptyState')
    const table = this.element.querySelector('.clients-table')

    if (this.filteredClients.length === 0) {
      table.style.display = 'none'
      emptyState.style.display = 'block'
      return
    }

    table.style.display = 'table'
    emptyState.style.display = 'none'

    // Calcular paginação
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    const paginatedClients = this.filteredClients.slice(startIndex, endIndex)

    // Renderizar linhas
    tableBody.innerHTML = paginatedClients.map(client => `
      <tr>
        <td data-label="ID">
          <code class="client-id">${client.client_id || '-'}</code>
        </td>
        <td data-label="Nome">
          <div class="client-info">
            <strong>${client.name}</strong>
            ${client.email ? `<small>${client.email}</small>` : ''}
          </div>
        </td>
        <td data-label="CPF">${this.formatCPF(client.cpf)}</td>
        <td data-label="Telefone">${this.formatPhone(client.phone)}</td>
        <td data-label="Tipo">
          <span class="status-badge ${client.client_type === 'menor' ? 'status-menor' : 'status-adulto'}">
            ${client.client_type === 'menor' ? 'Menor' : 'Adulto'}
          </span>
        </td>
        <td data-label="Status">
          <span class="status-badge status-${(client.status || 'ativo')}">
            ${(client.status || 'ativo') === 'ativo' ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td data-label="Agendamentos">
          <span class="badge-count">${client.total_agendamentos || 0}</span>
        </td>
        <td data-label="Cadastro">${this.formatDate(client.created_at)}</td>
        <td data-label="Ações">
          <div class="client-actions">
            <button class="btn-icon btn-view" onclick="viewMyClient('${client.id}')" title="Visualizar">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn-icon btn-edit" onclick="editMyClient('${client.id}')" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn-icon btn-calendar" onclick="scheduleForClient('${client.id}')" title="Agendar">
              <i data-lucide="calendar-plus"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('')

    // Renderizar paginação
    this.renderPagination()
  }

  renderPagination() {
    const pagination = this.element.querySelector('#pagination')
    const totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage)

    if (totalPages <= 1) {
      pagination.innerHTML = ''
      return
    }

    let paginationHTML = '<div class="pagination-controls">'
    
    // Botão anterior
    if (this.currentPage > 1) {
      paginationHTML += `<button class="btn btn-outline" onclick="this.changePage(${this.currentPage - 1})">Anterior</button>`
    }

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
      if (i === this.currentPage) {
        paginationHTML += `<span class="page-current">${i}</span>`
      } else {
        paginationHTML += `<button class="btn btn-outline" onclick="this.changePage(${i})">${i}</button>`
      }
    }

    // Botão próximo
    if (this.currentPage < totalPages) {
      paginationHTML += `<button class="btn btn-outline" onclick="this.changePage(${this.currentPage + 1})">Próximo</button>`
    }

    paginationHTML += '</div>'
    pagination.innerHTML = paginationHTML
  }

  changePage(page) {
    this.currentPage = page
    this.renderTable()
  }

  updateStats() {
    if (!this.stats) return

    const totalMeusClientes = this.element.querySelector('#totalMeusClientes')
    const clientesAtivos = this.element.querySelector('#clientesAtivos')
    const agendamentosMes = this.element.querySelector('#agendamentosMes')
    const agendamentosHoje = this.element.querySelector('#agendamentosHoje')

    if (totalMeusClientes) totalMeusClientes.textContent = this.stats.total_clientes
    if (clientesAtivos) clientesAtivos.textContent = this.stats.clientes_ativos
    if (agendamentosMes) agendamentosMes.textContent = this.stats.agendamentos_mes
    if (agendamentosHoje) agendamentosHoje.textContent = this.stats.agendamentos_hoje
  }

  // Ações dos clientes
  viewClient(clientId) {
    const client = this.clients.find(c => c.id === clientId)
    if (!client) return

    // Implementar modal de visualização ou navegar para página de detalhes
    toast.info(`Visualizando cliente: ${client.name}`)
  }

  editClient(clientId) {
    router.navigateTo(`${ROUTES.CLIENTS}?id=${clientId}`)
  }

  scheduleForClient(clientId) {
    router.navigateTo(`${ROUTES.APPOINTMENTS}?client_id=${clientId}`)
  }

  // Utilitários
  formatCPF(cpf) {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  formatPhone(phone) {
    if (!phone) return '-'
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
  }

  formatDate(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }
} 