import supabase from '../config/supabase.js'
import toast from '../components/toast.js'
import authService from '../services/auth.js'

export default class AppointmentsPage {
  constructor() {
    this.element = null
    this.currentDate = new Date()
    this.selectedDate = new Date()
    this.appointments = []
    this.clients = []
    this.editingAppointment = null
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'appointments-page'
    this.element.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">Agenda de Consultas</h1>
          <p class="page-subtitle">Gerencie agendamentos e consultas</p>
        </div>

        <div class="appointments-layout">
          <!-- Calendário -->
          <div class="calendar-section">
            <div class="calendar-widget">
              <div class="calendar-header">
                <h3 id="calendar-month-year">${this.getMonthYear(this.currentDate)}</h3>
                <div class="calendar-nav">
                  <button class="btn btn-ghost btn-sm" id="prev-month">
                    <i data-lucide="chevron-left"></i>
                  </button>
                  <button class="btn btn-ghost btn-sm" id="next-month">
                    <i data-lucide="chevron-right"></i>
                  </button>
                </div>
              </div>
              <div class="calendar-grid" id="calendar-grid">
                ${this.renderCalendar()}
              </div>
            </div>
          </div>

          <!-- Formulário e Lista -->
          <div class="appointments-content">
            <!-- Formulário de Agendamento -->
            <div class="appointment-form-section">
              <h3>
                <span id="form-title">Novo Agendamento</span>
                <span class="selected-date" id="selected-date-display">${this.formatDateFull(this.selectedDate)}</span>
              </h3>
              
              <form id="appointment-form" class="appointment-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="client-select">Cliente *</label>
                    <select id="client-select" name="client_id" required>
                      <option value="">Selecione um cliente</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="appointment-time">Horário *</label>
                    <input type="time" id="appointment-time" name="appointment_time" required>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="appointment-type">Tipo de Consulta *</label>
                    <select id="appointment-type" name="appointment_type" required>
                      <option value="">Selecione</option>
                      <option value="consulta">Consulta</option>
                      <option value="avaliacao">Avaliação</option>
                      <option value="sessao">Sessão</option>
                      <option value="retorno">Retorno</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="duration">Duração (min)</label>
                    <input type="number" id="duration" name="duration_minutes" value="60" min="15" step="15">
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="room">Sala</label>
                    <input type="text" id="room" name="room" placeholder="Ex: Sala 1">
                  </div>
                  <div class="form-group">
                    <label for="notes">Observações</label>
                    <input type="text" id="notes" name="notes" placeholder="Observações...">
                  </div>
                </div>
                
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary" id="clear-form-btn">
                    <i data-lucide="x"></i>
                    Limpar
                  </button>
                  <button type="submit" class="btn btn-primary" id="save-appointment-btn">
                    <i data-lucide="save"></i>
                    <span id="save-btn-text">Salvar Agendamento</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Lista de Agendamentos do Dia -->
            <div class="appointments-list-section">
              <h3>
                Agendamentos - <span id="appointments-date">${this.formatDateFull(this.selectedDate)}</span>
                <span class="appointments-count" id="appointments-count">0 agendamentos</span>
              </h3>
              
              <div class="appointments-list" id="appointments-list">
                <div class="empty-appointments" id="empty-appointments">
                  <i data-lucide="calendar-x"></i>
                  <p>Nenhum agendamento para este dia</p>
                </div>
              </div>
            </div>
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
      await this.loadClients()
      await this.loadAppointments()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
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

      this.clients = data || []
      this.updateClientSelect()
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  updateClientSelect() {
    const clientSelect = this.element.querySelector('#client-select')
    if (clientSelect) {
      clientSelect.innerHTML = '<option value="">Selecione um cliente</option>'
      this.clients.forEach(client => {
        clientSelect.innerHTML += `<option value="${client.id}">${client.name}</option>`
      })
    }
  }

  async loadAppointments() {
    try {
      const selectedDate = this.selectedDate.toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            name,
            phone,
            email
          )
        `)
        .eq('appointment_date', selectedDate)
        .order('appointment_time', { ascending: true })

      if (error) throw error

      this.appointments = data || []
      this.renderAppointments()
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
      this.renderAppointmentsError()
    }
  }

  renderAppointments() {
    const appointmentsList = this.element.querySelector('#appointments-list')
    const emptyState = this.element.querySelector('#empty-appointments')
    const countElement = this.element.querySelector('#appointments-count')

    if (this.appointments.length === 0) {
      emptyState.style.display = 'flex'
      countElement.textContent = '0 agendamentos'
      appointmentsList.innerHTML = ''
      appointmentsList.appendChild(emptyState)
      return
    }

    emptyState.style.display = 'none'
    countElement.textContent = `${this.appointments.length} agendamento${this.appointments.length > 1 ? 's' : ''}`

    appointmentsList.innerHTML = this.appointments.map(appointment => `
      <div class="appointment-card" data-id="${appointment.id}">
        <div class="appointment-time">
          ${this.formatTime(appointment.appointment_time)}
        </div>
        <div class="appointment-info">
          <h4>${appointment.clients?.name || 'Nome não encontrado'}</h4>
          <p>
            <span class="appointment-type">${this.getAppointmentTypeText(appointment.appointment_type)}</span>
            ${appointment.room ? `• ${appointment.room}` : ''}
          </p>
          ${appointment.notes ? `<small class="appointment-notes">${appointment.notes}</small>` : ''}
        </div>
        <div class="appointment-status">
          <span class="status-badge status-${appointment.status}">
            ${this.getStatusText(appointment.status)}
          </span>
        </div>
        <div class="appointment-actions">
          <button class="btn-icon btn-edit" onclick="window.editAppointment('${appointment.id}')" title="Editar">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="btn-icon btn-success" onclick="window.markAsCompleted('${appointment.id}')" title="Marcar como realizada">
            <i data-lucide="check"></i>
          </button>
          <button class="btn-icon btn-phone" onclick="window.callClient('${appointment.clients?.phone}')" title="Ligar para cliente">
            <i data-lucide="phone"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="window.cancelAppointment('${appointment.id}')" title="Cancelar">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
    `).join('')

    // Configurar métodos globais para os botões
    window.editAppointment = (id) => this.editAppointment(id)
    window.markAsCompleted = (id) => this.markAsCompleted(id)
    window.callClient = (phone) => this.callClient(phone)
    window.cancelAppointment = (id) => this.cancelAppointment(id)
  }

  renderAppointmentsError() {
    const appointmentsList = this.element.querySelector('#appointments-list')
    appointmentsList.innerHTML = `
      <div class="error-state">
        <i data-lucide="alert-circle"></i>
        <p>Erro ao carregar agendamentos</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Tentar novamente</button>
      </div>
    `
  }

  setupEventListeners() {
    // Navegação do calendário
    const prevMonth = this.element.querySelector('#prev-month')
    const nextMonth = this.element.querySelector('#next-month')

    prevMonth.addEventListener('click', () => this.changeMonth(-1))
    nextMonth.addEventListener('click', () => this.changeMonth(1))

    // Formulário
    const form = this.element.querySelector('#appointment-form')
    const clearBtn = this.element.querySelector('#clear-form-btn')

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      this.saveAppointment()
    })

    clearBtn.addEventListener('click', () => this.clearForm())

    // Configurar eventos do calendário
    this.setupCalendarEvents()
  }

  setupCalendarEvents() {
    const calendarGrid = this.element.querySelector('#calendar-grid')
    calendarGrid.addEventListener('click', (e) => {
      const dayElement = e.target.closest('.calendar-day')
      if (dayElement && !dayElement.classList.contains('other-month')) {
        // Remover seleção anterior
        this.element.querySelectorAll('.calendar-day').forEach(day => {
          day.classList.remove('selected')
        })
        
        // Adicionar seleção atual
        dayElement.classList.add('selected')
        
        // Atualizar data selecionada
        const day = parseInt(dayElement.textContent)
        this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day)
        
        // Atualizar displays
        this.updateDateDisplays()
        
        // Carregar agendamentos da nova data
        this.loadAppointments()
      }
    })
  }

  updateDateDisplays() {
    const selectedDateDisplay = this.element.querySelector('#selected-date-display')
    const appointmentsDate = this.element.querySelector('#appointments-date')
    
    if (selectedDateDisplay) {
      selectedDateDisplay.textContent = this.formatDateFull(this.selectedDate)
    }
    if (appointmentsDate) {
      appointmentsDate.textContent = this.formatDateFull(this.selectedDate)
    }
  }

  async saveAppointment() {
    try {
      const form = this.element.querySelector('#appointment-form')
      const formData = new FormData(form)
      const appointmentData = Object.fromEntries(formData)

      // Validar dados
      if (!appointmentData.client_id || !appointmentData.appointment_time || !appointmentData.appointment_type) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      // Adicionar data selecionada
      appointmentData.appointment_date = this.selectedDate.toISOString().split('T')[0]
      
      // Adicionar dados do usuário logado
      const currentUser = await authService.getCurrentUser()
      appointmentData.professional_id = currentUser.id
      appointmentData.created_by = currentUser.id
      appointmentData.status = 'agendado'

      let result
      if (this.editingAppointment) {
        result = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', this.editingAppointment)
      } else {
        result = await supabase
          .from('appointments')
          .insert([appointmentData])
      }

      if (result.error) throw result.error

      toast.success(`Agendamento ${this.editingAppointment ? 'atualizado' : 'criado'} com sucesso!`)
      this.clearForm()
      await this.loadAppointments()
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
      toast.error('Erro ao salvar agendamento')
    }
  }

  async editAppointment(appointmentId) {
    try {
      const appointment = this.appointments.find(a => a.id === appointmentId)
      if (!appointment) return

      // Preencher formulário
      const form = this.element.querySelector('#appointment-form')
      form.querySelector('#client-select').value = appointment.client_id
      form.querySelector('#appointment-time').value = appointment.appointment_time
      form.querySelector('#appointment-type').value = appointment.appointment_type
      form.querySelector('#duration').value = appointment.duration_minutes || 60
      form.querySelector('#room').value = appointment.room || ''
      form.querySelector('#notes').value = appointment.notes || ''

      // Atualizar interface
      this.editingAppointment = appointmentId
      this.element.querySelector('#form-title').textContent = 'Editar Agendamento'
      this.element.querySelector('#save-btn-text').textContent = 'Atualizar Agendamento'
    } catch (error) {
      console.error('Erro ao editar agendamento:', error)
    }
  }

  async markAsCompleted(appointmentId) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'realizado' })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Consulta marcada como realizada!')
      await this.loadAppointments()
    } catch (error) {
      console.error('Erro ao marcar como realizada:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  callClient(phone) {
    if (phone) {
      window.open(`tel:${phone}`)
    } else {
      toast.error('Telefone não disponível')
    }
  }

  async cancelAppointment(appointmentId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelado' })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Agendamento cancelado!')
      await this.loadAppointments()
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      toast.error('Erro ao cancelar agendamento')
    }
  }

  clearForm() {
    const form = this.element.querySelector('#appointment-form')
    form.reset()
    
    // Resetar estado de edição
    this.editingAppointment = null
    this.element.querySelector('#form-title').textContent = 'Novo Agendamento'
    this.element.querySelector('#save-btn-text').textContent = 'Salvar Agendamento'
    
    // Definir valores padrão
    form.querySelector('#duration').value = 60
  }

  changeMonth(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction)
    
    // Atualizar calendário
    const calendarGrid = this.element.querySelector('#calendar-grid')
    const monthYear = this.element.querySelector('#calendar-month-year')
    
    calendarGrid.innerHTML = this.renderCalendar()
    monthYear.textContent = this.getMonthYear(this.currentDate)
    
    // Reconfigurar eventos
    this.setupCalendarEvents()
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear()
    const month = this.currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    let html = `
      <div class="calendar-weekdays">
        <div class="calendar-weekday">Dom</div>
        <div class="calendar-weekday">Seg</div>
        <div class="calendar-weekday">Ter</div>
        <div class="calendar-weekday">Qua</div>
        <div class="calendar-weekday">Qui</div>
        <div class="calendar-weekday">Sex</div>
        <div class="calendar-weekday">Sáb</div>
      </div>
      <div class="calendar-days">
    `
    
    const today = new Date()
    const selectedDay = this.selectedDate.getDate()
    const selectedMonth = this.selectedDate.getMonth()
    const selectedYear = this.selectedDate.getFullYear()
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const isCurrentMonth = currentDate.getMonth() === month
      const isToday = currentDate.toDateString() === today.toDateString()
      const isSelected = currentDate.getDate() === selectedDay && 
                        currentDate.getMonth() === selectedMonth && 
                        currentDate.getFullYear() === selectedYear
      
      let classes = 'calendar-day'
      if (!isCurrentMonth) classes += ' other-month'
      if (isToday) classes += ' today'
      if (isSelected) classes += ' selected'
      
      html += `<div class="${classes}" data-date="${currentDate.toISOString().split('T')[0]}">${currentDate.getDate()}</div>`
    }
    
    html += '</div>'
    return html
  }

  getAppointmentTypeText(type) {
    const types = {
      'consulta': 'Consulta',
      'avaliacao': 'Avaliação',
      'sessao': 'Sessão',
      'retorno': 'Retorno'
    }
    return types[type] || type
  }

  getStatusText(status) {
    const statuses = {
      'agendado': 'Agendado',
      'confirmado': 'Confirmado',
      'realizado': 'Realizado',
      'cancelado': 'Cancelado',
      'faltou': 'Faltou'
    }
    return statuses[status] || status
  }

  formatTime(timeString) {
    return timeString.substring(0, 5)
  }

  formatDate(date) {
    return date.toLocaleDateString('pt-BR')
  }

  formatDateFull(date) {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  getMonthYear(date) {
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    })
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 