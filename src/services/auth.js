import supabase from '../config/supabase.js'

export const ROLES = {
  COORDINATOR: 'coordenador',
  STAFF: 'funcionario', 
  INTERN: 'estagiario'
}

export const PERMISSIONS = {
  [ROLES.COORDINATOR]: ['all'],
  [ROLES.STAFF]: ['clients', 'appointments', 'reports', 'documents'],
  [ROLES.INTERN]: ['own-appointments', 'own-clients']
}

class AuthService {
  constructor() {
    this.currentUser = null
    this.listeners = []
    this.isInitialized = false
    this.sessionCheckTimeout = null
    this.maxSessionCheckTime = 5000
    this.retryAttempts = 3
    this.retryDelay = 1000
  }

  async withRetry(operation, operationName, attempts = this.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        console.log(`🔄 AuthService: Tentativa ${i + 1}/${attempts} - ${operationName}`)
        const result = await operation()
        console.log(`✅ AuthService: ${operationName} bem-sucedido`)
        return result
      } catch (error) {
        console.error(`❌ AuthService: Tentativa ${i + 1} falhou - ${operationName}:`, error)
        
        if (i === attempts - 1) {
          throw new Error(`${operationName} falhou após ${attempts} tentativas: ${error.message}`)
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)))
      }
    }
  }

  async withTimeout(operation, operationName, timeout = this.maxSessionCheckTime) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout: ${operationName} demorou mais que ${timeout}ms`))
      }, timeout)
    })

    try {
      return await Promise.race([operation(), timeoutPromise])
    } catch (error) {
      if (error.message.includes('Timeout')) {
        console.error(`❌ AuthService: Timeout em ${operationName}`)
        throw new Error(`${operationName} demorou muito para responder`)
      }
      throw error
    }
  }

  onAuthStateChange(callback) {
    try {
      this.listeners.push(callback)
      
      supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          console.log(`🔄 AuthService: Auth state change - ${event}`)
          
          if (session?.user) {
            console.log('👤 AuthService: Obtendo perfil do usuário...')
            this.currentUser = await this.getUserWithProfile(session.user)
          } else {
            console.log('👤 AuthService: Usuário deslogado')
            this.currentUser = null
          }
          
          this.listeners.forEach(listener => {
            try {
              listener(this.currentUser)
            } catch (error) {
              console.error('❌ AuthService: Erro ao notificar listener:', error)
            }
          })
          
        } catch (error) {
          console.error('❌ AuthService: Erro durante mudança de estado:', error)
          
          this.listeners.forEach(listener => {
            try {
              listener(null)
            } catch (err) {
              console.error('❌ AuthService: Erro ao notificar listener de erro:', err)
            }
          })
        }
      })
      
    } catch (error) {
      console.error('❌ AuthService: Erro ao configurar listener:', error)
      throw error
    }
  }

  async login(email, password) {
    try {
      console.log('🔄 AuthService: Iniciando login...')
      
      const loginOperation = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
        return data
      }

      const data = await this.withTimeout(
        () => this.withRetry(loginOperation, 'Login'),
        'Login completo',
        8000
      )

      console.log('✅ AuthService: Login bem-sucedido')
      this.currentUser = await this.getUserWithProfile(data.user)
      
      return { success: true, user: this.currentUser }
      
    } catch (error) {
      console.error('❌ AuthService: Erro durante login:', error)
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      }
    }
  }

  async logout() {
    try {
      console.log('🔄 AuthService: Iniciando logout...')
      
      const logoutOperation = async () => {
        await supabase.auth.signOut()
      }

      await this.withRetry(logoutOperation, 'Logout')
      
      this.currentUser = null
      console.log('✅ AuthService: Logout bem-sucedido')
      
      return { success: true }
      
    } catch (error) {
      console.error('❌ AuthService: Erro durante logout:', error)
      
      this.currentUser = null
      
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      }
    }
  }

  async signUp(email, password, userData = {}) {
    try {
      console.log('�� AuthService: Iniciando signup...')
      
      const signUpOperation = async () => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData
          }
        })

        if (error) throw error
        return data
      }

      const data = await this.withTimeout(
        () => this.withRetry(signUpOperation, 'SignUp'),
        'SignUp completo',
        10000
      )

      console.log('✅ AuthService: SignUp bem-sucedido')
      return { success: true, user: data.user }
      
    } catch (error) {
      console.error('❌ AuthService: Erro durante signup:', error)
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      }
    }
  }

  async createUserProfile(userId, profileData) {
    try {
      console.log('🔄 AuthService: Criando perfil do usuário...')
      
      const createProfileOperation = async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .insert([{
            id: userId,
            ...profileData
          }])

        if (error) throw error
        return data
      }

      const data = await this.withRetry(createProfileOperation, 'Criar perfil')
      
      console.log('✅ AuthService: Perfil criado com sucesso')
      return { success: true, profile: data }
      
    } catch (error) {
      console.error('❌ AuthService: Erro ao criar perfil:', error)
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      }
    }
  }

  async getCurrentUser() {
    try {
      console.log('🔄 AuthService: Verificando usuário atual...')
      
      const getUserOperation = async () => {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) throw error
        return user
      }

      const user = await this.withTimeout(
        () => this.withRetry(getUserOperation, 'Obter usuário atual'),
        'Verificação de usuário',
        this.maxSessionCheckTime
      )
      
      if (user) {
        console.log('👤 AuthService: Usuário encontrado, obtendo perfil...')
        this.currentUser = await this.getUserWithProfile(user)
      } else {
        console.log('👤 AuthService: Nenhum usuário autenticado')
        this.currentUser = null
      }
      
      return this.currentUser
      
    } catch (error) {
      console.error('❌ AuthService: Erro ao obter usuário atual:', error)
      
      try {
        console.log('🔄 AuthService: Tentando fallback com sessão local...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('✅ AuthService: Usuário encontrado na sessão local')
          this.currentUser = await this.getUserWithProfile(session.user)
          return this.currentUser
        }
      } catch (fallbackError) {
        console.error('❌ AuthService: Fallback também falhou:', fallbackError)
      }
      
      this.currentUser = null
      return null
    }
  }

  async getUserWithProfile(user) {
    try {
      console.log(`🔄 AuthService: Obtendo perfil para ${user.email}`)
      
      const getProfileOperation = async () => {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }
        
        return profile
      }

      let profile
      try {
        profile = await this.withRetry(getProfileOperation, 'Obter perfil')
      } catch (error) {
        console.log('⚠️ AuthService: Perfil não encontrado, usando perfil padrão')
        profile = null
      }

      if (!profile) {
        const defaultProfile = this.createDefaultProfile(user)
        console.log('✅ AuthService: Usando perfil padrão:', defaultProfile)
        
        return {
          ...user,
          profile: defaultProfile
        }
      }

      console.log('✅ AuthService: Perfil encontrado:', profile)
      return {
        ...user,
        profile: profile
      }
      
    } catch (error) {
      console.error('❌ AuthService: Erro ao obter perfil:', error)
      
      const fallbackProfile = this.createDefaultProfile(user)
      console.log('✅ AuthService: Usando perfil de fallback:', fallbackProfile)
      
      return {
        ...user,
        profile: fallbackProfile
      }
    }
  }

  createDefaultProfile(user) {
    const isAdminEmail = user.email === 'test@example.com' || 
                        user.email === 'admin.neuropsicologia@gmail.com'
    
    return {
      role: isAdminEmail ? ROLES.COORDINATOR : ROLES.INTERN,
      name: isAdminEmail ? 'Administrador' : 
            user.user_metadata?.name || 
            user.email?.split('@')[0]?.replace(/[._]/g, ' ') || 
            'Usuário',
      email: user.email
    }
  }

  getErrorMessage(error) {
    if (typeof error === 'string') return error
    
    const message = error?.message || 'Erro desconhecido'
    
    const errorMappings = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Email não confirmado',
      'Too many requests': 'Muitas tentativas. Tente novamente em alguns minutos',
      'Network request failed': 'Erro de conexão. Verifique sua internet',
      'Timeout': 'Tempo limite excedido. Tente novamente',
      'User not found': 'Usuário não encontrado',
      'Invalid email': 'Email inválido'
    }

    for (const [key, value] of Object.entries(errorMappings)) {
      if (message.includes(key)) {
        return value
      }
    }

    return message
  }

  hasPermission(permission) {
    try {
      if (!this.currentUser?.profile?.role) {
        console.log('⚠️ AuthService: Usuário sem role definido')
        return false
      }
      
      const userPermissions = PERMISSIONS[this.currentUser.profile.role]
      const hasPermission = userPermissions.includes('all') || userPermissions.includes(permission)
      
      console.log(`🔍 AuthService: Verificando permissão "${permission}" para role "${this.currentUser.profile.role}": ${hasPermission}`)
      
      return hasPermission
    } catch (error) {
      console.error('❌ AuthService: Erro ao verificar permissão:', error)
      return false
    }
  }

  isCoordinator() {
    try {
      const isCoord = this.currentUser?.profile?.role === ROLES.COORDINATOR
      console.log(`🔍 AuthService: É coordenador: ${isCoord}`)
      return isCoord
    } catch (error) {
      console.error('❌ AuthService: Erro ao verificar se é coordenador:', error)
      return false
    }
  }

  isStaff() {
    try {
      return this.currentUser?.profile?.role === ROLES.STAFF
    } catch (error) {
      console.error('❌ AuthService: Erro ao verificar se é staff:', error)
      return false
    }
  }

  isIntern() {
    try {
      return this.currentUser?.profile?.role === ROLES.INTERN
    } catch (error) {
      console.error('❌ AuthService: Erro ao verificar se é estagiário:', error)
      return false
    }
  }

  getUserRole() {
    try {
      return this.currentUser?.profile?.role || null
    } catch (error) {
      console.error('❌ AuthService: Erro ao obter role do usuário:', error)
      return null
    }
  }

  getUserName() {
    try {
      return this.currentUser?.profile?.name || 
             this.currentUser?.user_metadata?.name || 
             this.currentUser?.email?.split('@')[0] || 
             'Usuário'
    } catch (error) {
      console.error('❌ AuthService: Erro ao obter nome do usuário:', error)
      return 'Usuário'
    }
  }

  isAuthenticated() {
    try {
      return !!this.currentUser
    } catch (error) {
      console.error('❌ AuthService: Erro ao verificar autenticação:', error)
      return false
    }
  }

  async refreshSession() {
    try {
      console.log('🔄 AuthService: Renovando sessão...')
      
      const refreshOperation = async () => {
        const { data, error } = await supabase.auth.refreshSession()
        if (error) throw error
        return data
      }

      const data = await this.withRetry(refreshOperation, 'Renovar sessão')
      
      if (data.user) {
        this.currentUser = await this.getUserWithProfile(data.user)
        console.log('✅ AuthService: Sessão renovada com sucesso')
        return { success: true, user: this.currentUser }
      }
      
      throw new Error('Falha ao renovar sessão')
      
    } catch (error) {
      console.error('❌ AuthService: Erro ao renovar sessão:', error)
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      }
    }
  }

  destroy() {
    try {
      console.log('🔄 AuthService: Destruindo serviço...')
      
      if (this.sessionCheckTimeout) {
        clearTimeout(this.sessionCheckTimeout)
        this.sessionCheckTimeout = null
      }

      this.currentUser = null
      this.listeners = []
      this.isInitialized = false
      
      console.log('✅ AuthService: Serviço destruído')
      
    } catch (error) {
      console.error('❌ AuthService: Erro ao destruir serviço:', error)
    }
  }
}

export default new AuthService() 