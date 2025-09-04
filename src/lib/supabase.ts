// Supabase 配置和初始化
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Supabase 配置对象
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

logger.debug('环境变量检查', {
  NODE_ENV: import.meta.env.MODE,
  VITE_SUPABASE_URL: supabaseUrl ? `已设置 (${supabaseUrl.substring(0, 30)}...)` : '缺失',
  VITE_SUPABASE_ANON_KEY: supabaseAnonKey
    ? `已设置 (${supabaseAnonKey.substring(0, 30)}...)`
    : '缺失',
});

// 检查环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Supabase环境变量缺失', {
    VITE_SUPABASE_URL: supabaseUrl ? '已设置' : '缺失',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '已设置' : '缺失',
    'import.meta.env': import.meta.env,
  });

  // 在开发环境下，使用本地.env文件的值
  if (import.meta.env.MODE === 'development') {
    logger.warn('开发环境下使用本地.env文件配置');
    // 这里不抛出错误，让开发环境使用本地配置
  } else {
    // 在生产环境下抛出错误
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

    throw new Error(
      `Missing Supabase environment variables: ${missingVars.join(', ')}. Please check your GitHub Secrets configuration.`
    );
  }
}

// 创建 Supabase 客户端
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

logger.info('Supabase客户端初始化成功');

// 数据库表名定义
export const TABLES = {
  USER_PROFILES: 'user_profiles',
  USER_SETTINGS: 'user_settings',
  USER_WEBSITES: 'user_websites',
} as const;

export default supabase;
