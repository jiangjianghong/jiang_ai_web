# 开发指南

本文档提供了项目开发相关的信息，包括本地开发环境设置、测试和部署流程。

## 开发环境设置

### 必要条件

- [Node.js](https://nodejs.org/) (v16 或更高版本)
- [pnpm](https://pnpm.io/installation) (推荐) 或 npm
- 代码编辑器 (推荐 [Visual Studio Code](https://code.visualstudio.com/))

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

这将启动开发服务器，通常在 http://localhost:3000 上运行。

## 项目结构

```
/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── components/      # React 组件
│   ├── contexts/        # React 上下文
│   ├── hooks/           # 自定义 React Hooks
│   ├── lib/             # 工具库和服务
│   │   ├── api/         # API 客户端
│   │   └── proxy/       # CORS 代理服务
│   ├── pages/           # 页面组件
│   ├── App.tsx          # 应用入口组件
│   ├── main.tsx         # 应用入口点
│   └── index.css        # 全局样式
├── .env                 # 环境变量
├── .env.example         # 环境变量示例
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
```

## CORS 代理服务

### 代理服务架构

CORS 代理服务使用多个公共代理服务，按优先级顺序尝试：

1. corsproxy.io
2. api.allorigins.win
3. thingproxy.freeboard.io
4. cors-anywhere.herokuapp.com

### 测试代理服务

要测试代理服务是否正常工作，可以使用以下方法：

1. **浏览器控制台测试**

   打开浏览器控制台 (F12)，执行以下代码：

   ```javascript
   // 测试 corsproxy.io
   fetch('https://corsproxy.io/?https://httpbin.org/get')
     .then(response => response.json())
     .then(data => console.log('corsproxy.io 可用:', data))
     .catch(error => console.error('corsproxy.io 不可用:', error));
   
   // 测试 api.allorigins.win
   fetch('https://api.allorigins.win/raw?url=https://httpbin.org/get')
     .then(response => response.json())
     .then(data => console.log('api.allorigins.win 可用:', data))
     .catch(error => console.error('api.allorigins.win 不可用:', error));
   ```

2. **使用应用内代理状态指示器**

   应用界面中的代理状态指示器会显示当前使用的代理服务及其状态。

### 添加新的代理服务

如果需要添加新的代理服务，请修改 `src/lib/proxy/config.ts` 文件：

```typescript
export const proxyConfigs: ProxyConfig[] = [
  // 添加新的代理服务
  {
    name: '新代理服务',
    url: 'https://new-proxy-service.com/',
    transformRequest: (url) => `https://new-proxy-service.com/?${encodeURIComponent(url)}`,
    supportsBinary: true,
    priority: 5 // 优先级，数字越小越优先
  },
  // 现有代理服务...
];
```

## API 客户端

### 使用 API 客户端

API 客户端使用 CORS 代理服务发送请求：

```typescript
import { CorsProxyService } from '../lib/proxy';
import { ApiClient } from '../lib/api';

// 创建代理服务
const proxyService = new CorsProxyService();

// 创建 API 客户端
const apiClient = new ApiClient(proxyService);

// 发送请求
apiClient.get('https://api.example.com/data')
  .then(data => console.log('请求成功:', data))
  .catch(error => console.error('请求失败:', error));
```

### Notion API 客户端

Notion API 客户端是对 API 客户端的扩展，专门用于与 Notion API 交互：

```typescript
import { CorsProxyService } from '../lib/proxy';
import { ApiClient, NotionApiClient } from '../lib/api';

// 创建代理服务
const proxyService = new CorsProxyService();

// 创建 API 客户端
const apiClient = new ApiClient(proxyService);

// 创建 Notion API 客户端
const notionClient = new NotionApiClient(apiClient, 'your-notion-api-key');

// 获取数据库信息
notionClient.getDatabase('your-database-id')
  .then(database => console.log('数据库信息:', database))
  .catch(error => console.error('获取数据库失败:', error));
```

## 构建和部署

### 构建项目

```bash
pnpm build
```

这将在 `dist` 目录中生成生产就绪的构建。

### 部署到 GitHub Pages

```bash
pnpm deploy
```

这将构建项目并将其部署到 GitHub Pages。

### 本地预览生产构建

```bash
pnpm preview
```

这将启动本地服务器来预览生产构建。

## 故障排除

如果遇到问题，请参考 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 文件。