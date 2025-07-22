# ai_new_web

[**项目地址**](https://space.coze.cn/task/7520427345329783091)

## 功能特性

- 使用 React + TypeScript + Vite 构建的现代化 Web 应用
- 支持 GitHub Pages 部署
- 内置多重 CORS 代理解决方案，支持 Notion API 等外部服务
- 响应式设计，适配各种设备

## 本地开发

### 环境准备

- 安装 [Node.js](https://nodejs.org/en)
- 安装 [pnpm](https://pnpm.io/installation)

### 操作步骤

- 安装依赖

```sh
pnpm install
```

- 启动 Dev Server

```sh
pnpm run dev
```

- 在浏览器访问 http://localhost:3000

## CORS 代理解决方案

本项目使用多个公共 CORS 代理服务来解决跨域请求问题，特别是与 Notion API 的集成。代理服务按以下优先级使用：

1. corsproxy.io
2. api.allorigins.win
3. thingproxy.freeboard.io
4. cors-anywhere.herokuapp.com

系统会自动选择可用的代理服务，如果一个代理失败，会自动切换到下一个。详细信息请参考 [CORS_SOLUTION.md](./CORS_SOLUTION.md)。

## 部署

### GitHub Pages 部署

```sh
pnpm run deploy
```

此命令会构建项目并将其部署到 GitHub Pages。

## 项目结构

- `src/` - 源代码
  - `components/` - React 组件
  - `lib/` - 工具库和服务
    - `proxy/` - CORS 代理服务实现
    - `api/` - API 客户端
  - `pages/` - 页面组件
  - `contexts/` - React 上下文
  - `hooks/` - 自定义 React Hooks

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request
