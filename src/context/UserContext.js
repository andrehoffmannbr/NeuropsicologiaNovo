import React, { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../config/supabase.js'

// Criar contexto
const UserContext = createContext()

// Provider do contexto
export function UserProvider({ children }) {
  const [user, setUser] = useState(null) // {id, nome, email, role, ativo, telefone, cargo}
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carregar perfil do usuário
  const loadUserProfile = async (userId) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, role, ativo, telefone, cargo, criado_em')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        setError('Erro ao carregar perfil do usuário')
        return null
      }

      setUser(data)
      return data
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      setError('Erro inesperado ao carregar perfil')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Criar perfil de usuário se não existir
  const createUserProfile = async (authUser, profileData = {}) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([
          {
            id: authUser.id,
            nome: profileData.nome || authUser.user_metadata?.nome || 'Usuário',
            email: authUser.email,
            role: profileData.role || 'funcionario',
            ativo: true,
            telefone: profileData.telefone || authUser.user_metadata?.telefone || null,
            cargo: profileData.cargo || null
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar perfil:', error)
        throw error
      }

      setUser(data)
      return data
    } catch (err) {
      console.error('Erro ao criar perfil:', err)
      throw err
    }
  }

  // Atualizar perfil do usuário
  const updateUserProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('Usuário não está logado')
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar perfil:', error)
        throw error
      }

      setUser(data)
      return data
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      throw err
    }
  }

  // Verificar se usuário tem permissão
  const hasPermission = (permission) => {
    if (!user) return false

    const permissions = {
      admin: ['all'],
      coordenador: ['all', 'manage_users', 'manage_protocols', 'view_reports', 'manage_clients'],
      funcionario: ['view_clients', 'manage_appointments', 'view_reports'],
      estagiario: ['view_own_clients', 'create_clients', 'manage_own_appointments']
    }

    const userPermissions = permissions[user.role] || []
    
    // Admin tem acesso a tudo
    if (userPermissions.includes('all')) return true
    
    // Verificar permissão específica
    return userPermissions.includes(permission)
  }

  // Verificar se é admin
  const isAdmin = () => {
    return user && user.role === 'admin'
  }

  // Verificar se é coordenador
  const isCoordinator = () => {
    return user && user.role === 'coordenador'
  }

  // Verificar se é funcionário
  const isStaff = () => {
    return user && user.role === 'funcionario'
  }

  // Verificar se é estagiário
  const isIntern = () => {
    return user && user.role === 'estagiario'
  }

  // Verificar se tem acesso administrativo
  const isAdminOrCoordinator = () => {
    return user && ['admin', 'coordenador'].includes(user.role)
  }

  // Limpar dados do usuário
  const clearUser = () => {
    setUser(null)
    setError(null)
  }

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      clearUser()
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    }
  }

  // Efeito para monitorar mudanças de autenticação
  useEffect(() => {
    let mounted = true

    // Verificar sessão inicial
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          const profile = await loadUserProfile(session.user.id)
          if (!profile && mounted) {
            // Se não encontrou perfil, criar um básico
            await createUserProfile(session.user)
          }
        } else if (mounted) {
          setLoading(false)
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err)
        if (mounted) {
          setError('Erro ao verificar sessão')
          setLoading(false)
        }
      }
    }

    checkSession()

    // Monitorar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await loadUserProfile(session.user.id)
          if (!profile) {
            // Se não encontrou perfil, criar um básico
            await createUserProfile(session.user)
          }
        } else if (event === 'SIGNED_OUT') {
          clearUser()
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Valor do contexto
  const value = {
    // Estado
    user,
    loading,
    error,
    
    // Funções
    loadUserProfile,
    createUserProfile,
    updateUserProfile,
    clearUser,
    logout,
    
    // Verificações de permissão
    hasPermission,
    isAdmin,
    isCoordinator,
    isStaff,
    isIntern,
    isAdminOrCoordinator,
    
    // Propriedades computadas
    isAuthenticated: !!user,
    userName: user?.nome || 'Usuário',
    userRole: user?.role || 'funcionario',
    userEmail: user?.email || ''
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// Hook para usar o contexto
export function useUser() {
  const context = useContext(UserContext)
  
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  
  return context
}

// Hook para verificar autenticação
export function useAuth() {
  const { user, loading, isAuthenticated } = useUser()
  
  return {
    user,
    loading,
    isAuthenticated
  }
}

// Hook para verificar permissões
export function usePermissions() {
  const { 
    hasPermission, 
    isAdmin, 
    isCoordinator, 
    isStaff, 
    isIntern, 
    isAdminOrCoordinator 
  } = useUser()
  
  return {
    hasPermission,
    isAdmin,
    isCoordinator,
    isStaff,
    isIntern,
    isAdminOrCoordinator
  }
}

export default UserContext 