// 开发环境代理服务器 - 模拟 Vercel serverless function
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3002;

// 导入代理逻辑
const proxyHandler = require('./api/proxy.js');

const server = http.createServer(async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  console.log(`收到请求: ${req.method} ${req.url}`);

  // 只处理代理请求
  if (!req.url.startsWith('/api/proxy')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: '路径不存在' }));
  }

  // 为 Node.js res 对象添加 Vercel 兼容的方法
  const addVercelCompatibility = (res) => {
    res.status = (statusCode) => {
      res.statusCode = statusCode;
      return {
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        send: (data) => {
          if (typeof data === 'object') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } else {
            res.end(data);
          }
        },
        end: () => res.end()
      };
    };
    return res;
  };

  // 添加兼容性
  addVercelCompatibility(res);

  // 解析查询参数
  const parsedUrl = url.parse(req.url, true);
  req.query = parsedUrl.query;

  // 解析请求体
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        if (body) {
          req.body = JSON.parse(body);
        }
        await proxyHandler(req, res);
      } catch (error) {
        console.error('代理处理错误:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '代理处理错误', message: error.message }));
      }
    });
  } else {
    // GET 请求直接处理
    try {
      await proxyHandler(req, res);
    } catch (error) {
      console.error('代理处理错误:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '代理处理错误', message: error.message }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`🚀 开发代理服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 代理端点: http://localhost:${PORT}/api/proxy`);
  console.log('💡 这个服务器模拟 Vercel serverless functions 在开发环境中的行为');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭开发代理服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});