// 简单的Notion API代理服务器
// 可以部署到 Vercel, Netlify Functions, 或任何 Node.js 服务器

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // 或使用内置fetch (Node 18+)

const app = express();
const PORT = process.env.PORT || 3001;

// 启用CORS
app.use(cors());
app.use(express.json());

// 代理路由
app.all('/api/notion/*', async (req, res) => {
  try {
    const notionPath = req.path.replace('/api/notion', '');
    const notionUrl = `https://api.notion.com/v1${notionPath}`;
    
    // 转发请求到Notion API
    const response = await fetch(notionUrl, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      ...(req.body && { body: JSON.stringify(req.body) })
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('代理错误:', error);
    res.status(500).json({ error: '代理服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log(`Notion代理服务器运行在端口 ${PORT}`);
});

// 部署说明:
// 1. npm install express cors node-fetch
// 2. 部署到 Vercel/Netlify/Railway 等平台
// 3. 更新前端代码使用您的代理URL