-- 添加缺失的设置字段到 user_settings 表
-- 此迁移脚本添加了所有新的用户设置字段
-- 请在 Supabase SQL Editor 中执行此脚本

-- 添加颜色设置字段
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '255, 255, 255',
ADD COLUMN IF NOT EXISTS search_bar_color TEXT DEFAULT '255, 255, 255';

-- 添加同步设置字段
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_sync_interval INTEGER DEFAULT 30;

-- 添加搜索和排序设置字段
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS search_in_new_tab BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_sort_enabled BOOLEAN DEFAULT false;

-- 添加时间组件设置字段
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS time_component_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_full_date BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_seconds BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_weekday BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_year BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_month BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_day BOOLEAN DEFAULT true;

-- 添加搜索框样式设置字段
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS search_bar_border_radius INTEGER DEFAULT 12;

-- 添加注释说明
COMMENT ON COLUMN user_settings.card_color IS '卡片颜色 (RGB字符串格式，如 "255, 255, 255")';
COMMENT ON COLUMN user_settings.search_bar_color IS '搜索框颜色 (RGB字符串格式)';
COMMENT ON COLUMN user_settings.auto_sync_enabled IS '自动同步开关';
COMMENT ON COLUMN user_settings.auto_sync_interval IS '自动同步间隔（秒，3-300之间）';
COMMENT ON COLUMN user_settings.search_in_new_tab IS '搜索是否在新标签页打开';
COMMENT ON COLUMN user_settings.auto_sort_enabled IS '卡片自动排序开关';
COMMENT ON COLUMN user_settings.time_component_enabled IS '时间组件显示开关';
COMMENT ON COLUMN user_settings.show_full_date IS '是否显示完整日期';
COMMENT ON COLUMN user_settings.show_seconds IS '是否精确到秒';
COMMENT ON COLUMN user_settings.show_weekday IS '是否显示星期';
COMMENT ON COLUMN user_settings.show_year IS '是否显示年份';
COMMENT ON COLUMN user_settings.show_month IS '是否显示月份';
COMMENT ON COLUMN user_settings.show_day IS '是否显示日期';
COMMENT ON COLUMN user_settings.search_bar_border_radius IS '搜索框圆角大小（像素）';
