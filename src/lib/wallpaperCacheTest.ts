// 壁纸缓存测试工具
import { wallpaperCacheService } from './wallpaperCacheService';

export const testWallpaperCache = async () => {
  console.log('🧪 开始测试壁纸缓存系统...');
  
  try {
    // 测试获取缓存统计
    const stats = await wallpaperCacheService.getCacheStats();
    console.log('📊 当前缓存状态:', stats);
    
    // 测试下载并缓存一张壁纸
    const testUrl = 'https://bing.img.run/1920x1080.php';
    console.log('🔄 测试下载壁纸:', testUrl);
    
    const startTime = Date.now();
    const cachedUrl = await wallpaperCacheService.getWallpaper('test', testUrl);
    const endTime = Date.now();
    
    console.log('✅ 测试完成!', {
      原始URL: testUrl,
      缓存URL: cachedUrl,
      耗时: `${endTime - startTime}ms`,
      是否为blob: cachedUrl.startsWith('blob:')
    });
    
    // 再次获取同一张图片，应该从缓存获取
    console.log('🔄 测试缓存命中...');
    const startTime2 = Date.now();
    const cachedUrl2 = await wallpaperCacheService.getWallpaper('test', testUrl);
    const endTime2 = Date.now();
    
    console.log('⚡ 缓存命中测试:', {
      缓存URL: cachedUrl2,
      耗时: `${endTime2 - startTime2}ms`,
      是否更快: (endTime2 - startTime2) < (endTime - startTime)
    });
    
    // 获取更新后的缓存统计
    const newStats = await wallpaperCacheService.getCacheStats();
    console.log('📈 更新后缓存状态:', newStats);
    
  } catch (error) {
    console.error('❌ 缓存测试失败:', error);
  }
};

// 在浏览器控制台中暴露测试函数
if (typeof window !== 'undefined') {
  (window as any).testWallpaperCache = testWallpaperCache;
  console.log('🔧 壁纸缓存测试函数已添加到 window.testWallpaperCache()');
}
