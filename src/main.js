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
      console.log('🚀 MAIN.JS CARREGADO - Timestamp:', new Date().toISOString());
      console.log('🔧 authService definido:', !!authService);
      
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
      console.log('🔧 DOM CARREGADO - Iniciando App');
      
      // Inicializar Lucide icons
      if (window.lucide) {
        window.lucide.createIcons()
      }

      // Verificar usuário autenticado
      const currentUser = await authService.getCurrentUser()
      console.log('🔧 Usuário atual:', currentUser)
      console.log('🔧 Role do usuário:', authService.getUserRole())
      
      // Inicializar roteador
      router.init()
      
      // Inicializar aplicação
      this.app = new App()
      await this.app.init()
      
      console.log('🔧 APP INICIALIZADO - App:', this.app);
      console.log('🔧 Layout atual:', this.app.layout);
      
      // Expor app globalmente para debug
      window.app = this.app;
      
      // Remover loading inicial
      this.removeInitialLoading()
      
      console.log('🚀 Sistema de Neuropsicologia iniciado com sucesso!')
      
      // Forçar renderização das tabs após 2 segundos
      setTimeout(() => {
        console.log('🔧 FORÇANDO RENDERIZAÇÃO DAS TABS');
        if (this.app.layout) {
          console.log('🔧 Layout existe, forçando renderNavigationTabs');
          this.app.layout.renderNavigationTabs();
        } else {
          console.log('🔧 Layout não existe ainda');
        }
      }, 2000);
      
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