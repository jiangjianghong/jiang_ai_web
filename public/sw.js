// 离线优先的Service Worker for 炫酷收藏夹
const CACHE_NAME = 'jiang-ai-web-v4-offline';
const STATIC_CACHE_NAME = 'static-v4';
const DYNAMIC_CACHE_NAME = 'dynamic-v4';

// 动态获取正确的路径前缀
const getBasePath = () => {
  const isGitHubPages = self.location.hostname.includes('github.io') || self.location.hostname.includes('jiangjiangjiang.top');
  return isGitHubPages ? '/jiang_ai_web' : '';
};

const basePath = getBasePath();
const STATIC_CACHE_URLS = [
  `${basePath}/`,
  `${basePath}/index.html`,
  `${basePath}/404.html`,
  // 预缓存关键资源
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-solid-900.woff2',
  `${basePath}/icon/icon.jpg` // 修复默认图标路径
];

// 高优先级缓存的资源类型
const HIGH_PRIORITY_CACHE = [
  'document',
  'script',
  'style'
];

// 不应该缓存的URL模式
const SKIP_CACHE_PATTERNS = [
  /googleapis\.com/,
  /firebase/,
  /google\.com.*s2\/favicons/,
  /identitytoolkit/,
  /supabase\.co.*auth/ // 避免缓存认证请求
];

// 安装事件 - 缓存核心资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: 安装中...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 缓存核心资源');
        // 逐个添加资源，避免某个资源失败导致整个缓存失败
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`缓存失败: ${url}`, error);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker: 核心资源缓存完成');
        self.skipWaiting(); // 强制激活新的Service Worker
      })
      .catch((error) => {
        console.error('Service Worker: 缓存失败', error);
      })
  );
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: 激活中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: 删除旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截网络请求 - 实现缓存优先策略
self.addEventListener('fetch', (event) => {
  // 只处理同源请求
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 对于HTML文件，使用网络优先策略确保内容最新
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 网络请求成功，更新缓存
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络失败，回退到缓存
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // 如果没有缓存，对于SPA路由返回index.html
            if (event.request.mode === 'navigate') {
              return caches.match(`${basePath}/index.html`);
            }
            // 其他情况返回404页面
            return caches.match(`${basePath}/404.html`);
          });
        })
    );
    return;
  }

  // 对于静态资源，使用缓存优先策略
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' || 
      event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // 有缓存，后台更新
            fetch(event.request).then((response) => {
              if (response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, response.clone());
                });
              }
            }).catch(() => {
              // 忽略网络错误
            });
            return cachedResponse;
          }
          
          // 无缓存，网络请求并缓存
          return fetch(event.request).then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // 其他请求直接走网络
  event.respondWith(fetch(event.request));
});
