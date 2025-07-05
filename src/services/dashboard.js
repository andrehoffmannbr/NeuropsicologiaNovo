import supabase from '../config/supabase.js'

class DashboardService {
  constructor() {
    this.maxQueryTime = 5000 // 🔧 CORREÇÃO: 5 segundos max para consultas
    this.retryAttempts = 2 // 🔧 CORREÇÃO: 2 tentativas de retry
    this.retryDelay = 1000 // 🔧 CORREÇÃO: 1 segundo entre tentativas
  }

  // 🔧 CORREÇÃO: Método para fazer consultas com timeout e retry
  async executeQuery(operation, operationName) {
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        console.log(`🔄 DashboardService: Executando ${operationName} (tentativa ${i + 1}/${this.retryAttempts})`)
        
        // 🔧 CORREÇÃO: Configurar timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Timeout: ${operationName} demorou mais que ${this.maxQueryTime}ms`))
          }, this.maxQueryTime)
        })

        // 🔧 CORREÇÃO: Race entre operação e timeout
        const result = await Promise.race([operation(), timeoutPromise])
        
        console.log(`✅ DashboardService: ${operationName} concluído com sucesso`)
        return result
        
      } catch (error) {
        console.error(`❌ DashboardService: ${operationName} falhou (tentativa ${i + 1}):`, error)
        
        if (i === this.retryAttempts - 1) {
          // Última tentativa
          console.error(`❌ DashboardService: ${operationName} falhou após ${this.retryAttempts} tentativas`)
          throw error
        }
        
        // 🔧 CORREÇÃO: Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)))
      }
    }
  }

  // 🔧 CORREÇÃO: Obter estatísticas com timeout e fallback
  async getStatistics() {
    try {
      console.log('🔄 DashboardService: Carregando estatísticas...')
      
      const stats = {
        activeClients: 0,
        todayAppointments: 0,
        pendingReports: 0,
        monthlyRevenue: 0
      }

      // 🔧 CORREÇÃO: Carregar estatísticas em paralelo com timeouts individuais
      const statsPromises = [
        this.executeQuery(
          () => this.getActiveClientsCount(),
          'Contagem de clientes ativos'
        ).then(count => { stats.activeClients = count }),
        
        this.executeQuery(
          () => this.getTodayAppointmentsCount(),
          'Contagem de agendamentos de hoje'
        ).then(count => { stats.todayAppointments = count }),
        
        this.executeQuery(
          () => this.getPendingReportsCount(),
          'Contagem de relatórios pendentes'
        ).then(count => { stats.pendingReports = count }),
        
        this.executeQuery(
          () => this.getMonthlyRevenue(),
          'Receita mensal'
        ).then(revenue => { stats.monthlyRevenue = revenue })
      ]

      // 🔧 CORREÇÃO: Usar Promise.allSettled para não falhar se uma estatística falhar
      const results = await Promise.allSettled(statsPromises)
      
      // 🔧 CORREÇÃO: Log de resultados
      results.forEach((result, index) => {
        const statNames = ['clientes ativos', 'agendamentos hoje', 'relatórios pendentes', 'receita mensal']
        if (result.status === 'rejected') {
          console.error(`⚠️ DashboardService: Falha ao carregar ${statNames[index]}:`, result.reason)
        }
      })

      console.log('✅ DashboardService: Estatísticas carregadas:', stats)
      return stats
      
    } catch (error) {
      console.error('❌ DashboardService: Erro ao obter estatísticas:', error)
      
      // 🔧 CORREÇÃO: Retornar estatísticas vazias em caso de erro
      return {
        activeClients: 0,
        todayAppointments: 0,
        pendingReports: 0,
        monthlyRevenue: 0
      }
    }
  }

  // 🔧 CORREÇÃO: Métodos auxiliares para estatísticas individuais
  async getActiveClientsCount() {
    const { data, error } = await supabase
      .from('clients')
      .select('id', { count: 'exact' })
      .eq('status', 'ativo')

    if (error) throw error
    return data?.length || 0
  }

  async getTodayAppointmentsCount() {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('appointments')
      .select('id', { count: 'exact' })
      .eq('appointment_date', today)
      .in('status', ['agendado', 'confirmado'])

    if (error) throw error
    return data?.length || 0
  }

  async getPendingReportsCount() {
    const { data, error } = await supabase
      .from('reports')
      .select('id', { count: 'exact' })
      .eq('status', 'rascunho')

    if (error) throw error
    return data?.length || 0
  }

  async getMonthlyRevenue() {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('transaction_type', 'receita')
      .eq('payment_status', 'pago')
      .gte('paid_date', firstDayOfMonth)

    if (error) throw error
    
    if (!data || data.length === 0) return 0
    
    return data.reduce((sum, transaction) => {
      const amount = parseFloat(transaction.amount) || 0
      return sum + amount
    }, 0)
  }

  // 🔧 CORREÇÃO: Obter agendamentos de hoje com timeout
  async getTodayAppointments() {
    try {
      console.log('🔄 DashboardService: Carregando agendamentos de hoje...')
      
      const appointmentsOperation = async () => {
        const today = new Date().toISOString().split('T')[0]
        
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            clients (
              name,
              phone,
              client_id
            )
          `)
          .eq('appointment_date', today)
          .in('status', ['agendado', 'confirmado'])
          .order('appointment_time', { ascending: true })

        if (error) throw error
        return data
      }

      const data = await this.executeQuery(appointmentsOperation, 'Agendamentos de hoje')
      
      // 🔧 CORREÇÃO: Transformar dados de forma mais robusta
      const formattedData = (data || []).map(appointment => {
        try {
          return {
            ...appointment,
            client_name: appointment.clients?.name || 'Nome não disponível',
            client_phone: appointment.clients?.phone || '',
            client_id: appointment.clients?.client_id || '',
            time: appointment.appointment_time ? 
                  this.formatTime(appointment.appointment_time) : 
                  '00:00',
            type: appointment.appointment_type || 'Consulta'
          }
        } catch (formatError) {
          console.error('⚠️ DashboardService: Erro ao formatar agendamento:', formatError)
          return {
            ...appointment,
            client_name: 'Erro ao carregar',
            client_phone: '',
            client_id: '',
            time: '00:00',
            type: 'Consulta'
          }
        }
      })

      console.log(`✅ DashboardService: ${formattedData.length} agendamentos carregados`)
      return formattedData
      
    } catch (error) {
      console.error('❌ DashboardService: Erro ao obter agendamentos de hoje:', error)
      return []
    }
  }

  // 🔧 CORREÇÃO: Obter atividades recentes com timeout
  async getRecentActivities() {
    try {
      console.log('🔄 DashboardService: Carregando atividades recentes...')
      
      const activities = []

      // 🔧 CORREÇÃO: Carregar atividades em paralelo
      const activitiesPromises = [
        this.executeQuery(
          () => this.getRecentClients(),
          'Clientes recentes'
        ),
        this.executeQuery(
          () => this.getRecentAppointments(),
          'Agendamentos recentes'
        )
      ]

      const [clientsResult, appointmentsResult] = await Promise.allSettled(activitiesPromises)

      // 🔧 CORREÇÃO: Processar clientes recentes
      if (clientsResult.status === 'fulfilled' && clientsResult.value) {
        clientsResult.value.forEach(client => {
          activities.push({
            type: 'cliente',
            description: `Cliente ${client.name} foi cadastrado`,
            timestamp: client.created_at
          })
        })
      } else {
        console.warn('⚠️ DashboardService: Não foi possível carregar clientes recentes')
      }

      // 🔧 CORREÇÃO: Processar agendamentos recentes
      if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value) {
        appointmentsResult.value.forEach(appointment => {
          activities.push({
            type: 'agendamento',
            description: `Agendamento para ${appointment.clients?.name || 'Cliente'} em ${appointment.appointment_date}`,
            timestamp: appointment.created_at
          })
        })
      } else {
        console.warn('⚠️ DashboardService: Não foi possível carregar agendamentos recentes')
      }

      // 🔧 CORREÇÃO: Ordenar por data e limitar
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      const limitedActivities = activities.slice(0, 5)

      console.log(`✅ DashboardService: ${limitedActivities.length} atividades recentes carregadas`)
      return limitedActivities
      
    } catch (error) {
      console.error('❌ DashboardService: Erro ao obter atividades recentes:', error)
      return []
    }
  }

  // 🔧 CORREÇÃO: Métodos auxiliares para atividades
  async getRecentClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) throw error
    return data || []
  }

  async getRecentAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        appointment_date,
        appointment_time,
        clients (name),
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) throw error
    return data || []
  }

  // Formatear moeda
  formatCurrency(value) {
    try {
      const numValue = parseFloat(value) || 0
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numValue)
    } catch (error) {
      console.error('❌ DashboardService: Erro ao formatar moeda:', error)
      return 'R$ 0,00'
    }
  }

  // Formatar data
  formatDate(dateString) {
    try {
      if (!dateString) return '--/--/----'
      
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '--/--/----'
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      console.error('❌ DashboardService: Erro ao formatar data:', error)
      return '--/--/----'
    }
  }

  // 🔧 CORREÇÃO: Formatar hora com proteção
  formatTime(timeString) {
    try {
      if (!timeString) return '00:00'
      
      // Se já está no formato HH:MM, retornar
      if (typeof timeString === 'string' && timeString.includes(':')) {
        return timeString.substring(0, 5)
      }
      
      return '00:00'
    } catch (error) {
      console.error('❌ DashboardService: Erro ao formatar hora:', error)
      return '00:00'
    }
  }

  // 🔧 CORREÇÃO: Método para verificar conectividade
  async checkConnection() {
    try {
      console.log('🔄 DashboardService: Verificando conectividade...')
      
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .limit(1)

      if (error) throw error
      
      console.log('✅ DashboardService: Conectividade OK')
      return true
      
    } catch (error) {
      console.error('❌ DashboardService: Problema de conectividade:', error)
      return false
    }
  }

  // 🔧 CORREÇÃO: Método para limpar cache (se necessário)
  clearCache() {
    console.log('🔄 DashboardService: Cache limpo (nenhum cache implementado)')
  }
}

export default new DashboardService() 