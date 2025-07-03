import supabase from '../config/supabase.js'
import toast from '../components/toast.js'
import authService from '../services/auth.js'

export default class InventoryPage {
  constructor() {
    this.element = null
    this.items = []
    this.filteredItems = []
    this.currentFilter = 'all'
    this.searchTerm = ''
    this.isAddingItem = false
    this.editingItem = null
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'inventory-page'
    this.element.innerHTML = `
      <div class="page-header">
        <h1>
          <i data-lucide="package"></i>
          Inventário
        </h1>
        <p>Controle de estoque e materiais</p>
        <div class="page-actions">
          <button class="btn btn-primary" id="add-item-btn">
            <i data-lucide="plus"></i>
            Adicionar Item
          </button>
        </div>
      </div>

      <div class="inventory-content">
        <!-- Filtros e Busca -->
        <div class="inventory-filters card">
          <div class="card-body">
            <div class="filters-row">
              <div class="search-group">
                <div class="search-input-group">
                  <i data-lucide="search"></i>
                  <input type="text" id="search-input" placeholder="Buscar itens..." class="search-input">
                </div>
              </div>
              <div class="filter-group">
                <label>Categoria:</label>
                <select id="category-filter">
                  <option value="all">Todas</option>
                  <option value="Material de Escritório">Material de Escritório</option>
                  <option value="Material Clínico">Material Clínico</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Limpeza">Limpeza</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Status:</label>
                <select id="status-filter">
                  <option value="all">Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="baixo_estoque">Baixo Estoque</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Estatísticas -->
        <div class="inventory-stats">
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="package"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-number" id="total-items">0</h3>
              <p class="stat-label">Total de Itens</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="alert-triangle"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-number" id="low-stock-items">0</h3>
              <p class="stat-label">Estoque Baixo</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i data-lucide="dollar-sign"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-number" id="inventory-value">R$ 0,00</h3>
              <p class="stat-label">Valor Total</p>
            </div>
          </div>
        </div>

        <!-- Lista de Itens -->
        <div class="inventory-list card">
          <div class="card-header">
            <h3>Itens do Inventário</h3>
            <span class="badge" id="items-count">0</span>
          </div>
          <div class="card-body">
            <div id="items-table">
              <div class="loading-state">
                <i data-lucide="loader"></i>
                <p>Carregando itens...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para Adicionar/Editar Item -->
      <div class="modal" id="item-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h3 id="modal-title">Adicionar Item</h3>
            <button class="btn btn-ghost btn-sm" id="close-modal">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="item-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="item-name">Nome do Item *</label>
                  <input type="text" id="item-name" name="name" required>
                </div>
                <div class="form-group">
                  <label for="item-category">Categoria *</label>
                  <select id="item-category" name="category" required>
                    <option value="">Selecione</option>
                    <option value="Material de Escritório">Material de Escritório</option>
                    <option value="Material Clínico">Material Clínico</option>
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label for="item-description">Descrição</label>
                <textarea id="item-description" name="description" rows="3"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="item-quantity">Quantidade *</label>
                  <input type="number" id="item-quantity" name="quantity" min="0" required>
                </div>
                <div class="form-group">
                  <label for="item-minimum">Estoque Mínimo</label>
                  <input type="number" id="item-minimum" name="minimum_stock" min="0" value="0">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="item-price">Preço Unitário</label>
                  <input type="number" id="item-price" name="unit_price" step="0.01" min="0">
                </div>
                <div class="form-group">
                  <label for="item-supplier">Fornecedor</label>
                  <input type="text" id="item-supplier" name="supplier">
                </div>
              </div>
              <div class="form-group">
                <label for="item-location">Localização</label>
                <input type="text" id="item-location" name="location" placeholder="Ex: Armário 1, Prateleira 2">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-btn">Cancelar</button>
            <button class="btn btn-primary" id="save-btn">Salvar</button>
          </div>
        </div>
      </div>

      <!-- Modal para Movimentação de Estoque -->
      <div class="modal" id="movement-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h3>Movimentação de Estoque</h3>
            <button class="btn btn-ghost btn-sm" id="close-movement-modal">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div id="movement-item-info" class="movement-item-info">
              <!-- Informações do item serão inseridas aqui -->
            </div>
            <form id="movement-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="movement-type">Tipo de Movimentação</label>
                  <select id="movement-type" name="movement_type" required>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                    <option value="ajuste">Ajuste</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="movement-quantity">Quantidade</label>
                  <input type="number" id="movement-quantity" name="quantity" min="1" required>
                </div>
              </div>
              <div class="form-group">
                <label for="movement-reason">Motivo</label>
                <textarea id="movement-reason" name="reason" rows="3" placeholder="Descreva o motivo da movimentação..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-movement-btn">Cancelar</button>
            <button class="btn btn-primary" id="save-movement-btn">Salvar</button>
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
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name')

      if (error) throw error

      this.items = data || []
      this.filteredItems = [...this.items]
      this.renderItems()
      this.updateStats()
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
      this.renderItemsError()
    }
  }

  renderItems() {
    const container = this.element.querySelector('#items-table')
    const countEl = this.element.querySelector('#items-count')
    
    countEl.textContent = this.filteredItems.length

    if (this.filteredItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package"></i>
          <p>Nenhum item encontrado</p>
        </div>
      `
      return
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Quantidade</th>
              <th>Estoque Mínimo</th>
              <th>Preço Unit.</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredItems.map(item => `
              <tr>
                <td>
                  <div class="item-info">
                    <h4>${item.name}</h4>
                    ${item.description ? `<p>${item.description}</p>` : ''}
                  </div>
                </td>
                <td><span class="badge">${item.category}</span></td>
                <td>
                  <span class="quantity ${item.quantity <= item.minimum_stock ? 'low-stock' : ''}">${item.quantity}</span>
                </td>
                <td>${item.minimum_stock}</td>
                <td>${item.unit_price ? this.formatCurrency(item.unit_price) : '-'}</td>
                <td>
                  <span class="badge ${this.getStatusClass(item)}">
                    ${this.getStatusText(item)}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="btn btn-ghost btn-sm" onclick="inventoryPage.editItem('${item.id}')" title="Editar">
                      <i data-lucide="edit"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="inventoryPage.showMovementModal('${item.id}')" title="Movimentar">
                      <i data-lucide="move"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm btn-danger" onclick="inventoryPage.deleteItem('${item.id}')" title="Excluir">
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

    // Definir referência global para os métodos
    window.inventoryPage = this
  }

  renderItemsError() {
    const container = this.element.querySelector('#items-table')
    container.innerHTML = `
      <div class="error-state">
        <i data-lucide="alert-circle"></i>
        <p>Erro ao carregar itens</p>
      </div>
    `
  }

  updateStats() {
    const totalItems = this.items.length
    const lowStockItems = this.items.filter(item => item.quantity <= item.minimum_stock).length
    const inventoryValue = this.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.unit_price || 0))
    }, 0)

    const totalEl = this.element.querySelector('#total-items')
    const lowStockEl = this.element.querySelector('#low-stock-items')
    const valueEl = this.element.querySelector('#inventory-value')

    if (totalEl) totalEl.textContent = totalItems
    if (lowStockEl) lowStockEl.textContent = lowStockItems
    if (valueEl) valueEl.textContent = this.formatCurrency(inventoryValue)
  }

  getStatusClass(item) {
    if (item.status === 'inativo') return 'badge-secondary'
    if (item.quantity <= item.minimum_stock) return 'badge-warning'
    return 'badge-success'
  }

  getStatusText(item) {
    if (item.status === 'inativo') return 'Inativo'
    if (item.quantity <= item.minimum_stock) return 'Baixo Estoque'
    return 'Ativo'
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  setupEventListeners() {
    // Botão adicionar item
    const addBtn = this.element.querySelector('#add-item-btn')
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showAddItemModal()
      })
    }

    // Busca
    const searchInput = this.element.querySelector('#search-input')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value
        this.filterItems()
      })
    }

    // Filtros
    const categoryFilter = this.element.querySelector('#category-filter')
    const statusFilter = this.element.querySelector('#status-filter')

    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        this.filterItems()
      })
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.filterItems()
      })
    }

    // Modais
    this.setupModalEvents()
  }

  setupModalEvents() {
    // Modal principal
    const modal = this.element.querySelector('#item-modal')
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
        this.saveItem()
      })
    }

    // Modal de movimentação
    const movementModal = this.element.querySelector('#movement-modal')
    const closeMovementBtn = this.element.querySelector('#close-movement-modal')
    const cancelMovementBtn = this.element.querySelector('#cancel-movement-btn')
    const saveMovementBtn = this.element.querySelector('#save-movement-btn')

    if (closeMovementBtn) {
      closeMovementBtn.addEventListener('click', () => {
        this.hideMovementModal()
      })
    }

    if (cancelMovementBtn) {
      cancelMovementBtn.addEventListener('click', () => {
        this.hideMovementModal()
      })
    }

    if (saveMovementBtn) {
      saveMovementBtn.addEventListener('click', () => {
        this.saveMovement()
      })
    }

    // Fechar modais ao clicar no backdrop
    if (modal) {
      const backdrop = modal.querySelector('.modal-backdrop')
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          this.hideModal()
        })
      }
    }

    if (movementModal) {
      const backdrop = movementModal.querySelector('.modal-backdrop')
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          this.hideMovementModal()
        })
      }
    }
  }

  filterItems() {
    const categoryFilter = this.element.querySelector('#category-filter').value
    const statusFilter = this.element.querySelector('#status-filter').value

    this.filteredItems = this.items.filter(item => {
      const matchesSearch = !this.searchTerm || 
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(this.searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

      let matchesStatus = true
      if (statusFilter === 'baixo_estoque') {
        matchesStatus = item.quantity <= item.minimum_stock
      } else if (statusFilter !== 'all') {
        matchesStatus = item.status === statusFilter
      }

      return matchesSearch && matchesCategory && matchesStatus
    })

    this.renderItems()
  }

  showAddItemModal() {
    this.editingItem = null
    this.element.querySelector('#modal-title').textContent = 'Adicionar Item'
    this.element.querySelector('#item-form').reset()
    this.element.querySelector('#item-modal').classList.add('active')
  }

  editItem(itemId) {
    this.editingItem = this.items.find(item => item.id === itemId)
    if (!this.editingItem) return

    this.element.querySelector('#modal-title').textContent = 'Editar Item'
    
    // Preencher formulário
    const form = this.element.querySelector('#item-form')
    form.querySelector('#item-name').value = this.editingItem.name || ''
    form.querySelector('#item-category').value = this.editingItem.category || ''
    form.querySelector('#item-description').value = this.editingItem.description || ''
    form.querySelector('#item-quantity').value = this.editingItem.quantity || 0
    form.querySelector('#item-minimum').value = this.editingItem.minimum_stock || 0
    form.querySelector('#item-price').value = this.editingItem.unit_price || ''
    form.querySelector('#item-supplier').value = this.editingItem.supplier || ''
    form.querySelector('#item-location').value = this.editingItem.location || ''

    this.element.querySelector('#item-modal').classList.add('active')
  }

  hideModal() {
    this.element.querySelector('#item-modal').classList.remove('active')
    this.editingItem = null
  }

  showMovementModal(itemId) {
    const item = this.items.find(i => i.id === itemId)
    if (!item) return

    this.currentMovementItem = item
    
    // Mostrar informações do item
    const infoContainer = this.element.querySelector('#movement-item-info')
    infoContainer.innerHTML = `
      <div class="item-summary">
        <h4>${item.name}</h4>
        <p>Quantidade atual: <strong>${item.quantity}</strong></p>
        <p>Estoque mínimo: <strong>${item.minimum_stock}</strong></p>
      </div>
    `

    // Limpar formulário
    this.element.querySelector('#movement-form').reset()
    
    this.element.querySelector('#movement-modal').classList.add('active')
  }

  hideMovementModal() {
    this.element.querySelector('#movement-modal').classList.remove('active')
    this.currentMovementItem = null
  }

  async saveItem() {
    try {
      const form = this.element.querySelector('#item-form')
      const formData = new FormData(form)
      const itemData = Object.fromEntries(formData)

      if (!itemData.name || !itemData.category || !itemData.quantity) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }

      const currentUser = await authService.getCurrentUser()
      itemData.created_by = currentUser.id
      itemData.quantity = parseInt(itemData.quantity)
      itemData.minimum_stock = parseInt(itemData.minimum_stock) || 0
      itemData.unit_price = parseFloat(itemData.unit_price) || null

      let result
      if (this.editingItem) {
        result = await supabase
          .from('inventory_items')
          .update(itemData)
          .eq('id', this.editingItem.id)
      } else {
        result = await supabase
          .from('inventory_items')
          .insert([itemData])
      }

      if (result.error) throw result.error

      toast.success(`Item ${this.editingItem ? 'atualizado' : 'adicionado'} com sucesso!`)
      this.hideModal()
      await this.loadData()
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      toast.error('Erro ao salvar item')
    }
  }

  async saveMovement() {
    try {
      const form = this.element.querySelector('#movement-form')
      const formData = new FormData(form)
      const movementData = Object.fromEntries(formData)

      if (!movementData.movement_type || !movementData.quantity) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }

      const currentUser = await authService.getCurrentUser()
      movementData.item_id = this.currentMovementItem.id
      movementData.quantity = parseInt(movementData.quantity)
      movementData.created_by = currentUser.id

      // Calcular nova quantidade
      let newQuantity = this.currentMovementItem.quantity
      if (movementData.movement_type === 'entrada') {
        newQuantity += movementData.quantity
      } else if (movementData.movement_type === 'saida') {
        newQuantity -= movementData.quantity
        if (newQuantity < 0) {
          toast.error('Quantidade insuficiente em estoque')
          return
        }
      } else if (movementData.movement_type === 'ajuste') {
        newQuantity = movementData.quantity
      }

      // Salvar movimentação
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([movementData])

      if (movementError) throw movementError

      // Atualizar quantidade do item
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', this.currentMovementItem.id)

      if (updateError) throw updateError

      toast.success('Movimentação registrada com sucesso!')
      this.hideMovementModal()
      await this.loadData()
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error)
      toast.error('Erro ao salvar movimentação')
    }
  }

  async deleteItem(itemId) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      toast.success('Item excluído com sucesso!')
      await this.loadData()
    } catch (error) {
      console.error('Erro ao excluir item:', error)
      toast.error('Erro ao excluir item')
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 