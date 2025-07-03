import './styles/main.css'
import authService from './services/auth.js'
import router from './utils/router.js'
import toast from './components/toast.js'
import App from './App.js'

// TESTE IMEDIATO - DEVE APARECER SEMPRE
console.log('🚨 TESTE IMEDIATO - MAIN.JS CARREGADO!');
console.log('🚨 Timestamp:', new Date().toLocaleString());
alert('🚨 TESTE: Main.js carregado com sucesso!');

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
      console.log('🔧 Document readyState:', document.readyState);
      console.log('🔧 Container app:', document.getElementById('app'));
      
      // Inicializar Lucide icons
      if (window.lucide) {
        console.log('🔧 Lucide disponível');
        window.lucide.createIcons()
      } else {
        console.log('⚠️ Lucide NÃO disponível');
      }

      // Verificar usuário autenticado
      const currentUser = await authService.getCurrentUser()
      console.log('🔧 Usuário atual:', currentUser)
      console.log('🔧 Role do usuário:', authService.getUserRole())
      
      // Inicializar roteador
      router.init()
      console.log('🔧 Router inicializado');
      
      // Inicializar aplicação
      this.app = new App()
      console.log('🔧 App criado:', this.app);
      
      await this.app.init()
      
      console.log('🔧 APP INICIALIZADO - App:', this.app);
      console.log('🔧 Layout atual:', this.app.layout);
      
      // Expor app globalmente para debug
      window.app = this.app;
      
      // Remover loading inicial
      this.removeInitialLoading()
      
      console.log('🚀 Sistema de Neuropsicologia iniciado com sucesso!')
      
      // FORÇAR ADIÇÃO DA ABA COLABORADORES
      this.forceAddColaboradoresTab();
      
      // Forçar renderização das tabs após 2 segundos
      setTimeout(() => {
        console.log('🔧 FORÇANDO RENDERIZAÇÃO DAS TABS');
        console.log('🔧 App layout existe:', !!this.app.layout);
        if (this.app.layout) {
          console.log('🔧 Layout existe, forçando renderNavigationTabs');
          try {
            this.app.layout.renderNavigationTabs();
          } catch (error) {
            console.error('🔧 Erro ao renderizar tabs:', error);
          }
        } else {
          console.log('🔧 Layout não existe ainda');
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao iniciar aplicação:', error)
      console.error('❌ Stack trace:', error.stack)
      toast.error('Erro ao iniciar o sistema. Verifique sua conexão.')
    }
  }

  forceAddColaboradoresTab() {
    console.log('🔧 FORÇANDO ADIÇÃO DA ABA COLABORADORES');
    
    setTimeout(() => {
      const navTabs = document.querySelector('#nav-tabs');
      console.log('🔧 Nav tabs encontrado:', navTabs);
      
      if (navTabs) {
        const colaboradoresTab = `
          <button class="nav-tab" data-section="colaboradores">
            <i data-lucide="users-cog"></i>
            <span class="nav-tab-text">Colaboradores</span>
          </button>
        `;
        
        navTabs.insertAdjacentHTML('beforeend', colaboradoresTab);
        console.log('🔧 Aba colaboradores adicionada manualmente!');
        
        // Reinicializar os ícones
        if (window.lucide) {
          window.lucide.createIcons();
        }
      } else {
        console.log('🔧 Nav tabs não encontrado');
      }
    }, 1000);
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