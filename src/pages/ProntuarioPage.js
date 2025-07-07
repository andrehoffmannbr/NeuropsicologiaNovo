import supabase from '../config/supabase.js'
import { toast } from '../components/toast.js'

export default class ProntuarioPage {
  constructor() {
    this.element = null
    this.currentClient = null
    this.currentProntuario = null
    this.activeTab = 'laudo'
    this.testesDisponiveis = []
    this.testesAplicados = []
    this.valorTotal = 0
  }

  async render(container) {
    console.log('📋 PRONTUÁRIO: Iniciando renderização...')
    
    this.element = document.createElement('div')
    this.element.className = 'prontuario-page'
    
    try {
      await this.loadTestesDisponiveis()
      this.renderContent()
      this.setupEventListeners()
      this.init()
      
      container.innerHTML = ''
      container.appendChild(this.element)
      
      console.log('✅ PRONTUÁRIO: Renderizado com sucesso')
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro na renderização:', error)
      this.renderError(error.message)
    }
  }

  renderContent() {
    this.element.innerHTML = `
      <div class="prontuario-container">
        <div class="prontuario-header">
          <h2><i data-lucide="file-text"></i> Prontuário Eletrônico</h2>
          <p>Gestão completa do atendimento neuropsicológico</p>
        </div>

        <!-- Seleção do Paciente -->
        <div class="patient-selection">
          <div class="search-container">
            <label for="patient-search">Buscar Paciente:</label>
            <div class="search-input-group">
              <input 
                type="text" 
                id="patient-search" 
                placeholder="Digite o nome ou e-mail do paciente..."
                autocomplete="off"
              >
              <button id="new-prontuario-btn" class="btn btn-primary" disabled>
                <i data-lucide="plus"></i> Novo Prontuário
              </button>
            </div>
            <div id="search-results" class="search-results"></div>
          </div>
        </div>

        <!-- Dados do Paciente Selecionado -->
        <div id="patient-info" class="patient-info" style="display: none;">
          <div class="patient-card">
            <div class="patient-details"></div>
            <div class="prontuario-status"></div>
          </div>
        </div>

        <!-- Sub-abas do Prontuário -->
        <div id="prontuario-tabs" class="prontuario-tabs" style="display: none;">
          <nav class="tab-nav">
            <button class="tab-btn active" data-tab="laudo">
              <i data-lucide="file-text"></i> Laudo
            </button>
            <button class="tab-btn" data-tab="anamnese">
              <i data-lucide="clipboard-list"></i> Anamnese
            </button>
            <button class="tab-btn" data-tab="testes">
              <i data-lucide="brain"></i> Testes Aplicados
            </button>
          </nav>

          <!-- Conteúdo das Abas -->
          <div class="tab-content">
            <!-- Aba Laudo -->
            <div id="tab-laudo" class="tab-pane active">
              ${this.renderLaudoTab()}
            </div>

            <!-- Aba Anamnese -->
            <div id="tab-anamnese" class="tab-pane">
              ${this.renderAnamneseTab()}
            </div>

            <!-- Aba Testes -->
            <div id="tab-testes" class="tab-pane">
              ${this.renderTestesTab()}
            </div>
          </div>
        </div>

        <!-- Resumo Financeiro -->
        <div id="financial-summary" class="financial-summary" style="display: none;">
          <div class="summary-card">
            <h3><i data-lucide="calculator"></i> Resumo Financeiro</h3>
            <div class="value-breakdown">
              <div class="value-item">
                <span>Anamnese:</span>
                <span id="valor-anamnese">R$ 150,00</span>
              </div>
              <div class="value-item">
                <span>Testes Aplicados:</span>
                <span id="valor-testes">R$ 0,00</span>
              </div>
              <div class="value-total">
                <span>Total:</span>
                <span id="valor-total">R$ 150,00</span>
              </div>
            </div>
            <div class="action-buttons">
              <button id="close-treatment-btn" class="btn btn-success">
                <i data-lucide="check-circle"></i> Fechar Atendimento
              </button>
              <button id="export-pdf-btn" class="btn btn-secondary">
                <i data-lucide="download"></i> Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  renderLaudoTab() {
    return `
      <div class="laudo-section">
        <h3>Laudo Neuropsicológico</h3>
        <form id="laudo-form">
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="laudo-titulo">Título do Laudo:</label>
              <input type="text" id="laudo-titulo" value="Laudo Neuropsicológico" required>
            </div>
            
            <div class="form-group full-width">
              <label for="laudo-queixa">Queixa Principal:</label>
              <textarea id="laudo-queixa" rows="3" placeholder="Descreva a queixa principal do paciente..."></textarea>
            </div>
            
            <div class="form-group full-width">
              <label for="laudo-historia">História Clínica:</label>
              <textarea id="laudo-historia" rows="4" placeholder="Histórico clínico relevante..."></textarea>
            </div>
            
            <div class="form-group full-width">
              <label for="laudo-observacoes">Observações Comportamentais:</label>
              <textarea id="laudo-observacoes" rows="3" placeholder="Observações durante a avaliação..."></textarea>
            </div>
            
            <div class="form-group full-width">
              <label for="laudo-resultados">Resultados dos Testes:</label>
              <textarea id="laudo-resultados" rows="4" placeholder="Análise dos resultados dos testes aplicados..."></textarea>
            </div>
            
            <div class="form-group full-width">
              <label for="laudo-conclusoes">Conclusões:</label>
              <textarea id="laudo-conclusoes" rows="4" placeholder="Conclusões diagnósticas..."></textarea>
            </div>
            
            <div class="form-group full-width">
              <label for="laudo-recomendacoes">Recomendações:</label>
              <textarea id="laudo-recomendacoes" rows="4" placeholder="Recomendações terapêuticas e orientações..."></textarea>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              <i data-lucide="save"></i> Salvar Laudo
            </button>
            <button type="button" id="clear-laudo" class="btn btn-secondary">
              <i data-lucide="refresh-ccw"></i> Limpar
            </button>
          </div>
        </form>
      </div>
    `
  }

  renderAnamneseTab() {
    return `
      <div class="anamnese-section">
        <h3>Anamnese</h3>
        
        <div class="anamnese-type">
          <label>Tipo de Atendimento:</label>
          <select id="tipo-atendimento">
            <option value="infantil">Infantil (até 12 anos)</option>
            <option value="adulto">Adulto (13-59 anos)</option>
            <option value="idoso">Idoso (60+ anos)</option>
          </select>
        </div>
        
        <form id="anamnese-form">
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="anamnese-queixa">Queixa Principal:</label>
              <textarea id="anamnese-queixa" rows="3" placeholder="Motivo da consulta..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="anamnese-historia">História Clínica:</label>
              <textarea id="anamnese-historia" rows="4" placeholder="História clínica detalhada..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="anamnese-antecedentes">Antecedentes Médicos:</label>
              <textarea id="anamnese-antecedentes" rows="4" placeholder="Histórico médico..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="anamnese-medicamentos">Medicamentos em Uso:</label>
              <textarea id="anamnese-medicamentos" rows="3" placeholder="Medicações atuais..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="anamnese-familia">História Familiar:</label>
              <textarea id="anamnese-familia" rows="3" placeholder="Histórico familiar relevante..."></textarea>
            </div>
            
            <div id="campos-dinamicos" class="form-group full-width">
              <!-- Campos específicos por idade serão inseridos aqui -->
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              <i data-lucide="save"></i> Salvar Anamnese
            </button>
            <div class="anamnese-value">
              <span>Valor: <strong>R$ 150,00</strong></span>
            </div>
          </div>
        </form>
      </div>
    `
  }

  renderTestesTab() {
    return `
      <div class="testes-section">
        <h3>Testes Aplicados</h3>
        
        <!-- Adicionar Teste -->
        <div class="add-test-section">
          <h4>Adicionar Teste:</h4>
          <div class="test-selection">
            <select id="teste-categoria" class="test-filter">
              <option value="">Todas as categorias</option>
              <option value="cognitivo">Cognitivo</option>
              <option value="atencao">Atenção</option>
              <option value="memoria">Memória</option>
              <option value="funcoes_executivas">Funções Executivas</option>
              <option value="academico">Acadêmico</option>
              <option value="personalidade">Personalidade</option>
              <option value="neuropsicologico">Neuropsicológico</option>
            </select>
            
            <select id="teste-disponivel">
              <option value="">Selecione um teste...</option>
            </select>
            
            <button id="add-test-btn" class="btn btn-primary" disabled>
              <i data-lucide="plus"></i> Adicionar
            </button>
          </div>
        </div>
        
        <!-- Lista de Testes Aplicados -->
        <div class="applied-tests">
          <h4>Testes Aplicados:</h4>
          <div id="testes-aplicados-lista" class="tests-list">
            <p class="no-tests">Nenhum teste aplicado ainda</p>
          </div>
        </div>
        
        <!-- Resumo dos Testes -->
        <div class="tests-summary">
          <div class="summary-item">
            <span>Total de Testes:</span>
            <span id="total-testes">0</span>
          </div>
          <div class="summary-item">
            <span>Tempo Total Estimado:</span>
            <span id="tempo-total">0 min</span>
          </div>
          <div class="summary-item">
            <span>Valor Total dos Testes:</span>
            <span id="valor-testes-total">R$ 0,00</span>
          </div>
        </div>
      </div>
    `
  }

  async loadTestesDisponiveis() {
    try {
      console.log('📋 PRONTUÁRIO: Carregando catálogo de testes...')
      
      const { data: testes, error } = await supabase
        .from('testes_catalogo')
        .select('*')
        .eq('ativo', true)
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true })

      if (error) throw error

      this.testesDisponiveis = testes || []
      console.log('✅ PRONTUÁRIO: Testes carregados:', this.testesDisponiveis.length)
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao carregar testes:', error)
      this.testesDisponiveis = []
    }
  }

  setupEventListeners() {
    // Busca de pacientes
    const searchInput = this.element.querySelector('#patient-search')
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(this.searchPatients.bind(this), 300))
    }

    // Navegação de abas
    const tabButtons = this.element.querySelectorAll('.tab-btn')
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab))
    })

    // Novo prontuário
    const newProntuarioBtn = this.element.querySelector('#new-prontuario-btn')
    if (newProntuarioBtn) {
      newProntuarioBtn.addEventListener('click', this.createNewProntuario.bind(this))
    }

    // Formulários
    this.setupFormListeners()
    this.setupTestesListeners()
  }

  setupFormListeners() {
    // Formulário de laudo
    const laudoForm = this.element.querySelector('#laudo-form')
    if (laudoForm) {
      laudoForm.addEventListener('submit', this.saveLaudo.bind(this))
    }

    // Formulário de anamnese
    const anamneseForm = this.element.querySelector('#anamnese-form')
    if (anamneseForm) {
      anamneseForm.addEventListener('submit', this.saveAnamnese.bind(this))
    }

    // Tipo de atendimento
    const tipoAtendimento = this.element.querySelector('#tipo-atendimento')
    if (tipoAtendimento) {
      tipoAtendimento.addEventListener('change', this.updateCamposDinamicos.bind(this))
    }
  }

  setupTestesListeners() {
    // Filtro de categoria
    const categoriaSelect = this.element.querySelector('#teste-categoria')
    if (categoriaSelect) {
      categoriaSelect.addEventListener('change', this.filterTestes.bind(this))
    }

    // Seleção de teste
    const testeSelect = this.element.querySelector('#teste-disponivel')
    if (testeSelect) {
      testeSelect.addEventListener('change', this.updateAddTestButton.bind(this))
    }

    // Adicionar teste
    const addTestBtn = this.element.querySelector('#add-test-btn')
    if (addTestBtn) {
      addTestBtn.addEventListener('click', this.addTeste.bind(this))
    }

    // Fechar atendimento
    const closeTreatmentBtn = this.element.querySelector('#close-treatment-btn')
    if (closeTreatmentBtn) {
      closeTreatmentBtn.addEventListener('click', this.closeTreatment.bind(this))
    }

    // Carregar testes iniciais
    this.populateTestesSelect()
  }

  async searchPatients(e) {
    const query = e.target.value.trim()
    
    if (query.length < 2) {
      this.clearSearchResults()
      return
    }

    try {
      console.log('🔍 PRONTUÁRIO: Buscando pacientes:', query)
      
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)

      if (error) throw error

      this.displaySearchResults(clients || [])
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro na busca:', error)
      toast.error('Erro ao buscar pacientes')
    }
  }

  displaySearchResults(clients) {
    const resultsContainer = this.element.querySelector('#search-results')
    
    if (clients.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">Nenhum paciente encontrado</div>'
      return
    }

    resultsContainer.innerHTML = clients.map(client => `
      <div class="search-result-item" data-client-id="${client.id}">
        <div class="client-info">
          <strong>${client.name}</strong>
          <span>${client.email}</span>
          <small>${this.formatAge(client.birth_date)}</small>
        </div>
      </div>
    `).join('')

    // Adicionar event listeners
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const clientId = item.dataset.clientId
        this.selectPatient(clientId)
      })
    })
  }

  clearSearchResults() {
    const resultsContainer = this.element.querySelector('#search-results')
    if (resultsContainer) {
      resultsContainer.innerHTML = ''
    }
  }

  async selectPatient(clientId) {
    try {
      console.log('👤 PRONTUÁRIO: Selecionando paciente:', clientId)
      
      // Carregar dados do cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError

      this.currentClient = client
      
      // Verificar prontuários existentes
      await this.loadExistingProntuarios()
      
      this.displayPatientInfo()
      this.enableNewProntuario()
      this.clearSearchResults()
      
      toast.success(`Paciente ${client.name} selecionado`)
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao selecionar paciente:', error)
      toast.error('Erro ao carregar dados do paciente')
    }
  }

  async loadExistingProntuarios() {
    try {
      const { data: prontuarios, error } = await supabase
        .from('prontuarios')
        .select('*')
        .eq('client_id', this.currentClient.id)
        .order('data_abertura', { ascending: false })

      if (error) throw error

      this.existingProntuarios = prontuarios || []
      
      // Se tem prontuário aberto, carregar
      const openProntuario = prontuarios?.find(p => p.status === 'aberto' || p.status === 'em_andamento')
      if (openProntuario) {
        this.currentProntuario = openProntuario
        await this.loadProntuarioData()
      }
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao carregar prontuários:', error)
    }
  }

  displayPatientInfo() {
    const patientInfo = this.element.querySelector('#patient-info')
    const patientDetails = patientInfo.querySelector('.patient-details')
    const prontuarioStatus = patientInfo.querySelector('.prontuario-status')
    
    patientDetails.innerHTML = `
      <h3>${this.currentClient.name}</h3>
      <div class="patient-data">
        <p><strong>E-mail:</strong> ${this.currentClient.email}</p>
        <p><strong>Data de Nascimento:</strong> ${this.formatDate(this.currentClient.birth_date)}</p>
        <p><strong>Idade:</strong> ${this.formatAge(this.currentClient.birth_date)}</p>
        <p><strong>Telefone:</strong> ${this.currentClient.phone || 'Não informado'}</p>
      </div>
    `
    
    if (this.currentProntuario) {
      prontuarioStatus.innerHTML = `
        <div class="current-prontuario">
          <h4>Prontuário Atual</h4>
          <p><strong>Status:</strong> ${this.formatStatus(this.currentProntuario.status)}</p>
          <p><strong>Abertura:</strong> ${this.formatDate(this.currentProntuario.data_abertura)}</p>
          <p><strong>Valor Total:</strong> R$ ${this.currentProntuario.valor_total.toFixed(2)}</p>
        </div>
      `
      this.showProntuarioTabs()
    } else {
      prontuarioStatus.innerHTML = `
        <div class="no-prontuario">
          <p>Nenhum prontuário ativo para este paciente.</p>
          <p>Clique em "Novo Prontuário" para iniciar.</p>
        </div>
      `
    }
    
    patientInfo.style.display = 'block'
  }

  enableNewProntuario() {
    const newProntuarioBtn = this.element.querySelector('#new-prontuario-btn')
    if (newProntuarioBtn) {
      newProntuarioBtn.disabled = false
    }
  }

  showProntuarioTabs() {
    const tabsContainer = this.element.querySelector('#prontuario-tabs')
    const financialSummary = this.element.querySelector('#financial-summary')
    
    if (tabsContainer) tabsContainer.style.display = 'block'
    if (financialSummary) financialSummary.style.display = 'block'
    
    this.updateFinancialSummary()
  }

  // Utility functions
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  formatAge(birthDate) {
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    return `${age} anos`
  }

  formatStatus(status) {
    const statusMap = {
      'aberto': 'Aberto',
      'em_andamento': 'Em Andamento', 
      'fechado': 'Fechado'
    }
    return statusMap[status] || status
  }

  renderError(message) {
    this.element.innerHTML = `
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar Prontuário</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">
          Tentar Novamente
        </button>
      </div>
    `
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }

  async createNewProntuario() {
    if (!this.currentClient) {
      toast.error('Nenhum paciente selecionado')
      return
    }

    try {
      console.log('📋 PRONTUÁRIO: Criando novo prontuário para:', this.currentClient.name)
      
      const { data: prontuario, error } = await supabase
        .from('prontuarios')
        .insert([{
          client_id: this.currentClient.id,
          status: 'aberto',
          valor_total: 0.00,
          observacoes: ''
        }])
        .select()
        .single()

      if (error) throw error

      this.currentProntuario = prontuario
      await this.registrarHistorico('abertura', 'Prontuário criado')
      
      this.displayPatientInfo()
      this.showProntuarioTabs()
      
      toast.success('Novo prontuário criado com sucesso!')
      console.log('✅ PRONTUÁRIO: Criado:', prontuario.id)
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao criar prontuário:', error)
      toast.error('Erro ao criar prontuário')
    }
  }

  async loadProntuarioData() {
    if (!this.currentProntuario) return

    try {
      console.log('📋 PRONTUÁRIO: Carregando dados do prontuário:', this.currentProntuario.id)
      
      // Carregar anamnese
      const { data: anamnese } = await supabase
        .from('anamnese')
        .select('*')
        .eq('prontuario_id', this.currentProntuario.id)
        .single()

      if (anamnese) {
        this.populateAnamneseForm(anamnese)
      }

      // Carregar laudos
      const { data: laudos } = await supabase
        .from('laudos_prontuario')
        .select('*')
        .eq('prontuario_id', this.currentProntuario.id)
        .order('created_at', { ascending: false })

      if (laudos && laudos.length > 0) {
        this.populateLaudoForm(laudos[0])
      }

      // Carregar testes aplicados
      await this.loadTestesAplicados()
      
      console.log('✅ PRONTUÁRIO: Dados carregados com sucesso')
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao carregar dados:', error)
    }
  }

  async loadTestesAplicados() {
    if (!this.currentProntuario) return

    try {
      const { data: testes, error } = await supabase
        .from('testes_aplicados')
        .select('*')
        .eq('prontuario_id', this.currentProntuario.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      this.testesAplicados = testes || []
      this.updateTestesDisplay()
      this.updateFinancialSummary()
      
      console.log('✅ PRONTUÁRIO: Testes aplicados carregados:', this.testesAplicados.length)
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao carregar testes:', error)
    }
  }

  switchTab(tabName) {
    console.log('📋 PRONTUÁRIO: Mudando para aba:', tabName)
    
    this.activeTab = tabName
    
    // Atualizar botões das abas
    this.element.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    
    this.element.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
    
    // Atualizar conteúdo das abas
    this.element.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active')
    })
    
    this.element.querySelector(`#tab-${tabName}`).classList.add('active')
    
    // Carregar dados específicos da aba se necessário
    if (tabName === 'testes') {
      this.populateTestesSelect()
    } else if (tabName === 'anamnese') {
      this.updateCamposDinamicos()
    }
  }

  async saveLaudo(e) {
    e.preventDefault()
    
    if (!this.currentProntuario) {
      toast.error('Nenhum prontuário ativo')
      return
    }

    try {
      console.log('📋 PRONTUÁRIO: Salvando laudo...')
      
      const formData = new FormData(e.target)
      const laudoData = {
        prontuario_id: this.currentProntuario.id,
        titulo: formData.get('laudo-titulo') || 'Laudo Neuropsicológico',
        queixa_principal: formData.get('laudo-queixa'),
        historia_clinica: formData.get('laudo-historia'),
        observacoes_comportamentais: formData.get('laudo-observacoes'),
        resultados_testes: formData.get('laudo-resultados'),
        conclusoes: formData.get('laudo-conclusoes'),
        recomendacoes: formData.get('laudo-recomendacoes')
      }

      const { error } = await supabase
        .from('laudos_prontuario')
        .upsert(laudoData)

      if (error) throw error

      await this.registrarHistorico('laudo_criado', 'Laudo salvo')
      
      toast.success('Laudo salvo com sucesso!')
      console.log('✅ PRONTUÁRIO: Laudo salvo')
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao salvar laudo:', error)
      toast.error('Erro ao salvar laudo')
    }
  }

  async saveAnamnese(e) {
    e.preventDefault()
    
    if (!this.currentProntuario) {
      toast.error('Nenhum prontuário ativo')
      return
    }

    try {
      console.log('📋 PRONTUÁRIO: Salvando anamnese...')
      
      const formData = new FormData(e.target)
      const tipoAtendimento = this.element.querySelector('#tipo-atendimento').value
      
      const anamneseData = {
        prontuario_id: this.currentProntuario.id,
        tipo_atendimento: tipoAtendimento,
        queixa_principal: formData.get('anamnese-queixa'),
        historia_clinica: formData.get('anamnese-historia'),
        antecedentes_medicos: formData.get('anamnese-antecedentes'),
        medicamentos_uso: formData.get('anamnese-medicamentos'),
        historia_familiar: formData.get('anamnese-familia'),
        campos_customizados: this.getCamposDinamicos(),
        valor: 150.00
      }

      const { error } = await supabase
        .from('anamnese')
        .upsert(anamneseData)

      if (error) throw error

      await this.registrarHistorico('anamnese_criada', 'Anamnese salva', 150.00)
      await this.updateProntuarioTotal()
      
      toast.success('Anamnese salva com sucesso!')
      console.log('✅ PRONTUÁRIO: Anamnese salva')
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao salvar anamnese:', error)
      toast.error('Erro ao salvar anamnese')
    }
  }

  getCamposDinamicos() {
    const campos = {}
    const dinamicosContainer = this.element.querySelector('#campos-dinamicos')
    
    if (dinamicosContainer) {
      dinamicosContainer.querySelectorAll('input, textarea, select').forEach(field => {
        if (field.name) {
          campos[field.name] = field.value
        }
      })
    }
    
    return campos
  }

  updateCamposDinamicos() {
    const tipoAtendimento = this.element.querySelector('#tipo-atendimento').value
    const container = this.element.querySelector('#campos-dinamicos')
    
    if (!container) return
    
    let camposHTML = ''
    
    if (tipoAtendimento === 'infantil') {
      camposHTML = `
        <h4>Campos Específicos - Atendimento Infantil</h4>
        <div class="form-group">
          <label for="desenvolvimento">Desenvolvimento Neuropsicomotor:</label>
          <textarea name="desenvolvimento" rows="3" placeholder="Marcos do desenvolvimento..."></textarea>
        </div>
        <div class="form-group">
          <label for="historia-escolar">História Escolar:</label>
          <textarea name="historia-escolar" rows="3" placeholder="Desempenho escolar, dificuldades..."></textarea>
        </div>
        <div class="form-group">
          <label for="comportamento">Aspectos Comportamentais:</label>
          <textarea name="comportamento" rows="3" placeholder="Comportamento em casa e na escola..."></textarea>
        </div>
      `
    } else if (tipoAtendimento === 'adulto') {
      camposHTML = `
        <h4>Campos Específicos - Atendimento Adulto</h4>
        <div class="form-group">
          <label for="historia-profissional">História Profissional:</label>
          <textarea name="historia-profissional" rows="3" placeholder="Histórico profissional..."></textarea>
        </div>
        <div class="form-group">
          <label for="relacionamentos">Relacionamentos:</label>
          <textarea name="relacionamentos" rows="3" placeholder="Relacionamentos familiares e sociais..."></textarea>
        </div>
        <div class="form-group">
          <label for="autonomia">Autonomia e Independência:</label>
          <textarea name="autonomia" rows="3" placeholder="Nível de autonomia..."></textarea>
        </div>
      `
    } else if (tipoAtendimento === 'idoso') {
      camposHTML = `
        <h4>Campos Específicos - Atendimento Idoso</h4>
        <div class="form-group">
          <label for="funcionalidade">Funcionalidade:</label>
          <textarea name="funcionalidade" rows="3" placeholder="Capacidade funcional..."></textarea>
        </div>
        <div class="form-group">
          <label for="cognitividade">Estado Cognitivo:</label>
          <textarea name="cognitividade" rows="3" placeholder="Avaliação cognitiva..."></textarea>
        </div>
        <div class="form-group">
          <label for="suporte-social">Suporte Social:</label>
          <textarea name="suporte-social" rows="3" placeholder="Rede de apoio..."></textarea>
        </div>
      `
    }
    
    container.innerHTML = camposHTML
  }

  populateTestesSelect() {
    const testeSelect = this.element.querySelector('#teste-disponivel')
    const categoria = this.element.querySelector('#teste-categoria').value
    
    if (!testeSelect) return
    
    let testesParaExibir = this.testesDisponiveis
    
    if (categoria) {
      testesParaExibir = this.testesDisponiveis.filter(teste => teste.categoria === categoria)
    }
    
    testeSelect.innerHTML = '<option value="">Selecione um teste...</option>' +
      testesParaExibir.map(teste => 
        `<option value="${teste.id}">${teste.nome} - R$ ${teste.valor.toFixed(2)}</option>`
      ).join('')
  }

  filterTestes() {
    this.populateTestesSelect()
    this.updateAddTestButton()
  }

  updateAddTestButton() {
    const testeSelect = this.element.querySelector('#teste-disponivel')
    const addBtn = this.element.querySelector('#add-test-btn')
    
    if (addBtn && testeSelect) {
      addBtn.disabled = !testeSelect.value
    }
  }

  async addTeste() {
    const testeSelect = this.element.querySelector('#teste-disponivel')
    const testeId = testeSelect.value
    
    if (!testeId || !this.currentProntuario) return
    
    try {
      console.log('📋 PRONTUÁRIO: Adicionando teste:', testeId)
      
      const teste = this.testesDisponiveis.find(t => t.id === testeId)
      if (!teste) throw new Error('Teste não encontrado')
      
      const { data: testeAplicado, error } = await supabase
        .from('testes_aplicados')
        .insert([{
          prontuario_id: this.currentProntuario.id,
          teste_id: teste.id,
          nome_teste: teste.nome,
          valor: teste.valor,
          data_aplicacao: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (error) throw error

      this.testesAplicados.push(testeAplicado)
      await this.registrarHistorico('teste_adicionado', `Teste ${teste.nome} adicionado`, teste.valor)
      
      this.updateTestesDisplay()
      this.updateFinancialSummary()
      await this.updateProntuarioTotal()
      
      // Resetar seleção
      testeSelect.value = ''
      this.updateAddTestButton()
      
      toast.success(`Teste ${teste.nome} adicionado com sucesso!`)
      console.log('✅ PRONTUÁRIO: Teste adicionado')
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao adicionar teste:', error)
      toast.error('Erro ao adicionar teste')
    }
  }

  updateTestesDisplay() {
    const lista = this.element.querySelector('#testes-aplicados-lista')
    
    if (!lista) return
    
    if (this.testesAplicados.length === 0) {
      lista.innerHTML = '<p class="no-tests">Nenhum teste aplicado ainda</p>'
      return
    }
    
    lista.innerHTML = this.testesAplicados.map(teste => `
      <div class="test-item" data-test-id="${teste.id}">
        <div class="test-info">
          <h5>${teste.nome_teste}</h5>
          <p>Aplicado em: ${this.formatDate(teste.data_aplicacao)}</p>
        </div>
        <div class="test-value">R$ ${teste.valor.toFixed(2)}</div>
        <div class="test-actions">
          <button class="btn btn-small btn-danger" onclick="prontuarioPage.removeTeste('${teste.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `).join('')
    
    // Atualizar resumo
    this.updateTestesResume()
  }

  updateTestesResume() {
    const totalTestes = this.testesAplicados.length
    const valorTotal = this.testesAplicados.reduce((sum, teste) => sum + parseFloat(teste.valor), 0)
    const tempoTotal = this.testesAplicados.reduce((sum, teste) => {
      const testeOriginal = this.testesDisponiveis.find(t => t.id === teste.teste_id)
      return sum + (testeOriginal?.tempo_aplicacao || 0)
    }, 0)
    
    const totalTestesEl = this.element.querySelector('#total-testes')
    const tempoTotalEl = this.element.querySelector('#tempo-total')
    const valorTestesTotalEl = this.element.querySelector('#valor-testes-total')
    
    if (totalTestesEl) totalTestesEl.textContent = totalTestes
    if (tempoTotalEl) tempoTotalEl.textContent = `${tempoTotal} min`
    if (valorTestesTotalEl) valorTestesTotalEl.textContent = `R$ ${valorTotal.toFixed(2)}`
  }

  async removeTeste(testeId) {
    if (!confirm('Tem certeza que deseja remover este teste?')) return
    
    try {
      console.log('📋 PRONTUÁRIO: Removendo teste:', testeId)
      
      const { error } = await supabase
        .from('testes_aplicados')
        .delete()
        .eq('id', testeId)

      if (error) throw error

      this.testesAplicados = this.testesAplicados.filter(t => t.id !== testeId)
      
      await this.registrarHistorico('teste_removido', 'Teste removido')
      
      this.updateTestesDisplay()
      this.updateFinancialSummary()
      await this.updateProntuarioTotal()
      
      toast.success('Teste removido com sucesso!')
      console.log('✅ PRONTUÁRIO: Teste removido')
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao remover teste:', error)
      toast.error('Erro ao remover teste')
    }
  }

  updateFinancialSummary() {
    const valorAnamneseEl = this.element.querySelector('#valor-anamnese')
    const valorTestesEl = this.element.querySelector('#valor-testes')
    const valorTotalEl = this.element.querySelector('#valor-total')
    
    const valorAnamnese = 150.00
    const valorTestes = this.testesAplicados.reduce((sum, teste) => sum + parseFloat(teste.valor), 0)
    const valorTotal = valorAnamnese + valorTestes
    
    if (valorAnamneseEl) valorAnamneseEl.textContent = `R$ ${valorAnamnese.toFixed(2)}`
    if (valorTestesEl) valorTestesEl.textContent = `R$ ${valorTestes.toFixed(2)}`
    if (valorTotalEl) valorTotalEl.textContent = `R$ ${valorTotal.toFixed(2)}`
    
    this.valorTotal = valorTotal
  }

  async updateProntuarioTotal() {
    if (!this.currentProntuario) return
    
    try {
      const { error } = await supabase
        .from('prontuarios')
        .update({ valor_total: this.valorTotal })
        .eq('id', this.currentProntuario.id)

      if (error) throw error
      
      this.currentProntuario.valor_total = this.valorTotal
      console.log('✅ PRONTUÁRIO: Valor total atualizado:', this.valorTotal)
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao atualizar valor total:', error)
    }
  }

  async closeTreatment() {
    if (!this.currentProntuario) return
    
    if (!confirm(`Tem certeza que deseja fechar este atendimento?\n\nValor total: R$ ${this.valorTotal.toFixed(2)}`)) {
      return
    }
    
    try {
      console.log('📋 PRONTUÁRIO: Fechando atendimento...')
      
      const { error } = await supabase
        .from('prontuarios')
        .update({
          status: 'fechado',
          data_fechamento: new Date().toISOString(),
          valor_total: this.valorTotal
        })
        .eq('id', this.currentProntuario.id)

      if (error) throw error

      await this.registrarHistorico('fechamento', 'Atendimento fechado', this.valorTotal)
      
      this.currentProntuario.status = 'fechado'
      this.currentProntuario.data_fechamento = new Date().toISOString()
      
      toast.success('Atendimento fechado com sucesso!')
      
      // Atualizar interface
      this.displayPatientInfo()
      
      console.log('✅ PRONTUÁRIO: Atendimento fechado')
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao fechar atendimento:', error)
      toast.error('Erro ao fechar atendimento')
    }
  }

  async registrarHistorico(acao, descricao, valor = null) {
    try {
      const { error } = await supabase
        .from('prontuario_historico')
        .insert([{
          prontuario_id: this.currentProntuario.id,
          acao,
          descricao,
          valor_envolvido: valor
        }])

      if (error) throw error
      
      console.log('✅ PRONTUÁRIO: Histórico registrado:', acao)
    } catch (error) {
      console.error('❌ PRONTUÁRIO: Erro ao registrar histórico:', error)
    }
  }

  populateAnamneseForm(anamnese) {
    const form = this.element.querySelector('#anamnese-form')
    if (!form) return
    
    const fields = {
      'anamnese-queixa': anamnese.queixa_principal,
      'anamnese-historia': anamnese.historia_clinica,
      'anamnese-antecedentes': anamnese.antecedentes_medicos,
      'anamnese-medicamentos': anamnese.medicamentos_uso,
      'anamnese-familia': anamnese.historia_familiar
    }
    
    Object.entries(fields).forEach(([id, value]) => {
      const field = this.element.querySelector(`#${id}`)
      if (field && value) {
        field.value = value
      }
    })
    
    const tipoAtendimento = this.element.querySelector('#tipo-atendimento')
    if (tipoAtendimento && anamnese.tipo_atendimento) {
      tipoAtendimento.value = anamnese.tipo_atendimento
      this.updateCamposDinamicos()
    }
  }

  populateLaudoForm(laudo) {
    const form = this.element.querySelector('#laudo-form')
    if (!form) return
    
    const fields = {
      'laudo-titulo': laudo.titulo,
      'laudo-queixa': laudo.queixa_principal,
      'laudo-historia': laudo.historia_clinica,
      'laudo-observacoes': laudo.observacoes_comportamentais,
      'laudo-resultados': laudo.resultados_testes,
      'laudo-conclusoes': laudo.conclusoes,
      'laudo-recomendacoes': laudo.recomendacoes
    }
    
    Object.entries(fields).forEach(([id, value]) => {
      const field = this.element.querySelector(`#${id}`)
      if (field && value) {
        field.value = value
      }
    })
  }

  // Método para tornar removeTeste acessível globalmente
  init() {
    // Tornar métodos acessíveis globalmente para uso em onclick
    window.prontuarioPage = this
  }
} 