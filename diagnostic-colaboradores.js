// ==================================================
// DIAGNÓSTICO COMPLETO - COLABORADORES
// Sistema de Neuropsicologia
// ==================================================

console.log('🔍 DIAGNÓSTICO: Iniciando análise completa do sistema...');

// 1. Verificar se o módulo ColaboradoresPage existe
if (typeof ColaboradoresPage !== 'undefined') {
  console.log('✅ DIAGNÓSTICO: Classe ColaboradoresPage encontrada');
} else {
  console.log('❌ DIAGNÓSTICO: Classe ColaboradoresPage não encontrada');
}

// 2. Verificar configuração do Supabase
if (typeof supabase !== 'undefined') {
  console.log('✅ DIAGNÓSTICO: Supabase configurado');
  console.log('🔍 DIAGNÓSTICO: URL:', supabase.supabaseUrl);
  console.log('🔍 DIAGNÓSTICO: Key (primeiros 10 chars):', supabase.supabaseKey?.substring(0, 10) + '...');
} else {
  console.log('❌ DIAGNÓSTICO: Supabase não configurado');
}

// 3. Testar conectividade com a tabela colaboradores
async function testTableConnection() {
  console.log('🔍 DIAGNÓSTICO: Testando conexão com tabela colaboradores...');
  
  try {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('count(*)')
      .single();
    
    console.log('✅ DIAGNÓSTICO: Conexão com tabela OK:', { data, error });
    
    if (error) {
      console.log('❌ DIAGNÓSTICO: Erro na tabela:', error.code, error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ DIAGNÓSTICO: Erro inesperado na tabela:', error);
    return false;
  }
}

// 4. Testar Auth básico
async function testAuthBasic() {
  console.log('🔍 DIAGNÓSTICO: Testando funcionalidades básicas do Auth...');
  
  try {
    // Testar getSession
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('🔍 DIAGNÓSTICO: getSession:', { sessionData, sessionError });
    
    // Testar getUser
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('🔍 DIAGNÓSTICO: getUser:', { userData, userError });
    
    return true;
  } catch (error) {
    console.log('❌ DIAGNÓSTICO: Erro nos testes básicos do Auth:', error);
    return false;
  }
}

// 5. Testar inserção direta na tabela
async function testDirectInsert() {
  console.log('🔍 DIAGNÓSTICO: Testando inserção direta na tabela...');
  
  try {
    const timestamp = Date.now();
    const testData = {
      nome: `Teste Diagnóstico ${timestamp}`,
      email: `diagnostico-${timestamp}@teste.com`,
      telefone: '(11) 99999-9999',
      cargo: 'estagiario',
      user_id: null,
      ativo: true
    };
    
    const { data, error } = await supabase
      .from('colaboradores')
      .insert([testData])
      .select();
    
    console.log('🔍 DIAGNÓSTICO: Resultado da inserção direta:', { data, error });
    
    if (error) {
      console.log('❌ DIAGNÓSTICO: Erro na inserção:', error.code, error.message);
      return false;
    }
    
    // Limpar dados de teste
    if (data && data.length > 0) {
      const { error: deleteError } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🔍 DIAGNÓSTICO: Limpeza dos dados de teste:', { deleteError });
    }
    
    return true;
  } catch (error) {
    console.log('❌ DIAGNÓSTICO: Erro inesperado na inserção:', error);
    return false;
  }
}

// 6. Testar signup básico
async function testSignupBasic() {
  console.log('🔍 DIAGNÓSTICO: Testando signup básico...');
  
  try {
    const timestamp = Date.now();
    const testEmail = `signup-test-${timestamp}@teste.com`;
    const testPassword = 'senha123456';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Teste Signup'
        }
      }
    });
    
    console.log('🔍 DIAGNÓSTICO: Resultado do signup:', { data, error });
    
    if (error) {
      console.log('❌ DIAGNÓSTICO: Erro no signup:', error.code, error.message, error.status);
      return false;
    }
    
    console.log('✅ DIAGNÓSTICO: Signup funcionou!');
    return true;
  } catch (error) {
    console.log('❌ DIAGNÓSTICO: Erro inesperado no signup:', error);
    return false;
  }
}

// 7. Verificar RLS policies
async function testRLSPolicies() {
  console.log('🔍 DIAGNÓSTICO: Verificando políticas RLS...');
  
  try {
    const { data, error } = await supabase
      .rpc('check_rls_policies', { table_name: 'colaboradores' })
      .select();
    
    console.log('🔍 DIAGNÓSTICO: RLS Policies:', { data, error });
    
    if (error && error.code === '42883') {
      console.log('⚠️ DIAGNÓSTICO: Função check_rls_policies não existe (normal)');
      return true;
    }
    
    return true;
  } catch (error) {
    console.log('❌ DIAGNÓSTICO: Erro ao verificar RLS:', error);
    return false;
  }
}

// 8. Executar todos os testes
async function runDiagnostic() {
  console.log('🚀 DIAGNÓSTICO: Executando bateria completa de testes...');
  
  const results = {
    tableConnection: await testTableConnection(),
    authBasic: await testAuthBasic(),
    directInsert: await testDirectInsert(),
    signupBasic: await testSignupBasic(),
    rlsPolicies: await testRLSPolicies()
  };
  
  console.log('🏁 DIAGNÓSTICO: Resultados finais:', results);
  
  // Análise dos resultados
  if (results.tableConnection && results.directInsert) {
    console.log('✅ DIAGNÓSTICO: Problema parece estar no AUTH, não na tabela');
  } else if (!results.tableConnection) {
    console.log('❌ DIAGNÓSTICO: Problema na tabela colaboradores');
  } else if (!results.signupBasic) {
    console.log('❌ DIAGNÓSTICO: Problema no sistema de AUTH do Supabase');
  }
  
  return results;
}

// Executar diagnóstico automaticamente
runDiagnostic().then(results => {
  console.log('🎯 DIAGNÓSTICO COMPLETO! Veja os resultados acima para identificar o problema.');
});

// Exportar para uso manual
window.diagnosticColaboradores = {
  runDiagnostic,
  testTableConnection,
  testAuthBasic,
  testDirectInsert,
  testSignupBasic,
  testRLSPolicies
}; 