// Wallpaper Service - Supabase Edge Function
// 获取Bing每日壁纸，避免外部服务被墙问题

import { corsHeaders } from '../_shared/cors.ts'

console.log("Wallpaper Service started");

// 支持的壁纸分辨率
const RESOLUTIONS = {
  'uhd': '3840x2160',    // 4K
  '1920x1080': '1920x1080', // 1080p
  '1366x768': '1366x768',   // 720p
  'mobile': '1080x1920'     // 移动端
};

// 获取中国时区的时间对象
// 获取中国时区的时间对象
function getChinaDate(): Date {
  const now = new Date();
  // 直接使用 UTC 时间戳 + 8小时
  return new Date(now.getTime() + (8 * 60 * 60 * 1000));
}

// Bing壁纸API源
const BING_SOURCES = [
  // 直接访问Bing官方API
  (resolution: string) => `https://www.bing.com/th?id=OHR.${getBingImageId()}_${resolution}.jpg`,
  // Bing HPImageArchive API
  () => 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN',
  // 备用Bing图片API
  (resolution: string) => `https://bing.com/th?id=OHR.${getTodayId()}_${resolution}.jpg`
];

// 生成今日的Bing图片ID（基于日期）
function getTodayId(): string {
  const today = getChinaDate();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 获取Bing图片ID
function getBingImageId(): string {
  // 使用当前日期生成一个合理的图片ID
  const today = getChinaDate();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  return `BingDaily_${dateStr}`;
}

// 获取Bing每日壁纸元数据
async function getBingWallpaperMetadata(): Promise<any> {
  try {
    const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WallpaperBot/1.0)',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.images && data.images[0]) {
        return data.images[0];
      }
    }
  } catch (error: any) {
    console.log('获取Bing元数据失败:', error.message || error);
  }
  return null;
}

// 获取壁纸图片
async function fetchWallpaperImage(imageUrl: string): Promise<ArrayBuffer | null> {
  try {
    console.log(`尝试获取壁纸: ${imageUrl}`);

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WallpaperBot/1.0)',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': 'https://www.bing.com/',
      },
      signal: AbortSignal.timeout(15000), // 15秒超时
    });

    if (response.ok) {
      const imageData = await response.arrayBuffer();
      console.log(`成功获取壁纸: ${imageUrl} (${imageData.byteLength} bytes)`);
      return imageData;
    }
  } catch (error: any) {
    console.log(`获取壁纸失败: ${imageUrl} - ${error.message || error}`);
  }
  return null;
}

// 主处理函数
// @ts-ignore: Deno global
Deno.serve(async (req) => {
  const { url, method } = req;
  const requestUrl = new URL(url);

  // 处理CORS预检请求
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 获取参数
    const resolution = requestUrl.searchParams.get('resolution') || 'uhd';
    const forceRefresh = requestUrl.searchParams.get('refresh') === 'true';

    // 验证分辨率参数
    const targetResolution = RESOLUTIONS[resolution as keyof typeof RESOLUTIONS] || RESOLUTIONS['uhd'];

    console.log(`壁纸请求: ${resolution} (${targetResolution})`);

    // 生成缓存键 - 基于日期和分辨率 (使用UTC+8)
    const today = getChinaDate().toISOString().split('T')[0];
    const cacheKey = `wallpaper-${today}-${resolution}.jpg`;

    // 获取Supabase环境变量
    // @ts-ignore: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-ignore: Deno global
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    // 如果不强制刷新，先检查缓存
    if (!forceRefresh && supabaseUrl && supabaseKey) {
      try {
        const cacheResponse = await fetch(`${supabaseUrl}/storage/v1/object/wallpapers/${cacheKey}`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });

        if (cacheResponse.ok) {
          console.log(`使用缓存壁纸: ${cacheKey}`);
          const cachedData = await cacheResponse.arrayBuffer();
          return new Response(cachedData, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=43200', // 12小时缓存
              'X-Wallpaper-Source': 'cache',
              'X-Wallpaper-Date': today,
            },
          });
        }
      } catch (error) {
        console.log(`缓存未找到: ${cacheKey}`);
      }
    }

    // 获取Bing壁纸元数据
    const metadata = await getBingWallpaperMetadata();
    let imageUrl = '';
    let wallpaperData: ArrayBuffer | null = null;

    if (metadata && metadata.urlbase) {
      // 确定尝试的分辨率列表
      let resolutionCandidates = [targetResolution];

      // 如果请求的是4K，优先尝试 UHD，失败后尝试 3840x2160
      if (targetResolution === '3840x2160') {
        resolutionCandidates = ['UHD', '3840x2160'];
      }

      // 尝试获取壁纸（按优先级）
      for (const res of resolutionCandidates) {
        const url = `https://www.bing.com${metadata.urlbase}_${res}.jpg`;
        wallpaperData = await fetchWallpaperImage(url);

        if (wallpaperData) {
          imageUrl = url;
          console.log(`成功获取分辨率 ${res} 的壁纸`);
          break;
        }
      }
    }

    // 如果官方API失败，尝试备用方法
    // 如果官方API失败，尝试备用方法
    if (!wallpaperData) {
      console.log('官方API失败，尝试备用源');

      const fallbackUrls = [
        // 稳定的风景图 (Unsplash Source)
        `https://images.unsplash.com/photo-1472214103451-9374bd1c798e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1NjUyNzR8MHwxfHNlYXJjaHwxfHxuYXR1cmV8ZW58MHx8fHwxNjg0MjQ4NDYyfDA&ixlib=rb-4.0.3&q=80&w=${targetResolution.split('x')[0]}`,
        // 必应的几个经典壁纸作为硬编码后备
        `https://bing.com/th?id=OHR.Snowleopard_ZH-CN9377461665_${targetResolution}.jpg`,
        `https://bing.com/th?id=OHR.GrandPrismatic_ZH-CN8398188251_${targetResolution}.jpg`
      ];

      for (const fallbackUrl of fallbackUrls) {
        wallpaperData = await fetchWallpaperImage(fallbackUrl);
        if (wallpaperData) {
          imageUrl = fallbackUrl;
          console.log(`使用备用壁纸成功: ${fallbackUrl}`);
          break;
        }
      }
    }

    // 如果所有方法都失败，返回错误
    if (!wallpaperData) {
      console.log('所有壁纸源都失败');
      return new Response(
        JSON.stringify({
          error: '无法获取壁纸',
          resolution: targetResolution,
          date: today,
          fallback: '/icon/favicon.png'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 尝试缓存壁纸到Storage
    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/storage/v1/object/wallpapers/${cacheKey}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'image/jpeg',
          },
          body: wallpaperData,
        });
        console.log(`成功缓存壁纸: ${cacheKey}`);
      } catch (error: any) {
        console.log('缓存壁纸失败:', error.message || error);
      }
    }

    // 返回壁纸数据
    return new Response(wallpaperData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=43200', // 12小时缓存
        'X-Wallpaper-Source': imageUrl,
        'X-Wallpaper-Resolution': targetResolution,
        'X-Wallpaper-Date': today,
        'X-Wallpaper-Size': wallpaperData.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('壁纸服务错误:', error);

    return new Response(
      JSON.stringify({
        error: '壁纸服务内部错误',
        message: error.message || String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});