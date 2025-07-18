// Supabase 配置和初始化
import { createClient } from '@supabase/supabase-js'

// Supabase 配置对象
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
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
