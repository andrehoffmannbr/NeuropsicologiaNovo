import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://viiukipyuimjandushqh.supabase.co'
const FUNCTION_SECRET = 'np_refresh_views_2024_7e9a1b3c4d5f6g7h8i9j0k'

serve(async (req) => {
  try {
    // Log inicial
    console.log('🔄 Iniciando refresh-views function')
    
    // Verifica header de autorização
    const authHeader = req.headers.get('Authorization')
    console.log('Auth Header recebido:', authHeader)
    
    if (!authHeader) {
      console.log('❌ Header Authorization não encontrado')
      return new Response('Header Authorization não encontrado', { status: 401 })
    }

    // Extrai o token do header Bearer
    const token = authHeader.replace('Bearer ', '').trim()
    
    // Verifica o token
    if (token !== FUNCTION_SECRET) {
      console.log('❌ Token inválido')
      return new Response('Token inválido', { status: 401 })
    }

    // Cria cliente do Supabase com acesso anônimo
    const supabase = createClient(SUPABASE_URL, FUNCTION_SECRET, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('✅ Cliente Supabase criado')

    // Chama a função de refresh sem token
    console.log('🔄 Chamando refresh_materialized_views...')
    const { data, error } = await supabase
      .rpc('refresh_materialized_views')

    if (error) {
      console.error('❌ Erro ao atualizar views:', error)
      throw error
    }

    console.log('✅ Views atualizadas com sucesso:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: 'Views materializadas atualizadas com sucesso',
        timestamp: new Date().toISOString()
      }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error('❌ Erro:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}) 