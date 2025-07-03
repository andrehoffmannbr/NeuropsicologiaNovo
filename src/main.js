import './styles/main.css'
import authService from './services/auth.js'
import router from './utils/router.js'
import toast from './components/toast.js'
import App from './App.js'

class Main {
  constructor() {
    this.app = null
    this.init()
  }

  async init() {
    try {
      // Aguardar carregamento completo do DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.start())
      } else {
        this.start()
      }
    } catch (error) {
      console.error('Erro ao inicializar aplicação:', error)
      toast.error('Erro ao carregar a aplicação. Recarregue a página.')
    }
  }

  async start() {
    try {
      // Inicializar Lucide icons
      if (window.lucide) {
        window.lucide.createIcons()
      }

      // Verificar usuário autenticado
      const currentUser = await authService.getCurrentUser()
      
      // Inicializar roteador
      router.init()
      
      // Inicializar aplicação
      this.app = new App()
      await this.app.init()
      
      // Remover loading inicial
      this.removeInitialLoading()
      
      console.log('🚀 Sistema de Neuropsicologia iniciado com sucesso!')
      
    } catch (error) {
      console.error('Erro ao iniciar aplicação:', error)
      toast.error('Erro ao iniciar o sistema. Verifique sua conexão.')
    }
  }

  removeInitialLoading() {
    const loading = document.getElementById('initial-loading')
    if (loading) {
      loading.style.opacity = '0'
      setTimeout(() => {
        loading.remove()
      }, 300)
    }
  }
}

// Inicializar aplicação
new Main()

// Adicionar handlers globais
window.addEventListener('error', (event) => {
  console.error('Erro global:', event.error)
  toast.error('Ocorreu um erro inesperado. Tente novamente.')
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejeitada:', event.reason)
  toast.error('Erro de conexão. Verifique sua internet.')
})

// Adicionar utilitários globais para desenvolvimento E debug em produção
window.authService = authService
window.router = router
window.toast = toast

// Log adicional para debug
console.log('🔧 AuthService exposto globalmente para debug:', window.authService)
console.log('🔧 Usuário atual:', authService.currentUser)
console.log('🔧 Role do usuário:', authService.getUserRole()) 