// Notion URL 解析工具
// 支持多种 Notion URL 格式的数据库 ID 提取

export interface NotionUrlParseResult {
  databaseId: string | null;
  isValid: boolean;
  originalUrl: string;
  error?: string;
}

/**
 * 从 Notion URL 中提取数据库 ID
 * 支持的格式：
 * 1. https://www.notion.so/22b197407c238188ace9fe148487a853?v=22b197407c23816c809f000c1b8ef117
 * 2. https://notion.so/workspace/22b197407c238188ace9fe148487a853
 * 3. 直接的数据库 ID: 22b197407c238188ace9fe148487a853
 */
export function parseNotionUrl(input: string): NotionUrlParseResult {
  const originalUrl = input.trim();
  
  if (!originalUrl) {
    return {
      databaseId: null,
      isValid: false,
      originalUrl,
      error: '输入不能为空'
    };
  }

  try {
    // 情况1: 直接是数据库 ID（32位十六进制字符）
    const directIdMatch = originalUrl.match(/^[a-f0-9]{32}$/i);
    if (directIdMatch) {
      return {
        databaseId: originalUrl.toLowerCase(),
        isValid: true,
        originalUrl
      };
    }

    // 情况2: 包含 notion.so 的 URL
    if (originalUrl.includes('notion.so')) {
      try {
        const url = new URL(originalUrl);
        
        // 从路径中提取数据库 ID
        // 路径格式通常是 /workspace/databaseId 或 /databaseId
        const pathParts = url.pathname.split('/').filter(part => part.length > 0);
        
        // 查找32位十六进制字符串
        for (const part of pathParts) {
          const cleanPart = part.replace(/-/g, ''); // 移除可能的连字符
          if (/^[a-f0-9]{32}$/i.test(cleanPart)) {
            return {
              databaseId: cleanPart.toLowerCase(),
              isValid: true,
              originalUrl
            };
          }
        }

        // 如果路径中没找到，检查查询参数
        const vParam = url.searchParams.get('v');
        if (vParam && /^[a-f0-9]{32}$/i.test(vParam)) {
          return {
            databaseId: vParam.toLowerCase(),
            isValid: true,
            originalUrl
          };
        }

        return {
          databaseId: null,
          isValid: false,
          originalUrl,
          error: '无法从 Notion URL 中提取有效的数据库 ID'
        };
      } catch (urlError) {
        return {
          databaseId: null,
          isValid: false,
          originalUrl,
          error: 'URL 格式无效'
        };
      }
    }

    // 情况3: 可能是格式化的数据库 ID（带连字符）
    const formattedIdMatch = originalUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (formattedIdMatch) {
      const cleanId = formattedIdMatch[1].replace(/-/g, '');
      return {
        databaseId: cleanId.toLowerCase(),
        isValid: true,
        originalUrl
      };
    }

    // 情况4: 尝试提取任何32位十六进制字符串
    const anyIdMatch = originalUrl.match(/[a-f0-9]{32}/i);
    if (anyIdMatch) {
      return {
        databaseId: anyIdMatch[0].toLowerCase(),
        isValid: true,
        originalUrl
      };
    }

    return {
      databaseId: null,
      isValid: false,
      originalUrl,
      error: '输入不是有效的 Notion 数据库 URL 或 ID'
    };
  } catch (error) {
    return {
      databaseId: null,
      isValid: false,
      originalUrl,
      error: error instanceof Error ? error.message : '解析失败'
    };
  }
}

/**
 * 验证数据库 ID 格式是否正确
 */
export function isValidDatabaseId(id: string): boolean {
  return /^[a-f0-9]{32}$/i.test(id.trim());
}

/**
 * 格式化数据库 ID 为标准格式（小写，无连字符）
 */
export function formatDatabaseId(id: string): string {
  return id.replace(/-/g, '').toLowerCase().trim();
}

/**
 * 将数据库 ID 格式化为 UUID 格式（带连字符）
 */
export function formatDatabaseIdAsUuid(id: string): string {
  const cleanId = formatDatabaseId(id);
  if (cleanId.length !== 32) {
    return cleanId;
  }
  
  return [
    cleanId.slice(0, 8),
    cleanId.slice(8, 12),
    cleanId.slice(12, 16),
    cleanId.slice(16, 20),
    cleanId.slice(20, 32)
  ].join('-');
}