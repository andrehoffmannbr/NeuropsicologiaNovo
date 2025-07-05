// 🔒 Sistema de Validação de Entrada e Segurança
class ValidationManager {
  constructor() {
    this.patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
      cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
      cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
      cep: /^\d{5}-\d{3}$/,
      date: /^\d{4}-\d{2}-\d{2}$/,
      time: /^\d{2}:\d{2}$/,
      money: /^\d+(\.\d{2})?$/,
      name: /^[a-zA-ZÀ-ÿ\s]+$/,
      alphanumeric: /^[a-zA-Z0-9\s]+$/,
      numeric: /^\d+$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    }
    
    this.sanitizers = {
      html: this.sanitizeHTML.bind(this),
      sql: this.sanitizeSQL.bind(this),
      xss: this.sanitizeXSS.bind(this),
      filename: this.sanitizeFilename.bind(this)
    }
    
    console.log('🔒 ValidationManager: Inicializado')
  }

  // 🔧 Validar cliente
  validateClient(data) {
    const errors = []
    const sanitized = {}

    // Nome obrigatório
    if (!data.name?.trim()) {
      errors.push('Nome é obrigatório')
    } else if (data.name.length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    } else if (data.name.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres')
    } else if (!this.patterns.name.test(data.name)) {
      errors.push('Nome contém caracteres inválidos')
    } else {
      sanitized.name = this.sanitizeXSS(data.name.trim())
    }

    // Email obrigatório
    if (!data.email?.trim()) {
      errors.push('Email é obrigatório')
    } else if (!this.patterns.email.test(data.email)) {
      errors.push('Email inválido')
    } else {
      sanitized.email = data.email.toLowerCase().trim()
    }

    // Telefone obrigatório
    if (!data.phone?.trim()) {
      errors.push('Telefone é obrigatório')
    } else if (!this.patterns.phone.test(data.phone)) {
      errors.push('Telefone deve estar no formato (XX) XXXXX-XXXX')
    } else {
      sanitized.phone = data.phone.trim()
    }

    // CPF (se fornecido)
    if (data.cpf && !this.patterns.cpf.test(data.cpf)) {
      errors.push('CPF deve estar no formato XXX.XXX.XXX-XX')
    } else if (data.cpf && !this.validateCPF(data.cpf)) {
      errors.push('CPF inválido')
    } else if (data.cpf) {
      sanitized.cpf = data.cpf.trim()
    }

    // Data de nascimento (se fornecida)
    if (data.birth_date) {
      const date = new Date(data.birth_date)
      if (isNaN(date.getTime())) {
        errors.push('Data de nascimento inválida')
      } else if (date > new Date()) {
        errors.push('Data de nascimento não pode ser futura')
      } else if (date < new Date('1900-01-01')) {
        errors.push('Data de nascimento deve ser posterior a 1900')
      } else {
        sanitized.birth_date = data.birth_date
      }
    }

    // Observações (se fornecidas)
    if (data.observations) {
      if (data.observations.length > 1000) {
        errors.push('Observações devem ter no máximo 1000 caracteres')
      } else {
        sanitized.observations = this.sanitizeXSS(data.observations.trim())
      }
    }

    return { isValid: errors.length === 0, errors, sanitized }
  }

  // 🔧 Validar agendamento
  validateAppointment(data) {
    const errors = []
    const sanitized = {}

    // Cliente obrigatório
    if (!data.client_id) {
      errors.push('Cliente é obrigatório')
    } else if (!this.patterns.numeric.test(data.client_id.toString())) {
      errors.push('ID do cliente inválido')
    } else {
      sanitized.client_id = parseInt(data.client_id)
    }

    // Data obrigatória
    if (!data.appointment_date) {
      errors.push('Data do agendamento é obrigatória')
    } else {
      const date = new Date(data.appointment_date)
      if (isNaN(date.getTime())) {
        errors.push('Data do agendamento inválida')
      } else if (date < new Date()) {
        errors.push('Data do agendamento não pode ser no passado')
      } else {
        sanitized.appointment_date = data.appointment_date
      }
    }

    // Hora obrigatória
    if (!data.appointment_time) {
      errors.push('Hora do agendamento é obrigatória')
    } else if (!this.patterns.time.test(data.appointment_time)) {
      errors.push('Hora deve estar no formato HH:MM')
    } else {
      sanitized.appointment_time = data.appointment_time
    }

    // Tipo de sessão
    const validTypes = ['avaliacao', 'terapia', 'retorno', 'orientacao']
    if (!data.session_type || !validTypes.includes(data.session_type)) {
      errors.push('Tipo de sessão inválido')
    } else {
      sanitized.session_type = data.session_type
    }

    // Status
    const validStatuses = ['agendado', 'confirmado', 'cancelado', 'realizado']
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Status inválido')
    } else if (data.status) {
      sanitized.status = data.status
    }

    // Observações (se fornecidas)
    if (data.notes) {
      if (data.notes.length > 500) {
        errors.push('Observações devem ter no máximo 500 caracteres')
      } else {
        sanitized.notes = this.sanitizeXSS(data.notes.trim())
      }
    }

    return { isValid: errors.length === 0, errors, sanitized }
  }

  // 🔧 Validar usuário
  validateUser(data) {
    const errors = []
    const sanitized = {}

    // Nome obrigatório
    if (!data.name?.trim()) {
      errors.push('Nome é obrigatório')
    } else if (data.name.length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    } else if (data.name.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres')
    } else {
      sanitized.name = this.sanitizeXSS(data.name.trim())
    }

    // Email obrigatório
    if (!data.email?.trim()) {
      errors.push('Email é obrigatório')
    } else if (!this.patterns.email.test(data.email)) {
      errors.push('Email inválido')
    } else {
      sanitized.email = data.email.toLowerCase().trim()
    }

    // Senha (se fornecida)
    if (data.password) {
      if (data.password.length < 8) {
        errors.push('Senha deve ter pelo menos 8 caracteres')
      } else if (!this.patterns.password.test(data.password)) {
        errors.push('Senha deve conter ao menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial')
      } else {
        sanitized.password = data.password
      }
    }

    // Role
    const validRoles = ['coordenador', 'funcionario', 'estagiario']
    if (!data.role || !validRoles.includes(data.role)) {
      errors.push('Papel do usuário inválido')
    } else {
      sanitized.role = data.role
    }

    return { isValid: errors.length === 0, errors, sanitized }
  }

  // 🔧 Validar CPF
  validateCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '')
    
    if (cleanCPF.length !== 11 || /^(.)\1{10}$/.test(cleanCPF)) {
      return false
    }

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false

    return true
  }

  // 🔧 Sanitizar HTML
  sanitizeHTML(input) {
    if (typeof input !== 'string') return input
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // 🔧 Sanitizar SQL
  sanitizeSQL(input) {
    if (typeof input !== 'string') return input
    
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/xp_/g, '')
      .replace(/sp_/g, '')
  }

  // 🔧 Sanitizar XSS
  sanitizeXSS(input) {
    if (typeof input !== 'string') return input
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
  }

  // 🔧 Sanitizar nome de arquivo
  sanitizeFilename(input) {
    if (typeof input !== 'string') return input
    
    return input
      .replace(/[^a-zA-Z0-9\-_.]/g, '')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .substring(0, 255)
  }

  // 🔧 Validar upload de arquivo
  validateFile(file, options = {}) {
    const errors = []
    const config = {
      maxSize: options.maxSize || 5 * 1024 * 1024, // 5MB default
      allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxFiles: options.maxFiles || 1,
      ...options
    }

    if (!file) {
      errors.push('Nenhum arquivo selecionado')
      return { isValid: false, errors }
    }

    // Tamanho do arquivo
    if (file.size > config.maxSize) {
      errors.push(`Arquivo deve ter no máximo ${this.formatFileSize(config.maxSize)}`)
    }

    // Tipo do arquivo
    if (!config.allowedTypes.includes(file.type)) {
      errors.push(`Tipo de arquivo não permitido. Permitidos: ${config.allowedTypes.join(', ')}`)
    }

    // Nome do arquivo
    if (file.name.length > 255) {
      errors.push('Nome do arquivo muito longo')
    }

    return { isValid: errors.length === 0, errors }
  }

  // 🔧 Formatar tamanho de arquivo
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 🔧 Validar múltiplos dados
  validateBatch(data, type) {
    const results = []
    const errors = []
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      let validation
      
      switch (type) {
        case 'client':
          validation = this.validateClient(item)
          break
        case 'appointment':
          validation = this.validateAppointment(item)
          break
        case 'user':
          validation = this.validateUser(item)
          break
        default:
          validation = { isValid: false, errors: ['Tipo de validação inválido'] }
      }
      
      if (!validation.isValid) {
        errors.push({
          index: i,
          item: item,
          errors: validation.errors
        })
      } else {
        results.push(validation.sanitized)
      }
    }
    
    return {
      isValid: errors.length === 0,
      results,
      errors,
      processed: results.length,
      failed: errors.length
    }
  }

  // 🔧 Rate limiting simples
  rateLimitCheck(key, limit = 10, window = 60000) {
    const now = Date.now()
    const windowStart = now - window
    
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map()
    }
    
    const requests = this.rateLimitStore.get(key) || []
    const validRequests = requests.filter(time => time > windowStart)
    
    if (validRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + window
      }
    }
    
    validRequests.push(now)
    this.rateLimitStore.set(key, validRequests)
    
    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetTime: now + window
    }
  }

  // 🔧 Limpar rate limit store
  cleanupRateLimit() {
    if (!this.rateLimitStore) return
    
    const now = Date.now()
    const windowSize = 60000
    
    for (const [key, requests] of this.rateLimitStore.entries()) {
      const validRequests = requests.filter(time => time > now - windowSize)
      
      if (validRequests.length === 0) {
        this.rateLimitStore.delete(key)
      } else {
        this.rateLimitStore.set(key, validRequests)
      }
    }
  }
}

// 🔧 Instância global
const validationManager = new ValidationManager()

// 🔧 Limpeza automática do rate limit
setInterval(() => {
  validationManager.cleanupRateLimit()
}, 60000)

// 🔧 Expor para debug
if (typeof window !== 'undefined') {
  window.validationManager = validationManager
}

export default validationManager 