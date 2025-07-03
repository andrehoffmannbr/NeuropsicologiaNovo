import authService from '../services/auth.js'
import router, { ROUTES } from '../utils/router.js'
import toast from '../components/toast.js'

export default class LoginPage {
  constructor() {
    this.element = null
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'login-page'
    this.element.innerHTML = `
      <div class="login-container">
        <div class="login-card card">
          <div class="card-header text-center">
            <h1 class="card-title">Sistema de Neuropsicologia</h1>
            <p class="card-subtitle">Faça login para acessar o sistema</p>
          </div>
          <div class="card-body">
            <form id="login-form">
              <div class="form-group">
                <label for="email" class="form-label">Email</label>
                <input type="email" id="email" class="form-input" required>
              </div>
              <div class="form-group">
                <label for="password" class="form-label">Senha</label>
                <input type="password" id="password" class="form-input" required>
              </div>
              <button type="submit" class="btn btn-primary w-100">
                <i data-lucide="log-in"></i>
                Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    `

    container.appendChild(this.element)
    this.setupEventListeners()
  }

  setupEventListeners() {
    const form = this.element.querySelector('#login-form')
    form.addEventListener('submit', (e) => this.handleLogin(e))
  }

  async handleLogin(e) {
    e.preventDefault()
    
    const email = this.element.querySelector('#email').value
    const password = this.element.querySelector('#password').value

    console.log('🔑 Tentativa de login:', { email, password: '***' })

    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    try {
      console.log('🔄 Chamando authService.login...')
      const result = await authService.login(email, password)
      console.log('📋 Resultado do login:', result)
      
      if (result.success) {
        console.log('✅ Login bem-sucedido, navegando para dashboard')
        toast.success('Login realizado com sucesso!')
        router.navigateTo(ROUTES.DASHBOARD)
      } else {
        console.error('❌ Erro no login:', result.error)
        toast.error(result.error || 'Credenciais inválidas')
      }
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error)
      toast.error('Erro ao fazer login. Tente novamente.')
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 