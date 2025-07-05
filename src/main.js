import './styles/main.css'
import authService from './services/auth.js'
import router from './utils/router.js'
import toast from './components/toast.js'
import App from './App.js'

// 🔧 CORREÇÃO: Verificar imports iniciais
console.log('🔄 Main: Verificando importações...')
try {
  if (!authService || !router || !toast || !App) {
    throw new Error('Dependências não carregadas corretamente');
  }
  console.log('✅ Main: Todas as dependências carregadas')
} catch (error) {
  console.error('❌ Main: ERRO nos imports:', error);
  alert('❌ ERRO CRÍTICO: Dependências não carregadas - ' + error.message);
}

class Main {
  constructor() {
    this.app = null
    this.isInitialized = false
    this.initTimeout = null
    this.maxInitTime = 15000 // 🔧 CORREÇÃO: 15 segundos max para inicialização
    
    try {
      console.log('🔄 Main: Iniciando constructor...')
      this.init()
    } catch (error) {
      console.error('❌ Main: ERRO no constructor:', error);
      this.handleInitializationError(error)
    }
  }

  // 🔧 CORREÇÃO: Tratamento de erro de inicialização
  handleInitializationError(error) {
    console.error('❌ Main: Erro de inicialização crítico:', error)
    
    // Mostrar erro visual
    const errorDiv = document.createElement('div')
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #fee2e2;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="
          text-align: center;
          max-width: 500px;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        ">
          <h2 style="color: #dc2626; margin-bottom: 16px;">
            ❌ Erro de Inicialização
          </h2>
          <p style="color: #374151; margin-bottom: 24px;">
            O sistema não conseguiu inicializar corretamente.
          </p>
          <div style="
            background: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 24px;
            text-align: left;
          ">
            <strong>Erro:</strong> ${error.message}
          </div>
          <button 
            onclick="window.location.reload()" 
            style="
              background: #dc2626;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            "
          >
            🔄 Recarregar Sistema
          </button>
        </div>
      </div>
    `
    document.body.appendChild(errorDiv)
  }

  async init() {
    try {
      console.log('🔄 Main: Iniciando init()...')
      
      // 🔧 CORREÇÃO: Verificar se já foi inicializado
      if (this.isInitialized) {
        console.log('⚠️ Main: Sistema já inicializado')
        return
      }

      // 🔧 CORREÇÃO: Configurar timeout para inicialização
      const initTimeoutPromise = new Promise((_, reject) => {
        this.initTimeout = setTimeout(() => {
          reject(new Error('Timeout de inicialização - sistema demorou muito para carregar'))
        }, this.maxInitTime)
      })

      // 🔧 CORREÇÃO: Promise de inicialização
      const initPromise = this.performInitialization()

      // 🔧 CORREÇÃO: Race entre inicialização e timeout
      await Promise.race([initPromise, initTimeoutPromise])

      // 🔧 CORREÇÃO: Limpar timeout se sucesso
      if (this.initTimeout) {
        clearTimeout(this.initTimeout)
        this.initTimeout = null
      }

      this.isInitialized = true
      console.log('✅ Main: Sistema inicializado com sucesso!')

    } catch (error) {
      console.error('❌ Main: ERRO CRÍTICO durante inicialização:', error);
      
      // 🔧 CORREÇÃO: Limpar timeout se erro
      if (this.initTimeout) {
        clearTimeout(this.initTimeout)
        this.initTimeout = null
      }

      this.handleInitializationError(error)
    }
  }

  // 🔧 CORREÇÃO: Processo de inicialização separado
  async performInitialization() {
    console.log('🔄 Main: Executando inicialização...')

    // 🔧 CORREÇÃO: Aguardar carregamento completo do DOM
    await this.waitForDOM()

    // 🔧 CORREÇÃO: Inicializar componentes básicos
    await this.initializeComponents()

    // 🔧 CORREÇÃO: Inicializar sistema de autenticação
    await this.initializeAuth()

    // 🔧 CORREÇÃO: Inicializar roteamento
    await this.initializeRouter()

    // 🔧 CORREÇÃO: Inicializar aplicação principal
    await this.initializeApp()

    // 🔧 CORREÇÃO: Configurações finais
    await this.finalizeInitialization()
  }

  // 🔧 CORREÇÃO: Aguardar DOM
  async waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        console.log('⏳ Main: Aguardando DOM...')
        document.addEventListener('DOMContentLoaded', () => {
          console.log('✅ Main: DOM carregado')
          resolve()
        })
      } else {
        console.log('✅ Main: DOM já carregado')
        resolve()
      }
    })
  }

  // 🔧 CORREÇÃO: Inicializar componentes básicos
  async initializeComponents() {
    try {
      console.log('🔄 Main: Inicializando componentes básicos...')

      // 🔧 CORREÇÃO: Inicializar Lucide icons
      if (window.lucide) {
        try {
          window.lucide.createIcons()
          console.log('✅ Main: Lucide icons inicializados')
        } catch (error) {
          console.warn('⚠️ Main: Erro ao inicializar Lucide icons:', error)
        }
      } else {
        console.warn('⚠️ Main: Lucide icons não disponível')
      }

      // 🔧 CORREÇÃO: Verificar container principal
      const appContainer = document.getElementById('app')
      if (!appContainer) {
        throw new Error('Container #app não encontrado no DOM')
      }
      console.log('✅ Main: Container #app encontrado')

    } catch (error) {
      console.error('❌ Main: Erro ao inicializar componentes:', error)
      throw error
    }
  }

  // 🔧 CORREÇÃO: Inicializar autenticação
  async initializeAuth() {
    try {
      console.log('🔄 Main: Inicializando sistema de autenticação...')

      // 🔧 CORREÇÃO: Verificar usuário atual com timeout
      const authTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao verificar autenticação')), 5000)
      })

      const authCheck = authService.getCurrentUser()
      
      const currentUser = await Promise.race([authCheck, authTimeout])
      
      if (currentUser) {
        console.log('✅ Main: Usuário autenticado encontrado:', currentUser.email)
      } else {
        console.log('✅ Main: Nenhum usuário autenticado (normal para início)')
      }

    } catch (error) {
      console.error('❌ Main: Erro ao inicializar autenticação:', error)
      
      // 🔧 CORREÇÃO: Não falhar se autenticação der problema
      console.log('⚠️ Main: Continuando sem autenticação inicial...')
    }
  }

  // 🔧 CORREÇÃO: Inicializar roteamento
  async initializeRouter() {
    try {
      console.log('🔄 Main: Inicializando roteamento...')

      // 🔧 CORREÇÃO: Inicializar router com timeout
      const routerTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao inicializar router')), 3000)
      })

      const routerInit = new Promise((resolve) => {
        router.init()
        resolve()
      })

      await Promise.race([routerInit, routerTimeout])
      
      console.log('✅ Main: Roteamento inicializado')

    } catch (error) {
      console.error('❌ Main: Erro ao inicializar roteamento:', error)
      throw error
    }
  }

  // 🔧 CORREÇÃO: Inicializar aplicação principal
  async initializeApp() {
    try {
      console.log('🔄 Main: Inicializando aplicação principal...')

      // 🔧 CORREÇÃO: Criar aplicação com timeout
      const appTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao criar aplicação')), 10000)
      })

      const appCreation = (async () => {
        this.app = new App()
        await this.app.init()
      })()

      await Promise.race([appCreation, appTimeout])
      
      console.log('✅ Main: Aplicação principal inicializada')

      // 🔧 CORREÇÃO: Expor app globalmente para debug
      window.app = this.app

    } catch (error) {
      console.error('❌ Main: Erro ao inicializar aplicação:', error)
      throw error
    }
  }

  // 🔧 CORREÇÃO: Finalizar inicialização
  async finalizeInitialization() {
    try {
      console.log('🔄 Main: Finalizando inicialização...')

      // 🔧 CORREÇÃO: Remover loading inicial
      this.removeInitialLoading()

      // 🔧 CORREÇÃO: Configurar tratamento de erros globais
      this.setupGlobalErrorHandlers()

      // 🔧 CORREÇÃO: Expor utilitários globais
      this.exposeGlobalUtils()

      // 🔧 CORREÇÃO: Log de sucesso
      console.log('🎉 Main: Sistema totalmente inicializado!')
      
      // 🔧 CORREÇÃO: Toast de boas-vindas (opcional)
      if (authService.isAuthenticated()) {
        setTimeout(() => {
          if (window.toast) {
            window.toast.success('Sistema carregado com sucesso!')
          }
        }, 1000)
      }

    } catch (error) {
      console.error('❌ Main: Erro durante finalização:', error)
      throw error
    }
  }

  // 🔧 CORREÇÃO: Remover loading inicial com animação
  removeInitialLoading() {
    try {
      const loading = document.getElementById('initial-loading')
      if (loading) {
        console.log('🔄 Main: Removendo loading inicial...')
        
        loading.style.transition = 'opacity 0.3s ease'
        loading.style.opacity = '0'
        
        setTimeout(() => {
          if (loading.parentNode) {
            loading.remove()
            console.log('✅ Main: Loading inicial removido')
          }
        }, 300)
      } else {
        console.log('⚠️ Main: Loading inicial não encontrado')
      }
    } catch (error) {
      console.error('❌ Main: Erro ao remover loading:', error)
    }
  }

  // 🔧 CORREÇÃO: Configurar tratamento de erros globais
  setupGlobalErrorHandlers() {
    try {
      console.log('🔄 Main: Configurando tratamento de erros globais...')

      // 🔧 CORREÇÃO: Erros de JavaScript não tratados
      window.addEventListener('error', (event) => {
        console.error('❌ Main: Erro global capturado:', {
          message: event.message,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          error: event.error
        })
        
        // 🔧 CORREÇÃO: Mostrar toast apenas para erros relevantes
        if (event.error && !event.error.message?.includes('Script error')) {
          if (window.toast) {
            window.toast.error('Erro no sistema: ' + event.error.message)
          }
        }
      })

      // 🔧 CORREÇÃO: Promises rejeitadas não tratadas
      window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ Main: Promise rejeitada capturada:', {
          reason: event.reason,
          promise: event.promise
        })
        
        if (window.toast && event.reason?.message) {
          window.toast.error('Erro de carregamento: ' + event.reason.message)
        }
      })

      console.log('✅ Main: Tratamento de erros globais configurado')

    } catch (error) {
      console.error('❌ Main: Erro ao configurar tratamento de erros:', error)
    }
  }

  // 🔧 CORREÇÃO: Expor utilitários globais
  exposeGlobalUtils() {
    try {
      console.log('🔄 Main: Expondo utilitários globais...')

      // 🔧 CORREÇÃO: Expor serviços para debug
      window.authService = authService
      window.router = router
      window.toast = toast

      // 🔧 CORREÇÃO: Utilitários de debug
      window.systemDebug = {
        getSystemInfo: () => ({
          isInitialized: this.isInitialized,
          hasApp: !!this.app,
          currentUser: authService.currentUser,
          currentRoute: router.getCurrentRoute(),
          timestamp: new Date().toISOString()
        }),
        
        reinitializeSystem: async () => {
          console.log('🔄 Debug: Reinicializando sistema...')
          try {
            if (this.app) {
              this.app.destroy()
            }
            this.isInitialized = false
            await this.init()
            console.log('✅ Debug: Sistema reinicializado')
          } catch (error) {
            console.error('❌ Debug: Erro ao reinicializar:', error)
          }
        },

        forceNavigateTo: (route) => {
          console.log(`🔄 Debug: Forçando navegação para ${route}...`)
          router.navigateTo(route)
        }
      }

      console.log('✅ Main: Utilitários globais expostos')
      console.log('💡 Main: Use window.systemDebug para ferramentas de debug')

    } catch (error) {
      console.error('❌ Main: Erro ao expor utilitários:', error)
    }
  }

  // 🔧 CORREÇÃO: Destruir sistema (para cleanup)
  destroy() {
    try {
      console.log('🔄 Main: Destruindo sistema...')

      // 🔧 CORREÇÃO: Limpar timeout
      if (this.initTimeout) {
        clearTimeout(this.initTimeout)
        this.initTimeout = null
      }

      // 🔧 CORREÇÃO: Destruir aplicação
      if (this.app) {
        this.app.destroy()
        this.app = null
      }

      // 🔧 CORREÇÃO: Limpar globais
      delete window.app
      delete window.systemDebug
      delete window.authService
      delete window.router
      delete window.toast

      this.isInitialized = false
      
      console.log('✅ Main: Sistema destruído')

    } catch (error) {
      console.error('❌ Main: Erro ao destruir sistema:', error)
    }
  }
}

// 🔧 CORREÇÃO: Inicializar sistema principal
console.log('🚀 Main: Iniciando Sistema de Neuropsicologia...')

try {
  const mainSystem = new Main()
  
  // 🔧 CORREÇÃO: Expor sistema para debug
  window.mainSystem = mainSystem
  
  console.log('✅ Main: Sistema principal criado')
  
} catch (error) {
  console.error('❌ Main: ERRO CRÍTICO ao criar sistema principal:', error);
  
  // 🔧 CORREÇÃO: Fallback final - mostrar erro e botão de reload
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #fee2e2;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="
        text-align: center;
        max-width: 500px;
        padding: 40px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      ">
        <h1 style="color: #dc2626; margin-bottom: 16px;">❌ Erro Crítico</h1>
        <p style="color: #374151; margin-bottom: 24px;">
          O Sistema de Neuropsicologia não conseguiu inicializar.
        </p>
        <div style="
          background: #f3f4f6;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 24px;
          text-align: left;
        ">
          <strong>Detalhes:</strong><br>
          ${error.message}
        </div>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #dc2626;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
          "
        >
          🔄 Recarregar Sistema
        </button>
      </div>
    </div>
  `
} 