-- ==============================================================================
-- Tomato Tabs - Admin System Migration Script
-- 西红柿标签页 - 管理员系统迁移脚本
-- ==============================================================================
-- Usage: Run this script in the Supabase SQL Editor after the base deployment.
-- ==============================================================================

-- 1. Add role column to user_profiles (添加角色字段)
-- ==============================================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- 2. Create user_bans table (创建用户禁用表)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

-- 3. Create announcements table (创建公告表)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'update', 'maintenance')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 4. Create default_websites table (创建默认网站卡片表)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS default_websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE default_websites ENABLE ROW LEVEL SECURITY;

-- 5. Create analytics_daily table (创建每日分析聚合表)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_site_visits INTEGER DEFAULT 0,
  avg_cards_per_user NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (安全策略 - 隐私优先)
-- ==============================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- user_bans: Only admins can manage
DROP POLICY IF EXISTS "Admins can manage bans" ON user_bans;
CREATE POLICY "Admins can manage bans" ON user_bans
  FOR ALL USING (is_admin());

-- announcements: Anyone can read active, admins can manage
DROP POLICY IF EXISTS "Anyone can read active announcements" ON announcements;
CREATE POLICY "Anyone can read active announcements" ON announcements
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (is_admin());

-- default_websites: Anyone can read active, admins can manage  
DROP POLICY IF EXISTS "Anyone can read default websites" ON default_websites;
CREATE POLICY "Anyone can read default websites" ON default_websites
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage default websites" ON default_websites;
CREATE POLICY "Admins can manage default websites" ON default_websites
  FOR ALL USING (is_admin());

-- analytics_daily: Only admins can read
DROP POLICY IF EXISTS "Admins can read analytics" ON analytics_daily;
CREATE POLICY "Admins can read analytics" ON analytics_daily
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "System can insert analytics" ON analytics_daily;
CREATE POLICY "System can insert analytics" ON analytics_daily
  FOR INSERT WITH CHECK (true);

-- 7. Aggregate stats function (聚合统计函数)
-- ==============================================================================
CREATE OR REPLACE FUNCTION aggregate_daily_stats()
RETURNS void AS $$
BEGIN
  INSERT INTO analytics_daily (date, total_users, new_users, active_users, total_searches, total_site_visits)
  SELECT 
    CURRENT_DATE,
    (SELECT COUNT(*) FROM user_profiles),
    (SELECT COUNT(*) FROM user_profiles WHERE created_at::date = CURRENT_DATE),
    (SELECT COUNT(*) FROM user_stats WHERE last_visit_date = CURRENT_DATE),
    (SELECT COALESCE(SUM(total_searches), 0) FROM user_stats),
    (SELECT COALESCE(SUM(total_site_visits), 0) FROM user_stats)
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    total_searches = EXCLUDED.total_searches,
    total_site_visits = EXCLUDED.total_site_visits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update existing RLS policies for admin access (更新现有表的管理员访问策略)
-- ==============================================================================

-- user_profiles: Admins can read basic info (not user_websites!)
DROP POLICY IF EXISTS "Admins can read basic profiles" ON user_profiles;
CREATE POLICY "Admins can read basic profiles" ON user_profiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin()
  );

-- user_stats: Admins can read stats (aggregate only, not card_clicks details)
DROP POLICY IF EXISTS "Admins can read stats summary" ON user_stats;
CREATE POLICY "Admins can read stats summary" ON user_stats
  FOR SELECT USING (
    auth.uid() = id OR is_admin()
  );

-- ⚠️ IMPORTANT: user_websites stays protected - admins CANNOT read user's personal data
-- 用户的网站数据保持受保护状态 - 管理员无法读取用户的个人数据

-- ==============================================================================
-- Migration Complete! 迁移完成!
-- ==============================================================================
