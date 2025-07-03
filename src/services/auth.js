import supabase from '../config/supabase.js'

export const ROLES = {
  COORDINATOR: 'coordinator',
  STAFF: 'staff',
  INTERN: 'intern'
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
  }

  // Registrar listener para mudanças de autenticação
  onAuthStateChange(callback) {
    this.listeners.push(callback)
    
    // Configurar listener do Supabase
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        this.currentUser = await this.getUserWithProfile(session.user)
      } else {
        this.currentUser = null
      }
      
      // Notificar todos os listeners
      this.listeners.forEach(listener => listener(this.currentUser))
    })
  }

  // Fazer login
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      this.currentUser = await this.getUserWithProfile(data.user)
      return { success: true, user: this.currentUser }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Fazer logout
  async logout() {
    try {
      await supabase.auth.signOut()
      this.currentUser = null
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Registrar novo usuário
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) throw error

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Criar perfil de usuário
  async createUserProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          id: userId,
          ...profileData
        }])

      if (error) throw error
      return { success: true, profile: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Obter usuário atual
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        this.currentUser = await this.getUserWithProfile(user)
      }
      
      return this.currentUser
    } catch (error) {
      console.error('Erro ao obter usuário:', error)
      return null
    }
  }

  // Obter perfil completo do usuário
  async getUserWithProfile(user) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.log('Perfil não encontrado, usando perfil padrão para:', user.email)
        // Se não encontrar o perfil, criar um padrão baseado no email
        const defaultProfile = {
          role: user.email === 'test@example.com' ? ROLES.COORDINATOR : 
                user.email === 'admin.neuropsicologia@gmail.com' ? ROLES.COORDINATOR : 
                ROLES.INTERN,
          name: user.email === 'test@example.com' ? 'Administrador' :
                user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email
        }
        
        console.log('✅ Usando perfil padrão:', defaultProfile)
        
        return {
          ...user,
          profile: defaultProfile
        }
      }

      return {
        ...user,
        profile: profile
      }
    } catch (error) {
      console.error('Erro ao obter perfil:', error)
      // Fallback para coordenador se for o admin ou test
      const defaultRole = (user.email === 'admin.neuropsicologia@gmail.com' || user.email === 'test@example.com') ? ROLES.COORDINATOR : ROLES.INTERN
      const defaultProfile = {
        role: defaultRole,
        name: user.email === 'test@example.com' ? 'Administrador' :
              user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email
      }
      
      console.log('✅ Usando perfil de fallback:', defaultProfile)
      
      return {
        ...user,
        profile: defaultProfile
      }
    }
  }

  // Verificar se usuário tem permissão
  hasPermission(permission) {
    if (!this.currentUser?.profile?.role) return false
    
    const userPermissions = PERMISSIONS[this.currentUser.profile.role]
    return userPermissions.includes('all') || userPermissions.includes(permission)
  }

  // Verificar se usuário é coordenador
  isCoordinator() {
    return this.currentUser?.profile?.role === ROLES.COORDINATOR
  }

  // Verificar se usuário é staff
  isStaff() {
    return this.currentUser?.profile?.role === ROLES.STAFF
  }

  // Verificar se usuário é estagiário
  isIntern() {
    return this.currentUser?.profile?.role === ROLES.INTERN
  }

  // Obter role do usuário
  getUserRole() {
    return this.currentUser?.profile?.role || null
  }

  // Obter nome do usuário
  getUserName() {
    return this.currentUser?.profile?.name || 
           this.currentUser?.user_metadata?.name || 
           this.currentUser?.email?.split('@')[0] || 
           'Usuário'
  }
}

export const authService = new AuthService()
export default authService 