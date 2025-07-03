import supabase from '../config/supabase.js'

class DashboardService {
  
  // Obter estatísticas principais
  async getStatistics() {
    try {
      const stats = {
        activeClients: 0,
        todayAppointments: 0,
        pendingReports: 0,
        monthlyRevenue: 0
      }

      // Clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id', { count: 'exact' })
        .eq('status', 'ativo')

      if (!clientsError) {
        stats.activeClients = clients?.length || 0
      }

      // Agendamentos de hoje
      const today = new Date().toISOString().split('T')[0]
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('appointment_date', today)
        .in('status', ['agendado', 'confirmado'])

      if (!appointmentsError) {
        stats.todayAppointments = appointments?.length || 0
      }

      // Relatórios pendentes
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('id', { count: 'exact' })
        .eq('status', 'rascunho')

      if (!reportsError) {
        stats.pendingReports = reports?.length || 0
      }

      // Receita do mês
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0]
      const { data: revenue, error: revenueError } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('transaction_type', 'receita')
        .eq('payment_status', 'pago')
        .gte('paid_date', firstDayOfMonth)

      if (!revenueError && revenue) {
        stats.monthlyRevenue = revenue.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0)
      }

      return stats
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return {
        activeClients: 0,
        todayAppointments: 0,
        pendingReports: 0,
        monthlyRevenue: 0
      }
    }
  }

  // Obter agendamentos de hoje
  async getTodayAppointments() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            name,
            phone
          )
        `)
        .eq('appointment_date', today)
        .in('status', ['agendado', 'confirmado'])
        .order('appointment_time', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao obter agendamentos de hoje:', error)
      return []
    }
  }

  // Obter atividades recentes
  async getRecentActivities() {
    try {
      const activities = []

      // Últimos clientes cadastrados
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(3)

      if (!clientsError && clients) {
        clients.forEach(client => {
          activities.push({
            type: 'cliente',
            description: `Cliente ${client.name} foi cadastrado`,
            timestamp: client.created_at
          })
        })
      }

      // Últimos agendamentos
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          appointment_date,
          appointment_time,
          clients (name),
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(3)

      if (!appointmentsError && appointments) {
        appointments.forEach(appointment => {
          activities.push({
            type: 'agendamento',
            description: `Agendamento para ${appointment.clients?.name} em ${appointment.appointment_date}`,
            timestamp: appointment.created_at
          })
        })
      }

      // Ordenar por data
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      return activities.slice(0, 5)
    } catch (error) {
      console.error('Erro ao obter atividades recentes:', error)
      return []
    }
  }

  // Formatear moeda
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Formatar data
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Formatar hora
  formatTime(timeString) {
    return timeString.substring(0, 5)
  }
}

export default new DashboardService() 