/**
 * 统一的图标路径管理工具
 * 确保在不同环境（本地开发、GitHub Pages）下图标路径正确
 */

// 使用自定义域名，始终返回空字符串作为 base path
const getBasePath = (): string => {
  return '';
};

/**
 * 获取默认图标的完整路径
 */
export const getDefaultIconPath = (): string => {
  return `${getBasePath()}/icon/chatgpt.svg`;
};

/**
 * 获取内置的SVG图标作为最终兜底
 */
export const getFallbackIconDataUrl = (): string => {
  // 一个简单的星星图标SVG
  const svgIcon = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#667eea"/>
    <path d="M32 12L36 28H52L40 36L44 52L32 44L20 52L24 36L12 28H28L32 12Z" fill="white"/>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svgIcon)}`;
};

/**
 * 获取图标的完整路径
 * @param iconPath 相对路径的图标地址
 */
export const getIconPath = (iconPath: string): string => {
  if (iconPath.startsWith('http') || iconPath.startsWith('data:')) {
    return iconPath; // 绝对路径或base64，直接返回
  }

  if (iconPath.startsWith('/')) {
    return `${getBasePath()}${iconPath}`;
  }

  return iconPath;
};

/**
 * 检查是否是默认图标
 */
export const isDefaultIcon = (iconPath: string): boolean => {
  return iconPath === '/icon/favicon.png' || iconPath === getDefaultIconPath();
};
