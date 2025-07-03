import supabase from '../config/supabase.js'
import toast from '../components/toast.js'
import router, { ROUTES } from '../utils/router.js'
import authService from '../services/auth.js'

export default class ClientsPage {
  constructor() {
    this.element = null
    this.isEditing = false
    this.clientId = null
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'clients-page'
    
    // Verificar se é edição
    const urlParams = new URLSearchParams(window.location.search)
    this.clientId = urlParams.get('id')
    this.isEditing = !!this.clientId

    this.element.innerHTML = `
      <div class="page-header">
        <h1>
          <i data-lucide="user-plus"></i>
          ${this.isEditing ? 'Editar Cliente' : 'Cadastrar Cliente'}
        </h1>
        <p>Formulário para ${this.isEditing ? 'edição' : 'cadastro'} de clientes</p>
      </div>

      <div class="clients-content">
        <div class="form-container">
          <form id="clientForm" class="client-form">
            <div class="form-section">
              <h3>Dados Pessoais</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="name">Nome Completo *</label>
                  <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                  <label for="cpf">CPF *</label>
                  <input type="text" id="cpf" name="cpf" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="birthDate">Data de Nascimento *</label>
                  <input type="date" id="birthDate" name="birthDate" required>
                </div>
                <div class="form-group">
                  <label for="phone">Telefone *</label>
                  <input type="tel" id="phone" name="phone" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="email">Email</label>
                  <input type="email" id="email" name="email">
                </div>
                <div class="form-group">
                  <label for="clientType">Tipo de Cliente *</label>
                  <select id="clientType" name="clientType" required>
                    <option value="">Selecione</option>
                    <option value="adulto">Adulto</option>
                    <option value="menor">Menor de Idade</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3>Endereço e Contatos</h3>
              <div class="form-row">
                <div class="form-group full-width">
                  <label for="address">Endereço</label>
                  <input type="text" id="address" name="address" placeholder="Rua, número, bairro, cidade, CEP">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="emergencyContact">Contato de Emergência</label>
                  <input type="text" id="emergencyContact" name="emergencyContact" placeholder="Nome do contato">
                </div>
                <div class="form-group">
                  <label for="emergencyPhone">Telefone de Emergência</label>
                  <input type="tel" id="emergencyPhone" name="emergencyPhone" placeholder="Telefone do contato">
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3>Informações Médicas</h3>
              <div class="form-row">
                <div class="form-group full-width">
                  <label for="medicalHistory">Histórico Médico</label>
                  <textarea id="medicalHistory" name="medicalHistory" rows="4" placeholder="Histórico médico relevante, medicamentos em uso, alergias, etc."></textarea>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="history.back()">
                <i data-lucide="arrow-left"></i>
                Voltar
              </button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="save"></i>
                ${this.isEditing ? 'Atualizar' : 'Cadastrar'} Cliente
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    container.appendChild(this.element)
    
    // Inicializar funcionalidades
    this.initializeEvents()
    
    // Carregar dados se estiver editando
    if (this.isEditing) {
      await this.loadClientData()
    }
  }

  initializeEvents() {
    const form = this.element.querySelector('#clientForm')
    
    // Submit do formulário
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.handleSubmit()
    })
  }

  async loadClientData() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', this.clientId)
        .single()

      if (error) throw error

      // Preencher formulário com os dados
      this.fillForm(data)
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error)
      toast.error('Erro ao carregar dados do cliente')
    }
  }

  fillForm(data) {
    const form = this.element.querySelector('#clientForm')
    
    // Mapear os nomes das colunas do banco para os campos do formulário
    const fieldMapping = {
      name: 'name',
      cpf: 'cpf',
      birth_date: 'birthDate',
      phone: 'phone',
      email: 'email',
      client_type: 'clientType',
      address: 'address',
      emergency_contact: 'emergencyContact',
      emergency_phone: 'emergencyPhone',
      medical_history: 'medicalHistory'
    }

    Object.keys(fieldMapping).forEach(dbField => {
      const formField = fieldMapping[dbField]
      const input = form.querySelector(`[name="${formField}"]`)
      if (input && data[dbField]) {
        input.value = data[dbField]
      }
    })
  }

  async handleSubmit() {
    try {
      const form = this.element.querySelector('#clientForm')
      const formData = new FormData(form)
      const rawData = Object.fromEntries(formData)

      // Mapear os nomes dos campos para os nomes corretos das colunas do banco
      const clientData = {
        name: rawData.name,
        cpf: rawData.cpf,
        birth_date: rawData.birthDate,  // birthDate -> birth_date
        phone: rawData.phone,
        email: rawData.email || null,
        client_type: rawData.clientType,  // clientType -> client_type
        address: rawData.address || null,
        emergency_contact: rawData.emergencyContact || null,
        emergency_phone: rawData.emergencyPhone || null,
        medical_history: rawData.medicalHistory || null,
        status: 'ativo'
      }

      // Adicionar dados do usuário logado
      const currentUser = await authService.getCurrentUser()
      clientData.created_by = currentUser.id
      clientData.updated_by = currentUser.id

      let result
      if (this.isEditing) {
        result = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', this.clientId)
      } else {
        result = await supabase
          .from('clients')
          .insert([clientData])
      }

      if (result.error) throw result.error

      toast.success(`Cliente ${this.isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`)
      router.navigateTo(ROUTES.ALL_CLIENTS)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      toast.error('Erro ao salvar cliente')
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 