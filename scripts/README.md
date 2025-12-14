# 自动更新 Service Worker 版本号

## 工作原理

### GitHub Actions 自动部署
每次 push 到 `main` 分支时，GitHub Actions 会自动执行：

1. 获取当前 commit 的 SHA hash（通过 `${{ github.sha }}`）
2. 运行 `pnpm update-sw-version` 更新版本号
3. 构建项目
4. 部署到 GitHub Pages

版本号格式：`v79a96ee`（v + commit SHA 的前7位）

### 本地构建
运行 `pnpm build` 时，会：

1. 通过 Git 命令获取当前 commit hash
2. 自动更新 `src/lib/swConfig.ts` 中的 `SW_VERSION`
3. 自动更新 `public/sw.js` 中的 `SW_VERSION`
4. 构建项目

## 使用方法

### 本地开发
```bash
pnpm dev
```
开发时不需要更新版本号。

### 手动更新版本号
```bash
pnpm update-sw-version
```
如果需要手动触发版本号更新。

### 本地构建
```bash
pnpm build    # 自动更新版本号并构建
```

### GitHub Actions 部署
```bash
git add .
git commit -m "your message"
git push origin main
```
Push 后 GitHub Actions 会自动构建和部署，版本号会自动使用该 commit 的 SHA。

## 版本号策略

- **GitHub Actions**：使用 `GITHUB_SHA` 环境变量（推荐）
- **本地 Git 仓库**：使用 `git rev-parse` 获取 commit hash
- **非 Git 环境**：使用时间戳（如 `v20250101T120000`）

## 好处

✅ **完全自动化**：每次 push 自动更新版本号
✅ **唯一性保证**：每个 commit 都有唯一的版本号
✅ **可追溯性**：可以通过版本号快速定位代码版本
✅ **缓存失效**：每次部署都会清除旧的 Service Worker 缓存
✅ **CI/CD 友好**：在 GitHub Actions 中无缝工作

## GitHub Actions 配置

在 `.github/workflows/deploy.yml` 中已配置：

```yaml
- name: Update Service Worker version
  run: pnpm update-sw-version
  env:
    GITHUB_SHA: ${{ github.sha }}

- name: Build
  run: pnpm run build:client
```

## 注意事项

- GitHub Actions 部署时会自动使用最新的 commit SHA
- 本地构建需要在 Git 仓库中进行
- 如果看到时间戳版本号，说明不在 Git 仓库中
- 版本号会在构建前自动更新，无需手动修改

## 相关文件

- `scripts/update-sw-version.js` - 自动更新脚本
- `.github/workflows/deploy.yml` - GitHub Actions 配置
- `src/lib/swConfig.ts` - Service Worker 配置文件
- `public/sw.js` - Service Worker 主文件
- `package.json` - 包含 `update-sw-version` 命令
