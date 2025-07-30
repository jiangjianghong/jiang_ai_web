# 域名迁移指南

## 概述
本指南帮助你将项目从 `https://jiangjiangjiang.top/jiang_ai_web/` 迁移到根域名 `https://jiangjiangjiang.top`。

## 已完成的代码修改

### 1. Vite 配置更新
- ✅ 将 `base: '/jiang_ai_web/'` 改为 `base: '/'`
- ✅ 更新开发服务器代理配置

### 2. 路径配置更新
- ✅ 更新 `src/main.tsx` 中的 basename 配置
- ✅ 更新 `src/lib/iconPath.ts` 中的路径逻辑
- ✅ 更新 `src/hooks/usePageTitle.ts` 中的页面标题
- ✅ 更新 `public/404.html` 中的重定向路径
- ✅ 更新 `public/sw.js` 和 `public/sw-offline.js` 中的路径逻辑
- ✅ 更新 `vercel.json` 中的 API 路由配置
- ✅ 更新 `index.html` 中的页面标题和 Service Worker 路径

### 3. 域名配置
- ✅ 创建 `public/CNAME` 文件，内容为 `jiangjiangjiang.top`

### 4. 构建问题修复
- ✅ 暂时禁用调试面板组件以修复生产构建问题
- ✅ 验证构建成功，所有资源正确打包

## 需要手动完成的 GitHub 操作

### 步骤 1: 处理另一个项目
你需要决定如何处理当前占用根域名的项目：

**选项 A: 删除另一个项目**
1. 进入另一个项目的 GitHub 仓库
2. 点击 Settings → 滚动到底部 → Delete this repository
3. 输入仓库名确认删除

**选项 B: 重命名另一个项目**
1. 进入另一个项目的 GitHub 仓库
2. 点击 Settings → Repository name → 修改为新名称
3. 在该项目的 Pages 设置中移除自定义域名

### 步骤 2: 配置当前项目的 GitHub Pages
1. 进入当前项目的 GitHub 仓库
2. 点击 Settings → Pages
3. Source 选择 "GitHub Actions"
4. 在 Custom domain 中输入 `jiangjiangjiang.top`
5. 勾选 "Enforce HTTPS"

### 步骤 3: 推送代码并部署
```bash
git add .
git commit -m "feat: 迁移到根域名部署"
git push origin main
```

### 步骤 4: 验证部署
1. 等待 GitHub Actions 部署完成（约 2-5 分钟）
2. 访问 `https://jiangjiangjiang.top` 确认网站正常运行
3. 检查所有功能是否正常工作

## 注意事项

1. **DNS 传播时间**: 域名配置更改可能需要几分钟到几小时才能生效
2. **缓存清理**: 建议清除浏览器缓存以确保看到最新版本
3. **SSL 证书**: GitHub Pages 会自动为自定义域名生成 SSL 证书
4. **旧链接**: 考虑在旧项目中添加重定向到新域名的逻辑

## 回滚方案
如果需要回滚到子路径部署：
1. 恢复 `vite.config.ts` 中的 `base: '/jiang_ai_web/'`
2. 恢复其他文件中的路径配置
3. 删除 `public/CNAME` 文件
4. 重新构建和部署

## 测试清单
- [ ] 首页正常加载
- [ ] 路由跳转正常
- [ ] 图标显示正常
- [ ] API 请求正常
- [ ] Service Worker 正常工作
- [ ] 404 页面重定向正常