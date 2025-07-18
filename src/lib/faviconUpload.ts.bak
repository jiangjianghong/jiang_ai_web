import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * 从 URL 下载图标并上传到 Firebase Storage
 * @param faviconUrl - 图标的 URL
 * @param websiteId - 网站的唯一标识符
 * @returns Promise<string> - 上传后的 Firebase Storage URL
 */
export async function uploadFaviconToStorage(faviconUrl: string, websiteId: string): Promise<string> {
  try {
    // 如果已经是 Firebase Storage URL，直接返回
    if (faviconUrl.includes('firebase') && faviconUrl.includes('storage')) {
      return faviconUrl;
    }

    // 如果是默认图标，不需要上传
    if (faviconUrl === '/icon/icon.jpg' || faviconUrl.includes('/icon/icon.jpg')) {
      return faviconUrl;
    }

    // 如果是 data: URL，直接返回（不上传到Storage）
    if (faviconUrl.startsWith('data:')) {
      console.log('📋 检测到 data URL，跳过上传');
      return faviconUrl;
    }

    console.log('🔄 开始上传图标到 Storage:', faviconUrl);

    // 下载图标 - 添加CORS处理
    let response: Response;
    try {
      response = await fetch(faviconUrl);
    } catch (fetchError) {
      console.warn('⚠️ 直接获取失败，尝试使用CORS代理:', fetchError);
      // 如果是CORS错误，尝试使用代理
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${faviconUrl}`;
      response = await fetch(proxyUrl);
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch icon: ${response.status}`);
    }

    const blob = await response.blob();
    
    // 生成存储路径 - 修复文件扩展名处理
    const timestamp = Date.now();
    let fileExtension = 'png'; // 默认扩展名
    
    if (blob.type) {
      const mimeType = blob.type.toLowerCase();
      if (mimeType.includes('svg')) {
        fileExtension = 'svg';
      } else if (mimeType.includes('png')) {
        fileExtension = 'png';
      } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
        fileExtension = 'jpg';
      } else if (mimeType.includes('ico')) {
        fileExtension = 'ico';
      } else if (mimeType.includes('gif')) {
        fileExtension = 'gif';
      } else if (mimeType.includes('webp')) {
        fileExtension = 'webp';
      }
    }
    
    const storagePath = `favicons/${websiteId}-${timestamp}.${fileExtension}`;
    
    // 创建存储引用
    const storageRef = ref(storage, storagePath);
    
    // 上传文件
    await uploadBytes(storageRef, blob);
    
    // 获取下载 URL
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('✅ 图标上传成功:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('❌ 图标上传失败:', error);
    // 上传失败时返回原始 URL
    return faviconUrl;
  }
}

/**
 * 批量上传图标到 Storage（用于迁移已有数据）
 * @param websites - 网站数组
 * @returns Promise<void>
 */
export async function batchUploadFavicons(websites: Array<{id: string, favicon: string}>): Promise<void> {
  console.log('🚀 开始批量上传图标...');
  
  const uploadPromises = websites.map(async (website) => {
    try {
      const newFaviconUrl = await uploadFaviconToStorage(website.favicon, website.id);
      return { id: website.id, newFaviconUrl };
    } catch (error) {
      console.error(`图标上传失败 - ${website.id}:`, error);
      return { id: website.id, newFaviconUrl: website.favicon };
    }
  });

  const results = await Promise.allSettled(uploadPromises);
  
  const successful = results.filter(result => result.status === 'fulfilled').length;
  console.log(`✅ 批量上传完成: ${successful}/${websites.length} 成功`);
}
