// 离线优先的Service Worker for 炫酷收藏夹
const STATIC_CACHE_NAME = 'static-v4';
const DYNAMIC_CACHE_NAME = 'dynamic-v4';

// 动态获取正确的路径前缀
const getBasePath = () => {
  // 使用根路径部署，不需要前缀
  return '';
};

const basePath = getBasePath();
const STATIC_CACHE_URLS = [
  `${basePath}/`,
  `${basePath}/index.html`,
  `${basePath}/offline-test.html`,
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
];

// 不应该缓存的URL模式
const SKIP_CACHE_PATTERNS = [
  /googleapis\.com/,
  /firebase/,
  /google\.com.*s2\/favicons/,
  /identitytoolkit/
];

// 安装事件 - 缓存核心资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: 安装中...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 缓存核心资源');
        return cache.addAll(STATIC_CACHE_URLS);
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

// 拦截网络请求 - 离线优先策略
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 跳过不应该缓存的URL
  if (SKIP_CACHE_PATTERNS.some(pattern => pattern.test(event.request.url))) {
    return;
  }

  // 对于HTML文件，使用网络优先但快速失败的策略
  if (event.request.destination === 'document') {
    event.respondWith(
      Promise.race([
        fetch(event.request).catch(() => null),
        new Promise(resolve => setTimeout(() => resolve(null), 1000)) // 1秒超时
      ]).then(response => {
        if (response && response.status === 200) {
          // 网络请求成功，更新缓存
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        }
        
        // 网络失败或超时，回退到缓存
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('Service Worker: 使用缓存页面', event.request.url);
            return cachedResponse;
          }
          
          // 如果是根路径请求，返回首页
          if (url.pathname === basePath + '/' || url.pathname === '/') {
            return caches.match(basePath + '/index.html');
          }
          
          // 否则尝试返回离线页面
          return new Response(
            '<html><body><h1>离线模式</h1><p>网络不可用，请稍后重试。</p><a href="/">返回首页</a></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // 对于静态资源（JS、CSS、图片），使用缓存优先策略
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' || 
      event.request.destination === 'image' ||
      event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          console.log('Service Worker: 使用缓存资源', event.request.url);
          // 有缓存，返回缓存并后台更新
          fetch(event.request).then(response => {
            if (response && response.status === 200) {
              caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                cache.put(event.request, response.clone());
              });
            }
          }).catch(() => {
            // 忽略后台更新错误
          });
          return cachedResponse;
        }
        
        // 无缓存，尝试网络请求
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(error => {
          console.log('Service Worker: 资源请求失败', event.request.url, error);
          
          // 如果是图片请求失败，返回默认图标
          if (event.request.destination === 'image') {
            return caches.match(basePath + '/icon/icon.jpg');
          }
          
          throw error;
        });
      })
    );
    return;
  }
});
