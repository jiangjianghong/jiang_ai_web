// Simple favicon proxy for Vercel
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const { domain, size = '64' } = req.query;
  
  if (!domain) {
    res.status(400).json({ error: 'Domain parameter required' });
    return;
  }
  
  try {
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    const faviconUrl = `https://favicon.im/${cleanDomain}?larger=true&size=${size}`;
    
    const response = await fetch(faviconUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FaviconProxy/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(Buffer.from(buffer));
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch favicon',
      message: error.message 
    });
  }
};