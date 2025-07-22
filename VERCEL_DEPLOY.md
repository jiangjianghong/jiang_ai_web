# 🚀 Vercel部署指导

## 📋 部署准备清单

✅ 已完成的配置：
- `vercel.json` - Vercel配置文件
- `api/proxy.js` - 通用CORS代理函数
- `src/lib/smartProxy.ts` - 智能代理管理器
- 更新了 `package.json` 构建脚本

## 🔧 部署步骤

### 方法1：通过Vercel CLI部署（推荐）

1. **安装Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel
   ```
   
   首次部署时会询问：
   - Link to existing project? → `N`
   - What's your project's name? → `jiang-ai-web`（或您想要的名称）
   - In which directory is your code located? → `./`

4. **生产部署**
   ```bash
   vercel --prod
   ```

### 方法2：通过GitHub连接部署

1. **推送代码到GitHub**
   ```bash
   git add .
   git commit -m "添加Vercel代理配置"
   git push origin main
   ```

2. **在Vercel Dashboard连接**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 连接您的GitHub仓库
   - 选择 `jiang_ai_web` 项目
   - 点击 "Deploy"

## 🌐 环境变量配置

在Vercel Dashboard中添加以下环境变量：

```
VITE_SUPABASE_URL=https://wxheqargopbsrruootyr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGVxYXJnb3Bic3JydW9vdHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MTc5MzMsImV4cCI6MjA2ODM5MzkzM30.KWm3ww5Ang42Bswim-O-CHtd6GwBIWZepUy359Bk7Yw
```

## 🔍 部署后验证

1. **访问您的应用**
   - 主域名：`https://your-app.vercel.app`
   - 代理API：`https://your-app.vercel.app/api/proxy`

2. **测试代理功能**
   ```bash
   curl "https://your-app.vercel.app/api/proxy?url=https://httpbin.org/get"
   ```

3. **检查Notion工作空间**
   - 打开工作空间设置
   - 测试Notion连接
   - 查看控制台代理切换日志

## 📊 智能代理工作原理

部署后，您的应用将：

1. **优先使用Vercel代理**（最快，国内外都好用）
2. **自动检测代理可用性**
3. **故障时切换备用代理**
4. **实时性能监控**

## 🛠️ 故障排查

### 构建失败
```bash
# 检查本地构建
npm run vercel-build

# 查看详细错误
vercel --debug
```

### 代理不工作
1. 检查API函数部署状态
2. 查看Vercel Functions日志
3. 确认环境变量设置

### CORS问题
- 代理会自动处理所有CORS问题
- 检查 `vercel.json` 的headers配置

## 🎯 成功标志

部署成功后您应该看到：
- ✅ 应用正常访问
- ✅ Notion工作空间连接成功  
- ✅ 壁纸和图标正常加载
- ✅ 控制台显示代理切换日志

## 📞 获取帮助

如果遇到问题：
1. 查看Vercel Dashboard的部署日志
2. 检查浏览器控制台错误信息
3. 确认所有文件都已提交并推送

---

🎉 **恭喜！您现在有了一个完全免费、无需VPN、国内外都能快速访问的CORS解决方案！**