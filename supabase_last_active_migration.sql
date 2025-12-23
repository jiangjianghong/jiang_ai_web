-- ==============================================================================
-- Tomato Tabs - Last Active Time Enhancement (精确活跃时间)
-- ==============================================================================
-- Usage: Run this script in the Supabase SQL Editor
-- ==============================================================================

-- 1. Add last_active_at column to user_stats (添加精确活跃时间字段)
-- ==============================================================================
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Initialize existing records with current timestamp
-- ==============================================================================
UPDATE user_stats 
SET last_active_at = NOW() 
WHERE last_active_at IS NULL;

-- 3. Create index for efficient queries (创建索引提高查询效率)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_user_stats_last_active_at ON user_stats(last_active_at);

-- ==============================================================================
-- Migration Complete! 迁移完成!
-- 
-- 此更新将使管理员后台能够看到用户的精确活跃时间，
-- 而不仅仅是日期。
-- ==============================================================================
