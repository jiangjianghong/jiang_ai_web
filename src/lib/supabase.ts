// Supabase 配置和初始化
import { createClient } from '@supabase/supabase-js'

// Supabase 配置对象
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 环境变量检查和回退
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 Supabase环境变量缺失:', {
    VITE_SUPABASE_URL: supabaseUrl ? '✅ 已设置' : '❌ 缺失',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ 已设置' : '❌ 缺失'
  })
  
  // 提供详细的错误信息
  const missingVars = []
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY')
  
  throw new Error(`Missing Supabase environment variables: ${missingVars.join(', ')}. Please check your GitHub Secrets or .env file.`)
}

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 数据库表名定义
export const TABLES = {
  USER_PROFILES: 'user_profiles',
  USER_SETTINGS: 'user_settings', 
  USER_WEBSITES: 'user_websites'
} as const

export default supabase
