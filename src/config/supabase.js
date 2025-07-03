import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://viiukipyuimjandushqh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpaXVraXB5dWltamFuZHVzaHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0ODU0NTcsImV4cCI6MjA2NzA2MTQ1N30.nzM0bA9m3lxdhx0KWVqmGvb9EabuoZrUFVcc5oo2o44'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'neuropsicologia-system'
    }
  }
})

export default supabase 