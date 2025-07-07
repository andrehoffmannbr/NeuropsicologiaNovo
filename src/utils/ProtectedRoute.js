import React from 'react'
import { useUser } from '../context/UserContext.js'
import { router, ROUTES } from './router.js'

// Componente de rota protegida por roles
export function RoleRoute({ allowed, children, fallbackRoute = ROUTES.DASHBOARD }) {
  const { user, loading, isAuthenticated } = useUser()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="route-loading">
        <div className="route-loading-content">
          <div className="loading-spinner"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Usuário não autenticado - redirecionar para login
  if (!isAuthenticated) {
    router.navigateTo(ROUTES.LOGIN)
    return null
  }

  // Usuário autenticado mas sem permissão - mostrar página de acesso negado
  if (user && !allowed.includes(user.role)) {
    return <AccessDenied userRole={user.role} allowedRoles={allowed} fallbackRoute={fallbackRoute} />
  }

  // Usuário com permissão - renderizar children
  return children
}

// Componente para usuários autenticados
export function AuthRoute({ children }) {
  const { loading, isAuthenticated } = useUser()

  if (loading) {
    return (
      <div className="route-loading">
        <div className="route-loading-content">
          <div className="loading-spinner"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.navigateTo(ROUTES.LOGIN)
    return null
  }

  return children
}

// Componente para usuários não autenticados (página pública)
export function PublicRoute({ children, redirectIfAuthenticated = ROUTES.DASHBOARD }) {
  const { loading, isAuthenticated } = useUser()

  if (loading) {
    return (
      <div className="route-loading">
        <div className="route-loading-content">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    router.navigateTo(redirectIfAuthenticated)
    return null
  }

  return children
}

// Componente de acesso negado
export function AccessDenied({ userRole, allowedRoles, fallbackRoute }) {
  const handleGoBack = () => {
    if (fallbackRoute) {
      router.navigateTo(fallbackRoute)
    } else {
      window.history.back()
    }
  }

  const handleGoToDashboard = () => {
    router.navigateTo(ROUTES.DASHBOARD)
  }

  return (
    <div className="access-denied-page">
      <div className="access-denied-content">
        <div className="access-denied-icon">
          <i data-lucide="shield-x"></i>
        </div>
        
        <h1>Acesso Negado</h1>
        
        <div className="access-denied-message">
          <p>Você não tem permissão para acessar esta página.</p>
          <div className="permission-details">
            <p><strong>Seu perfil:</strong> {getRoleDisplayName(userRole)}</p>
            <p><strong>Perfis permitidos:</strong> {allowedRoles.map(getRoleDisplayName).join(', ')}</p>
          </div>
        </div>

        <div className="access-denied-actions">
          <button className="btn btn-primary" onClick={handleGoToDashboard}>
            <i data-lucide="home"></i>
            Ir para Dashboard
          </button>
          <button className="btn btn-secondary" onClick={handleGoBack}>
            <i data-lucide="arrow-left"></i>
            Voltar
          </button>
        </div>

        <div className="access-denied-help">
          <p>Se você acredita que deveria ter acesso a esta página, entre em contato com o administrador do sistema.</p>
        </div>
      </div>
    </div>
  )
}

// Componente de proteção por permissão específica
export function PermissionRoute({ permission, children, fallbackComponent = null }) {
  const { user, loading, hasPermission } = useUser()

  if (loading) {
    return (
      <div className="route-loading">
        <div className="route-loading-content">
          <div className="loading-spinner"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.navigateTo(ROUTES.LOGIN)
    return null
  }

  if (!hasPermission(permission)) {
    return fallbackComponent || (
      <div className="permission-denied">
        <p>Você não tem permissão para ver este conteúdo.</p>
      </div>
    )
  }

  return children
}

// HOC para proteção de componentes
export function withRoleProtection(Component, allowedRoles) {
  return function ProtectedComponent(props) {
    return (
      <RoleRoute allowed={allowedRoles}>
        <Component {...props} />
      </RoleRoute>
    )
  }
}

// HOC para proteção por permissão
export function withPermissionProtection(Component, permission) {
  return function ProtectedComponent(props) {
    return (
      <PermissionRoute permission={permission}>
        <Component {...props} />
      </PermissionRoute>
    )
  }
}

// Função auxiliar para obter nome amigável do role
function getRoleDisplayName(role) {
  const roleNames = {
    admin: 'Administrador',
    coordenador: 'Coordenador',
    funcionario: 'Funcionário',
    estagiario: 'Estagiário'
  }
  
  return roleNames[role] || role
}

// Hook para verificar se pode acessar rota
export function useCanAccessRoute(allowedRoles) {
  const { user, loading, isAuthenticated } = useUser()
  
  if (loading || !isAuthenticated || !user) {
    return false
  }
  
  return allowedRoles.includes(user.role)
}

// Hook para obter rotas permitidas para o usuário atual
export function useAllowedRoutes() {
  const { user } = useUser()
  
  if (!user) return []
  
  const routePermissions = {
    [ROUTES.LOGIN]: ['public'],
    [ROUTES.DASHBOARD]: ['admin', 'coordenador', 'funcionario', 'estagiario'],
    [ROUTES.CLIENTS]: ['admin', 'coordenador', 'funcionario'],
    [ROUTES.APPOINTMENTS]: ['admin', 'coordenador', 'funcionario', 'estagiario'],
    [ROUTES.ALL_CLIENTS]: ['admin', 'coordenador'],
    [ROUTES.MEUS_CLIENTES]: ['estagiario'],
    [ROUTES.CLIENT_REPORTS]: ['admin', 'coordenador'],
    [ROUTES.DOCUMENTS]: ['admin', 'coordenador', 'funcionario'],
    [ROUTES.FINANCIAL]: ['admin', 'coordenador'],
    [ROUTES.INVENTORY]: ['admin', 'coordenador'],
    [ROUTES.INTERNS]: ['admin', 'coordenador'],
    [ROUTES.COLABORADORES]: ['admin', 'coordenador'],
    [ROUTES.PRONTUARIO]: ['admin', 'coordenador', 'funcionario']
  }
  
  const allowedRoutes = []
  
  for (const [route, allowedRoles] of Object.entries(routePermissions)) {
    if (allowedRoles.includes(user.role)) {
      allowedRoutes.push(route)
    }
  }
  
  return allowedRoutes
}

export default RoleRoute 