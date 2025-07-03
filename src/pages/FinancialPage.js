import supabase from '../config/supabase.js'
import toast from '../components/toast.js'
import authService from '../services/auth.js'

export default class FinancialPage {
  constructor() {
    this.element = null
    this.transactions = []
    this.filteredTransactions = []
    this.currentFilter = 'all'
    this.currentMonth = new Date().getMonth()
    this.currentYear = new Date().getFullYear()
    this.editingTransaction = null
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'financial-page'
    this.element.innerHTML = `
      <div class="page-header">
        <h1>
          <i data-lucide="dollar-sign"></i>
          Financeiro
        </h1>
        <p>Controle financeiro e relatórios</p>
        <div class="page-actions">
          <button class="btn btn-success" id="add-revenue-btn">
            <i data-lucide="plus"></i>
            Nova Receita
          </button>
          <button class="btn btn-danger" id="add-expense-btn">
            <i data-lucide="minus"></i>
            Nova Despesa
          </button>
        </div>
      </div>

      <div class="financial-content">
        <!-- Filtros de Período -->
        <div class="period-filter card">
          <div class="card-body">
            <div class="period-controls">
              <div class="period-navigation">
                <button class="btn btn-ghost btn-sm" id="prev-month">
                  <i data-lucide="chevron-left"></i>
                </button>
                <h3 id="current-period">${this.getMonthYearText(this.currentMonth, this.currentYear)}</h3>
                <button class="btn btn-ghost btn-sm" id="next-month">
                  <i data-lucide="chevron-right"></i>
                </button>
              </div>
              <div class="filter-group">
                <label>Tipo:</label>
                <select id="type-filter">
                  <option value="all">Todos</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Status:</label>
                <select id="status-filter">
                  <option value="all">Todos</option>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumo Financeiro -->
        <div class="financial-summary">
          <div class="summary-card revenue">
            <div class="summary-icon">
              <i data-lucide="trending-up"></i>
            </div>
            <div class="summary-content">
              <h3 id="total-revenue">R$ 0,00</h3>
              <p>Receitas do Mês</p>
              <small id="revenue-count">0 transações</small>
            </div>
          </div>
          
          <div class="summary-card expense">
            <div class="summary-icon">
              <i data-lucide="trending-down"></i>
            </div>
            <div class="summary-content">
              <h3 id="total-expense">R$ 0,00</h3>
              <p>Despesas do Mês</p>
              <small id="expense-count">0 transações</small>
            </div>
          </div>
          
          <div class="summary-card balance">
            <div class="summary-icon">
              <i data-lucide="bar-chart-3"></i>
            </div>
            <div class="summary-content">
              <h3 id="balance">R$ 0,00</h3>
              <p>Saldo do Mês</p>
              <small id="balance-status">Equilibrado</small>
            </div>
          </div>
        </div>

        <!-- Lista de Transações -->
        <div class="transactions-list card">
          <div class="card-header">
            <h3>Transações</h3>
            <div class="header-actions">
              <button class="btn btn-outline btn-sm" id="export-btn">
                <i data-lucide="download"></i>
                Exportar
              </button>
              <span class="badge" id="transactions-count">0</span>
            </div>
          </div>
          <div class="card-body">
            <div id="transactions-table">
              <div class="loading-state">
                <i data-lucide="loader"></i>
                <p>Carregando transações...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para Adicionar/Editar Transação -->
      <div class="modal" id="transaction-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h3 id="modal-title">Nova Transação</h3>
            <button class="btn btn-ghost btn-sm" id="close-modal">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="transaction-form">
              <input type="hidden" id="transaction-type" name="transaction_type">
              
              <div class="form-row">
                <div class="form-group">
                  <label for="description">Descrição *</label>
                  <input type="text" id="description" name="description" required>
                </div>
                <div class="form-group">
                  <label for="category">Categoria *</label>
                  <select id="category" name="category" required>
                    <option value="">Selecione</option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="amount">Valor *</label>
                  <input type="number" id="amount" name="amount" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                  <label for="payment-method">Forma de Pagamento</label>
                  <select id="payment-method" name="payment_method">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="due-date">Data de Vencimento</label>
                  <input type="date" id="due-date" name="due_date">
                </div>
                <div class="form-group">
                  <label for="paid-date">Data de Pagamento</label>
                  <input type="date" id="paid-date" name="paid_date">
                </div>
              </div>
              
              <div class="form-group">
                <label for="payment-status">Status</label>
                <select id="payment-status" name="payment_status">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="client-select">Cliente (opcional)</label>
                <select id="client-select" name="client_id">
                  <option value="">Nenhum cliente</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-btn">Cancelar</button>
            <button class="btn btn-primary" id="save-btn">Salvar</button>
          </div>
        </div>
      </div>
    `

    container.appendChild(this.element)
    await this.loadData()
    this.setupEventListeners()
  }

  async loadData() {
    try {
      // Carregar transações do mês atual
      await this.loadTransactions()
      
      // Carregar clientes para o select
      await this.loadClients()
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      this.renderTransactionsError()
    }
  }

  async loadTransactions() {
    try {
      const startDate = new Date(this.currentYear, this.currentMonth, 1).toISOString().split('T')[0]
      const endDate = new Date(this.currentYear, this.currentMonth + 1, 0).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          clients (
            name
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (error) throw error

      this.transactions = data || []
      this.filteredTransactions = [...this.transactions]
      this.renderTransactions()
      this.updateSummary()
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      this.renderTransactionsError()
    }
  }

  async loadClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'ativo')
        .order('name')

      if (error) throw error

      const clientSelect = this.element.querySelector('#client-select')
      if (clientSelect) {
        clientSelect.innerHTML = '<option value="">Nenhum cliente</option>'
        data.forEach(client => {
          clientSelect.innerHTML += `<option value="${client.id}">${client.name}</option>`
        })
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  renderTransactions() {
    const container = this.element.querySelector('#transactions-table')
    const countEl = this.element.querySelector('#transactions-count')
    
    countEl.textContent = this.filteredTransactions.length

    if (this.filteredTransactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="receipt"></i>
          <p>Nenhuma transação encontrada</p>
        </div>
      `
      return
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredTransactions.map(transaction => `
              <tr>
                <td>${this.formatDate(transaction.created_at)}</td>
                <td>
                  <div class="transaction-info">
                    <h4>${transaction.description}</h4>
                    <small class="transaction-type ${transaction.transaction_type}">
                      ${transaction.transaction_type === 'receita' ? 'Receita' : 'Despesa'}
                    </small>
                  </div>
                </td>
                <td><span class="badge">${transaction.category}</span></td>
                <td>${transaction.clients?.name || '-'}</td>
                <td>
                  <span class="amount ${transaction.transaction_type}">
                    ${transaction.transaction_type === 'receita' ? '+' : '-'} ${this.formatCurrency(transaction.amount)}
                  </span>
                </td>
                <td>
                  <span class="badge ${this.getStatusClass(transaction.payment_status)}">
                    ${this.getStatusText(transaction.payment_status)}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="btn btn-ghost btn-sm" onclick="financialPage.editTransaction('${transaction.id}')" title="Editar">
                      <i data-lucide="edit"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm btn-danger" onclick="financialPage.deleteTransaction('${transaction.id}')" title="Excluir">
                      <i data-lucide="trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `

    // Definir referência global
    window.financialPage = this
  }

  renderTransactionsError() {
    const container = this.element.querySelector('#transactions-table')
    container.innerHTML = `
      <div class="error-state">
        <i data-lucide="alert-circle"></i>
        <p>Erro ao carregar transações</p>
      </div>
    `
  }

  updateSummary() {
    const revenues = this.transactions.filter(t => t.transaction_type === 'receita' && t.payment_status === 'pago')
    const expenses = this.transactions.filter(t => t.transaction_type === 'despesa' && t.payment_status === 'pago')
    
    const totalRevenue = revenues.reduce((sum, t) => sum + parseFloat(t.amount), 0)
    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0)
    const balance = totalRevenue - totalExpense

    // Atualizar elementos
    const revenueEl = this.element.querySelector('#total-revenue')
    const expenseEl = this.element.querySelector('#total-expense')
    const balanceEl = this.element.querySelector('#balance')
    const revenueCountEl = this.element.querySelector('#revenue-count')
    const expenseCountEl = this.element.querySelector('#expense-count')
    const balanceStatusEl = this.element.querySelector('#balance-status')

    if (revenueEl) revenueEl.textContent = this.formatCurrency(totalRevenue)
    if (expenseEl) expenseEl.textContent = this.formatCurrency(totalExpense)
    if (balanceEl) balanceEl.textContent = this.formatCurrency(balance)
    if (revenueCountEl) revenueCountEl.textContent = `${revenues.length} transações`
    if (expenseCountEl) expenseCountEl.textContent = `${expenses.length} transações`
    
    if (balanceStatusEl) {
      if (balance > 0) {
        balanceStatusEl.textContent = 'Positivo'
        balanceStatusEl.className = 'positive'
      } else if (balance < 0) {
        balanceStatusEl.textContent = 'Negativo'
        balanceStatusEl.className = 'negative'
      } else {
        balanceStatusEl.textContent = 'Equilibrado'
        balanceStatusEl.className = 'neutral'
      }
    }
  }

  getStatusClass(status) {
    switch (status) {
      case 'pago': return 'badge-success'
      case 'pendente': return 'badge-warning'
      case 'cancelado': return 'badge-danger'
      default: return 'badge-secondary'
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'pago': return 'Pago'
      case 'pendente': return 'Pendente'
      case 'cancelado': return 'Cancelado'
      default: return status
    }
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  getMonthYearText(month, year) {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return `${monthNames[month]} ${year}`
  }

  setupEventListeners() {
    // Botões de adicionar
    const addRevenueBtn = this.element.querySelector('#add-revenue-btn')
    const addExpenseBtn = this.element.querySelector('#add-expense-btn')

    if (addRevenueBtn) {
      addRevenueBtn.addEventListener('click', () => {
        this.showTransactionModal('receita')
      })
    }

    if (addExpenseBtn) {
      addExpenseBtn.addEventListener('click', () => {
        this.showTransactionModal('despesa')
      })
    }

    // Navegação de período
    const prevBtn = this.element.querySelector('#prev-month')
    const nextBtn = this.element.querySelector('#next-month')

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.changeMonth(-1)
      })
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.changeMonth(1)
      })
    }

    // Filtros
    const typeFilter = this.element.querySelector('#type-filter')
    const statusFilter = this.element.querySelector('#status-filter')

    if (typeFilter) {
      typeFilter.addEventListener('change', () => {
        this.filterTransactions()
      })
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.filterTransactions()
      })
    }

    // Modal
    this.setupModalEvents()
  }

  setupModalEvents() {
    const modal = this.element.querySelector('#transaction-modal')
    const closeBtn = this.element.querySelector('#close-modal')
    const cancelBtn = this.element.querySelector('#cancel-btn')
    const saveBtn = this.element.querySelector('#save-btn')

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideModal()
      })
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hideModal()
      })
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveTransaction()
      })
    }

    // Fechar modal ao clicar no backdrop
    if (modal) {
      const backdrop = modal.querySelector('.modal-backdrop')
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          this.hideModal()
        })
      }
    }

    // Mudar opções de categoria baseado no tipo
    const categorySelect = this.element.querySelector('#category')
    if (categorySelect) {
      this.updateCategoryOptions('receita') // Default
    }
  }

  changeMonth(direction) {
    this.currentMonth += direction
    if (this.currentMonth < 0) {
      this.currentMonth = 11
      this.currentYear--
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0
      this.currentYear++
    }

    // Atualizar texto do período
    const periodEl = this.element.querySelector('#current-period')
    if (periodEl) {
      periodEl.textContent = this.getMonthYearText(this.currentMonth, this.currentYear)
    }

    // Recarregar dados
    this.loadTransactions()
  }

  filterTransactions() {
    const typeFilter = this.element.querySelector('#type-filter').value
    const statusFilter = this.element.querySelector('#status-filter').value

    this.filteredTransactions = this.transactions.filter(transaction => {
      const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter
      const matchesStatus = statusFilter === 'all' || transaction.payment_status === statusFilter
      
      return matchesType && matchesStatus
    })

    this.renderTransactions()
  }

  showTransactionModal(type) {
    this.editingTransaction = null
    
    const modal = this.element.querySelector('#transaction-modal')
    const titleEl = this.element.querySelector('#modal-title')
    const typeInput = this.element.querySelector('#transaction-type')
    const form = this.element.querySelector('#transaction-form')

    titleEl.textContent = type === 'receita' ? 'Nova Receita' : 'Nova Despesa'
    typeInput.value = type
    
    this.updateCategoryOptions(type)
    form.reset()
    typeInput.value = type // Garantir que o tipo seja mantido
    
    modal.classList.add('active')
  }

  updateCategoryOptions(type) {
    const categorySelect = this.element.querySelector('#category')
    
    const revenueCategories = [
      'Consulta', 'Avaliação', 'Sessão', 'Laudo', 'Outros'
    ]
    
    const expenseCategories = [
      'Aluguel', 'Material', 'Equipamentos', 'Limpeza', 'Marketing', 
      'Telefone', 'Internet', 'Energia', 'Outros'
    ]
    
    const categories = type === 'receita' ? revenueCategories : expenseCategories
    
    categorySelect.innerHTML = '<option value="">Selecione</option>'
    categories.forEach(category => {
      categorySelect.innerHTML += `<option value="${category}">${category}</option>`
    })
  }

  editTransaction(transactionId) {
    this.editingTransaction = this.transactions.find(t => t.id === transactionId)
    if (!this.editingTransaction) return

    const modal = this.element.querySelector('#transaction-modal')
    const titleEl = this.element.querySelector('#modal-title')
    const form = this.element.querySelector('#transaction-form')

    titleEl.textContent = 'Editar Transação'
    
    // Atualizar categorias
    this.updateCategoryOptions(this.editingTransaction.transaction_type)
    
    // Preencher formulário
    form.querySelector('#transaction-type').value = this.editingTransaction.transaction_type
    form.querySelector('#description').value = this.editingTransaction.description || ''
    form.querySelector('#category').value = this.editingTransaction.category || ''
    form.querySelector('#amount').value = this.editingTransaction.amount || ''
    form.querySelector('#payment-method').value = this.editingTransaction.payment_method || ''
    form.querySelector('#due-date').value = this.editingTransaction.due_date || ''
    form.querySelector('#paid-date').value = this.editingTransaction.paid_date || ''
    form.querySelector('#payment-status').value = this.editingTransaction.payment_status || ''
    form.querySelector('#client-select').value = this.editingTransaction.client_id || ''

    modal.classList.add('active')
  }

  hideModal() {
    const modal = this.element.querySelector('#transaction-modal')
    modal.classList.remove('active')
    this.editingTransaction = null
  }

  async saveTransaction() {
    try {
      const form = this.element.querySelector('#transaction-form')
      const formData = new FormData(form)
      const transactionData = Object.fromEntries(formData)

      if (!transactionData.description || !transactionData.category || !transactionData.amount) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }

      const currentUser = await authService.getCurrentUser()
      transactionData.created_by = currentUser.id
      transactionData.amount = parseFloat(transactionData.amount)
      
      // Limpar campos vazios
      Object.keys(transactionData).forEach(key => {
        if (transactionData[key] === '') {
          delete transactionData[key]
        }
      })

      let result
      if (this.editingTransaction) {
        result = await supabase
          .from('financial_transactions')
          .update(transactionData)
          .eq('id', this.editingTransaction.id)
      } else {
        result = await supabase
          .from('financial_transactions')
          .insert([transactionData])
      }

      if (result.error) throw result.error

      toast.success(`Transação ${this.editingTransaction ? 'atualizada' : 'adicionada'} com sucesso!`)
      this.hideModal()
      await this.loadTransactions()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      toast.error('Erro ao salvar transação')
    }
  }

  async deleteTransaction(transactionId) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId)

      if (error) throw error

      toast.success('Transação excluída com sucesso!')
      await this.loadTransactions()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      toast.error('Erro ao excluir transação')
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 