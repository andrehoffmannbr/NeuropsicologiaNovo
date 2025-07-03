// Utilitários de formatação
export const formatters = {
  // Formatar CPF
  cpf: (value) => {
    if (!value) return ''
    const cleaned = value.replace(/\D/g, '')
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  },

  // Formatar telefone
  phone: (value) => {
    if (!value) return ''
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  },

  // Formatar CEP
  cep: (value) => {
    if (!value) return ''
    const cleaned = value.replace(/\D/g, '')
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
  },

  // Formatar moeda
  currency: (value) => {
    if (!value && value !== 0) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  },

  // Formatar data
  date: (value) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('pt-BR')
  },

  // Formatar data e hora
  datetime: (value) => {
    if (!value) return ''
    return new Date(value).toLocaleString('pt-BR')
  }
}

// Utilitários de validação
export const validators = {
  // Validar CPF
  cpf: (cpf) => {
    if (!cpf) return false
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length !== 11) return false
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleaned)) return false
    
    // Validar dígitos verificadores
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleaned[9])) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleaned[10])) return false
    
    return true
  },

  // Validar email
  email: (email) => {
    if (!email) return false
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  },

  // Validar telefone
  phone: (phone) => {
    if (!phone) return false
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 11
  },

  // Validar CEP
  cep: (cep) => {
    if (!cep) return false
    const cleaned = cep.replace(/\D/g, '')
    return cleaned.length === 8
  },

  // Validar senha
  password: (password) => {
    if (!password) return false
    return password.length >= 6
  }
}

// Utilitários de sanitização
export const sanitizers = {
  // Sanitizar string
  string: (value) => {
    if (!value) return ''
    return value.toString().trim()
  },

  // Sanitizar HTML
  html: (value) => {
    if (!value) return ''
    const div = document.createElement('div')
    div.textContent = value
    return div.innerHTML
  },

  // Sanitizar números
  number: (value) => {
    if (!value && value !== 0) return null
    const num = parseFloat(value.toString().replace(/[^\d.,-]/g, '').replace(',', '.'))
    return isNaN(num) ? null : num
  },

  // Sanitizar CPF
  cpf: (value) => {
    if (!value) return ''
    return value.replace(/\D/g, '')
  },

  // Sanitizar telefone
  phone: (value) => {
    if (!value) return ''
    return value.replace(/\D/g, '')
  }
}

// Utilitários de data
export const dateUtils = {
  // Obter data atual
  now: () => new Date(),

  // Formatar data para input
  toInputDate: (date) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  },

  // Formatar data para banco
  toISOString: (date) => {
    if (!date) return null
    return new Date(date).toISOString()
  },

  // Calcular idade
  calculateAge: (birthDate) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  },

  // Verificar se é maior de idade
  isAdult: (birthDate) => {
    return dateUtils.calculateAge(birthDate) >= 18
  },

  // Formatar duração
  formatDuration: (minutes) => {
    if (!minutes) return '0 min'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
    }
    return `${mins}m`
  }
}

// Utilitários de array
export const arrayUtils = {
  // Remover duplicatas
  unique: (array, key) => {
    if (!key) return [...new Set(array)]
    return array.filter((item, index, self) => 
      index === self.findIndex(t => t[key] === item[key])
    )
  },

  // Ordenar array
  sortBy: (array, key, direction = 'asc') => {
    return [...array].sort((a, b) => {
      const aVal = key ? a[key] : a
      const bVal = key ? b[key] : b
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  },

  // Agrupar por chave
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key]
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(item)
      return groups
    }, {})
  }
}

// Utilitários de string
export const stringUtils = {
  // Capitalizar primeira letra
  capitalize: (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  // Capitalizar cada palavra
  titleCase: (str) => {
    if (!str) return ''
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  },

  // Gerar slug
  slug: (str) => {
    if (!str) return ''
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  },

  // Truncar texto
  truncate: (str, length = 100) => {
    if (!str) return ''
    if (str.length <= length) return str
    return str.substring(0, length) + '...'
  }
}

// Utilitários de localStorage
export const storage = {
  // Salvar no localStorage
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error)
    }
  },

  // Obter do localStorage
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Erro ao obter do localStorage:', error)
      return defaultValue
    }
  },

  // Remover do localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error)
    }
  }
}

// Utilitários de DOM
export const domUtils = {
  // Criar elemento
  createElement: (tag, className = '', textContent = '') => {
    const element = document.createElement(tag)
    if (className) element.className = className
    if (textContent) element.textContent = textContent
    return element
  },

  // Adicionar classe
  addClass: (element, className) => {
    if (element) element.classList.add(className)
  },

  // Remover classe
  removeClass: (element, className) => {
    if (element) element.classList.remove(className)
  },

  // Toggle classe
  toggleClass: (element, className) => {
    if (element) element.classList.toggle(className)
  },

  // Verificar se tem classe
  hasClass: (element, className) => {
    return element ? element.classList.contains(className) : false
  }
}

// Utilitários de debounce
export const debounce = (func, wait, immediate) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

// Utilitários de throttle
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
} 