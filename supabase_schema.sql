-- Supabase 数据库表结构创建脚本
-- 请在 Supabase SQL Editor 中执行此脚本

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  card_opacity NUMERIC DEFAULT 0.8,
  search_bar_opacity NUMERIC DEFAULT 0.9,
  parallax_enabled BOOLEAN DEFAULT true,
  wallpaper_resolution TEXT DEFAULT 'high',
  theme TEXT DEFAULT 'dark',
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 用户网站数据表
CREATE TABLE IF NOT EXISTS user_websites (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  websites JSONB DEFAULT '[]'::jsonb,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全策略（RLS）
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;

-- 创建安全策略：用户只能访问自己的数据
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own websites" ON user_websites
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own websites" ON user_websites
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own websites" ON user_websites
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建自动更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_websites_updated_at BEFORE UPDATE ON user_websites 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
