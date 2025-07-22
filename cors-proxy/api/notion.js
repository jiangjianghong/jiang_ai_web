// Notion API CORS 代理
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 获取目标 URL
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // 构建请求选项
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        ...req.headers,
      },
    };

    // 对于 POST 请求，添加请求体
    if (req.method === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    // 删除可能导致问题的头部
    delete options.headers.host;
    delete options.headers.origin;
    delete options.headers.referer;
    
    // 发起请求到 Notion API
    const response = await fetch(targetUrl, options);
    
    // 获取响应数据
    const data = await response.text();
    
    // 返回响应
    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.send(data);
    
  } catch (error) {
    console.error('Notion proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      message: error.message 
    });
  }
}