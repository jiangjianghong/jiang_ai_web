<div align="center">

# 江的标签页 | Jiang's Tab

```
 /\_/\
( o.o )
 > ^ <
```

**A modern, highly customizable personal website navigation application**
**一个现代化的个人网站导航应用，超高自定义**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[🌐 Live Demo](https://jiangjiangjiang.top) | [📖 中文文档](#chinese-docs) | [📖 English Docs](#english-docs) | [🐛 Report Bug](https://github.com/jiangjianghong/jiang_ai_web/issues) | [✨ Request Feature](https://github.com/jiangjianghong/jiang_ai_web/issues)

![Screenshot](image.png)

</div>

---

## 📚 Table of Contents | 目录

- [Features | 核心特性](#-features--核心特性)
- [Tech Stack | 技术栈](#-tech-stack--技术栈)
- [Quick Start | 快速开始](#-quick-start--快速开始)
- [Architecture | 项目架构](#-architecture--项目架构)
- [Deployment | 部署](#-deployment--部署)
- [Contributing | 贡献指南](#-contributing--贡献指南)
- [License | 许可证](#-license--许可证)
- [Contact | 联系方式](#-contact--联系方式)

---

<a name="chinese-docs"></a>

## 🇨🇳 中文文档

### ✨ 核心特性

<table>
<tr>
<td width="50%">

#### 🎨 用户界面
- ✅ **响应式设计** - 完美适配桌面端和移动端
- 🌄 **动态壁纸** - 每日自动更换高质量壁纸，支持多分辨率
- 🎭 **视差效果** - 鼠标跟随的视差动画效果
- 🎚️ **透明度调节** - 可自定义卡片和搜索栏透明度
- 🌗 **主题切换** - 支持明暗主题无缝切换
- ⏰ **时间显示** - 实时时钟和日期显示
- 🎨 **颜色自定义** - 自定义卡片和搜索栏颜色

#### 🔧 功能特性
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

#### ☁️ 云端服务
- 🔐 **用户认证** - 基于 Supabase 的安全认证系统
- 🔄 **智能数据同步** - 自动同步网站数据和设置到云端
- 🛡️ **数据验证** - 同步前验证数据有效性，防止空数据覆盖
- 📱 **多设备同步** - 在不同设备间无缝同步数据
- 🔌 **离线支持** - 离线状态下仍可正常使用
- 📧 **邮箱验证** - 支持邮箱验证和密码重置
- 👤 **用户资料** - 自定义用户显示名称和头像

#### 🚀 性能优化
- 💾 **智能缓存** - 多层缓存策略 (内存 + IndexedDB)
- 🖼️ **图标缓存** - 自动缓存网站图标，提升加载速度
- ⚡ **代码分割** - 按需加载，减少初始包大小
- 🎯 **资源预加载** - 智能预加载常用资源
- 📱 **PWA 支持** - 支持离线访问和安装到桌面
- 🧹 **内存管理** - 自动清理和内存优化

</td>
</tr>
</table>

#### 🔌 Notion 集成

- 📊 **工作空间** - 集成 Notion 数据库
- 📑 **多视图支持** - 卡片视图和列表视图
- 🔍 **搜索过滤** - 按分类、标签搜索
- ⌨️ **键盘导航** - 完整的键盘快捷键支持
- 🎨 **富文本渲染** - 支持 Notion 富文本格式

### 🛠️ 技术栈

<table>
<tr>
<td width="33%">

#### 前端框架
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

</td>
<td width="33%">

#### 状态与数据
![React Context](https://img.shields.io/badge/React_Context-API-61DAFB?style=flat-square&logo=react)
![IndexedDB](https://img.shields.io/badge/IndexedDB-Storage-orange?style=flat-square)
![LocalStorage](https://img.shields.io/badge/LocalStorage-API-yellow?style=flat-square)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=flat-square)

</td>
<td width="33%">

#### 后端服务
![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql&logoColor=white)
![Edge Functions](https://img.shields.io/badge/Edge_Functions-Serverless-black?style=flat-square)

</td>
</tr>
<tr>
<td width="33%">

#### 动画与交互
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.9.2-BB4E9D?style=flat-square&logo=framer)
![React DnD](https://img.shields.io/badge/React_DnD-16.0.1-orange?style=flat-square)
![Particles](https://img.shields.io/badge/TSParticles-3.0.0-blueviolet?style=flat-square)

</td>
<td width="33%">

#### 数据可视化
![Recharts](https://img.shields.io/badge/Recharts-2.15.1-8884d8?style=flat-square)
![HTML2Canvas](https://img.shields.io/badge/HTML2Canvas-1.4.1-green?style=flat-square)

</td>
<td width="33%">

#### 部署与工具
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Hosting-222?style=flat-square&logo=github)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-Code_Style-F7B93E?style=flat-square&logo=prettier&logoColor=white)

</td>
</tr>
</table>

### 🚀 快速开始

#### 环境要求

```bash
Node.js >= 18.0.0
pnpm >= 8.0.0 (推荐) 或 npm >= 9.0.0
```

#### 安装步骤

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

### 🏗️ 项目架构

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
│   ├── App.tsx                   # 应用根组件
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

### 📦 部署

#### GitHub Pages 自动部署

```bash
pnpm run deploy
```

项目已配置 GitHub Actions，推送到 main 分支即可自动部署。

#### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署 ✨

### 🗄️ 数据库配置

如果你需要设置自己的 Supabase 实例，请参考以下 SQL：

<details>
<summary>点击查看数据库迁移 SQL</summary>

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

-- 添加约束确保数据有效性
ALTER TABLE user_settings
ADD CONSTRAINT IF NOT EXISTS check_auto_sync_interval
CHECK (auto_sync_interval >= 3 AND auto_sync_interval <= 60);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_settings_id ON user_settings(id);
CREATE INDEX IF NOT EXISTS idx_user_websites_id ON user_websites(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
```

</details>

### 🔐 安全特性

- 🛡️ **行级安全** - Supabase RLS 策略
- 🔒 **数据加密** - 敏感数据加密存储
- ✅ **输入验证** - 严格的数据验证 (Zod)
- 🚫 **XSS 防护** - 内容安全策略
- 🍪 **Cookie 管理** - GDPR 合规

### 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

#### 代码规范

- ✅ TypeScript 严格模式
- ✅ ESLint 代码检查
- ✅ Prettier 代码格式化
- ✅ Conventional Commits 提交规范

### 📝 更新日志

#### v1.2.0 (2024-12-19)

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

### 🛠️ 故障排除

<details>
<summary>常见问题与解决方案</summary>

#### 域名无法访问
- 检查 DNS 配置是否正确
- 等待 DNS 传播（最多 24 小时）
- 清除浏览器缓存

#### 功能异常
- 检查浏览器控制台错误信息
- 确认网络连接正常
- 验证 Supabase 配置

#### 同步问题
- 检查用户是否已登录
- 确认网络连接稳定
- 查看同步状态指示器

#### 图标加载失败
- 检查网络连接
- 尝试刷新页面
- 清除浏览器缓存

</details>

### 📄 许可证

本项目采用 Apache License 2.0 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 🙏 致谢

感谢以下开源项目和服务：

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Supabase](https://supabase.com/) - 后端服务
- [Framer Motion](https://www.framer.com/motion/) - 动画库

### 📞 联系方式

- **项目地址**: [GitHub](https://github.com/jiangjianghong/jiang_ai_web)
- **问题反馈**: [Issues](https://github.com/jiangjianghong/jiang_ai_web/issues)
- **在线访问**: [jiangjiangjiang.top](https://jiangjiangjiang.top)

---

<div align="center">

**江的标签页** - 让网站管理更简单、更智能 🚀

Made with ❤️ by [Jiang](https://github.com/jiangjianghong)

⭐ Star this repo if you like it! | 如果喜欢请给个星标！

</div>

---

<a name="english-docs"></a>

## 🇬🇧 English Documentation

### ✨ Features

<table>
<tr>
<td width="50%">

#### 🎨 User Interface
- ✅ **Responsive Design** - Perfect for desktop and mobile
- 🌄 **Dynamic Wallpapers** - Auto-refresh daily, multi-resolution support
- 🎭 **Parallax Effects** - Mouse-following parallax animations
- 🎚️ **Opacity Control** - Customizable card and search bar transparency
- 🌗 **Theme Switching** - Seamless light/dark mode toggle
- ⏰ **Time Display** - Real-time clock and date display
- 🎨 **Color Customization** - Custom colors for cards and search bar

#### 🔧 Functionality
- 📝 **Website Card Management** - Add, edit, delete website cards
- 🔍 **Smart Search** - Real-time search by name, URL, and tags
- 🎯 **Drag & Drop** - Reorder cards with drag and drop
- 📊 **Visit Statistics** - Auto-track visit counts and timestamps
- 🏷️ **Tag System** - Organize websites with tags
- 📝 **Notes Feature** - Add personal notes to each website
- ✅ **TODO Management** - Built-in todo list functionality
- 📖 **Poetry Display** - Random Chinese poetry display

</td>
<td width="50%">

#### ☁️ Cloud Services
- 🔐 **User Authentication** - Secure Supabase-based auth system
- 🔄 **Smart Data Sync** - Auto-sync data and settings to cloud
- 🛡️ **Data Validation** - Validate data before sync, prevent empty overwrites
- 📱 **Multi-device Sync** - Seamless sync across devices
- 🔌 **Offline Support** - Full functionality when offline
- 📧 **Email Verification** - Email verification and password reset
- 👤 **User Profiles** - Customize display name and avatar

#### 🚀 Performance
- 💾 **Smart Caching** - Multi-layer cache strategy (Memory + IndexedDB)
- 🖼️ **Icon Caching** - Auto-cache website icons for faster loading
- ⚡ **Code Splitting** - Load on demand, reduce initial bundle size
- 🎯 **Resource Preloading** - Smart preload frequently used resources
- 📱 **PWA Support** - Offline access and install to desktop
- 🧹 **Memory Management** - Auto cleanup and memory optimization

</td>
</tr>
</table>

#### 🔌 Notion Integration

- 📊 **Workspace** - Integrate with Notion databases
- 📑 **Multiple Views** - Card view and list view support
- 🔍 **Search & Filter** - Filter by category and tags
- ⌨️ **Keyboard Navigation** - Full keyboard shortcuts support
- 🎨 **Rich Text Rendering** - Support Notion rich text format

### 🛠️ Tech Stack

<table>
<tr>
<td width="33%">

#### Frontend
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

</td>
<td width="33%">

#### State & Data
![React Context](https://img.shields.io/badge/React_Context-API-61DAFB?style=flat-square&logo=react)
![IndexedDB](https://img.shields.io/badge/IndexedDB-Storage-orange?style=flat-square)
![LocalStorage](https://img.shields.io/badge/LocalStorage-API-yellow?style=flat-square)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=flat-square)

</td>
<td width="33%">

#### Backend
![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql&logoColor=white)
![Edge Functions](https://img.shields.io/badge/Edge_Functions-Serverless-black?style=flat-square)

</td>
</tr>
<tr>
<td width="33%">

#### Animation
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.9.2-BB4E9D?style=flat-square&logo=framer)
![React DnD](https://img.shields.io/badge/React_DnD-16.0.1-orange?style=flat-square)
![Particles](https://img.shields.io/badge/TSParticles-3.0.0-blueviolet?style=flat-square)

</td>
<td width="33%">

#### Visualization
![Recharts](https://img.shields.io/badge/Recharts-2.15.1-8884d8?style=flat-square)
![HTML2Canvas](https://img.shields.io/badge/HTML2Canvas-1.4.1-green?style=flat-square)

</td>
<td width="33%">

#### Deployment
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Hosting-222?style=flat-square&logo=github)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-Code_Style-F7B93E?style=flat-square&logo=prettier&logoColor=white)

</td>
</tr>
</table>

### 🚀 Quick Start

#### Prerequisites

```bash
Node.js >= 18.0.0
pnpm >= 8.0.0 (recommended) or npm >= 9.0.0
```

#### Installation

1. **Clone the repository**

```bash
git clone https://github.com/jiangjianghong/jiang_ai_web.git
cd jiang_ai_web
```

2. **Install dependencies**

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

3. **Configure environment variables**

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_NAME=Jiang's Tab
VITE_APP_VERSION=1.0.0
```

4. **Start development server**

```bash
pnpm run dev
```

Visit http://localhost:3000 to see the app 🎉

5. **Build for production**

```bash
pnpm run build
pnpm run preview
```

### 🏗️ Project Architecture

```
jiang_ai_web/
├── 📁 public/                    # Static assets
│   ├── icon/                     # App icons
│   ├── manifest.json             # PWA config
│   └── sw.js                     # Service Worker
│
├── 📁 src/
│   ├── 📁 components/            # React components
│   │   ├── AnimatedCat.tsx       # Animated cat component
│   │   ├── AuthForm.tsx          # Authentication form
│   │   ├── CardEditModal.tsx     # Card edit modal
│   │   ├── SearchBar.tsx         # Search bar component
│   │   ├── TodoModal.tsx         # TODO modal
│   │   ├── TimeDisplay.tsx       # Time display
│   │   ├── PoemDisplay.tsx       # Poetry display
│   │   └── Workspace/            # Workspace components
│   │
│   ├── 📁 contexts/              # React contexts
│   │   ├── SupabaseAuthContext.tsx     # Auth context
│   │   ├── SyncContext.tsx             # Sync state
│   │   ├── TransparencyContext.tsx     # Transparency settings
│   │   ├── UserProfileContext.tsx      # User profile
│   │   └── WorkspaceContext.tsx        # Workspace state
│   │
│   ├── 📁 hooks/                 # Custom hooks
│   │   ├── useAutoSync.ts        # Auto sync
│   │   ├── useCloudData.ts       # Cloud data management
│   │   ├── useDataManager.ts     # Data import/export
│   │   ├── useDragAndDrop.ts     # Drag & drop
│   │   ├── useFavicon.ts         # Icon handling
│   │   ├── useTheme.ts           # Theme management
│   │   └── useWebsiteData.ts     # Website data
│   │
│   ├── 📁 lib/                   # Utilities and services
│   │   ├── api/                  # API clients
│   │   ├── proxy/                # Proxy services
│   │   ├── faviconCache.ts       # Icon cache
│   │   ├── indexedDBCache.ts     # IndexedDB cache
│   │   ├── storageManager.ts     # Storage manager
│   │   ├── supabase.ts           # Supabase config
│   │   └── supabaseSync.ts       # Supabase sync
│   │
│   ├── 📁 pages/                 # Page components
│   │   ├── Home.tsx              # Home page
│   │   ├── Settings.tsx          # Settings page
│   │   └── ResetPassword.tsx     # Password reset
│   │
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # App entry
│   └── index.css                 # Global styles
│
├── 📁 supabase/                  # Supabase config
│   ├── functions/                # Edge Functions
│   └── config.toml               # Supabase config
│
├── package.json                  # Dependencies
├── vite.config.ts                # Vite config
├── tailwind.config.js            # Tailwind config
└── tsconfig.json                 # TypeScript config
```

### 📦 Deployment

#### GitHub Pages Auto Deploy

```bash
pnpm run deploy
```

GitHub Actions is configured to auto-deploy when pushing to main branch.

#### Vercel Deploy

1. Connect GitHub repo to Vercel
2. Configure environment variables
3. Auto deploy ✨

### 🗄️ Database Setup

If you need to set up your own Supabase instance, refer to the SQL below:

<details>
<summary>Click to view database migration SQL</summary>

```sql
-- Add color settings fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '255, 255, 255';

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS search_bar_color TEXT DEFAULT '255, 255, 255';

-- Add auto-sync settings fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS auto_sync_interval INTEGER DEFAULT 30;

-- Add constraints for data validity
ALTER TABLE user_settings
ADD CONSTRAINT IF NOT EXISTS check_auto_sync_interval
CHECK (auto_sync_interval >= 3 AND auto_sync_interval <= 60);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_id ON user_settings(id);
CREATE INDEX IF NOT EXISTS idx_user_websites_id ON user_websites(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
```

</details>

### 🔐 Security Features

- 🛡️ **Row Level Security** - Supabase RLS policies
- 🔒 **Data Encryption** - Encrypted storage for sensitive data
- ✅ **Input Validation** - Strict data validation (Zod)
- 🚫 **XSS Protection** - Content Security Policy
- 🍪 **Cookie Management** - GDPR compliant

### 🤝 Contributing

We welcome all forms of contributions!

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

#### Code Standards

- ✅ TypeScript strict mode
- ✅ ESLint code linting
- ✅ Prettier code formatting
- ✅ Conventional Commits

### 📝 Changelog

#### v1.2.0 (2024-12-19)

**🔧 Fixes**
- Fixed data sync issue that could overwrite cloud data with empty data
- Added data validation to ensure only valid website data is synced

**✨ Improvements**
- Optimized sync status display for clearer feedback
- Enhanced error handling for better system stability
- Refactored core code for better performance and maintainability

**🛡️ Security**
- Implemented multi-layer data protection to prevent data loss
- Strengthened data validation rules for data integrity

### 🛠️ Troubleshooting

<details>
<summary>Common Issues & Solutions</summary>

#### Domain Not Accessible
- Check DNS configuration
- Wait for DNS propagation (up to 24 hours)
- Clear browser cache

#### Functionality Issues
- Check browser console for errors
- Verify network connection
- Validate Supabase configuration

#### Sync Issues
- Check if user is logged in
- Verify stable network connection
- Check sync status indicator

#### Icon Loading Failed
- Check network connection
- Try refreshing page
- Clear browser cache

</details>

### 📄 License

This project is licensed under Apache License 2.0 - see [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

Thanks to the following open source projects and services:

- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Supabase](https://supabase.com/) - Backend service
- [Framer Motion](https://www.framer.com/motion/) - Animation library

### 📞 Contact

- **Repository**: [GitHub](https://github.com/jiangjianghong/jiang_ai_web)
- **Issue Tracker**: [Issues](https://github.com/jiangjianghong/jiang_ai_web/issues)
- **Live Demo**: [jiangjiangjiang.top](https://jiangjiangjiang.top)

---

<div align="center">

**Jiang's Tab** - Make website management simpler and smarter 🚀

Made with ❤️ by [Jiang](https://github.com/jiangjianghong)

⭐ Star this repo if you like it!

</div>
