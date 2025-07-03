import { supabase } from '../config/supabase.js'
import { authService } from '../services/auth.js'
import { toast } from '../components/toast.js'

export default class ColaboradoresPage {
  constructor() {
    this.element = null
    this.currentUserCargo = null
    this.currentUserId = null
  }

  async render(container) {
    // Verificar se usuário está logado
    const currentUser = await authService.getCurrentUser()
    if (!currentUser) {
      window.location.href = '/#/login'
      return
    }

    // Verificar se usuário é coordenador
    await this.checkUserPermissions()
    if (this.currentUserCargo !== 'coordenador') {
      container.innerHTML = `
        <div class="access-denied">
          <h2>Acesso Negado</h2>
          <p>Apenas coordenadores podem acessar esta página.</p>
          <button class="btn btn-primary" onclick="window.history.back()">Voltar</button>
        </div>
      `
      return
    }

    this.element = document.createElement('div')
    this.element.className = 'colaboradores-page'
    
    await this.renderContent()
    container.appendChild(this.element)
    await this.loadColaboradores()
  }

  async checkUserPermissions() {
    try {
      const currentUser = await authService.getCurrentUser()
      this.currentUserId = currentUser.id

      const { data: colaborador, error } = await supabase
        .from('colaboradores')
        .select('cargo')
        .eq('user_id', currentUser.id)
        .eq('ativo', true)
        .single()

      if (error) throw error
      this.currentUserCargo = colaborador?.cargo || null
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      this.currentUserCargo = null
    }
  }

  async renderContent() {
    this.element.innerHTML = `
      <div class="colaboradores-container">
        <div class="page-header">
          <h1>Gestão de Colaboradores</h1>
          <p>Cadastre novos colaboradores e gerencie promoções</p>
        </div>

        <div class="colaboradores-tabs">
          <button class="tab-btn active" id="tab-cadastro">Cadastrar Colaborador</button>
          <button class="tab-btn" id="tab-listagem">Gerenciar Colaboradores</button>
        </div>

        <!-- SEÇÃO CADASTRO -->
        <div class="tab-content" id="cadastro-section">
          <div class="cadastro-card">
            <h3>Cadastrar Novo Colaborador</h3>
            <form id="colaborador-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="nome">Nome Completo *</label>
                  <input 
                    type="text" 
                    id="nome" 
                    name="nome" 
                    required 
                    placeholder="Digite o nome completo"
                  >
                </div>
                <div class="form-group">
                  <label for="email">E-mail *</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    placeholder="email@exemplo.com"
                  >
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="telefone">Telefone</label>
                  <input 
                    type="tel" 
                    id="telefone" 
                    name="telefone" 
                    placeholder="(11) 99999-9999"
                  >
                </div>
                <div class="form-group">
                  <label for="senha">Senha Temporária *</label>
                  <input 
                    type="password" 
                    id="senha" 
                    name="senha" 
                    required 
                    placeholder="Mínimo 6 caracteres"
                    minlength="6"
                  >
                </div>
              </div>

              <div class="form-group">
                <label for="cargo">Cargo Inicial</label>
                <select id="cargo" name="cargo" disabled>
                  <option value="estagiario">Estagiário (padrão)</option>
                </select>
                <small>Novos colaboradores sempre começam como estagiários</small>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-outline" id="limpar-form">Limpar</button>
                <button type="submit" class="btn btn-primary">
                  <i data-lucide="user-plus"></i>
                  Cadastrar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- SEÇÃO LISTAGEM -->
        <div class="tab-content" id="listagem-section" style="display: none;">
          <div class="listagem-header">
            <h3>Colaboradores Cadastrados</h3>
            <div class="filtros">
              <select id="filtro-cargo">
                <option value="">Todos os cargos</option>
                <option value="estagiario">Estagiários</option>
                <option value="funcionario">Funcionários</option>
                <option value="coordenador">Coordenadores</option>
              </select>
              <input 
                type="text" 
                id="busca-nome" 
                placeholder="Buscar por nome..."
                class="search-input"
              >
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

    this.setupEventListeners()
  }

  setupEventListeners() {
    // Tabs
    const tabCadastro = this.element.querySelector('#tab-cadastro')
    const tabListagem = this.element.querySelector('#tab-listagem')

    tabCadastro?.addEventListener('click', () => this.showTab('cadastro'))
    tabListagem?.addEventListener('click', () => {
      this.showTab('listagem')
      this.loadColaboradores()
    })

    // Formulário de cadastro
    const form = this.element.querySelector('#colaborador-form')
    form?.addEventListener('submit', (e) => {
      e.preventDefault()
      this.cadastrarColaborador(form)
    })

    // Botão limpar
    const limparBtn = this.element.querySelector('#limpar-form')
    limparBtn?.addEventListener('click', () => {
      form.reset()
    })

    // Filtros
    const filtroCargo = this.element.querySelector('#filtro-cargo')
    const buscaNome = this.element.querySelector('#busca-nome')

    filtroCargo?.addEventListener('change', () => this.filterColaboradores())
    buscaNome?.addEventListener('input', () => this.filterColaboradores())
  }

  showTab(tab) {
    // Atualizar botões das tabs
    this.element.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'))
    this.element.querySelector(`#tab-${tab}`)?.classList.add('active')

    // Mostrar/esconder seções
    this.element.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none'
    })
    this.element.querySelector(`#${tab}-section`).style.display = 'block'
  }

  async cadastrarColaborador(form) {
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
      if (this.element.querySelector('#listagem-section').style.display !== 'none') {
        await this.loadColaboradores()
      }

    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error)
      toast.error('Erro inesperado ao cadastrar colaborador')
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

      this.renderColaboradores(colaboradores || [])
      this.updateStats(colaboradores || [])

    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
      this.element.querySelector('#colaboradores-lista').innerHTML = 
        '<p class="error">Erro ao carregar colaboradores</p>'
    }
  }

  renderColaboradores(colaboradores) {
    const lista = this.element.querySelector('#colaboradores-lista')
    
    if (colaboradores.length === 0) {
      lista.innerHTML = '<p class="no-data">Nenhum colaborador encontrado</p>'
      return
    }

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
          ${colaborador.user_id !== this.currentUserId ? `
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

  filterColaboradores() {
    const filtroCargo = this.element.querySelector('#filtro-cargo').value
    const buscaNome = this.element.querySelector('#busca-nome').value.toLowerCase()
    const cards = this.element.querySelectorAll('.colaborador-card')

    cards.forEach(card => {
      const cargo = card.dataset.cargo
      const nome = card.dataset.nome

      const matchCargo = !filtroCargo || cargo === filtroCargo
      const matchNome = !buscaNome || nome.includes(buscaNome)

      card.style.display = matchCargo && matchNome ? 'block' : 'none'
    })
  }

  updateStats(colaboradores) {
    const stats = {
      total: colaboradores.length,
      estagiarios: colaboradores.filter(c => c.cargo === 'estagiario').length,
      funcionarios: colaboradores.filter(c => c.cargo === 'funcionario').length,
      coordenadores: colaboradores.filter(c => c.cargo === 'coordenador').length
    }

    this.element.querySelector('#total-colaboradores').textContent = stats.total
    this.element.querySelector('#total-estagiarios').textContent = stats.estagiarios
    this.element.querySelector('#total-funcionarios').textContent = stats.funcionarios
    this.element.querySelector('#total-coordenadores').textContent = stats.coordenadores
  }

  formatCargo(cargo) {
    const cargos = {
      estagiario: 'Estagiário',
      funcionario: 'Funcionário',
      coordenador: 'Coordenador'
    }
    return cargos[cargo] || cargo
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 