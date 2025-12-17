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

// 注意：以前的 BING_SOURCES 和 getBingImageId/getTodayId 已移除
// 因为直接构造的 Bing 图片 URL 无效（ID 格式不对）
// 实际使用的是 HPImageArchive API 返回的真实 URL

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
      signal: AbortSignal.timeout(45000), // 45秒超时
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

      // 如果请求的是4K，优先尝试 UHD，失败后依次尝试 3840x2160, 1920x1200, 1920x1080
      // 这样确保即使4K不可用，也能获取到当天的Bing壁纸（只是分辨率低一些）
      if (targetResolution === '3840x2160') {
        resolutionCandidates = ['UHD', '3840x2160', '1920x1200', '1920x1080'];
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


    // 如果 Bing 壁纸获取失败，直接返回错误
    // 让客户端决定如何处理（使用本地缓存或显示默认图片）
    if (!wallpaperData) {
      console.log('Bing壁纸获取失败，返回错误');
      return new Response(
        JSON.stringify({
          error: '无法获取今日Bing壁纸',
          resolution: targetResolution,
          date: today,
          message: '服务端无法从Bing获取壁纸，请稍后重试'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }


    // 缓存壁纸到Storage（使用 upsert 模式确保覆盖旧文件）
    if (supabaseUrl && supabaseKey) {
      try {
        // 使用 x-upsert: true 头部确保覆盖已存在的文件
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/wallpapers/${cacheKey}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true',  // 关键：确保覆盖已存在的文件
          },
          body: wallpaperData,
        });

        if (uploadResponse.ok) {
          console.log(`成功缓存壁纸: ${cacheKey}`);
        } else {
          const errorText = await uploadResponse.text();
          console.log(`缓存壁纸响应异常: ${uploadResponse.status} - ${errorText}`);
        }
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