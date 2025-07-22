/**
 * 获取正确的API路径
 * 根据环境自动添加基础路径
 */
export function getApiPath(path: string): string {
  // 确保path以/开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // 在开发环境中，如果使用了 base path，需要添加它
  const basePath = import.meta.env.BASE_URL || '/';
  
  if (basePath !== '/') {
    // 移除末尾的斜杠，然后添加path
    const cleanBasePath = basePath.replace(/\/$/, '');
    return cleanBasePath + path;
  }
  
  return path;
}

/**
 * 获取Vercel代理URL
 */
export function getProxyUrl(targetUrl: string): string {
  const proxyPath = getApiPath('/api/proxy');
  return `${proxyPath}?url=${encodeURIComponent(targetUrl)}`;
}