import supabase from '../config/supabase.js'

/**
 * Sistema de Auditoria
 * Registra todas as ações importantes do sistema para compliance e segurança
 */
class AuditLogger {
  constructor() {
    this.enabled = true
    this.batchLogs = []
    this.batchSize = 10
    this.flushInterval = 30000 // 30 segundos
    this.setupBatchLogging()
  }

  /**
   * Configurar sistema de logs em lote para performance
   */
  setupBatchLogging() {
    setInterval(() => {
      this.flushLogs()
    }, this.flushInterval)

    // Flush logs antes de fechar a janela
    window.addEventListener('beforeunload', () => {
      this.flushLogs()
    })
  }

  /**
   * Registrar uma ação do usuário
   * @param {Object} options - Opções do log
   * @param {string} options.action - Ação realizada (CREATE, UPDATE, DELETE, LOGIN, etc.)
   * @param {string} options.table - Tabela afetada
   * @param {string} options.record_id - ID do registro afetado
   * @param {Object} options.old_data - Dados antes da alteração
   * @param {Object} options.new_data - Dados depois da alteração
   * @param {Object} options.details - Detalhes adicionais
   * @param {boolean} options.immediate - Se deve ser enviado imediatamente
   */
  async log(options) {
    if (!this.enabled) return

    try {
      const logEntry = {
        usuario_id: await this.getCurrentUserId(),
        acao: options.action,
        tabela: options.table,
        registro_id: options.record_id,
        dados_antigos: options.old_data || null,
        dados_novos: options.new_data || null,
        detalhes: {
          ...options.details,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href,
          ip_address: await this.getClientIP()
        },
        data_hora: new Date().toISOString()
      }

      if (options.immediate) {
        await this.sendLog(logEntry)
      } else {
        this.batchLogs.push(logEntry)
        
        if (this.batchLogs.length >= this.batchSize) {
          await this.flushLogs()
        }
      }
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error)
    }
  }

  /**
   * Enviar logs em lote para o banco de dados
   */
  async flushLogs() {
    if (this.batchLogs.length === 0) return

    try {
      const logsToSend = [...this.batchLogs]
      this.batchLogs = []

      const { error } = await supabase
        .from('logs_acao')
        .insert(logsToSend)

      if (error) {
        console.error('Erro ao enviar logs de auditoria:', error)
        // Re-adicionar logs que falharam
        this.batchLogs.unshift(...logsToSend)
      }
    } catch (error) {
      console.error('Erro ao processar lote de logs:', error)
    }
  }

  /**
   * Enviar um log individual
   */
  async sendLog(logEntry) {
    try {
      const { error } = await supabase
        .from('logs_acao')
        .insert([logEntry])

      if (error) {
        console.error('Erro ao enviar log individual:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro ao processar log individual:', error)
      throw error
    }
  }

  /**
   * Obter ID do usuário atual
   */
  async getCurrentUserId() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id || null
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error)
      return null
    }
  }

  /**
   * Obter IP do cliente (aproximado)
   */
  async getClientIP() {
    try {
      // Em produção, isso deveria vir do servidor
      // Por ora, retornamos uma string indicativa
      return 'client-side'
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Ativar/desativar logs
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }

  /**
   * Consultar logs de auditoria
   */
  async getLogs(filters = {}) {
    try {
      let query = supabase
        .from('logs_acao')
        .select(`
          *,
          usuarios(nome, email, role)
        `)
        .order('data_hora', { ascending: false })

      // Aplicar filtros
      if (filters.table) {
        query = query.eq('tabela', filters.table)
      }

      if (filters.action) {
        query = query.eq('acao', filters.action)
      }

      if (filters.user_id) {
        query = query.eq('usuario_id', filters.user_id)
      }

      if (filters.date_from) {
        query = query.gte('data_hora', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('data_hora', filters.date_to)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao consultar logs:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao obter logs de auditoria:', error)
      throw error
    }
  }

  /**
   * Obter estatísticas de logs
   */
  async getLogStats() {
    try {
      const { data, error } = await supabase
        .from('logs_acao')
        .select('acao, tabela, data_hora')

      if (error) throw error

      const stats = {
        total: data.length,
        by_action: {},
        by_table: {},
        by_date: {},
        recent_activity: data.slice(0, 10)
      }

      data.forEach(log => {
        // Por ação
        stats.by_action[log.acao] = (stats.by_action[log.acao] || 0) + 1

        // Por tabela
        stats.by_table[log.tabela] = (stats.by_table[log.tabela] || 0) + 1

        // Por data (últimos 30 dias)
        const date = new Date(log.data_hora).toDateString()
        stats.by_date[date] = (stats.by_date[date] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Erro ao obter estatísticas de logs:', error)
      throw error
    }
  }

  /**
   * Exportar logs para CSV
   */
  async exportLogs(filters = {}) {
    try {
      const logs = await this.getLogs(filters)
      
      const csvHeader = [
        'Data/Hora',
        'Usuário',
        'Ação',
        'Tabela',
        'Registro ID',
        'Detalhes'
      ].join(',')

      const csvRows = logs.map(log => [
        new Date(log.data_hora).toLocaleString(),
        log.usuarios?.nome || 'N/A',
        log.acao,
        log.tabela,
        log.registro_id || '',
        JSON.stringify(log.detalhes || {}).replace(/"/g, '""')
      ].join(','))

      const csvContent = [csvHeader, ...csvRows].join('\n')
      
      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      return true
    } catch (error) {
      console.error('Erro ao exportar logs:', error)
      throw error
    }
  }

  /**
   * Limpar logs antigos
   */
  async cleanOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { error } = await supabase
        .from('logs_acao')
        .delete()
        .lt('data_hora', cutoffDate.toISOString())

      if (error) throw error

      return true
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error)
      throw error
    }
  }
}

// Instância singleton do logger
const auditLogger = new AuditLogger()

// Funções de conveniência para tipos comuns de logs
export const logUserAction = {
  // Login/Logout
  login: (details = {}) => auditLogger.log({
    action: 'LOGIN',
    table: 'usuarios',
    details,
    immediate: true
  }),

  logout: (details = {}) => auditLogger.log({
    action: 'LOGOUT',
    table: 'usuarios',
    details,
    immediate: true
  }),

  // CRUD de Clientes
  createClient: (clientId, clientData, details = {}) => auditLogger.log({
    action: 'CREATE',
    table: 'clientes',
    record_id: clientId,
    new_data: clientData,
    details
  }),

  updateClient: (clientId, oldData, newData, details = {}) => auditLogger.log({
    action: 'UPDATE',
    table: 'clientes',
    record_id: clientId,
    old_data: oldData,
    new_data: newData,
    details
  }),

  deleteClient: (clientId, clientData, details = {}) => auditLogger.log({
    action: 'DELETE',
    table: 'clientes',
    record_id: clientId,
    old_data: clientData,
    details,
    immediate: true
  }),

  // CRUD de Agendamentos
  createAppointment: (appointmentId, appointmentData, details = {}) => auditLogger.log({
    action: 'CREATE',
    table: 'agendamentos',
    record_id: appointmentId,
    new_data: appointmentData,
    details
  }),

  updateAppointment: (appointmentId, oldData, newData, details = {}) => auditLogger.log({
    action: 'UPDATE',
    table: 'agendamentos',
    record_id: appointmentId,
    old_data: oldData,
    new_data: newData,
    details
  }),

  cancelAppointment: (appointmentId, appointmentData, details = {}) => auditLogger.log({
    action: 'CANCEL',
    table: 'agendamentos',
    record_id: appointmentId,
    old_data: appointmentData,
    details
  }),

  // CRUD de Prontuários
  createRecord: (recordId, recordData, details = {}) => auditLogger.log({
    action: 'CREATE',
    table: 'prontuarios',
    record_id: recordId,
    new_data: recordData,
    details
  }),

  updateRecord: (recordId, oldData, newData, details = {}) => auditLogger.log({
    action: 'UPDATE',
    table: 'prontuarios',
    record_id: recordId,
    old_data: oldData,
    new_data: newData,
    details
  }),

  // Movimentação de Estoque
  stockMovement: (movementId, movementData, details = {}) => auditLogger.log({
    action: 'STOCK_MOVEMENT',
    table: 'movimentos_estoque',
    record_id: movementId,
    new_data: movementData,
    details
  }),

  // Ações Administrativas
  systemBackup: (details = {}) => auditLogger.log({
    action: 'SYSTEM_BACKUP',
    table: 'system',
    details,
    immediate: true
  }),

  systemMaintenance: (details = {}) => auditLogger.log({
    action: 'SYSTEM_MAINTENANCE',
    table: 'system',
    details,
    immediate: true
  }),

  configurationChange: (setting, oldValue, newValue, details = {}) => auditLogger.log({
    action: 'CONFIG_CHANGE',
    table: 'system',
    old_data: { setting, value: oldValue },
    new_data: { setting, value: newValue },
    details,
    immediate: true
  }),

  // Ação genérica
  custom: (action, table, recordId, oldData, newData, details = {}) => auditLogger.log({
    action,
    table,
    record_id: recordId,
    old_data: oldData,
    new_data: newData,
    details
  })
}

// Exportar logger principal e funções utilitárias
export default auditLogger
export { AuditLogger } 