import { supabase } from './supabase';

/**
 * 从 URL 下载图标并上传到 Supabase Storage
 * @param faviconUrl - 图标的 URL
 * @param websiteId - 网站的唯一标识符
 * @returns Promise<string> - 上传后的 Supabase Storage URL
 */
export const uploadFaviconToStorage = async (faviconUrl: string, websiteId: string): Promise<string> => {
  try {
    // 1. 从URL下载图标
    const response = await fetch(faviconUrl);
    if (!response.ok) {
      throw new Error(`下载图标失败: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // 2. 生成文件名
    const timestamp = Date.now();
    const fileExt = 'png'; // 默认使用png格式
    const fileName = `${websiteId}_${timestamp}.${fileExt}`;
    const filePath = `favicons/${fileName}`;

    // 3. 上传到Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('favicons')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/png',
      });

    if (uploadError) {
      throw new Error(`上传失败: ${uploadError.message}`);
    }

    // 4. 获取公共URL
    const { data } = supabase.storage
      .from('favicons')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('上传图标到Supabase失败:', error);
    // 如果上传失败，返回原始URL
    return faviconUrl;
  }
};
