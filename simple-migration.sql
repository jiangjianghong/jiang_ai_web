-- 简化的数据库迁移脚本
-- 请在 Supabase Dashboard 的 SQL Editor 中逐条执行

-- 1. 添加颜色设置字段
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '255, 255, 255';

-- 2. 添加搜索框颜色字段
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS search_bar_color TEXT DEFAULT '255, 255, 255';

-- 3. 添加自动同步开关字段
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true;

-- 4. 添加自动同步间隔字段
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS auto_sync_interval INTEGER DEFAULT 30;

-- 5. 添加索引（可选，提高性能）
CREATE INDEX IF NOT EXISTS idx_user_settings_id ON user_settings(id);

-- 6. 验证字段是否添加成功
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name IN ('card_color', 'search_bar_color', 'auto_sync_enabled', 'auto_sync_interval')
ORDER BY column_name;