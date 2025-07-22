// Vercel Serverless Function for favicon proxy
export default async function handler(req, res) {
  try {
    // Set comprehensive CORS headers first thing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '3600');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
  
  const { domain, size = '64' } = req.query;
  
  if (!domain) {
    // Set CORS headers for error response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(400).json({ error: 'Domain parameter is required' });
    return;
  }
  
  try {
    // Clean domain name
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    console.log(`Fetching favicon for: ${cleanDomain}`);
    
    // Try favicon.im first
    const faviconUrl = `https://favicon.im/${cleanDomain}?larger=true&size=${size}`;
    console.log(`Favicon URL: ${faviconUrl}`);
    
    const response = await fetch(faviconUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FaviconProxy/1.0)',
        'Accept': 'image/*,*/*;q=0.8'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    
    console.log(`Favicon fetched successfully. Size: ${arrayBuffer.byteLength} bytes, Type: ${contentType}`);
    
    // Set response headers including CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache
    
    // Send the image
    res.status(200).send(Buffer.from(arrayBuffer));
    
  } catch (error) {
    console.error('Favicon proxy error:', error);
    
    // Set CORS headers for error response too
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    res.status(500).json({ 
      error: 'Failed to fetch favicon',
      message: error.message,
      domain: domain
    });
  } catch (globalError) {
    // Handle any global errors
    console.error('Global error in favicon handler:', globalError);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Internal server error',
      message: globalError.message
    });
  }
}