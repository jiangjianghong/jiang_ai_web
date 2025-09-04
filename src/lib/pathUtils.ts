/**
 * 获取正确的API路径
 * 根据环境自动添加基础路径
 */
export function getApiPath(path: string): string {
  // 确保path以/开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // 对于 /api/proxy 路径，在开发环境中需要特殊处理
  if (path === '/api/proxy') {
    // 在开发环境中，使用 base path + api 路径，这样会被 Vite 代理转发
    const basePath = import.meta.env.BASE_URL || '/';
    if (basePath !== '/' && import.meta.env.DEV) {
      const cleanBasePath = basePath.replace(/\/$/, '');
      return cleanBasePath + path;
    }
    // 在生产环境中，直接使用 /api/proxy
    return path;
  }

  // 其他路径的处理保持不变
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
