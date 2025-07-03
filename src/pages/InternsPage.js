import supabase from '../config/supabase.js'
import toast from '../components/toast.js'
import router, { ROUTES } from '../utils/router.js'
import authService from '../services/auth.js'

export default class InternsPage {
  constructor() {
    this.element = null
    this.interns = []
    this.supervisionSessions = []
    this.isAddingIntern = false
    this.isSchedulingSupervision = false
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'interns-page'
    this.element.innerHTML = `
      <div class="page-header">
        <h1>
          <i data-lucide="graduation-cap"></i>
          Gestão de Estagiários
        </h1>
        <p>Supervisão e acompanhamento de estagiários</p>
        <div class="page-actions">
          <button class="btn btn-primary" id="add-intern-btn">
            <i data-lucide="user-plus"></i>
            Adicionar Estagiário
          </button>
          <button class="btn btn-secondary" id="schedule-supervision-btn">
            <i data-lucide="calendar-plus"></i>
            Agendar Supervisão
          </button>
        </div>
      </div>

      <div class="interns-content">
        <div class="interns-grid">
          <!-- Lista de Estagiários -->
          <div class="interns-list-card card">
            <div class="card-header">
              <h3>Estagiários Ativos</h3>
              <span class="badge" id="interns-count">0</span>
            </div>
            <div class="card-body">
              <div id="interns-list">
                <div class="loading-state">
                  <i data-lucide="loader"></i>
                  <p>Carregando estagiários...</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Supervisões Agendadas -->
          <div class="supervision-card card">
            <div class="card-header">
              <h3>Supervisões Agendadas</h3>
              <span class="badge" id="supervision-count">0</span>
            </div>
            <div class="card-body">
              <div id="supervision-list">
                <div class="loading-state">
                  <i data-lucide="loader"></i>
                  <p>Carregando supervisões...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para Adicionar Estagiário -->
      <div class="modal" id="add-intern-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h3>Adicionar Estagiário</h3>
            <button class="btn btn-ghost btn-sm" id="close-intern-modal">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="add-intern-form">
              <div class="form-group">
                <label for="intern-name">Nome Completo</label>
                <input type="text" id="intern-name" name="name" required>
              </div>
              <div class="form-group">
                <label for="intern-email">Email</label>
                <input type="email" id="intern-email" name="email" required>
              </div>
              <div class="form-group">
                <label for="intern-phone">Telefone</label>
                <input type="tel" id="intern-phone" name="phone" required>
              </div>
              <div class="form-group">
                <label for="intern-institution">Instituição</label>
                <input type="text" id="intern-institution" name="institution" required>
              </div>
              <div class="form-group">
                <label for="intern-supervisor">Supervisor</label>
                <select id="intern-supervisor" name="supervisor_id" required>
                  <option value="">Selecione um supervisor</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-intern-btn">Cancelar</button>
            <button class="btn btn-primary" id="save-intern-btn">Salvar</button>
          </div>
        </div>
      </div>

      <!-- Modal para Agendar Supervisão -->
      <div class="modal" id="schedule-supervision-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h3>Agendar Supervisão</h3>
            <button class="btn btn-ghost btn-sm" id="close-supervision-modal">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="schedule-supervision-form">
              <div class="form-group">
                <label for="supervision-intern">Estagiário</label>
                <select id="supervision-intern" name="intern_id" required>
                  <option value="">Selecione um estagiário</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="supervision-date">Data</label>
                  <input type="date" id="supervision-date" name="session_date" required>
                </div>
                <div class="form-group">
                  <label for="supervision-time">Horário</label>
                  <input type="time" id="supervision-time" name="session_time" required>
                </div>
              </div>
              <div class="form-group">
                <label for="supervision-topics">Tópicos a Discutir</label>
                <textarea id="supervision-topics" name="topics" rows="3" placeholder="Casos, dúvidas, objetivos da supervisão..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-supervision-btn">Cancelar</button>
            <button class="btn btn-primary" id="save-supervision-btn">Agendar</button>
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
      // Carregar estagiários
      await this.loadInterns()
      
      // Carregar supervisões
      await this.loadSupervisions()
      
      // Carregar supervisores para os selects
      await this.loadSupervisors()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  async loadInterns() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'intern')
        .order('name')

      if (error) throw error

      this.interns = data || []
      this.renderInterns()
    } catch (error) {
      console.error('Erro ao carregar estagiários:', error)
      this.renderInternsError()
    }
  }

  async loadSupervisions() {
    try {
      const { data, error } = await supabase
        .from('supervision_sessions')
        .select(`
          *,
          intern:intern_id (name, email),
          supervisor:supervisor_id (name)
        `)
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true })

      if (error) throw error

      this.supervisionSessions = data || []
      this.renderSupervisions()
    } catch (error) {
      console.error('Erro ao carregar supervisões:', error)
      this.renderSupervisionsError()
    }
  }

  async loadSupervisors() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('role', ['coordinator', 'staff'])
        .order('name')

      if (error) throw error

      const supervisorSelects = this.element.querySelectorAll('#intern-supervisor')
      supervisorSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione um supervisor</option>'
        data.forEach(supervisor => {
          select.innerHTML += `<option value="${supervisor.id}">${supervisor.name}</option>`
        })
      })
    } catch (error) {
      console.error('Erro ao carregar supervisores:', error)
    }
  }

  renderInterns() {
    const container = this.element.querySelector('#interns-list')
    const countEl = this.element.querySelector('#interns-count')
    
    countEl.textContent = this.interns.length

    if (this.interns.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="users"></i>
          <p>Nenhum estagiário cadastrado</p>
        </div>
      `
      return
    }

    container.innerHTML = this.interns.map(intern => `
      <div class="intern-item">
        <div class="intern-avatar">
          <i data-lucide="user"></i>
        </div>
        <div class="intern-info">
          <h4>${intern.name}</h4>
          <p>${intern.email}</p>
          <small>Cadastrado em ${new Date(intern.created_at).toLocaleDateString('pt-BR')}</small>
        </div>
        <div class="intern-actions">
          <button class="btn btn-ghost btn-sm" onclick="window.location.href='mailto:${intern.email}'">
            <i data-lucide="mail"></i>
          </button>
        </div>
      </div>
    `).join('')

    // Atualizar select de estagiários
    const internSelect = this.element.querySelector('#supervision-intern')
    if (internSelect) {
      internSelect.innerHTML = '<option value="">Selecione um estagiário</option>'
      this.interns.forEach(intern => {
        internSelect.innerHTML += `<option value="${intern.id}">${intern.name}</option>`
      })
    }
  }

  renderSupervisions() {
    const container = this.element.querySelector('#supervision-list')
    const countEl = this.element.querySelector('#supervision-count')
    
    countEl.textContent = this.supervisionSessions.length

    if (this.supervisionSessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="calendar"></i>
          <p>Nenhuma supervisão agendada</p>
        </div>
      `
      return
    }

    container.innerHTML = this.supervisionSessions.map(session => `
      <div class="supervision-item">
        <div class="supervision-date">
          <i data-lucide="calendar"></i>
          <span>${new Date(session.session_date).toLocaleDateString('pt-BR')}</span>
          <small>${session.session_time.substring(0, 5)}</small>
        </div>
        <div class="supervision-info">
          <h4>${session.intern?.name || 'Estagiário'}</h4>
          <p>Supervisor: ${session.supervisor?.name || 'Não definido'}</p>
          ${session.topics ? `<small>${session.topics}</small>` : ''}
        </div>
        <div class="supervision-status">
          <span class="badge ${session.status === 'agendado' ? 'badge-warning' : 'badge-success'}">${session.status}</span>
        </div>
      </div>
    `).join('')
  }

  renderInternsError() {
    const container = this.element.querySelector('#interns-list')
    container.innerHTML = `
      <div class="error-state">
        <i data-lucide="alert-circle"></i>
        <p>Erro ao carregar estagiários</p>
      </div>
    `
  }

  renderSupervisionsError() {
    const container = this.element.querySelector('#supervision-list')
    container.innerHTML = `
      <div class="error-state">
        <i data-lucide="alert-circle"></i>
        <p>Erro ao carregar supervisões</p>
      </div>
    `
  }

  setupEventListeners() {
    // Botão para adicionar estagiário
    const addInternBtn = this.element.querySelector('#add-intern-btn')
    if (addInternBtn) {
      addInternBtn.addEventListener('click', () => {
        this.showAddInternModal()
      })
    }

    // Botão para agendar supervisão
    const scheduleSupervisionBtn = this.element.querySelector('#schedule-supervision-btn')
    if (scheduleSupervisionBtn) {
      scheduleSupervisionBtn.addEventListener('click', () => {
        this.showScheduleSupervisionModal()
      })
    }

    // Modais
    this.setupModalEvents()
  }

  setupModalEvents() {
    // Modal de adicionar estagiário
    const addInternModal = this.element.querySelector('#add-intern-modal')
    const closeInternModal = this.element.querySelector('#close-intern-modal')
    const cancelInternBtn = this.element.querySelector('#cancel-intern-btn')
    const saveInternBtn = this.element.querySelector('#save-intern-btn')

    if (closeInternModal) {
      closeInternModal.addEventListener('click', () => {
        this.hideAddInternModal()
      })
    }

    if (cancelInternBtn) {
      cancelInternBtn.addEventListener('click', () => {
        this.hideAddInternModal()
      })
    }

    if (saveInternBtn) {
      saveInternBtn.addEventListener('click', () => {
        this.saveIntern()
      })
    }

    // Modal de agendar supervisão
    const scheduleSupervisionModal = this.element.querySelector('#schedule-supervision-modal')
    const closeSupervisionModal = this.element.querySelector('#close-supervision-modal')
    const cancelSupervisionBtn = this.element.querySelector('#cancel-supervision-btn')
    const saveSupervisionBtn = this.element.querySelector('#save-supervision-btn')

    if (closeSupervisionModal) {
      closeSupervisionModal.addEventListener('click', () => {
        this.hideScheduleSupervisionModal()
      })
    }

    if (cancelSupervisionBtn) {
      cancelSupervisionBtn.addEventListener('click', () => {
        this.hideScheduleSupervisionModal()
      })
    }

    if (saveSupervisionBtn) {
      saveSupervisionBtn.addEventListener('click', () => {
        this.saveSupervision()
      })
    }

    // Fechar modal ao clicar no backdrop
    if (addInternModal) {
      const backdrop = addInternModal.querySelector('.modal-backdrop')
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          this.hideAddInternModal()
        })
      }
    }

    if (scheduleSupervisionModal) {
      const backdrop = scheduleSupervisionModal.querySelector('.modal-backdrop')
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          this.hideScheduleSupervisionModal()
        })
      }
    }
  }

  showAddInternModal() {
    const modal = this.element.querySelector('#add-intern-modal')
    if (modal) {
      modal.classList.add('active')
    }
  }

  hideAddInternModal() {
    const modal = this.element.querySelector('#add-intern-modal')
    if (modal) {
      modal.classList.remove('active')
      // Limpar formulário
      const form = this.element.querySelector('#add-intern-form')
      if (form) {
        form.reset()
      }
    }
  }

  showScheduleSupervisionModal() {
    const modal = this.element.querySelector('#schedule-supervision-modal')
    if (modal) {
      modal.classList.add('active')
      // Definir data mínima como hoje
      const dateInput = this.element.querySelector('#supervision-date')
      if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0]
      }
    }
  }

  hideScheduleSupervisionModal() {
    const modal = this.element.querySelector('#schedule-supervision-modal')
    if (modal) {
      modal.classList.remove('active')
      // Limpar formulário
      const form = this.element.querySelector('#schedule-supervision-form')
      if (form) {
        form.reset()
      }
    }
  }

  async saveIntern() {
    try {
      const form = this.element.querySelector('#add-intern-form')
      const formData = new FormData(form)
      const internData = Object.fromEntries(formData)

      if (!internData.name || !internData.email || !internData.supervisor_id) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }

      // Simular adição do estagiário (seria necessário criar usuário real)
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          email: internData.email,
          name: internData.name,
          role: 'intern'
        }])

      if (error) throw error

      toast.success('Estagiário adicionado com sucesso!')
      this.hideAddInternModal()
      await this.loadInterns()
    } catch (error) {
      console.error('Erro ao salvar estagiário:', error)
      toast.error('Erro ao salvar estagiário')
    }
  }

  async saveSupervision() {
    try {
      const form = this.element.querySelector('#schedule-supervision-form')
      const formData = new FormData(form)
      const supervisionData = Object.fromEntries(formData)

      if (!supervisionData.intern_id || !supervisionData.session_date || !supervisionData.session_time) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }

      const currentUser = await authService.getCurrentUser()
      supervisionData.supervisor_id = currentUser.id
      supervisionData.created_by = currentUser.id

      const { data, error } = await supabase
        .from('supervision_sessions')
        .insert([supervisionData])

      if (error) throw error

      toast.success('Supervisão agendada com sucesso!')
      this.hideScheduleSupervisionModal()
      await this.loadSupervisions()
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