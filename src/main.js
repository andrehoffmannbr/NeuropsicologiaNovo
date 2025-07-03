import './styles/main.css'
import authService from './services/auth.js'
import router from './utils/router.js'
import toast from './components/toast.js'
import App from './App.js'

// TESTE IMEDIATO - DEVE APARECER SEMPRE
console.log('🚨 TESTE IMEDIATO - MAIN.JS CARREGADO!');
console.log('🚨 Timestamp:', new Date().toLocaleString());
alert('🚨 TESTE: Main.js carregado com sucesso!');

// TESTE: Verificar se imports funcionaram
try {
  console.log('🔧 TESTE: authService importado:', !!authService);
  console.log('🔧 TESTE: router importado:', !!router);
  console.log('🔧 TESTE: toast importado:', !!toast);
  console.log('🔧 TESTE: App importado:', !!App);
} catch (error) {
  console.error('❌ ERRO nos imports:', error);
}

class Main {
  constructor() {
    console.log('🔧 TESTE: Main constructor chamado');
    this.app = null
    try {
      this.init()
    } catch (error) {
      console.error('❌ ERRO no constructor:', error);
    }
  }

  async init() {
    console.log('🔧 TESTE: Main.init() chamado');
    try {
      console.log('🚀 MAIN.JS CARREGADO - Timestamp:', new Date().toISOString());
      console.log('🔧 authService definido:', !!authService);
      
      // Aguardar carregamento completo do DOM
      if (document.readyState === 'loading') {
        console.log('🔧 TESTE: DOM ainda carregando, aguardando...');
        document.addEventListener('DOMContentLoaded', () => {
          console.log('🔧 TESTE: DOMContentLoaded disparado');
          this.start()
        })
      } else {
        console.log('🔧 TESTE: DOM já carregado, iniciando...');
        this.start()
      }
    } catch (error) {
      console.error('❌ ERRO em Main.init():', error);
      console.error('❌ Stack:', error.stack);
    }
  }

  async start() {
    console.log('🔧 TESTE: Main.start() chamado');
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

      console.log('🔧 TESTE: Verificando usuário...');
      // Verificar usuário autenticado
      const currentUser = await authService.getCurrentUser()
      console.log('🔧 Usuário atual:', currentUser)
      console.log('🔧 Role do usuário:', authService.getUserRole())
      
      console.log('🔧 TESTE: Inicializando router...');
      // Inicializar roteador
      router.init()
      console.log('🔧 Router inicializado');
      
      console.log('🔧 TESTE: Criando App...');
      // Inicializar aplicação
      this.app = new App()
      console.log('🔧 App criado:', this.app);
      
      console.log('🔧 TESTE: Inicializando App...');
      await this.app.init()
      
      console.log('🔧 APP INICIALIZADO - App:', this.app);
      console.log('🔧 Layout atual:', this.app.layout);
      
      // Expor app globalmente para debug
      window.app = this.app;
      
      // Remover loading inicial
      this.removeInitialLoading()
      
      console.log('🚀 Sistema de Neuropsicologia iniciado com sucesso!')
      
      // FORÇAR ADIÇÃO DA ABA COLABORADORES
      console.log('🔧 TESTE: Forçando aba colaboradores...');
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
      console.error('❌ ERRO CRÍTICO em Main.start():', error);
      console.error('❌ Stack trace:', error.stack);
      alert('❌ ERRO CRÍTICO: ' + error.message);
    }
  }

  forceAddColaboradoresTab() {
    console.log('🔧 FORÇANDO ADIÇÃO DA ABA COLABORADORES');
    
    setTimeout(() => {
      try {
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
console.log('🔧 TESTE: Criando instância Main...');
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

console.log('🔧 TESTE: Fim do main.js'); 