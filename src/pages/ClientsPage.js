import supabase from '../config/supabase.js'
import toast from '../components/toast.js'
import router, { ROUTES } from '../utils/router.js'
import authService from '../services/auth.js'

export default class ClientsPage {
  constructor() {
    this.element = null
    this.isEditing = false
    this.clientId = null
    this.clientAge = null
    this.isMinor = false
  }

  async render(container) {
    console.log('🔧 ClientsPage - render chamado');
    
    this.element = document.createElement('div')
    this.element.className = 'clients-page'
    
    // Verificar se é edição
    const urlParams = new URLSearchParams(window.location.search)
    this.clientId = urlParams.get('id')
    this.isEditing = !!this.clientId
    
    console.log('🔧 ClientsPage - isEditing:', this.isEditing);
    console.log('🔧 ClientsPage - clientId:', this.clientId);

    this.element.innerHTML = `
      <div class="page-header">
        <h1>
          <i data-lucide="user-plus"></i>
          ${this.isEditing ? 'Editar Cliente' : 'Cadastrar Cliente'}
        </h1>
        <p>${this.isEditing ? 'Edite as informações do cliente' : 'Preencha os dados do cliente - o formulário se adapta automaticamente baseado na idade'}</p>
      </div>

      <div class="clients-content">
        <div class="form-container">
          <form id="clientForm" class="client-form">
            <!-- SEÇÃO INICIAL - DADOS BÁSICOS -->
            <div class="form-section">
              <h3>📋 Dados Básicos</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="name">Nome Completo *</label>
                  <input type="text" id="name" name="name" required placeholder="Nome completo do cliente">
                </div>
                <div class="form-group">
                  <label for="birthDate">Data de Nascimento *</label>
                  <input type="date" id="birthDate" name="birthDate" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="gender">Gênero *</label>
                  <select id="gender" name="gender" required>
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="nao-binario">Não-binário</option>
                    <option value="prefiro-nao-informar">Prefiro não informar</option>
                  </select>
                </div>
                <div class="form-group">
                  <div class="age-display" id="ageDisplay" style="display: none;">
                    <label>Idade Detectada</label>
                    <div class="age-badge">
                      <span id="ageText">-</span>
                      <span id="ageType">-</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- FORMULÁRIO DINÂMICO -->
            <div id="dynamicForm">
              <div class="form-loading">
                <i data-lucide="clock"></i>
                <p>Selecione a data de nascimento para continuar...</p>
              </div>
            </div>

            <!-- BOTÕES DE AÇÃO -->
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
      console.log('🔧 ClientsPage - Carregando dados do cliente para edição');
      await this.loadClientData()
    }
    
    console.log('🔧 ClientsPage - Render concluído');
  }

  initializeEvents() {
    console.log('🔧 ClientsPage - initializeEvents chamado');
    
    const form = this.element.querySelector('#clientForm')
    const birthDateInput = this.element.querySelector('#birthDate')
    
    if (!form) {
      console.error('❌ ClientsPage - Formulário não encontrado!');
      return;
    }
    
    // Evento para detectar mudança na data de nascimento
    birthDateInput.addEventListener('change', (e) => {
      console.log('🔧 ClientsPage - Data de nascimento alterada:', e.target.value);
      this.calculateAge(e.target.value)
      this.renderDynamicForm()
    })
    
    // Submit do formulário
    form.addEventListener('submit', async (e) => {
      console.log('🔧 ClientsPage - Submit do formulário');
      e.preventDefault()
      await this.handleSubmit()
    })
    
    console.log('🔧 ClientsPage - Event listeners adicionados');
  }

  calculateAge(birthDate) {
    if (!birthDate) {
      this.clientAge = null
      this.isMinor = false
      return
    }

    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    this.clientAge = age
    this.isMinor = age < 18

    console.log('🔧 ClientsPage - Idade calculada:', age, 'É menor:', this.isMinor)

    // Atualizar display da idade
    this.updateAgeDisplay()
  }

  updateAgeDisplay() {
    const ageDisplay = this.element.querySelector('#ageDisplay')
    const ageText = this.element.querySelector('#ageText')
    const ageType = this.element.querySelector('#ageType')

    if (this.clientAge !== null) {
      ageDisplay.style.display = 'block'
      ageText.textContent = `${this.clientAge} anos`
      ageType.textContent = this.isMinor ? 'MENOR DE IDADE' : 'MAIOR DE IDADE'
      ageType.className = this.isMinor ? 'age-minor' : 'age-adult'
    } else {
      ageDisplay.style.display = 'none'
    }
  }

  renderDynamicForm() {
    const dynamicForm = this.element.querySelector('#dynamicForm')
    
    if (this.clientAge === null) {
      dynamicForm.innerHTML = `
        <div class="form-loading">
          <i data-lucide="clock"></i>
          <p>Selecione a data de nascimento para continuar...</p>
        </div>
      `
      return
    }

    if (this.isMinor) {
      this.renderMinorForm(dynamicForm)
    } else {
      this.renderAdultForm(dynamicForm)
    }

    // Inicializar eventos específicos do formulário dinâmico
    this.initializeDynamicEvents()
  }

  renderMinorForm(container) {
    console.log('🔧 ClientsPage - Renderizando formulário para menor de idade')
    
    container.innerHTML = `
      <!-- DADOS PESSOAIS DO MENOR -->
      <div class="form-section">
        <h3>👶 Dados Pessoais do Menor</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="schoolName">Nome da Escola *</label>
            <input type="text" id="schoolName" name="schoolName" required placeholder="Nome da escola que frequenta">
          </div>
          <div class="form-group">
            <label for="schoolType">Tipo de Escola *</label>
            <select id="schoolType" name="schoolType" required>
              <option value="">Selecione</option>
              <option value="publica">Pública</option>
              <option value="privada">Privada</option>
              <option value="tecnica">Técnica</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="schoolGrade">Ano Escolar *</label>
            <select id="schoolGrade" name="schoolGrade" required>
              <option value="">Selecione</option>
              <option value="educacao-infantil">Educação Infantil</option>
              <option value="1-ano">1º Ano</option>
              <option value="2-ano">2º Ano</option>
              <option value="3-ano">3º Ano</option>
              <option value="4-ano">4º Ano</option>
              <option value="5-ano">5º Ano</option>
              <option value="6-ano">6º Ano</option>
              <option value="7-ano">7º Ano</option>
              <option value="8-ano">8º Ano</option>
              <option value="9-ano">9º Ano</option>
              <option value="1-medio">1º Médio</option>
              <option value="2-medio">2º Médio</option>
              <option value="3-medio">3º Médio</option>
            </select>
          </div>
          <div class="form-group">
            <label for="phone">Telefone de Contato *</label>
            <input type="tel" id="phone" name="phone" required placeholder="(11) 99999-9999">
          </div>
        </div>
      </div>

      <!-- DADOS DOS PAIS/RESPONSÁVEIS -->
      <div class="form-section">
        <h3>👨‍👩‍👧‍👦 Dados dos Pais/Responsáveis</h3>
        
        <!-- DADOS DO PAI -->
        <div class="parent-section">
          <h4>🧔 Dados do Pai</h4>
          <div class="form-row">
            <div class="form-group">
              <label for="fatherName">Nome do Pai *</label>
              <input type="text" id="fatherName" name="fatherName" required placeholder="Nome completo do pai">
            </div>
            <div class="form-group">
              <label for="fatherAge">Idade do Pai *</label>
              <input type="number" id="fatherAge" name="fatherAge" required min="18" max="99" placeholder="Ex: 35">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="fatherProfession">Profissão do Pai *</label>
              <input type="text" id="fatherProfession" name="fatherProfession" required placeholder="Profissão do pai">
            </div>
            <div class="form-group">
              <label for="fatherPhone">Telefone do Pai *</label>
              <input type="tel" id="fatherPhone" name="fatherPhone" required placeholder="(11) 99999-9999">
            </div>
          </div>
        </div>

        <!-- DADOS DA MÃE -->
        <div class="parent-section">
          <h4>👩 Dados da Mãe</h4>
          <div class="form-row">
            <div class="form-group">
              <label for="motherName">Nome da Mãe *</label>
              <input type="text" id="motherName" name="motherName" required placeholder="Nome completo da mãe">
            </div>
            <div class="form-group">
              <label for="motherAge">Idade da Mãe *</label>
              <input type="number" id="motherAge" name="motherAge" required min="18" max="99" placeholder="Ex: 33">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="motherProfession">Profissão da Mãe *</label>
              <input type="text" id="motherProfession" name="motherProfession" required placeholder="Profissão da mãe">
            </div>
            <div class="form-group">
              <label for="motherPhone">Telefone da Mãe *</label>
              <input type="tel" id="motherPhone" name="motherPhone" required placeholder="(11) 99999-9999">
            </div>
          </div>
        </div>

        <!-- RESPONSÁVEL FINANCEIRO -->
        <div class="form-row">
          <div class="form-group">
            <label for="financialResponsible">Responsável Financeiro *</label>
            <select id="financialResponsible" name="financialResponsible" required>
              <option value="">Selecione</option>
              <option value="pai">Pai</option>
              <option value="mae">Mãe</option>
              <option value="ambos">Ambos</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label for="otherResponsible">Outro Responsável</label>
            <input type="text" id="otherResponsible" name="otherResponsible" placeholder="Nome e parentesco (ex: Avó, Tio)">
          </div>
        </div>
      </div>

      <!-- ENDEREÇO -->
      <div class="form-section">
        <h3>📍 Endereço</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="cep">CEP *</label>
            <input type="text" id="cep" name="cep" required placeholder="00000-000" maxlength="9">
            <small class="field-help">Digite o CEP para preenchimento automático</small>
          </div>
          <div class="form-group">
            <label for="street">Logradouro *</label>
            <input type="text" id="street" name="street" required placeholder="Rua, Avenida, etc.">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="number">Número *</label>
            <input type="text" id="number" name="number" required placeholder="Número">
          </div>
          <div class="form-group">
            <label for="complement">Complemento</label>
            <input type="text" id="complement" name="complement" placeholder="Apartamento, Bloco, etc.">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="neighborhood">Bairro *</label>
            <input type="text" id="neighborhood" name="neighborhood" required placeholder="Bairro">
          </div>
          <div class="form-group">
            <label for="city">Cidade *</label>
            <input type="text" id="city" name="city" required placeholder="Cidade">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="state">Estado *</label>
            <select id="state" name="state" required>
              <option value="">Selecione</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
          </div>
          <div class="form-group">
            <label for="email">E-mail (Opcional)</label>
            <input type="email" id="email" name="email" placeholder="email@exemplo.com">
          </div>
        </div>
      </div>

      <!-- OUTRAS INFORMAÇÕES -->
      <div class="form-section">
        <h3>📝 Outras Informações</h3>
        <div class="form-row">
          <div class="form-group full-width">
            <label for="observations">Observações Gerais</label>
            <textarea id="observations" name="observations" rows="4" placeholder="Informações adicionais relevantes sobre o cliente..."></textarea>
          </div>
        </div>
      </div>
    `
  }

  renderAdultForm(container) {
    console.log('🔧 ClientsPage - Renderizando formulário para maior de idade')
    
    container.innerHTML = `
      <!-- DADOS PESSOAIS -->
      <div class="form-section">
        <h3>👤 Dados Pessoais</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="cpf">CPF *</label>
            <input type="text" id="cpf" name="cpf" required placeholder="000.000.000-00" maxlength="14">
          </div>
          <div class="form-group">
            <label for="rg">RG *</label>
            <input type="text" id="rg" name="rg" required placeholder="00.000.000-0">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="birthPlace">Naturalidade *</label>
            <input type="text" id="birthPlace" name="birthPlace" required placeholder="Cidade onde nasceu">
          </div>
          <div class="form-group">
            <label for="maritalStatus">Estado Civil *</label>
            <select id="maritalStatus" name="maritalStatus" required>
              <option value="">Selecione</option>
              <option value="solteiro">Solteiro(a)</option>
              <option value="casado">Casado(a)</option>
              <option value="divorciado">Divorciado(a)</option>
              <option value="viuvo">Viúvo(a)</option>
              <option value="uniao-estavel">União Estável</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="education">Escolaridade *</label>
            <select id="education" name="education" required>
              <option value="">Selecione</option>
              <option value="fundamental-incompleto">Fundamental Incompleto</option>
              <option value="fundamental-completo">Fundamental Completo</option>
              <option value="medio-incompleto">Médio Incompleto</option>
              <option value="medio-completo">Médio Completo</option>
              <option value="superior-incompleto">Superior Incompleto</option>
              <option value="superior-completo">Superior Completo</option>
              <option value="pos-graduacao">Pós-graduação</option>
              <option value="mestrado">Mestrado</option>
              <option value="doutorado">Doutorado</option>
            </select>
          </div>
          <div class="form-group">
            <label for="profession">Profissão *</label>
            <input type="text" id="profession" name="profession" required placeholder="Sua profissão">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="email">E-mail *</label>
            <input type="email" id="email" name="email" required placeholder="email@exemplo.com">
          </div>
          <div class="form-group">
            <label for="phone">Telefone *</label>
            <input type="tel" id="phone" name="phone" required placeholder="(11) 99999-9999">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="emergencyContact">Contato de Emergência *</label>
            <input type="text" id="emergencyContact" name="emergencyContact" required placeholder="Nome do contato">
          </div>
          <div class="form-group">
            <label for="emergencyPhone">Telefone de Emergência *</label>
            <input type="tel" id="emergencyPhone" name="emergencyPhone" required placeholder="(11) 99999-9999">
          </div>
        </div>
      </div>

      <!-- RESPONSÁVEL FINANCEIRO -->
      <div class="form-section">
        <h3>💳 Responsável Financeiro</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="adultFinancialResponsible">Responsável pelo Pagamento</label>
            <select id="adultFinancialResponsible" name="adultFinancialResponsible">
              <option value="">Selecione (opcional)</option>
              <option value="proprio-cliente">O próprio cliente</option>
              <option value="pai">Pai</option>
              <option value="mae">Mãe</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="form-group" id="adultOtherResponsibleGroup" style="display: none;">
            <label for="adultOtherResponsible">Especificar Outro Responsável</label>
            <input type="text" id="adultOtherResponsible" name="adultOtherResponsible" placeholder="Ex: Tio - João da Silva">
          </div>
        </div>
      </div>

      <!-- ENDEREÇO -->
      <div class="form-section">
        <h3>📍 Endereço</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="cep">CEP *</label>
            <input type="text" id="cep" name="cep" required placeholder="00000-000" maxlength="9">
            <small class="field-help">Digite o CEP para preenchimento automático</small>
          </div>
          <div class="form-group">
            <label for="street">Logradouro *</label>
            <input type="text" id="street" name="street" required placeholder="Rua, Avenida, etc.">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="number">Número *</label>
            <input type="text" id="number" name="number" required placeholder="Número">
          </div>
          <div class="form-group">
            <label for="complement">Complemento</label>
            <input type="text" id="complement" name="complement" placeholder="Apartamento, Bloco, etc.">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="neighborhood">Bairro *</label>
            <input type="text" id="neighborhood" name="neighborhood" required placeholder="Bairro">
          </div>
          <div class="form-group">
            <label for="city">Cidade *</label>
            <input type="text" id="city" name="city" required placeholder="Cidade">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="state">Estado *</label>
            <select id="state" name="state" required>
              <option value="">Selecione</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
          </div>
          <div class="form-group">
            <!-- Placeholder para manter layout -->
          </div>
        </div>
      </div>

      <!-- OUTRAS INFORMAÇÕES -->
      <div class="form-section">
        <h3>📝 Outras Informações</h3>
        <div class="form-row">
          <div class="form-group full-width">
            <label for="observations">Observações Gerais</label>
            <textarea id="observations" name="observations" rows="4" placeholder="Informações adicionais relevantes sobre o cliente..."></textarea>
          </div>
        </div>
      </div>
    `
  }

  initializeDynamicEvents() {
    // Busca de CEP
    const cepInput = this.element.querySelector('#cep')
    if (cepInput) {
      cepInput.addEventListener('blur', (e) => {
        this.searchCEP(e.target.value)
      })
      
      // Formatação automática do CEP
      cepInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '')
        if (value.length >= 5) {
          value = value.replace(/(\d{5})(\d)/, '$1-$2')
        }
        e.target.value = value
      })
    }

    // Formatação de telefones
    const phoneInputs = this.element.querySelectorAll('input[type="tel"]')
    phoneInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '')
        if (value.length >= 10) {
          value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
        } else if (value.length >= 6) {
          value = value.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3')
        } else if (value.length >= 2) {
          value = value.replace(/(\d{2})(\d)/, '($1) $2')
        }
        e.target.value = value
      })
    })

    // Formatação de CPF
    const cpfInput = this.element.querySelector('#cpf')
    if (cpfInput) {
      cpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '')
        if (value.length >= 9) {
          value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        } else if (value.length >= 6) {
          value = value.replace(/(\d{3})(\d{3})(\d)/, '$1.$2.$3')
        } else if (value.length >= 3) {
          value = value.replace(/(\d{3})(\d)/, '$1.$2')
        }
        e.target.value = value
      })
    }

    // Validação de CPF
    if (cpfInput) {
      cpfInput.addEventListener('blur', (e) => {
        if (e.target.value && !this.validateCPF(e.target.value)) {
          toast.error('CPF inválido!')
          e.target.focus()
        }
      })
    }

    // Lógica para responsável financeiro de maiores de idade
    const adultFinancialSelect = this.element.querySelector('#adultFinancialResponsible')
    const adultOtherGroup = this.element.querySelector('#adultOtherResponsibleGroup')
    
    if (adultFinancialSelect && adultOtherGroup) {
      adultFinancialSelect.addEventListener('change', (e) => {
        if (e.target.value === 'outro') {
          adultOtherGroup.style.display = 'block'
          // Usar timeout para animação suave
          setTimeout(() => {
            adultOtherGroup.classList.add('show')
          }, 10)
          // Tornar o campo obrigatório quando "Outro" for selecionado
          const otherInput = adultOtherGroup.querySelector('#adultOtherResponsible')
          if (otherInput) {
            otherInput.required = true
          }
        } else {
          adultOtherGroup.classList.remove('show')
          // Aguardar animação para esconder
          setTimeout(() => {
            adultOtherGroup.style.display = 'none'
          }, 300)
          // Remover obrigatoriedade quando não for "Outro"
          const otherInput = adultOtherGroup.querySelector('#adultOtherResponsible')
          if (otherInput) {
            otherInput.required = false
            otherInput.value = '' // Limpar o campo
          }
        }
      })
    }
  }

  async searchCEP(cep) {
    // Limpar formatação do CEP
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) {
      return
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error('CEP não encontrado!')
        return
      }

      // Preencher campos automaticamente
      const streetInput = this.element.querySelector('#street')
      const neighborhoodInput = this.element.querySelector('#neighborhood')
      const cityInput = this.element.querySelector('#city')
      const stateSelect = this.element.querySelector('#state')

      if (streetInput) streetInput.value = data.logradouro || ''
      if (neighborhoodInput) neighborhoodInput.value = data.bairro || ''
      if (cityInput) cityInput.value = data.localidade || ''
      if (stateSelect) stateSelect.value = data.uf || ''

      toast.success('Endereço preenchido automaticamente!')
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      toast.error('Erro ao buscar CEP. Verifique a conexão.')
    }
  }

  validateCPF(cpf) {
    // Remover formatação
    cpf = cpf.replace(/\D/g, '')
    
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false

    // Validar primeiro dígito
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i)
    }
    let remainder = 11 - (sum % 11)
    if (remainder >= 10) remainder = 0
    if (remainder !== parseInt(cpf[9])) return false

    // Validar segundo dígito
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i)
    }
    remainder = 11 - (sum % 11)
    if (remainder >= 10) remainder = 0
    if (remainder !== parseInt(cpf[10])) return false

    return true
  }

  async loadClientData() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', this.clientId)
        .single()

      if (error) throw error

      // Preencher dados básicos
      this.element.querySelector('#name').value = data.name || ''
      this.element.querySelector('#birthDate').value = data.birth_date || ''
      this.element.querySelector('#gender').value = data.gender || ''

      // Calcular idade e renderizar formulário
      if (data.birth_date) {
        this.calculateAge(data.birth_date)
        this.renderDynamicForm()
        
        // Aguardar um pouco para garantir que o formulário foi renderizado
        setTimeout(() => {
          this.fillFormData(data)
        }, 100)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error)
      toast.error('Erro ao carregar dados do cliente')
    }
  }

  fillFormData(data) {
    // Preencher campos baseado no tipo de cliente
    const form = this.element.querySelector('#clientForm')
    
    // Dados comuns
    const commonFields = [
      'phone', 'email', 'cep', 'street', 'number', 'complement',
      'neighborhood', 'city', 'state', 'observations'
    ]
    
    commonFields.forEach(field => {
      const input = form.querySelector(`[name="${field}"]`)
      if (input && data[field]) {
        input.value = data[field]
      }
    })

    // Dados específicos baseados na idade
    if (this.isMinor) {
      // Dados de menor
      const minorFields = [
        'schoolName', 'schoolType', 'schoolGrade', 'fatherName', 'fatherAge',
        'fatherProfession', 'fatherPhone', 'motherName', 'motherAge',
        'motherProfession', 'motherPhone', 'financialResponsible', 'otherResponsible'
      ]
      
      minorFields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`)
        if (input && data[field]) {
          input.value = data[field]
        }
      })
    } else {
      // Dados de adulto
      const adultFields = [
        'cpf', 'rg', 'birthPlace', 'maritalStatus', 'education', 'profession',
        'emergencyContact', 'emergencyPhone', 'adultFinancialResponsible', 'adultOtherResponsible'
      ]
      
      adultFields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`)
        if (input && data[field]) {
          input.value = data[field]
        }
      })

      // Lógica especial para responsável financeiro de adultos
      const adultFinancialSelect = form.querySelector('#adultFinancialResponsible')
      const adultOtherGroup = form.querySelector('#adultOtherResponsibleGroup')
      
      if (adultFinancialSelect && data.adultFinancialResponsible) {
        adultFinancialSelect.value = data.adultFinancialResponsible
        
        // Mostrar campo "Outro" se necessário
        if (data.adultFinancialResponsible === 'outro' && adultOtherGroup) {
          adultOtherGroup.style.display = 'block'
          setTimeout(() => {
            adultOtherGroup.classList.add('show')
          }, 10)
          const otherInput = adultOtherGroup.querySelector('#adultOtherResponsible')
          if (otherInput) {
            otherInput.required = true
          }
        }
      }
    }
  }

  async handleSubmit() {
    try {
      const form = this.element.querySelector('#clientForm')
      const formData = new FormData(form)
      const rawData = Object.fromEntries(formData)

      // Validações básicas
      if (!rawData.name || !rawData.birthDate || !rawData.gender) {
        toast.error('Preencha todos os campos obrigatórios!')
        return
      }

      // Criar objeto de dados do cliente
      const clientData = {
        name: rawData.name,
        birth_date: rawData.birthDate,
        gender: rawData.gender,
        client_type: this.isMinor ? 'menor' : 'adulto',
        phone: rawData.phone || null,
        email: rawData.email || null,
        // Endereço combinado
        address: this.buildAddress(rawData),
        status: 'ativo'
      }

      // Adicionar campos específicos
      if (this.isMinor) {
        // Dados de menor
        Object.assign(clientData, {
          school_name: rawData.schoolName,
          school_type: rawData.schoolType,
          school_grade: rawData.schoolGrade,
          father_name: rawData.fatherName,
          father_age: rawData.fatherAge,
          father_profession: rawData.fatherProfession,
          father_phone: rawData.fatherPhone,
          mother_name: rawData.motherName,
          mother_age: rawData.motherAge,
          mother_profession: rawData.motherProfession,
          mother_phone: rawData.motherPhone,
          financial_responsible: rawData.financialResponsible,
          other_responsible: rawData.otherResponsible
        })
      } else {
        // Dados de adulto
        Object.assign(clientData, {
          cpf: rawData.cpf,
          rg: rawData.rg,
          birth_place: rawData.birthPlace,
          marital_status: rawData.maritalStatus,
          education: rawData.education,
          profession: rawData.profession,
          emergency_contact: rawData.emergencyContact,
          emergency_phone: rawData.emergencyPhone,
          adult_financial_responsible: rawData.adultFinancialResponsible || null,
          adult_other_responsible: rawData.adultOtherResponsible || null
        })
      }

      // Adicionar observações
      if (rawData.observations) {
        clientData.medical_history = rawData.observations
      }

      // Adicionar dados do usuário logado
      const currentUser = await authService.getCurrentUser()
      clientData.created_by = currentUser.id
      clientData.updated_by = currentUser.id

      // Salvar no banco
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
      toast.error('Erro ao salvar cliente: ' + (error.message || 'Erro desconhecido'))
    }
  }

  buildAddress(data) {
    const addressParts = []
    
    if (data.street) addressParts.push(data.street)
    if (data.number) addressParts.push(data.number)
    if (data.complement) addressParts.push(data.complement)
    if (data.neighborhood) addressParts.push(data.neighborhood)
    if (data.city) addressParts.push(data.city)
    if (data.state) addressParts.push(data.state)
    if (data.cep) addressParts.push(data.cep)
    
    return addressParts.join(', ')
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 