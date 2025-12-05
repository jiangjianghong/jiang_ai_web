// Wallpaper Service - Supabase Edge Function
// 获取Bing每日壁纸，避免外部服务被墙问题

console.log("Wallpaper Service started");

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// 支持的壁纸分辨率
const RESOLUTIONS = {
   uhd: 'UHD',    // 4K
  '1920x1080': '1920x1080', // 1080p
  '1366x768': '1366x768',   // 720p
  mobile: '1080x1920'     // 移动端
};

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
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 获取Bing图片ID
function getBingImageId(): string {
  // 使用当前日期生成一个合理的图片ID
  const today = new Date();
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
  } catch (error) {
    console.log('获取Bing元数据失败:', error.message);
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
  } catch (error) {
    console.log(`获取壁纸失败: ${imageUrl} - ${error.message}`);
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
    const targetResolution = RESOLUTIONS[resolution] || RESOLUTIONS['uhd'];

    console.log(`壁纸请求: ${resolution} (${targetResolution})`);

    // 生成缓存键 - 基于日期和分辨率
    const today = new Date().toISOString().split('T')[0];
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
      // 使用官方API获取的URL
      imageUrl = `https://www.bing.com${metadata.urlbase}_${targetResolution}.jpg`;
      wallpaperData = await fetchWallpaperImage(imageUrl);
    }

    // 如果官方API失败，尝试备用方法
    if (!wallpaperData) {
      const fallbackUrls = [
        `https://www.bing.com/th?id=OHR.${getTodayId()}_${targetResolution}.jpg`,
        `https://bing.com/az/hprichbg/rb/Dongdaemun_${targetResolution}_zh-CN.jpg`,
        `https://www.bing.com/az/hprichbg/rb/BingDaily_${targetResolution}.jpg`
      ];

      for (const fallbackUrl of fallbackUrls) {
        wallpaperData = await fetchWallpaperImage(fallbackUrl);
        if (wallpaperData) {
          imageUrl = fallbackUrl;
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
      } catch (error) {
        console.log('缓存壁纸失败:', error.message);
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

  } catch (error) {
    console.error('壁纸服务错误:', error);

    return new Response(
      JSON.stringify({
        error: '壁纸服务内部错误',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
