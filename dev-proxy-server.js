const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 导入代理逻辑
const proxyHandler = require('./api/proxy.js');

// 将所有/api请求转发到代理处理器
app.all('/api/proxy', async (req, res) => {
  try {
    console.log(`本地代理服务器收到请求: ${req.method} /api/proxy`);
    await proxyHandler(req, res);
  } catch (error) {
    console.error('本地代理服务器错误:', error);
    res.status(500).json({ error: '本地代理服务器错误', message: error.message });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dev-proxy-server' });
});

app.listen(PORT, () => {
  console.log(`🚀 开发代理服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 代理端点: http://localhost:${PORT}/api/proxy`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭开发代理服务器...');
  process.exit(0);
});