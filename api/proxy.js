// Vercel Serverless Function - 通用CORS代理
// 针对中国网络环境优化，无需备案

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url: targetUrl } = req.query;
    
    if (!targetUrl) {
      return res.status(400).json({ error: '缺少目标URL参数' });
    }

    console.log(`代理请求: ${req.method} ${targetUrl}`);

    // 允许的域名列表
    const allowedDomains = [
      'api.notion.com',
      'favicon.im',
      'www.google.com', 
      'bing.img.run',
      'bing.com',
      's2.googleusercontent.com',
      'api.allorigins.win'
    ];
    
    const targetDomain = new URL(targetUrl).hostname;
    const isAllowed = allowedDomains.some(domain => 
      targetDomain === domain || targetDomain.endsWith('.' + domain)
    );
    
    if (!isAllowed) {
      return res.status(403).json({ error: '目标域名不在允许列表中' });
    }

    // 准备请求头
    const headers = {
      'User-Agent': 'Vercel-Proxy/1.0'
    };

    // Notion API特殊处理
    if (targetDomain === 'api.notion.com') {
      const authHeader = req.headers.authorization || req.headers['x-api-key'];
      if (authHeader) {
        headers['Authorization'] = authHeader;
        headers['Content-Type'] = 'application/json';
        headers['Notion-Version'] = '2022-06-28';
      }
    }

    // 图片请求特殊处理
    if (targetUrl.includes('.jpg') || targetUrl.includes('.png') || targetUrl.includes('.jpeg') || targetUrl.includes('bing.img.run')) {
      headers['Accept'] = 'image/*';
    }

    // 准备请求选项
    const fetchOptions = {
      method: req.method,
      headers
    };

    // POST请求添加请求体
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    // 发送请求
    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    // 处理不同类型响应
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else if (contentType.startsWith('image/')) {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      return res.status(response.status).send(Buffer.from(buffer));
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

  } catch (error) {
    console.error('代理错误:', error);
    return res.status(500).json({ 
      error: '代理服务器错误',
      message: error.message 
    });
  }
}