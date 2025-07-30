# 域名迁移操作清单

## ✅ 已完成的自动化修改
- [x] 更新 Vite 配置为根路径部署
- [x] 修复所有路径引用
- [x] 创建 CNAME 文件
- [x] 修复构建问题
- [x] 推送代码到 GitHub

## 🔄 需要手动完成的步骤

### 步骤 1: 处理另一个项目 (必须先完成)
**重要**: 必须先处理占用根域名的项目，否则无法设置自定义域名

1. 进入另一个项目的 GitHub 仓库 (当前占用 jiangjiangjiang.top 的项目)
2. 选择以下任一方案：
   
   **方案 A: 删除项目**
   - 点击 Settings → 滚动到底部 → Delete this repository
   - 输入仓库名确认删除
   
   **方案 B: 重命名项目**
   - 点击 Settings → Repository name → 修改为新名称
   - 进入 Settings → Pages → 移除 Custom domain 设置

### 步骤 2: 配置当前项目的 GitHub Pages
1. 进入当前项目的 GitHub 仓库: https://github.com/jiangjianghong/jiang_ai_web
2. 点击 Settings → Pages
3. Source 选择 "GitHub Actions" (应该已经是这个设置)
4. 在 Custom domain 中输入: `jiangjiangjiang.top`
5. 勾选 "Enforce HTTPS"
6. 点击 Save

### 步骤 3: 等待部署完成
1. 查看 Actions 页面，等待部署完成 (约 2-5 分钟)
2. 部署成功后，访问 https://jiangjiangjiang.top
3. 验证网站正常运行

## 🔍 验证清单
访问 https://jiangjiangjiang.top 并检查：
- [ ] 首页正常加载
- [ ] 搜索功能正常
- [ ] 网站卡片显示正常
- [ ] 图标加载正常
- [ ] 路由跳转正常 (如设置页面)
- [ ] 用户登录功能正常
- [ ] 工作空间功能正常

## ⚠️ 注意事项
1. **DNS 传播**: 域名配置可能需要几分钟到几小时生效
2. **浏览器缓存**: 建议清除浏览器缓存
3. **SSL 证书**: GitHub Pages 会自动生成，可能需要几分钟
4. **旧链接**: 考虑在社交媒体等地方更新链接

## 🆘 如果遇到问题
1. **域名无法设置**: 确保另一个项目已经释放了域名
2. **网站无法访问**: 等待 DNS 传播，清除浏览器缓存
3. **SSL 错误**: 等待 GitHub Pages 生成证书
4. **功能异常**: 检查浏览器控制台错误信息

## 📞 完成后
完成所有步骤后，你的项目将在 https://jiangjiangjiang.top 上运行！