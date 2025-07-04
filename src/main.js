import './styles/main.css'
import authService from './services/auth.js'
import router from './utils/router.js'
import toast from './components/toast.js'
import App from './App.js'

// Aplicação iniciada

// Verificar se imports funcionaram
try {
  if (!authService || !router || !toast || !App) {
    throw new Error('Dependências não carregadas corretamente');
  }
} catch (error) {
  console.error('❌ ERRO nos imports:', error);
}

class Main {
  constructor() {
    this.app = null
    try {
      this.init()
    } catch (error) {
      console.error('❌ ERRO no constructor:', error);
    }
  }

  async init() {
    try {
      // Aguardar carregamento completo do DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.start()
        })
      } else {
        this.start()
      }
    } catch (error) {
      console.error('❌ ERRO em Main.init():', error);
      console.error('❌ Stack:', error.stack);
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
      
      // Expor app globalmente para debug
      window.app = this.app;
      
      // Remover loading inicial
      this.removeInitialLoading()
      
      // FORÇAR ADIÇÃO DA ABA COLABORADORES
      this.forceAddColaboradoresTab();
      
      // Forçar renderização das tabs após 2 segundos
      setTimeout(() => {
        if (this.app.layout) {
          try {
            this.app.layout.renderNavigationTabs();
          } catch (error) {
            console.error('🔧 Erro ao renderizar tabs:', error);
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ ERRO CRÍTICO em Main.start():', error);
      console.error('❌ Stack trace:', error.stack);
      alert('❌ ERRO CRÍTICO: ' + error.message);
    }
  }

  forceAddColaboradoresTab() {
    setTimeout(() => {
      try {
        const navTabs = document.querySelector('#nav-tabs');
        
        if (navTabs) {
          const colaboradoresTab = `
            <button class="nav-tab" data-section="colaboradores">
              <i data-lucide="users-cog"></i>
              <span class="nav-tab-text">Colaboradores</span>
            </button>
          `;
          
          navTabs.insertAdjacentHTML('beforeend', colaboradoresTab);
          
          // Reinicializar os ícones
          if (window.lucide) {
            window.lucide.createIcons();
          }
        }
      } catch (error) {
        console.error('❌ ERRO ao forçar aba:', error);
      }
    }, 1000);
  }

  removeInitialLoading() {
    try {
      const loading = document.getElementById('initial-loading')
      if (loading) {
        loading.style.opacity = '0'
        setTimeout(() => {
          loading.remove()
        }, 300)
      }
    } catch (error) {
      console.error('❌ ERRO ao remover loading:', error);
    }
  }
}

// Inicializar aplicação
try {
  new Main()
} catch (error) {
  console.error('❌ ERRO ao criar Main:', error);
  alert('❌ ERRO ao criar Main: ' + error.message);
}

// Adicionar handlers globais
window.addEventListener('error', (event) => {
  console.error('❌ Erro global:', event.error)
  console.error('❌ Arquivo:', event.filename)
  console.error('❌ Linha:', event.lineno)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rejeitada:', event.reason)
})

// Adicionar utilitários globais para desenvolvimento E debug em produção
window.authService = authService
window.router = router
window.toast = toast 