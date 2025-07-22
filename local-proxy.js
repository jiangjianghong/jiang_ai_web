const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8080;

// 启用CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

// Notion API代理
app.use('/api/notion', createProxyMiddleware({
  target: 'https://api.notion.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/notion': '/v1'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`代理请求: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`代理响应: ${proxyRes.statusCode} ${req.url}`);
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 本地代理服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 Notion API 代理地址: http://localhost:${PORT}/api/notion`);
  console.log('');
  console.log('使用方法:');
  console.log('1. 在工作空间设置中启用代理');
  console.log('2. 代理地址填入: http://localhost:8080/api/notion/');
  console.log('3. 测试连接');
});