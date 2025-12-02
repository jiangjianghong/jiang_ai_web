<div align="center">

# 江的标签页

```
 /\_/\
( o.o )
 > ^ <
```

**一个现代化的个人网站导航应用，超高自定义**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[🌐 在线演示](https://jiangjiang.cc) | [🐛 问题反馈](https://github.com/jiangjianghong/jiang_ai_web/issues) | [✨ 功能建议](https://github.com/jiangjianghong/jiang_ai_web/issues)

**[ [English](README.md) | 简体中文 ]**

![Screenshot](image.png)

</div>

---

## 📚 目录

- [核心特性](#-核心特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目架构](#-项目架构)
- [部署](#-部署)
- [数据库配置](#-数据库配置)
- [安全特性](#-安全特性)
- [贡献指南](#-贡献指南)
- [更新日志](#-更新日志)
- [故障排除](#-故障排除)
- [许可证](#-许可证)
- [致谢](#-致谢)
- [联系方式](#-联系方式)

---

## ✨ 核心特性

<table>
<tr>
<td width="50%">

### 🎨 用户界面
- ✅ **响应式设计** - 完美适配桌面端和移动端
- 🌄 **动态壁纸** - 每日自动更换高质量壁纸，支持多分辨率
- 🎭 **视差效果** - 鼠标跟随的视差动画效果
- 🎚️ **透明度调节** - 可自定义卡片和搜索栏透明度
- 🌗 **主题切换** - 支持明暗主题无缝切换
- ⏰ **时间显示** - 实时时钟和日期显示
- 🎨 **颜色自定义** - 自定义卡片和搜索栏颜色

### 🔧 功能特性
- 📝 **网站卡片管理** - 添加、编辑、删除网站卡片
- 🔍 **智能搜索** - 实时搜索网站名称、URL和标签
- 🎯 **拖拽排序** - 支持拖拽重新排列卡片顺序
- 📊 **访问统计** - 自动记录访问次数和最后访问时间
- 🏷️ **标签系统** - 为网站添加标签便于分类管理
- 📝 **备注功能** - 为每个网站添加个人备注
- ✅ **TODO管理** - 内置待办事项管理功能
- 📖 **诗词展示** - 随机展示中国古诗词

</td>
<td width="50%">

### ☁️ 云端服务
- 🔐 **用户认证** - 基于 Supabase 的安全认证系统
- 🔄 **智能数据同步** - 自动同步网站数据和设置到云端
- 🛡️ **数据验证** - 同步前验证数据有效性，防止空数据覆盖
- 📱 **多设备同步** - 在不同设备间无缝同步数据
- 🔌 **离线支持** - 离线状态下仍可正常使用
- 📧 **邮箱验证** - 支持邮箱验证和密码重置
- 👤 **用户资料** - 自定义用户显示名称和头像

### 🚀 性能优化
- 💾 **智能缓存** - 多层缓存策略 (内存 + IndexedDB)
- 🖼️ **图标缓存** - 自动缓存网站图标，提升加载速度
- ⚡ **代码分割** - 按需加载，减少初始包大小
- 🎯 **资源预加载** - 智能预加载常用资源
- 📱 **PWA 支持** - 支持离线访问和安装到桌面
- 🧹 **内存管理** - 自动清理和内存优化

</td>
</tr>
</table>

### 🔌 Notion 集成

- 📊 **工作空间** - 集成 Notion 数据库
- 📑 **多视图支持** - 卡片视图和列表视图
- 🔍 **搜索过滤** - 按分类、标签搜索
- ⌨️ **键盘导航** - 完整的键盘快捷键支持
- 🎨 **富文本渲染** - 支持 Notion 富文本格式

---

## 🛠️ 技术栈

<table>
<tr>
<td width="33%">

### 前端框架
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

</td>
<td width="33%">

### 状态与数据
![React Context](https://img.shields.io/badge/React_Context-API-61DAFB?style=flat-square&logo=react)
![IndexedDB](https://img.shields.io/badge/IndexedDB-Storage-orange?style=flat-square)
![LocalStorage](https://img.shields.io/badge/LocalStorage-API-yellow?style=flat-square)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=flat-square)

</td>
<td width="33%">

### 后端服务
![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql&logoColor=white)
![Edge Functions](https://img.shields.io/badge/Edge_Functions-Serverless-black?style=flat-square)

</td>
</tr>
<tr>
<td width="33%">

### 动画与交互
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.9.2-BB4E9D?style=flat-square&logo=framer)
![React DnD](https://img.shields.io/badge/React_DnD-16.0.1-orange?style=flat-square)
![Particles](https://img.shields.io/badge/TSParticles-3.0.0-blueviolet?style=flat-square)

</td>
<td width="33%">

### 数据可视化
![Recharts](https://img.shields.io/badge/Recharts-2.15.1-8884d8?style=flat-square)
![HTML2Canvas](https://img.shields.io/badge/HTML2Canvas-1.4.1-green?style=flat-square)

</td>
<td width="33%">

### 部署与工具
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Hosting-222?style=flat-square&logo=github)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-Code_Style-F7B93E?style=flat-square&logo=prettier&logoColor=white)

</td>
</tr>
</table>

---

## 🚀 快速开始

### 环境要求

```bash
Node.js >= 18.0.0
pnpm >= 8.0.0 (推荐) 或 npm >= 9.0.0
```

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/jiangjianghong/jiang_ai_web.git
cd jiang_ai_web
```

2. **安装依赖**

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

3. **配置环境变量**

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 应用配置
VITE_APP_NAME=江的标签页
VITE_APP_VERSION=1.0.0
```

4. **启动开发服务器**

```bash
pnpm run dev
```

访问 http://localhost:3000 查看应用 🎉

5. **构建生产版本**

```bash
pnpm run build
pnpm run preview
```

---

## 🏗️ 项目架构

```
jiang_ai_web/
├── 📁 public/                    # 静态资源
│   ├── icon/                     # 应用图标
│   ├── manifest.json             # PWA 配置
│   └── sw.js                     # Service Worker
│
├── 📁 src/
│   ├── 📁 components/            # React 组件
│   │   ├── AnimatedCat.tsx       # 动画猫咪组件
│   │   ├── AuthForm.tsx          # 认证表单
│   │   ├── CardEditModal.tsx     # 卡片编辑模态框
│   │   ├── SearchBar.tsx         # 搜索栏组件
│   │   ├── TodoModal.tsx         # TODO管理模态框
│   │   ├── TimeDisplay.tsx       # 时间显示组件
│   │   ├── PoemDisplay.tsx       # 诗词显示组件
│   │   └── Workspace/            # 工作空间相关组件
│   │       ├── WorkspaceModal.tsx
│   │       ├── WorkspaceCard.tsx
│   │       └── NotionGuide.tsx
│   │
│   ├── 📁 contexts/              # React 上下文
│   │   ├── SupabaseAuthContext.tsx     # 认证上下文
│   │   ├── SyncContext.tsx             # 同步状态上下文
│   │   ├── TransparencyContext.tsx     # 透明度设置上下文
│   │   ├── UserProfileContext.tsx      # 用户资料上下文
│   │   └── WorkspaceContext.tsx        # 工作空间上下文
│   │
│   ├── 📁 hooks/                 # 自定义 Hooks
│   │   ├── useAutoSync.ts        # 自动同步
│   │   ├── useCloudData.ts       # 云端数据管理
│   │   ├── useDataManager.ts     # 数据导入导出
│   │   ├── useDragAndDrop.ts     # 拖拽功能
│   │   ├── useFavicon.ts         # 图标处理
│   │   ├── useTheme.ts           # 主题管理
│   │   └── useWebsiteData.ts     # 网站数据管理
│   │
│   ├── 📁 lib/                   # 工具库和服务
│   │   ├── api/                  # API 客户端
│   │   │   ├── ApiClient.ts
│   │   │   ├── NotionApiClient.ts
│   │   │   └── WorkspaceManager.ts
│   │   ├── proxy/                # 代理服务
│   │   │   ├── CorsProxyService.ts
│   │   │   └── smartProxy.ts
│   │   ├── faviconCache.ts       # 图标缓存
│   │   ├── indexedDBCache.ts     # IndexedDB 缓存
│   │   ├── storageManager.ts     # 存储管理器
│   │   ├── supabase.ts           # Supabase 配置
│   │   └── supabaseSync.ts       # Supabase 同步服务
│   │
│   ├── 📁 pages/                 # 页面组件
│   │   ├── Home.tsx              # 主页
│   │   ├── Settings.tsx          # 设置页面
│   │   └── ResetPassword.tsx     # 密码重置页面
│   │
│   ├── MainApp.tsx               # 应用主组件
│   ├── main.tsx                  # 应用入口
│   └── index.css                 # 全局样式
│
├── 📁 supabase/                  # Supabase 配置
│   ├── functions/                # Edge Functions
│   │   ├── cors-proxy/           # CORS 代理服务
│   │   ├── favicon-service/      # 图标服务
│   │   ├── notion-proxy/         # Notion 代理
│   │   └── wallpaper-service/    # 壁纸服务
│   └── config.toml               # Supabase 配置
│
├── package.json                  # 项目依赖
├── vite.config.ts                # Vite 配置
├── tailwind.config.js            # Tailwind 配置
└── tsconfig.json                 # TypeScript 配置
```

---

## 📦 部署

### GitHub Pages 自动部署

```bash
pnpm run deploy
```

项目已配置 GitHub Actions，推送到 main 分支即可自动部署。

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署 ✨

---

## 🗄️ Supabase 配置

### 数据库设置

如果你需要设置自己的 Supabase 实例，请按以下步骤操作：

<details>
<summary>1️⃣ 完整数据库架构（首次部署）</summary>

在 Supabase SQL Editor 中执行以下脚本：

```sql
-- ====================================
-- 1. 创建数据表
-- ====================================

-- 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  -- 基础设置
  card_opacity NUMERIC DEFAULT 0.8,
  search_bar_opacity NUMERIC DEFAULT 0.9,
  parallax_enabled BOOLEAN DEFAULT true,
  wallpaper_resolution TEXT DEFAULT 'high',
  theme TEXT DEFAULT 'dark',
  -- 颜色设置
  card_color TEXT DEFAULT '255, 255, 255',
  search_bar_color TEXT DEFAULT '255, 255, 255',
  -- 同步设置
  auto_sync_enabled BOOLEAN DEFAULT true,
  auto_sync_interval INTEGER DEFAULT 30,
  -- 搜索和排序
  search_in_new_tab BOOLEAN DEFAULT true,
  auto_sort_enabled BOOLEAN DEFAULT false,
  -- 时间组件设置
  time_component_enabled BOOLEAN DEFAULT true,
  show_full_date BOOLEAN DEFAULT true,
  show_seconds BOOLEAN DEFAULT true,
  show_weekday BOOLEAN DEFAULT true,
  show_year BOOLEAN DEFAULT true,
  show_month BOOLEAN DEFAULT true,
  show_day BOOLEAN DEFAULT true,
  -- 样式设置
  search_bar_border_radius INTEGER DEFAULT 12,
  -- 时间戳
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户网站数据表
CREATE TABLE IF NOT EXISTS user_websites (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  websites JSONB DEFAULT '[]'::jsonb,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 2. 启用行级安全策略（RLS）
-- ====================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 3. 创建安全策略
-- ====================================

-- user_profiles 策略
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_settings 策略
CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_websites 策略
CREATE POLICY "Users can read own websites" ON user_websites
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own websites" ON user_websites
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own websites" ON user_websites
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ====================================
-- 4. 创建自动更新时间戳的函数和触发器
-- ====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_websites_updated_at
  BEFORE UPDATE ON user_websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 5. 创建索引以提高性能
-- ====================================

CREATE INDEX IF NOT EXISTS idx_user_settings_id ON user_settings(id);
CREATE INDEX IF NOT EXISTS idx_user_websites_id ON user_websites(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
```

</details>

<details>
<summary>2️⃣ 增量迁移（已有数据库）</summary>

如果你已经有数据库，只需要添加新字段：

```sql
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
```

</details>

<details>
<summary>3️⃣ Storage Buckets 配置</summary>

为 Favicon 和 Wallpaper 服务创建 Storage buckets：

```sql
-- 创建 favicons bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('favicons', 'favicons', true)
ON CONFLICT (id) DO NOTHING;

-- 创建 wallpapers bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallpapers', 'wallpapers', true)
ON CONFLICT (id) DO NOTHING;

-- favicons bucket 策略
CREATE POLICY "Public favicon access" ON storage.objects
FOR SELECT USING (bucket_id = 'favicons');

CREATE POLICY "Service role favicon upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'favicons');

CREATE POLICY "Service role favicon update" ON storage.objects
FOR UPDATE USING (bucket_id = 'favicons');

-- wallpapers bucket 策略
CREATE POLICY "Public wallpaper access" ON storage.objects
FOR SELECT USING (bucket_id = 'wallpapers');

CREATE POLICY "Service role wallpaper upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'wallpapers');

CREATE POLICY "Service role wallpaper update" ON storage.objects
FOR UPDATE USING (bucket_id = 'wallpapers');
```

</details>

### Edge Functions 部署

<details>
<summary>📦 Favicon Service</summary>

统一的 favicon 获取和缓存服务。

**部署命令：**
```bash
supabase functions deploy favicon-service
```

**API 使用：**
```bash
GET https://your-project.supabase.co/functions/v1/favicon-service?domain=github.com&size=64
```

**功能特性：**
- 🚀 统一 API 获取网站 favicon
- 💾 自动缓存到 Supabase Storage
- 🔄 多源支持，自动故障转移
- ⚡ 边缘计算，全球低延迟

详见：`supabase/functions/favicon-service/README.md`

</details>

<details>
<summary>🖼️ Wallpaper Service</summary>

每日壁纸获取和缓存服务（Bing 每日壁纸）。

**部署命令：**
```bash
supabase functions deploy wallpaper-service
```

**API 使用：**
```bash
GET https://your-project.supabase.co/functions/v1/wallpaper-service?resolution=uhd
```

**支持的分辨率：**
- `uhd` - 3840x2160 (4K)
- `1920x1080` - 全高清
- `1366x768` - 高清
- `mobile` - 1080x1920 (手机)

详见：`supabase/functions/wallpaper-service/README.md`

</details>

<details>
<summary>🔗 Notion Proxy</summary>

Notion API 代理服务，用于工作空间集成。

**部署命令：**
```bash
supabase functions deploy notion-proxy
```

**配置要求：**
需要在 Supabase Dashboard 中设置环境变量：
- `NOTION_API_KEY` - Notion Integration Token

</details>

---

## 🔐 安全特性

- 🛡️ **行级安全** - Supabase RLS 策略
- 🔒 **数据加密** - 敏感数据加密存储
- ✅ **输入验证** - 严格的数据验证 (Zod)
- 🚫 **XSS 防护** - 内容安全策略
- 🍪 **Cookie 管理** - GDPR 合规

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 代码规范

- ✅ TypeScript 严格模式
- ✅ ESLint 代码检查
- ✅ Prettier 代码格式化
- ✅ Conventional Commits 提交规范

---

## 📝 更新日志

### v1.2.0 (2024-12-19)

**🔧 修复**
- 修复数据同步可能导致空数据覆盖云端真实数据的问题
- 增加数据有效性验证，确保只同步有效的网站数据

**✨ 改进**
- 优化同步状态显示，提供更清晰的反馈信息
- 增强错误处理机制，提高系统稳定性
- 重构部分核心代码，提升性能和可维护性

**🛡️ 安全性**
- 实施多层数据保护机制，防止意外数据丢失
- 加强数据验证规则，确保数据完整性

---

## 🛠️ 故障排除

<details>
<summary>常见问题与解决方案</summary>

### 域名无法访问
- 检查 DNS 配置是否正确
- 等待 DNS 传播（最多 24 小时）
- 清除浏览器缓存

### 功能异常
- 检查浏览器控制台错误信息
- 确认网络连接正常
- 验证 Supabase 配置

### 同步问题
- 检查用户是否已登录
- 确认网络连接稳定
- 查看同步状态指示器

### 图标加载失败
- 检查网络连接
- 尝试刷新页面
- 清除浏览器缓存

</details>

---

## 📄 许可证

本项目采用 Apache License 2.0 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

感谢以下开源项目和服务：

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Supabase](https://supabase.com/) - 后端服务
- [Framer Motion](https://www.framer.com/motion/) - 动画库

---

## 📞 联系方式

- **项目地址**: [GitHub](https://github.com/jiangjianghong/jiang_ai_web)
- **问题反馈**: [Issues](https://github.com/jiangjianghong/jiang_ai_web/issues)
- **在线访问**: [jiangjiang.cc](https://jiangjiang.cc)

---

<div align="center">

**江的标签页** - 让网站管理更简单、更智能 🚀

Made with ❤️ by [Jiang](https://github.com/jiangjianghong)

⭐ 如果喜欢请给个星标！

</div>
