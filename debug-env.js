#!/usr/bin/env node

// 调试环境变量脚本
console.log('🔍 环境变量调试信息:')
console.log('==========================================')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? `✅ 已设置 (${process.env.VITE_SUPABASE_URL.substring(0, 30)}...)` : '❌ 缺失')
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? `✅ 已设置 (${process.env.VITE_SUPABASE_ANON_KEY.substring(0, 30)}...)` : '❌ 缺失')
console.log('==========================================')

// 列出所有 VITE_ 开头的环境变量
const viteEnvs = Object.keys(process.env).filter(key => key.startsWith('VITE_'))
if (viteEnvs.length > 0) {
  console.log('📋 所有 VITE_ 环境变量:')
  viteEnvs.forEach(key => {
    const value = process.env[key]
    console.log(`  ${key}: ${value ? `✅ 已设置 (${value.substring(0, 30)}...)` : '❌ 空值'}`)
  })
} else {
  console.log('❌ 没有找到任何 VITE_ 环境变量')
}
console.log('==========================================')
