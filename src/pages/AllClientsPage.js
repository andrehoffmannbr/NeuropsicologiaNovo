import supabase from '../config/supabase.js'
import toast from '../components/toast.js'
import router, { ROUTES } from '../utils/router.js'
import authService from '../services/auth.js'

export default class AllClientsPage {
  constructor() {
    this.element = null
    this.clients = []
    this.filteredClients = []
    this.currentPage = 1
    this.itemsPerPage = 10
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'all-clients-page'
    
    this.element.innerHTML = `
      <div class="page-header">
        <nav class="breadcrumb">
          <a href="javascript:void(0)" onclick="window.location.href='${ROUTES.DASHBOARD}'">
            <i data-lucide="home"></i>
            Dashboard
          </a>
          <i data-lucide="chevron-right"></i>
          <span>Todos os Clientes</span>
        </nav>
        
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i data-lucide="users"></i>
              Todos os Clientes
            </h1>
            <p>Visualize e gerencie todos os clientes cadastrados</p>
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
        <div class="modern-filters-section">
          <div class="filters-header">
            <h2>
              <i data-lucide="filter"></i>
              Filtros e Pesquisa
            </h2>
            <button class="btn btn-outline" id="clearFilters">
              <i data-lucide="x"></i>
              Limpar Filtros
            </button>
          </div>
          
          <div class="filters-grid">
            <div class="filter-group">
              <label for="searchInput">
                <i data-lucide="search"></i>
                Buscar Cliente
              </label>
              <div class="search-input-wrapper">
                <input type="text" id="searchInput" placeholder="Nome, CPF, telefone ou e-mail...">
                <i data-lucide="search" class="search-icon"></i>
              </div>
            </div>
            
            <div class="filter-group">
              <label for="clientIdSearch">
                <i data-lucide="hash"></i>
                Buscar por ID
              </label>
              <div class="search-input-wrapper">
                <input type="text" id="clientIdSearch" placeholder="Digite o ID do cliente (ex: CLIN-0001)">
                <i data-lucide="hash" class="search-icon"></i>
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
            
            <div class="filter-group">
              <label for="dateFilter">
                <i data-lucide="calendar"></i>
                Período de Cadastro
              </label>
              <select id="dateFilter">
                <option value="">Todos os períodos</option>
                <option value="today">Hoje</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mês</option>
                <option value="year">Este ano</option>
              </select>
            </div>
          </div>
          
          <div class="filters-summary" id="filtersSummary" style="display: none;">
            <span class="summary-text">Filtros aplicados:</span>
            <div class="filter-tags" id="filterTags"></div>
          </div>
        </div>

        <div class="clients-stats">
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="users"></i>
            </div>
            <div class="stat-content">
              <h3 id="totalClients">0</h3>
              <p>Total de Clientes</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="user-check"></i>
            </div>
            <div class="stat-content">
              <h3 id="activeClients">0</h3>
              <p>Clientes Ativos</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="calendar"></i>
            </div>
            <div class="stat-content">
              <h3 id="newThisMonth">0</h3>
              <p>Novos Este Mês</p>
            </div>
          </div>
        </div>

        <div class="clients-table-container">
          <table class="clients-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Tipo</th>
                <th>Idade</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="clientsTableBody">
              <!-- Dados dos clientes serão carregados aqui -->
            </tbody>
          </table>
          
          <div class="table-empty" id="emptyState" style="display: none;">
            <i data-lucide="users"></i>
            <h3>Nenhum cliente encontrado</h3>
            <p>Não há clientes cadastrados ou nenhum cliente atende aos filtros selecionados.</p>
            <button class="btn btn-primary" id="btn-first-client">
              <i data-lucide="user-plus"></i>
              Cadastrar Primeiro Cliente
            </button>
          </div>
        </div>

        <div class="pagination" id="pagination">
          <!-- Paginação será gerada aqui -->
        </div>
      </div>

      <!-- Modal de Confirmação -->
      <div class="modal" id="confirmModal" style="display: none;">
        <div class="modal-content">
          <h3>Confirmar Exclusão</h3>
          <p>Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">
              Cancelar
            </button>
            <button class="btn btn-danger" id="confirmDeleteBtn">
              Excluir
            </button>
          </div>
        </div>
      </div>
    `

    container.appendChild(this.element)
    
    // Inicializar funcionalidades
    this.initializeEventListeners()
    await this.loadClients()
    this.updateStats()
  }

  initializeEventListeners() {
    const searchInput = this.element.querySelector('#searchInput')
    const clientIdSearch = this.element.querySelector('#clientIdSearch')
    const typeFilter = this.element.querySelector('#typeFilter')
    const statusFilter = this.element.querySelector('#statusFilter')
    const dateFilter = this.element.querySelector('#dateFilter')
    const clearFilters = this.element.querySelector('#clearFilters')

    // Busca em tempo real
    searchInput.addEventListener('input', () => {
      this.applyFilters()
    })

    clientIdSearch.addEventListener('input', () => {
      this.applyFilters()
    })

    // Filtros
    typeFilter.addEventListener('change', () => {
      this.applyFilters()
    })

    statusFilter.addEventListener('change', () => {
      this.applyFilters()
    })

    dateFilter.addEventListener('change', () => {
      this.applyFilters()
    })

    // Limpar filtros
    clearFilters.addEventListener('click', () => {
      searchInput.value = ''
      clientIdSearch.value = ''
      typeFilter.value = ''
      statusFilter.value = ''
      dateFilter.value = ''
      this.applyFilters()
      this.updateFiltersSummary()
    })

    // Botão Novo Cliente
    const btnNewClient = this.element.querySelector('#btn-new-client')
    if (btnNewClient) {
      btnNewClient.addEventListener('click', () => {
        router.navigateTo(ROUTES.CLIENTS)
      })
    }

    // Botão Cadastrar Primeiro Cliente
    const btnFirstClient = this.element.querySelector('#btn-first-client')
    if (btnFirstClient) {
      btnFirstClient.addEventListener('click', () => {
        router.navigateTo(ROUTES.CLIENTS)
      })
    }
  }

  async loadClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      this.clients = data || []
      this.filteredClients = [...this.clients]
      this.renderTable()
      this.updateStats()
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar clientes')
    }
  }

  applyFilters() {
    const searchTerm = this.element.querySelector('#searchInput').value.toLowerCase()
    const clientIdSearch = this.element.querySelector('#clientIdSearch').value.toLowerCase()
    const typeFilter = this.element.querySelector('#typeFilter').value
    const statusFilter = this.element.querySelector('#statusFilter').value
    const dateFilter = this.element.querySelector('#dateFilter').value

    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !searchTerm || 
        client.name?.toLowerCase().includes(searchTerm) ||
        client.cpf?.toLowerCase().includes(searchTerm) ||
        client.phone?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm)

      const matchesClientId = !clientIdSearch || client.client_id?.toLowerCase().includes(clientIdSearch)
      const matchesType = !typeFilter || client.client_type === typeFilter
      const matchesStatus = !statusFilter || (client.status || 'ativo') === statusFilter
      const matchesDate = this.matchesDateFilter(client.created_at, dateFilter)

      return matchesSearch && matchesClientId && matchesType && matchesStatus && matchesDate
    })

    this.currentPage = 1
    this.renderTable()
    this.updateStats()
    this.updateFiltersSummary()
  }

  matchesDateFilter(createdAt, filter) {
    if (!filter) return true
    
    const clientDate = new Date(createdAt)
    const now = new Date()
    
    switch (filter) {
      case 'today':
        return clientDate.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return clientDate >= weekAgo
      case 'month':
        return clientDate.getMonth() === now.getMonth() && 
               clientDate.getFullYear() === now.getFullYear()
      case 'year':
        return clientDate.getFullYear() === now.getFullYear()
      default:
        return true
    }
  }

  updateFiltersSummary() {
    const searchTerm = this.element.querySelector('#searchInput').value
    const clientIdSearch = this.element.querySelector('#clientIdSearch').value
    const typeFilter = this.element.querySelector('#typeFilter').value
    const statusFilter = this.element.querySelector('#statusFilter').value
    const dateFilter = this.element.querySelector('#dateFilter').value
    
    const filtersSummary = this.element.querySelector('#filtersSummary')
    const filterTags = this.element.querySelector('#filterTags')
    
    const activeTags = []
    
    if (searchTerm) {
      activeTags.push(`Busca: "${searchTerm}"`)
    }
    
    if (clientIdSearch) {
      activeTags.push(`ID: ${clientIdSearch}`)
    }
    
    if (typeFilter) {
      const typeLabels = { adulto: 'Adulto', menor: 'Menor de Idade' }
      activeTags.push(`Tipo: ${typeLabels[typeFilter]}`)
    }
    
    if (statusFilter) {
      const statusLabels = { ativo: 'Ativo', inativo: 'Inativo' }
      activeTags.push(`Status: ${statusLabels[statusFilter]}`)
    }
    
    if (dateFilter) {
      const dateLabels = { 
        today: 'Hoje', 
        week: 'Esta semana', 
        month: 'Este mês', 
        year: 'Este ano' 
      }
      activeTags.push(`Período: ${dateLabels[dateFilter]}`)
    }
    
    if (activeTags.length > 0) {
      filterTags.innerHTML = activeTags.map(tag => 
        `<span class="filter-tag">${tag}</span>`
      ).join('')
      filtersSummary.style.display = 'block'
    } else {
      filtersSummary.style.display = 'none'
    }
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

    // Renderizar linhas da tabela
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
        <td data-label="Idade">${this.calculateAge(client.birth_date) || '-'}</td>
        <td data-label="Status">
          <span class="status-badge status-${(client.status || 'ativo')}">
            ${(client.status || 'ativo') === 'ativo' ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td data-label="Cadastro">${this.formatDate(client.created_at)}</td>
        <td data-label="Ações">
          <div class="client-actions">
            <button class="btn-icon btn-edit" onclick="window.editClient('${client.id}')" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn-icon btn-edit" onclick="window.viewClient('${client.id}')" title="Visualizar">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn-icon btn-delete" onclick="window.deleteClient('${client.id}')" title="Excluir">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('')

    // Renderizar paginação
    this.renderPagination()

    // Adicionar eventos aos botões de ação
    this.setupActionButtons()
  }

  setupActionButtons() {
    // Adicionar métodos globais temporariamente
    window.editClient = (id) => this.editClient(id)
    window.viewClient = (id) => this.viewClient(id)
    window.deleteClient = (id) => this.deleteClient(id)
  }

  editClient(id) {
    router.navigateTo(`${ROUTES.CLIENTS}?id=${id}`)
  }

  viewClient(id) {
    router.navigateTo(`${ROUTES.CLIENT_REPORTS}?id=${id}`)
  }

  deleteClient(id) {
    const modal = this.element.querySelector('#confirmModal')
    const confirmBtn = this.element.querySelector('#confirmDeleteBtn')
    
    modal.style.display = 'flex'
    
    confirmBtn.onclick = async () => {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)

        if (error) throw error

        toast.success('Cliente excluído com sucesso!')
        modal.style.display = 'none'
        await this.loadClients()
      } catch (error) {
        console.error('Erro ao excluir cliente:', error)
        toast.error('Erro ao excluir cliente')
      }
    }
  }

  renderPagination() {
    const pagination = this.element.querySelector('#pagination')
    const totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage)

    if (totalPages <= 1) {
      pagination.innerHTML = ''
      return
    }

    let paginationHTML = `
      <button class="btn btn-secondary" ${this.currentPage === 1 ? 'disabled' : ''} 
              onclick="this.changePage(${this.currentPage - 1})">
        <i data-lucide="chevron-left"></i>
      </button>
    `

    for (let i = 1; i <= totalPages; i++) {
      if (i === this.currentPage) {
        paginationHTML += `<button class="btn btn-primary active">${i}</button>`
      } else {
        paginationHTML += `<button class="btn btn-secondary" onclick="this.changePage(${i})">${i}</button>`
      }
    }

    paginationHTML += `
      <button class="btn btn-secondary" ${this.currentPage === totalPages ? 'disabled' : ''} 
              onclick="this.changePage(${this.currentPage + 1})">
        <i data-lucide="chevron-right"></i>
      </button>
    `

    pagination.innerHTML = paginationHTML

    // Adicionar método global temporariamente
    window.changePage = (page) => this.changePage(page)
  }

  changePage(page) {
    this.currentPage = page
    this.renderTable()
  }

  updateStats() {
    const totalClients = this.element.querySelector('#totalClients')
    const activeClients = this.element.querySelector('#activeClients')
    const newThisMonth = this.element.querySelector('#newThisMonth')

    const total = this.clients.length
    const active = this.clients.filter(c => (c.status || 'ativo') === 'ativo').length
    
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const newCount = this.clients.filter(c => 
      new Date(c.created_at) >= thisMonth
    ).length

    totalClients.textContent = total
    activeClients.textContent = active
    newThisMonth.textContent = newCount
  }

  calculateAge(birthDate) {
    if (!birthDate) return null
    
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  formatDate(dateString) {
    if (!dateString) return '-'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  formatCPF(cpf) {
    if (!cpf) return '-'
    
    const cleanCpf = cpf.replace(/\D/g, '')
    return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  formatPhone(phone) {
    if (!phone) return '-'
    
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  destroy() {
    // Limpar métodos globais
    delete window.editClient
    delete window.viewClient
    delete window.deleteClient
    delete window.changePage
    
    if (this.element) {
      this.element.remove()
    }
  }
} 