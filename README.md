# 江AI网站导航 (Jiang AI Web)

一个现代化的个人网站导航应用，集成了智能壁纸、云端同步、拖拽排序等功能。

[**项目地址**](https://space.coze.cn/task/7520427345329783091) | [**在线演示**](https://your-demo-url.com)

## ✨ 核心特性

### 🎨 用户界面
- **响应式设计** - 完美适配桌面端和移动端
- **动态壁纸** - 每日自动更换高质量壁纸，支持多分辨率
- **视差效果** - 鼠标跟随的视差动画效果
- **透明度调节** - 可自定义卡片和搜索栏透明度
- **主题切换** - 支持明暗主题切换

### 🔧 功能特性
- **网站卡片管理** - 添加、编辑、删除网站卡片
- **智能搜索** - 实时搜索网站名称、URL和标签
- **拖拽排序** - 支持拖拽重新排列卡片顺序
- **访问统计** - 自动记录访问次数和最后访问时间
- **标签系统** - 为网站添加标签便于分类管理
- **备注功能** - 为每个网站添加个人备注

### ☁️ 云端服务
- **用户认证** - 基于 Supabase 的安全认证系统
- **智能数据同步** - 自动同步网站数据和设置到云端，带有数据验证和冲突解决
- **多设备同步** - 在不同设备间无缝同步数据
- **离线支持** - 离线状态下仍可正常使用
- **数据保护** - 防止空数据覆盖云端真实数据，确保数据安全

### 🚀 性能优化
- **智能缓存** - 多层缓存策略，包括内存缓存和 IndexedDB
- **图标缓存** - 自动缓存网站图标，提升加载速度
- **代码分割** - 按需加载，减少初始包大小
- **资源预加载** - 智能预加载常用资源

## 🛠️ 技术栈

### 前端框架
- **React 18** - 现代化的用户界面库
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 快速的构建工具和开发服务器
- **Tailwind CSS** - 实用优先的 CSS 框架

### 状态管理与数据
- **React Context** - 全局状态管理
- **Custom Hooks** - 可复用的业务逻辑
- **IndexedDB** - 客户端数据持久化
- **LocalStorage** - 轻量级本地存储

### 动画与交互
- **Framer Motion** - 流畅的动画库
- **React DnD** - 拖拽功能实现
- **React Tilt** - 3D 倾斜效果

### 后端服务
- **Supabase** - 后端即服务平台
  - 用户认证
  - PostgreSQL 数据库
  - 实时数据同步
  - Edge Functions

### 部署与构建
- **GitHub Pages** - 静态网站托管
- **Vercel** - 边缘函数部署
- **GitHub Actions** - 自动化部署流程

## 🏗️ 项目架构

```
jiang_ai_web/
├── public/                     # 静态资源
│   ├── icon/                   # 应用图标
│   ├── manifest.json          # PWA 配置
│   └── sw.js                   # Service Worker
├── src/
│   ├── components/             # React 组件
│   │   ├── AnimatedCat.tsx     # 动画猫咪组件
│   │   ├── AuthForm.tsx        # 认证表单
│   │   ├── CardEditModal.tsx   # 卡片编辑模态框
│   │   ├── SearchBar.tsx       # 搜索栏组件
│   │   ├── WebsiteCard.tsx     # 网站卡片组件
│   │   └── Workspace/          # 工作空间组件
│   ├── contexts/               # React 上下文
│   │   ├── SupabaseAuthContext.tsx    # 认证上下文
│   │   ├── SyncContext.tsx             # 同步状态上下文
│   │   ├── TransparencyContext.tsx     # 透明度设置上下文
│   │   ├── UserProfileContext.tsx      # 用户资料上下文
│   │   └── WorkspaceContext.tsx        # 工作空间上下文
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useAutoSync.ts      # 自动同步
│   │   ├── useCloudData.ts     # 云端数据管理
│   │   ├── useDataManager.ts   # 数据导入导出
│   │   ├── useDragAndDrop.ts   # 拖拽功能
│   │   ├── useFavicon.ts       # 图标处理
│   │   ├── useLocalStorage.ts  # 本地存储
│   │   ├── useNetworkStatus.ts # 网络状态监控
│   │   ├── usePWA.ts          # PWA 功能
│   │   ├── usePerformanceOptimization.ts # 性能优化
│   │   ├── useResponsiveLayout.ts        # 响应式布局
│   │   ├── useSettingsManager.ts        # 设置管理
│   │   ├── useTheme.ts                   # 主题管理
│   │   └── useWebsiteData.ts             # 网站数据管理
│   ├── lib/                    # 工具库和服务
│   │   ├── api/                # API 客户端
│   │   ├── proxy/              # 代理服务
│   │   ├── cacheManager.ts     # 缓存管理器
│   │   ├── faviconCache.ts     # 图标缓存
│   │   ├── indexedDBCache.ts   # IndexedDB 缓存
│   │   ├── notionClient.ts     # Notion API 客户端
│   │   ├── performanceMonitor.ts # 性能监控
│   │   ├── smartProxy.ts       # 智能代理管理
│   │   ├── storageManager.ts   # 存储管理器
│   │   ├── supabase.ts         # Supabase 配置
│   │   ├── supabaseSync.ts     # Supabase 同步服务
│   │   └── utils.ts            # 通用工具函数
│   ├── pages/                  # 页面组件
│   │   ├── Home.tsx            # 主页
│   │   └── Settings.tsx        # 设置页面
│   ├── App.tsx                 # 应用根组件
│   ├── main.tsx                # 应用入口
│   └── index.css               # 全局样式
├── supabase/                   # Supabase 配置
│   ├── functions/              # Edge Functions
│   │   ├── cors-proxy/         # CORS 代理服务
│   │   ├── favicon-service/    # 图标服务
│   │   ├── notion-proxy/       # Notion 代理
│   │   ├── universal-proxy/    # 通用代理
│   │   └── wallpaper-service/  # 壁纸服务
│   └── config.toml             # Supabase 配置
├── cors-proxy/                 # 独立代理服务
├── package.json                # 项目依赖
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
└── tsconfig.json               # TypeScript 配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐) 或 npm >= 9.0.0

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 环境配置

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 配置环境变量：
```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 其他配置
VITE_APP_NAME=江AI网站导航
VITE_APP_VERSION=1.0.0
```

### 启动开发服务器

```bash
# 启动前端开发服务器
pnpm run dev

# 启动代理服务器 (可选)
pnpm run dev:proxy
```

访问 http://localhost:3000 查看应用。

### 构建生产版本

```bash
# 构建项目
pnpm run build

# 预览构建结果
pnpm run preview
```

## 📦 部署

### GitHub Pages 部署

```bash
# 自动构建并部署到 GitHub Pages
pnpm run deploy
```

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### 手动部署

```bash
# 构建项目
pnpm run build

# 将 dist 目录部署到你的服务器
```

## 🔧 核心功能实现

### 数据管理

#### 本地存储
- **StorageManager**: 统一的存储管理器，支持 localStorage 和 sessionStorage
- **IndexedDBCache**: 大容量数据缓存，用于图标和壁纸
- **数据验证**: 确保数据完整性和类型安全

#### 智能云端同步 🆕
- **自动同步**: 数据变更时自动同步到 Supabase
- **数据验证**: 同步前验证数据有效性，防止空数据覆盖云端
- **冲突解决**: 智能合并本地和云端数据
- **离线支持**: 离线时缓存操作，联网后自动同步
- **安全保护**: 只同步有效数据，保护云端数据完整性

### 缓存策略

#### 多层缓存架构
1. **内存缓存**: 运行时数据缓存，最快访问速度
2. **localStorage**: 轻量级持久化存储
3. **IndexedDB**: 大容量结构化数据存储
4. **Service Worker**: 网络请求缓存

#### 智能缓存管理
- **TTL 机制**: 自动过期清理
- **LRU 策略**: 最近最少使用淘汰
- **压缩存储**: 减少存储空间占用

### 性能优化

#### 渲染优化
- **虚拟化**: 大列表虚拟滚动
- **防抖节流**: 搜索和滚动事件优化
- **懒加载**: 图片和组件按需加载
- **代码分割**: 路由级别的代码分割

#### 网络优化
- **资源预加载**: 预加载关键资源
- **CDN 加速**: 静态资源 CDN 分发
- **压缩传输**: Gzip/Brotli 压缩
- **HTTP/2**: 多路复用和服务器推送

### CORS 解决方案

#### 智能代理系统
- **多代理支持**: 支持多个 CORS 代理服务
- **自动切换**: 代理失败时自动切换
- **健康检查**: 定期检查代理可用性
- **负载均衡**: 根据响应时间选择最优代理

#### 代理服务列表
1. **api.allorigins.win** - 主要代理服务
2. **corsproxy.io** - 备用代理服务
3. **Supabase Edge Functions** - 自建代理服务
4. **Vercel Functions** - 边缘计算代理

## 🔐 安全特性

### 数据安全
- **行级安全**: Supabase RLS 策略
- **数据加密**: 敏感数据加密存储
- **输入验证**: 严格的数据验证
- **XSS 防护**: 内容安全策略

### 隐私保护
- **Cookie 同意**: GDPR 合规的 Cookie 管理
- **数据最小化**: 只收集必要数据
- **用户控制**: 用户可完全控制自己的数据
- **透明度**: 清晰的隐私政策

## 📱 PWA 支持

### 功能特性
- **离线访问**: Service Worker 缓存策略
- **安装提示**: 原生应用般的安装体验
- **推送通知**: 重要更新通知
- **后台同步**: 后台数据同步

### 配置文件
- **manifest.json**: PWA 应用清单
- **sw.js**: Service Worker 脚本
- **图标集**: 多尺寸应用图标

## 🧪 测试

### 测试策略
- **单元测试**: 核心函数和组件测试
- **集成测试**: 功能模块集成测试
- **E2E 测试**: 端到端用户流程测试
- **性能测试**: 加载速度和响应时间测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行 E2E 测试
pnpm test:e2e
```

## 🤝 贡献指南

### 开发流程

1. **Fork 项目**
```bash
git clone https://github.com/your-username/jiang_ai_web.git
cd jiang_ai_web
```

2. **创建功能分支**
```bash
git checkout -b feature/amazing-feature
```

3. **开发和测试**
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 运行测试
pnpm test
```

4. **提交更改**
```bash
git add .
git commit -m "feat: add amazing feature"
```

5. **推送分支**
```bash
git push origin feature/amazing-feature
```

6. **创建 Pull Request**

### 代码规范

- **TypeScript**: 严格的类型检查
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Husky**: Git hooks 自动化

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢以下开源项目和服务：

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Supabase](https://supabase.com/) - 后端服务
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Vercel](https://vercel.com/) - 部署平台

## 📝 更新日志

### v1.2.0 (2024-12-19)

#### 🔧 修复
- **数据同步安全性增强**: 修复了自动同步可能导致空数据覆盖云端真实数据的问题
- **数据验证机制**: 在同步前增加数据有效性验证，确保只同步有效的网站数据
- **智能上传逻辑**: 改进本地数据上传逻辑，避免无效数据污染云端

#### ✨ 改进
- **同步状态提示**: 优化同步状态显示，提供更清晰的反馈信息
- **错误处理**: 增强错误处理机制，提高系统稳定性
- **代码优化**: 重构部分核心代码，提升性能和可维护性

#### 🛡️ 安全性
- **数据保护**: 实施多层数据保护机制，防止意外数据丢失
- **验证增强**: 加强数据验证规则，确保数据完整性

### v1.1.0 (2024-12-15)
- 初始版本发布
- 基础功能实现
- 云端同步功能

## 📞 联系方式

- **项目地址**: [GitHub](https://github.com/your-username/jiang_ai_web)
- **问题反馈**: [Issues](https://github.com/your-username/jiang_ai_web/issues)
- **功能建议**: [Discussions](https://github.com/your-username/jiang_ai_web/discussions)

---

**江AI网站导航** - 让网站管理更简单、更智能 🚀
