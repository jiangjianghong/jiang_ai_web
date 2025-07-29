# 🗄️ 数据库迁移指南

## 📋 问题描述

应用中新增了以下设置功能，需要在数据库中添加对应的字段：

- **卡片颜色设置** (`card_color`)
- **搜索框颜色设置** (`search_bar_color`) 
- **自动同步开关** (`auto_sync_enabled`)
- **自动同步间隔** (`auto_sync_interval`)

## 🔧 解决方案

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 登录你的账户
3. 选择项目：`wxheqargopbsrruootyr`

### 步骤 2: 执行 SQL 迁移

1. 在左侧菜单中点击 **SQL Editor**
2. 点击 **New Query** 创建新查询
3. 复制以下 SQL 代码并粘贴到编辑器中：

```sql
-- 添加颜色设置字段
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '255, 255, 255';

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS search_bar_color TEXT DEFAULT '255, 255, 255';

-- 添加自动同步设置字段
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS auto_sync_interval INTEGER DEFAULT 30;

-- 添加约束确保数据有效性（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_auto_sync_interval' 
        AND table_name = 'user_settings'
    ) THEN
        ALTER TABLE user_settings 
        ADD CONSTRAINT check_auto_sync_interval 
        CHECK (auto_sync_interval >= 3 AND auto_sync_interval <= 60);
    END IF;
END $$;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_settings_id ON user_settings(id);
CREATE INDEX IF NOT EXISTS idx_user_websites_id ON user_websites(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
```

4. 点击 **Run** 按钮执行 SQL
5. 确认所有命令都成功执行（没有错误信息）

### 步骤 3: 验证迁移结果

执行以下查询来验证字段是否添加成功：

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;
```

你应该看到新增的字段：
- `card_color` (TEXT)
- `search_bar_color` (TEXT)  
- `auto_sync_enabled` (BOOLEAN)
- `auto_sync_interval` (INTEGER)

### 步骤 4: 更新应用代码

迁移完成后，需要更新 `src/lib/supabaseSync.ts` 文件：

1. 找到 `saveUserSettings` 函数中的 TODO 注释
2. 取消注释新字段的同步代码
3. 删除临时的基本字段限制

## 🧪 测试

迁移完成后，测试以下功能：

1. **设置同步**: 修改卡片颜色、搜索框颜色等设置，检查是否能正确同步到云端
2. **自动同步**: 修改自动同步设置，确认功能正常
3. **跨设备同步**: 在不同设备上登录，验证设置是否正确同步

## ❗ 注意事项

- 执行 SQL 前请确保已备份重要数据
- 如果遇到权限问题，请检查 Supabase 项目的访问权限
- 迁移过程中应用的新功能可能暂时无法同步，但不会影响基本功能

## 🆘 故障排除

### 问题：权限不足
**解决方案**: 确保你是项目的所有者或具有数据库修改权限

### 问题：字段已存在错误
**解决方案**: 使用 `IF NOT EXISTS` 子句可以安全地重复执行，不会产生错误

### 问题：约束冲突
**解决方案**: 检查现有数据是否符合新约束条件

## 📞 支持

如果遇到问题，请检查：
1. Supabase Dashboard 中的错误日志
2. 浏览器开发者工具中的网络请求
3. 应用日志中的同步相关信息

---

**执行完成后，应用的所有设置功能将能够正常同步到云端！** 🎉