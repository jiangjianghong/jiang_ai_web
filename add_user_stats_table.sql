-- 用户统计数据表
-- 请在 Supabase SQL Editor 中执行此脚本

-- 创建用户统计表
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

-- 启用行级安全策略（RLS）
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 创建安全策略：用户只能访问自己的数据
CREATE POLICY "Users can read own stats" ON user_stats
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建触发器自动更新时间戳
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
