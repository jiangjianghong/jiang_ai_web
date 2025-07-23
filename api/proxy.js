// Vercel Serverless Function - 通用CORS代理
// 针对中国网络环境优化，无需备案

module.exports = async function handler(req, res) {
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
      'api.allorigins.win',
      'httpbin.org', // 测试用
      'corsproxy.io',
      'icons.duckduckgo.com', // DuckDuckGo favicon 服务
      'github.com',
      'drive.google.com',
      'wx.mail.qq.com',
      'mail.google.com',
      'notion.so',
      'aistudio.google.com',
      'yacd.metacubex.one',
      'bilibili.com',
      'excalidraw.com'
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
      // 检查多种可能的认证头格式
      const authHeader = req.headers.authorization || 
                        req.headers['Authorization'] || 
                        req.headers['x-api-key'] ||
                        req.headers['X-Api-Key'];
      
      console.log('Notion请求头检查:', { 
        authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'null',
        method: req.method,
        allHeaders: Object.keys(req.headers)
      });
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
        headers['Content-Type'] = 'application/json';
        headers['Notion-Version'] = '2022-06-28';
        console.log('设置Notion认证头成功');
      } else {
        console.warn('缺少Notion认证头, 可用头部:', Object.keys(req.headers));
      }
    }

    // 图片和 favicon 请求特殊处理
    if (targetUrl.includes('.jpg') || targetUrl.includes('.png') || targetUrl.includes('.jpeg') || 
        targetUrl.includes('bing.img.run') || targetUrl.includes('favicon') || 
        targetUrl.includes('.ico') || targetUrl.includes('s2/favicons')) {
      headers['Accept'] = 'image/*,*/*;q=0.8';
      headers['User-Agent'] = 'Mozilla/5.0 (compatible; FaviconBot/1.0)';
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
    console.log('发送请求到:', targetUrl, '选项:', JSON.stringify(fetchOptions, null, 2));
    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    console.log('收到响应:', { status: response.status, contentType });

    // 处理不同类型响应
    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log('返回JSON数据:', data);
      // 保持原始状态码和设置正确的响应头
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).json(data);
    } else if (contentType.startsWith('image/')) {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      console.log('返回图片数据，大小:', buffer.byteLength);
      return res.status(response.status).send(Buffer.from(buffer));
    } else {
      const text = await response.text();
      console.log('返回文本数据，长度:', text.length, '前100字符:', text.substring(0, 100));
      
      // 如果期望JSON但收到HTML，说明有错误
      if (targetDomain === 'api.notion.com' && text.trim().startsWith('<!')) {
        console.error('Notion API返回HTML而不是JSON，可能是认证失败');
        return res.status(401).json({ 
          error: 'Notion API认证失败',
          message: 'API密钥可能无效或已过期',
          details: text.substring(0, 200)
        });
      }
      
      res.setHeader('Content-Type', contentType || 'text/plain');
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