// ==================================================
// TESTE ISOLADO DE SIGNUP - SUPABASE AUTH
// Sistema de Neuropsicologia
// ==================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://viiukipyuimjandushqh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpaXVraXB5dWltamFuZHVzaHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0ODU0NTcsImV4cCI6MjA2NzA2MTQ1N30.nzM0bA9m3lxdhx0KWVqmGvb9EabuoZrUFVcc5oo2o44'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Função para testar o signup
async function testSignup() {
  console.log('🧪 TESTE: Iniciando teste de signup...')
  console.log('🧪 TESTE: URL do Supabase:', supabaseUrl)
  console.log('🧪 TESTE: Cliente configurado:', !!supabase)

  try {
    // Gerar email único para teste
    const timestamp = Date.now()
    const testEmail = `teste-${timestamp}@neuropsicologia.com`
    const testPassword = '123456789'
    
    console.log('🧪 TESTE: Email de teste:', testEmail)
    console.log('🧪 TESTE: Senha de teste:', testPassword)

    // Tentar criar usuário
    console.log('🧪 TESTE: Chamando supabase.auth.signUp...')
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Usuário Teste'
        }
      }
    })

    console.log('🧪 TESTE: Resposta do signUp:')
    console.log('  - Data:', data)
    console.log('  - Error:', error)
    console.log('  - User ID:', data?.user?.id)
    console.log('  - User email:', data?.user?.email)
    console.log('  - Session:', data?.session)

    if (error) {
      console.error('❌ TESTE: Erro no signup:', error)
      console.error('❌ TESTE: Código:', error.code)
      console.error('❌ TESTE: Mensagem:', error.message)
      console.error('❌ TESTE: Status:', error.status)
      return false
    }

    if (data?.user?.id) {
      console.log('✅ TESTE: Signup realizado com sucesso!')
      console.log('✅ TESTE: User ID:', data.user.id)
      
      // Testar inserção na tabela colaboradores
      console.log('🧪 TESTE: Testando inserção na tabela colaboradores...')
      
      const { data: insertData, error: insertError } = await supabase
        .from('colaboradores')
        .insert([{
          nome: 'Usuário Teste',
          email: testEmail,
          telefone: '(11) 99999-9999',
          cargo: 'estagiario',
          user_id: data.user.id,
          ativo: true
        }])
        .select()

      console.log('🧪 TESTE: Resultado da inserção na tabela:')
      console.log('  - Data:', insertData)
      console.log('  - Error:', insertError)

      if (insertError) {
        console.error('❌ TESTE: Erro na inserção:', insertError)
        return false
      }

      console.log('✅ TESTE: Inserção na tabela realizada com sucesso!')
      return true
    }

    console.log('⚠️ TESTE: Signup realizado mas sem user ID')
    return false

  } catch (error) {
    console.error('❌ TESTE: Erro inesperado:', error)
    console.error('❌ TESTE: Stack:', error.stack)
    return false
  }
}

// Função para testar configurações do Auth
async function testAuthConfig() {
  console.log('🧪 CONFIG: Testando configurações do Auth...')
  
  try {
    // Verificar sessão atual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('🧪 CONFIG: Sessão atual:', { sessionData, sessionError })

    // Verificar usuário atual
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('🧪 CONFIG: Usuário atual:', { userData, userError })

    // Testar conexão com a tabela colaboradores
    const { data: tableData, error: tableError } = await supabase
      .from('colaboradores')
      .select('count(*)')
      .single()

    console.log('🧪 CONFIG: Teste da tabela colaboradores:', { tableData, tableError })

  } catch (error) {
    console.error('❌ CONFIG: Erro ao testar configurações:', error)
  }
}

// Executar testes
console.log('🚀 Iniciando testes do Supabase Auth...')
testAuthConfig().then(() => {
  return testSignup()
}).then((success) => {
  console.log('🏁 RESULTADO FINAL:', success ? 'SUCESSO' : 'FALHA')
}).catch((error) => {
  console.error('💥 ERRO GERAL:', error)
})

export { testSignup, testAuthConfig } 