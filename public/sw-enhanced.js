// 增强版离线Service Worker - 完全离线支持
const CACHE_VERSION = 'v5';
const CACHE_PREFIX = 'jiang-ai-web';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-${CACHE_VERSION}`;

// 需要预缓存的核心资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon/favicon.png',
  // Vite生成的资源会在运行时动态添加
];

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 静态资源：缓存优先，后台更新
  static: [
    /\.js$/,
    /\.css$/,
    /\.woff2?$/,
    /\.ttf$/,
    /\.eot$/,
  ],
  // 图片资源：缓存优先，永久缓存
  images: [
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.svg$/,
    /\.webp$/,
    /\.ico$/,
  ],
  // API请求：网络优先，失败回退缓存
  api: [
    /\/api\//,
    /supabase\.co\/rest/,
    /supabase\.co\/storage/,
  ],
  // 跳过缓存
  skip: [
    /\/auth\//,
    /\/realtime/,
    /google-analytics/,
    /googletagmanager/,
    /google\.com.*s2\/favicons/, // Google favicon API
  ],
};

// 判断请求类型
function getRequestType(url) {
  const urlStr = url.toString();
  
  // 检查是否应该跳过
  if (CACHE_STRATEGIES.skip.some(pattern => pattern.test(urlStr))) {
    return 'skip';
  }
  
  // 检查各种缓存类型
  if (CACHE_STRATEGIES.images.some(pattern => pattern.test(urlStr))) {
    return 'image';
  }
  
  if (CACHE_STRATEGIES.api.some(pattern => pattern.test(urlStr))) {
    return 'api';
  }
  
  if (CACHE_STRATEGIES.static.some(pattern => pattern.test(urlStr))) {
    return 'static';
  }
  
  // HTML文档
  if (urlStr.endsWith('.html') || urlStr.endsWith('/')) {
    return 'document';
  }
  
  return 'dynamic';
}

// 安装事件 - 预缓存核心资源
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching core assets');
        // 逐个缓存，容错处理
        return Promise.allSettled(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Pre-caching complete');
        // 立即激活
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith(CACHE_PREFIX) &&
                     !cacheName.includes(CACHE_VERSION);
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        // 立即控制所有客户端
        return self.clients.claim();
      })
  );
});

// 网络请求拦截
self.addEventListener('fetch', event => {
  const { request } = event;
  const requestType = getRequestType(request.url);
  
  // 跳过某些请求
  if (requestType === 'skip') {
    return;
  }
  
  // 根据请求类型使用不同策略
  switch (requestType) {
    case 'document':
      // HTML文档：网络优先，快速回退
      event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
      break;
      
    case 'static':
      // JS/CSS：缓存优先，后台更新
      event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
      break;
      
    case 'image':
      // 图片：缓存优先，长期缓存
      event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
      break;
      
    case 'api':
      // API：网络优先，5秒超时
      event.respondWith(networkFirstWithTimeout(request, API_CACHE, 5000));
      break;
      
    default:
      // 其他：缓存优先
      event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
  }
});

// 策略：缓存优先
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network request failed:', error);
    
    // 返回离线页面或默认响应
    if (request.destination === 'document') {
      const offlineResponse = await cache.match('/index.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // 返回空响应
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// 策略：网络优先
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 对于导航请求，返回index.html（SPA路由）
    if (request.mode === 'navigate') {
      const indexResponse = await cache.match('/index.html');
      if (indexResponse) {
        return indexResponse;
      }
    }
    
    throw error;
  }
}

// 策略：网络优先（带超时）
async function networkFirstWithTimeout(request, cacheName, timeout = 3000) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    );
    
    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// 策略：过期后重新验证
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.warn('[SW] Background update failed:', error);
      return cachedResponse;
    });
  
  return cachedResponse || fetchPromise;
}

// 监听消息事件（用于手动更新缓存）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then(cache => cache.addAll(event.data.urls))
    );
  }
});

// 后台同步（如果浏览器支持）
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // 同步本地数据到服务器
  console.log('[SW] Background sync triggered');
  // 实现数据同步逻辑
}