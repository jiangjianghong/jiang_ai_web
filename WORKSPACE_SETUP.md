# 工作空间设置指南

## 📋 Notion数据库示例

创建一个数据库，包含以下属性：

### 必需属性
- **Name** (标题类型) - 工作链接的名称
- **URL** (URL类型) - 链接地址

### 可选属性  
- **Description** (文本类型) - 链接描述
- **Category** (选择类型) - 分类，如：开发工具、设计资源、文档等
- **Active** (复选框类型) - 是否在工作空间中显示

## 🔧 配置步骤

### 1. 创建Notion集成
1. 访问 https://www.notion.so/my-integrations
2. 点击 "New integration"
3. 填写集成名称，选择工作空间
4. 复制生成的 API Token

### 2. 设置数据库权限
1. 在数据库页面点击右上角 "Share"
2. 搜索并添加你的集成
3. 设置权限为 "Can read" 或 "Can edit"
4. 复制数据库URL中的32位ID

### 3. 在工作空间中配置
1. 点击页面左上角"工作空间"按钮
2. 首次使用会自动打开设置页面
3. 填入API Token和数据库ID
4. 点击"测试连接"验证配置
5. 保存配置并开始同步

## 🎯 数据库示例内容

| Name | URL | Category | Description | Active |
|------|-----|----------|-------------|--------|
| GitHub | https://github.com | 开发工具 | 代码仓库管理 | ✅ |
| Figma | https://figma.com | 设计工具 | UI设计协作 | ✅ |
| Notion | https://notion.so | 文档工具 | 知识管理 | ✅ |

## 🔧 故障排除

### 权限问题
- 确保集成已添加到数据库
- 检查集成权限不是"No access"
- 验证API Token格式正确

### 连接问题  
- 检查网络连接
- 尝试使用CORS代理
- 确认数据库ID正确（32位字符串）

### 数据显示问题
- 确保数据库有"Name"和"URL"属性
- 检查"Active"字段是否勾选
- 验证URL格式是否正确

## 🌐 CORS代理配置（可选）

如果遇到CORS问题，可以使用代理：

1. 部署提供的 `cors-proxy/api/notion.js` 到Vercel
2. 在工作空间设置中填入代理地址
3. 格式：`https://your-domain.vercel.app/api/notion`

## 📱 使用技巧

- 支持关键词搜索和分类筛选
- 点击卡片直接在新标签打开链接
- 支持离线缓存，网络恢复时自动同步
- 响应式设计，移动端也能完美使用