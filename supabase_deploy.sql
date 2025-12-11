-- ==============================================================================
-- Tomato Tabs - Unified Deployment Script (One-Click Setup)
-- 西红柿标签页 - 统一部署脚本 (一键安装)
-- ==============================================================================
-- Usage: Run this entire script in the Supabase SQL Editor.
-- 用法: 在 Supabase SQL Editor 中运行此脚本即可完成所有数据库配置。
-- ==============================================================================

-- 1. Create Tables (创建数据表)
-- ==============================================================================

-- 1.1 User Profiles (用户资料表)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 User Settings (用户设置表) - Includes all latest columns
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  -- Basic Appearance
  card_opacity NUMERIC DEFAULT 0.8,
  search_bar_opacity NUMERIC DEFAULT 0.9,
  parallax_enabled BOOLEAN DEFAULT true,
  wallpaper_resolution TEXT DEFAULT 'high',
  theme TEXT DEFAULT 'dark',
  -- Colors
  card_color TEXT DEFAULT '255, 255, 255',
  search_bar_color TEXT DEFAULT '255, 255, 255',
  -- Sync Settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  auto_sync_interval INTEGER DEFAULT 30,
  -- Behavior
  search_in_new_tab BOOLEAN DEFAULT true,
  auto_sort_enabled BOOLEAN DEFAULT false,
  -- Time Component
  time_component_enabled BOOLEAN DEFAULT true,
  show_full_date BOOLEAN DEFAULT true,
  show_seconds BOOLEAN DEFAULT true,
  show_weekday BOOLEAN DEFAULT true,
  show_year BOOLEAN DEFAULT true,
  show_month BOOLEAN DEFAULT true,
  show_day BOOLEAN DEFAULT true,
  -- Style
  search_bar_border_radius INTEGER DEFAULT 12,
  -- Meta
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 User Websites (用户网站数据表)
CREATE TABLE IF NOT EXISTS user_websites (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  websites JSONB DEFAULT '[]'::jsonb,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 User Stats (用户统计表)
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  total_site_visits INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  settings_opened INTEGER DEFAULT 0,
  app_opened INTEGER DEFAULT 0,
  card_clicks JSONB DEFAULT '{}'::jsonb,
  first_use_date DATE DEFAULT CURRENT_DATE,
  last_visit_date DATE DEFAULT CURRENT_DATE,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) (启用行级安全)
-- ==============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 3. Create Security Policies (创建安全策略)
-- ==============================================================================

-- Helper for common policies (DROP helps if re-running script)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Settings Policies
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

CREATE POLICY "Users can read own settings" ON user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);

-- Websites Policies
DROP POLICY IF EXISTS "Users can read own websites" ON user_websites;
DROP POLICY IF EXISTS "Users can update own websites" ON user_websites;
DROP POLICY IF EXISTS "Users can insert own websites" ON user_websites;

CREATE POLICY "Users can read own websites" ON user_websites FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own websites" ON user_websites FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own websites" ON user_websites FOR INSERT WITH CHECK (auth.uid() = id);

-- Stats Policies
DROP POLICY IF EXISTS "Users can read own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;

CREATE POLICY "Users can read own stats" ON user_stats FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own stats" ON user_stats FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Create Functions & Triggers (创建函数与触发器)
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers to avoid duplication errors on re-run
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_user_websites_updated_at ON user_websites;
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_websites_updated_at BEFORE UPDATE ON user_websites 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Storage Buckets (存储桶)
-- ==============================================================================
-- Note: Running this via SQL Editor might require special permissions.
-- If this fails, please create buckets named 'favicons' and 'wallpapers' manually in the Dashboard.

INSERT INTO storage.buckets (id, name, public)
VALUES ('favicons', 'favicons', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('wallpapers', 'wallpapers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Public Read, Authenticated Upload)

-- Favicons
DROP POLICY IF EXISTS "Public favicon access" ON storage.objects;
CREATE POLICY "Public favicon access" ON storage.objects FOR SELECT USING (bucket_id = 'favicons');

DROP POLICY IF EXISTS "Service role favicon upload" ON storage.objects;
CREATE POLICY "Service role favicon upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'favicons');

-- Wallpapers
DROP POLICY IF EXISTS "Public wallpaper access" ON storage.objects;
CREATE POLICY "Public wallpaper access" ON storage.objects FOR SELECT USING (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Service role wallpaper upload" ON storage.objects;
CREATE POLICY "Service role wallpaper upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wallpapers');

-- ==============================================================================
-- Deployment Complete! 部署完成!
-- ==============================================================================
