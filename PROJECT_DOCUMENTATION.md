# 江AI网站导航 - 项目技术文档

## 1. 项目概述

江AI网站导航是一个现代化的个人网站导航应用，旨在提供一个简洁、高效、美观的网站收藏和管理平台。本项目采用 React + TypeScript + Vite 技术栈构建，集成了多项现代 Web 技术，包括云端同步、智能缓存、响应式设计等。

### 1.1 核心功能

- 网站卡片管理：添加、编辑、删除、排序网站卡片
- 智能搜索：实时搜索网站名称、URL和标签
- 云端同步：基于 Supabase 的数据同步系统
- 动态壁纸：自动更换高质量背景壁纸
- 响应式设计：适配桌面端和移动端
- 性能优化：多层缓存策略和资源预加载

### 1.2 技术栈

- **前端框架**：React 18, TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS
- **状态管理**：React Context API
- **后端服务**：Supabase (Auth, Database, Storage, Edge Functions)
- **部署平台**：GitHub Pages, Vercel

## 2. 系统架构

### 2.1 整体架构

项目采用前端为主、后端轻量化的架构设计，主要分为以下几个部分：

1. **前端应用层**：React 组件和页面
2. **业务逻辑层**：自定义 Hooks 和工具函数
3. **数据持久层**：本地存储和云端同步
4. **基础设施层**：缓存系统、代理服务、性能优化

### 2.2 数据流

```
用户操作 → React 组件 → 自定义 Hooks → 数据管理器 → 本地存储/云端同步
```

### 2.3 模块划分

- **UI 组件**：负责界面渲染和用户交互
- **业务逻辑**：处理数据操作和业务规则
- **数据管理**：负责数据的存储、检索和同步
- **基础设施**：提供缓存、代理、性能优化等基础服务

## 3. 核心模块实现

### 3.1 数据管理系统

#### 3.1.1 本地存储

项目使用多层存储策略，根据数据特性选择不同的存储方式：

- **localStorage**：存储用户设置和网站数据
- **IndexedDB**：存储大容量数据，如壁纸和图标缓存
- **内存缓存**：存储临时数据，提高访问速度

核心实现在 `useLocalStorage.ts` 和 `indexedDBCache.ts` 中：

```typescript
// useLocalStorage.ts 核心实现
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

#### 3.1.2 智能云端同步

使用 Supabase 实现数据的云端存储和同步，主要功能包括：

- 用户认证和授权
- 数据的增删改查
- 数据有效性验证（v1.2.0 新增）
- 冲突检测和解决
- 离线支持和自动重试
- 空数据保护机制（v1.2.0 新增）

核心实现在 `supabaseSync.ts` 中：

```typescript
// 数据验证函数（v1.2.0 新增）
function validateWebsiteData(websites: WebsiteData[]): WebsiteData[] {
  return websites.filter(website => 
    website && 
    typeof website === 'object' &&
    website.id && 
    website.name && 
    website.url &&
    typeof website.id === 'string' &&
    typeof website.name === 'string' &&
    typeof website.url === 'string'
  );
}

// 保存用户网站数据到 Supabase（已增强数据验证）
export async function saveUserWebsites(
  userId: string,
  websites: WebsiteData[],
  callback?: SyncStatusCallback
): Promise<boolean> {
  if (!userId) return false;
  
  try {
    callback?.({status: 'syncing', message: '正在同步网站数据...'});
    
    // v1.2.0: 数据验证，防止空数据覆盖云端
    const validWebsites = validateWebsiteData(websites);
    if (validWebsites.length === 0) {
      console.warn('没有有效的网站数据，跳过同步');
      callback?.({status: 'warning', message: '没有有效数据需要同步'});
      return false;
    }
    
    // 使用 upsert 操作保存数据
    const { error } = await supabase
      .from('user_websites')
      .upsert({
        user_id: userId,
        websites: validWebsites,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      
    if (error) throw error;
    
    callback?.({status: 'success', message: `成功同步 ${validWebsites.length} 个网站`});
    return true;
  } catch (error) {
    console.error('保存网站数据失败:', error);
    callback?.({status: 'error', message: '网站数据同步失败'});
    return false;
  }
}
```

### 3.2 缓存系统

#### 3.2.1 内存缓存

实现了一个轻量级的内存缓存系统，支持 TTL（生存时间）和自动清理：

```typescript
// cacheManager.ts 核心实现
export class CacheManager {
  private cache: Map<string, CacheItem> = new Map();
  private maxSize: number;
  private cleanupInterval: number;
  private intervalId: number | null = null;

  constructor(maxSize = 100, cleanupInterval = 60000) {
    this.maxSize = maxSize;
    this.cleanupInterval = cleanupInterval;
    this.startCleanupTimer();
  }

  set(key: string, value: any, ttl = 3600000): void {
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      value,
      expiry: ttl > 0 ? Date.now() + ttl : 0
    });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    
    if (!item) return null;
    if (item.expiry > 0 && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry > 0 && item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  private startCleanupTimer(): void {
    this.intervalId = window.setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }
}
```

#### 3.2.2 壁纸缓存

使用 IndexedDB 实现壁纸的持久化缓存，支持大文件存储和二进制数据：

```typescript
// 缓存壁纸到 IndexedDB
export async function cacheWallpaper(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB('wallpaper-cache', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('wallpapers')) {
          db.createObjectStore('wallpapers');
        }
      },
    });
    
    const cacheKey = generateCacheKey(url);
    const tx = db.transaction('wallpapers', 'readwrite');
    await tx.store.put(blob, cacheKey);
    await tx.done;
    
    console.log(`Wallpaper cached: ${cacheKey}`);
  } catch (error) {
    console.error('Failed to cache wallpaper:', error);
  }
}
```

### 3.3 CORS 代理系统

#### 3.3.1 智能代理管理

实现了一个智能代理管理系统，可以自动选择最快的可用代理：

```typescript
// smartProxy.ts 核心实现
export class SmartProxyManager {
  private proxies: ProxyConfig[] = [];
  private lastCheckTime: number = 0;
  private checkInterval: number = 3600000; // 1小时检查一次

  constructor() {
    this.initProxies();
  }

  private initProxies() {
    this.proxies = [
      {
        name: 'allorigins',
        url: 'https://api.allorigins.win/raw?url=',
        priority: 1,
        available: true,
        speed: 0,
        lastCheck: 0
      },
      {
        name: 'corsproxy',
        url: 'https://corsproxy.io/?',
        priority: 2,
        available: true,
        speed: 0,
        lastCheck: 0
      },
      // 其他代理配置...
    ];
  }

  async getBestProxy(): Promise<ProxyConfig | null> {
    // 如果距离上次检查超过检查间隔，重新检查所有代理
    if (Date.now() - this.lastCheckTime > this.checkInterval) {
      await this.checkAllProxies();
    }
    
    // 按照可用性、速度和优先级排序
    const availableProxies = this.proxies
      .filter(p => p.available)
      .sort((a, b) => {
        if (a.speed !== b.speed) return a.speed - b.speed;
        return a.priority - b.priority;
      });
      
    return availableProxies.length > 0 ? availableProxies[0] : null;
  }

  async makeRequest(url: string): Promise<Response> {
    const proxy = await this.getBestProxy();
    if (!proxy) throw new Error('No available proxy');
    
    const proxyUrl = this.buildProxyUrl(proxy, url);
    return fetch(proxyUrl);
  }
}
```

### 3.4 性能优化

#### 3.4.1 资源预加载

实现了智能资源预加载，提前加载用户可能需要的资源：

```typescript
// useResourcePreloader.ts 核心实现
export function useResourcePreloader(resources: ResourceConfig[]) {
  useEffect(() => {
    const preloadResources = async () => {
      for (const resource of resources) {
        try {
          if (resource.type === 'image') {
            const img = new Image();
            img.src = resource.url;
          } else if (resource.type === 'script') {
            const script = document.createElement('link');
            script.rel = 'preload';
            script.as = 'script';
            script.href = resource.url;
            document.head.appendChild(script);
          } else if (resource.type === 'style') {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = resource.url;
            document.head.appendChild(link);
          } else if (resource.type === 'font') {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.href = resource.url;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
          }
        } catch (error) {
          console.error(`Failed to preload resource: ${resource.url}`, error);
        }
      }
    };

    // 使用 requestIdleCallback 在浏览器空闲时预加载资源
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        preloadResources();
      });
    } else {
      // 降级处理
      setTimeout(preloadResources, 1000);
    }
  }, [resources]);
}
```

#### 3.4.2 渲染优化

使用 React 的性能优化技术，如 memo、useMemo 和 useCallback：

```typescript
// 使用 memo 优化组件渲染
const WebsiteCard = memo(({ website, onEdit, onDelete }: WebsiteCardProps) => {
  // 使用 useCallback 优化事件处理函数
  const handleEdit = useCallback(() => {
    onEdit(website);
  }, [website, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(website.id);
  }, [website.id, onDelete]);

  // 使用 useMemo 优化计算属性
  const formattedDate = useMemo(() => {
    return website.lastVisit ? new Date(website.lastVisit).toLocaleDateString() : '从未访问';
  }, [website.lastVisit]);

  return (
    <div className="website-card">
      {/* 组件内容 */}
    </div>
  );
});
```

## 4. 关键功能实现

### 4.1 拖拽排序

使用 React DnD 实现网站卡片的拖拽排序功能：

```typescript
// useDragAndDrop.ts 核心实现
export function useDragAndDrop(items, setItems) {
  const moveItem = useCallback(
    (dragIndex, hoverIndex) => {
      const dragItem = items[dragIndex];
      const newItems = [...items];
      newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, dragItem);
      setItems(newItems);
    },
    [items, setItems]
  );

  return { moveItem };
}

// 拖拽项组件
const DraggableItem = ({ id, index, moveItem, children }) => {
  const ref = useRef(null);
  
  const [{ handlerId }, drop] = useDrop({
    accept: 'ITEM',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      
      // 计算鼠标位置和项目大小
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // 只在鼠标越过一半时执行移动
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} data-handler-id={handlerId}>
      {children}
    </div>
  );
};
```

### 4.2 响应式布局

使用自定义 Hook 实现响应式布局：

```typescript
// useResponsiveLayout.ts 核心实现
export function useResponsiveLayout() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 根据窗口大小计算布局类
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  // 返回各组件的类名
  return {
    containerClass: isMobile ? 'container-mobile' : isTablet ? 'container-tablet' : 'container-desktop',
    searchBarClass: isMobile ? 'search-mobile' : 'search-desktop',
    cardContainerClass: isMobile ? 'cards-mobile' : isTablet ? 'cards-tablet' : 'cards-desktop',
    gridClass: isMobile ? 'grid-1-col' : isTablet ? 'grid-2-cols' : 'grid-3-cols',
    isMobile,
    isTablet,
    isDesktop,
  };
}
```

### 4.3 壁纸加载

实现了智能壁纸加载和缓存系统：

```typescript
// 壁纸加载函数
async function loadWallpaper() {
  setWallpaperLoading(true);
  
  try {
    // 尝试从缓存加载
    const cachedWallpaper = await getCachedWallpaper(wallpaperUrl);
    if (cachedWallpaper) {
      setWallpaperSrc(URL.createObjectURL(cachedWallpaper));
      setWallpaperLoading(false);
      return;
    }
    
    // 如果缓存中没有，从网络加载
    const response = await fetch(wallpaperUrl);
    if (!response.ok) throw new Error('Failed to load wallpaper');
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    // 缓存壁纸
    await cacheWallpaper(wallpaperUrl, blob);
    
    setWallpaperSrc(objectUrl);
  } catch (error) {
    console.error('Error loading wallpaper:', error);
    // 加载失败时使用默认壁纸
    setWallpaperSrc(defaultWallpaper);
  } finally {
    setWallpaperLoading(false);
  }
}
```

## 5. 部署与运维

### 5.1 构建配置

使用 Vite 进行项目构建，配置了代码分割、资源优化和缓存策略：

```typescript
// vite.config.ts 核心配置
export default defineConfig({
  base: '/jiang_ai_web/',
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', 'react-tilt'],
        },
      },
    },
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'development',
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 8080,
  },
});
```

### 5.2 GitHub Pages 部署

使用 GitHub Actions 自动化部署流程：

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

## 6. 安全与隐私

### 6.1 数据安全

#### 6.1.1 Supabase RLS 策略

使用 Supabase 的行级安全策略保护用户数据：

```sql
-- 用户设置表的 RLS 策略
CREATE POLICY "用户只能访问自己的设置" ON user_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- 用户网站表的 RLS 策略
CREATE POLICY "用户只能访问自己的网站数据" ON user_websites
  FOR ALL
  USING (auth.uid() = user_id);
```

#### 6.1.2 数据验证

在前端和后端都实现了严格的数据验证：

```typescript
// 数据验证函数
function validateWebsiteData(website: WebsiteData): boolean {
  if (!website) return false;
  if (!website.id || typeof website.id !== 'string') return false;
  if (!website.name || typeof website.name !== 'string') return false;
  if (!website.url || typeof website.url !== 'string') return false;
  
  // URL 格式验证
  try {
    new URL(website.url);
  } catch (e) {
    return false;
  }
  
  // 其他字段验证...
  
  return true;
}
```

### 6.2 隐私保护

#### 6.2.1 Cookie 同意

实现了符合 GDPR 的 Cookie 同意机制：

```typescript
// CookieConsent.tsx 核心实现
export function CookieConsent() {
  const [cookieConsent, setCookieConsent] = useLocalStorage('cookie-consent', false);
  const [showBanner, setShowBanner] = useState(!cookieConsent);

  const acceptCookies = () => {
    setCookieConsent(true);
    setShowBanner(false);
  };

  const declineCookies = () => {
    // 设置最小必要的 Cookie
    setCookieConsent(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-consent-banner">
      <p>
        我们使用 Cookie 来提升您的浏览体验。继续使用本网站即表示您同意我们的
        <a href="/privacy-policy">隐私政策</a>。
      </p>
      <div className="cookie-buttons">
        <button onClick={acceptCookies}>接受所有 Cookie</button>
        <button onClick={declineCookies}>仅接受必要 Cookie</button>
      </div>
    </div>
  );
}
```

## 7. 性能指标

### 7.1 关键性能指标

- **首次内容绘制 (FCP)**: < 1.5s
- **最大内容绘制 (LCP)**: < 2.5s
- **首次输入延迟 (FID)**: < 100ms
- **累积布局偏移 (CLS)**: < 0.1

### 7.2 性能监控

使用 Web Vitals 库监控性能指标：

```typescript
// performanceMonitor.ts 核心实现
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

export function initPerformanceMonitoring() {
  // 监控 Core Web Vitals
  getCLS(metric => sendToAnalytics('CLS', metric));
  getFID(metric => sendToAnalytics('FID', metric));
  getLCP(metric => sendToAnalytics('LCP', metric));
  getFCP(metric => sendToAnalytics('FCP', metric));
  getTTFB(metric => sendToAnalytics('TTFB', metric));
}

function sendToAnalytics(metricName, metric) {
  // 发送性能指标到分析服务
  console.log(`${metricName}: ${metric.value}`);
  
  // 实际项目中可以发送到 Google Analytics 或自定义分析服务
  // analytics.send({
  //   name: metricName,
  //   value: metric.value,
  //   id: metric.id,
  // });
}
```

## 8. 未来规划

### 8.1 功能扩展

- **多语言支持**: 添加国际化支持，支持多种语言
- **主题定制**: 允许用户自定义主题和样式
- **数据分析**: 添加访问统计和数据分析功能
- **浏览器扩展**: 开发浏览器扩展版本

### 8.2 技术优化

- **迁移到 React Server Components**: 提升首屏加载性能
- **采用 Suspense 和 Concurrent Mode**: 优化用户体验
- **引入 WebAssembly**: 提升计算密集型任务性能
- **实现 PWA 离线工作模式**: 增强离线使用体验

## 9. 附录

### 9.1 API 文档

#### 9.1.1 Supabase API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/auth/v1/token` | POST | 用户登录和令牌刷新 |
| `/rest/v1/user_settings` | GET/POST | 用户设置管理 |
| `/rest/v1/user_websites` | GET/POST | 用户网站数据管理 |
| `/storage/v1/object` | GET/POST/DELETE | 存储对象管理 |

#### 9.1.2 自定义 Edge Functions

| 函数名 | 描述 |
|--------|------|
| `cors-proxy` | 通用 CORS 代理服务 |
| `favicon-service` | 网站图标获取服务 |
| `wallpaper-service` | 壁纸获取和处理服务 |

### 9.2 数据模型

#### 9.2.1 用户设置

```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  cardTransparency: number; // 0-100
  searchBarTransparency: number; // 0-100
  enableParallax: boolean;
  enableAnimations: boolean;
  wallpaperType: 'daily' | 'static' | 'custom';
  customWallpaperUrl?: string;
  gridColumns: number;
  showVisitCount: boolean;
  showLastVisit: boolean;
}
```

#### 9.2.2 网站数据

```typescript
interface WebsiteData {
  id: string;
  name: string;
  url: string;
  icon?: string;
  tags?: string[];
  notes?: string;
  visitCount: number;
  lastVisit?: string; // ISO 日期字符串
  position: number;
  workspace?: string;
  createdAt: string; // ISO 日期字符串
  updatedAt: string; // ISO 日期字符串
}
```

### 9.3 错误处理

#### 9.3.1 错误类型

```typescript
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error',
  UNKNOWN_ERROR = 'unknown_error',
}

interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  timestamp: number;
}
```

#### 9.3.2 错误处理策略

```typescript
// 全局错误处理函数
function handleError(error: any): AppError {
  // 网络错误
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: '网络连接失败，请检查您的网络连接',
      originalError: error,
      timestamp: Date.now(),
    };
  }
  
  // 认证错误
  if (error.status === 401 || error.code === 'auth/unauthorized') {
    return {
      type: ErrorType.AUTH_ERROR,
      message: '认证失败，请重新登录',
      originalError: error,
      timestamp: Date.now(),
    };
  }
  
  // 服务器错误
  if (error.status >= 500) {
    return {
      type: ErrorType.SERVER_ERROR,
      message: '服务器错误，请稍后再试',
      originalError: error,
      timestamp: Date.now(),
    };
  }
  
  // 未知错误
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: '发生未知错误',
    originalError: error,
    timestamp: Date.now(),
  };
}
```

## 10. 版本更新记录

### v1.2.1 (2024-12-19) - 系统稳定性全面提升

#### 🔧 关键问题修复

**P0 优先级问题修复**
1. **数据验证逻辑统一** (`useWebsiteData.ts`)
   - 实现严格的 `validateWebsiteData` 函数
   - 统一 `loadFromCache` 和 `importData` 的验证逻辑
   - 添加URL格式验证，确保数据完整性

2. **StorageManager 竞态条件解决** (`storageManager.ts`)
   - 实现状态缓存机制，避免频繁localStorage访问
   - 添加 `consentCache` 和缓存时间控制
   - 优化 `hasConsent` 和 `getConsentStatus` 方法性能

3. **设置管理原子操作** (`useSettingsManager.ts`)
   - 重构 `importSettings` 函数，实现原子操作
   - 添加回滚机制，确保操作失败时数据一致性
   - 防止设置导入过程中的数据损坏

**P1 优先级问题修复**
4. **缓存容量控制** (`cacheManager.ts`)
   - 实现完整的容量限制：100项缓存，50MB内存
   - 添加LRU淘汰策略和自动清理机制
   - 为壁纸缓存添加100MB存储限制

5. **异步错误处理增强** (`ErrorBoundary.tsx`)
   - 添加全局 `unhandledrejection` 和 `error` 事件监听
   - 将异步错误转换为同步错误统一处理
   - 确保组件卸载时的事件监听器清理

6. **云数据加载优化** (`useCloudData.ts`)
   - 使用 `useRef` 防止重复加载和无限循环
   - 优化useEffect依赖，稳定函数引用
   - 添加加载状态跟踪和用户ID变化检测

7. **内存泄漏防护** (`useWebsiteData.ts`)
   - 修复useEffect依赖问题，确保定时器正确清理
   - 优化缓存一致性检查的依赖管理

#### 🛡️ 系统稳定性提升

**数据安全保障**
- 多层数据验证机制
- 原子操作确保数据一致性
- 防止无效数据污染系统

**性能优化**
- 缓存容量智能管理
- 内存使用效率提升
- 减少不必要的重复操作

**错误处理完善**
- 全面的异步错误捕获
- 统一的错误处理策略
- 友好的用户体验保障

### v1.2.0 (2024-12-19) - 数据同步安全性增强

#### 🔧 核心修复

**数据同步安全性问题修复**
- **问题描述**: 自动同步功能可能导致空数据覆盖云端真实数据
- **修复方案**: 在 `App.tsx` 和 `useAutoSync.ts` 中增加数据验证机制
- **技术实现**:
  ```typescript
  // 数据验证函数
  const validWebsites = websites.filter(website => 
    website && 
    typeof website === 'object' &&
    website.id && 
    website.name && 
    website.url &&
    typeof website.id === 'string' &&
    typeof website.name === 'string' &&
    typeof website.url === 'string'
  );
  
  // 只有存在有效数据时才执行同步
  if (validWebsites.length > 0) {
    await autoSync(validWebsites);
  }
  ```

**智能上传逻辑优化**
- **App.tsx 修改**: 在本地数据上传前增加有效性检查
- **useAutoSync.ts 修改**: 在自动同步前验证数据完整性
- **防护机制**: 防止空数组或无效数据污染云端存储

#### ✨ 功能改进

**同步状态反馈优化**
- 增加更详细的同步状态提示
- 区分不同类型的同步结果（成功、警告、错误）
- 提供同步数据数量的具体反馈

**错误处理增强**
- 改进错误捕获和处理机制
- 增加更友好的错误提示信息
- 优化网络异常情况下的用户体验

#### 🛡️ 安全性提升

**多层数据保护**
1. **输入验证**: 在数据进入系统前进行严格验证
2. **同步验证**: 在数据同步前再次验证有效性
3. **云端保护**: 防止无效数据覆盖云端真实数据

**数据完整性保障**
- 确保必要字段的存在性检查
- 验证数据类型的正确性
- 过滤掉损坏或不完整的数据记录

#### 📊 性能优化

**代码重构**
- 优化数据处理逻辑，减少不必要的计算
- 改进内存使用效率
- 提升同步操作的响应速度

**缓存策略优化**
- 改进本地缓存的数据验证
- 优化缓存失效和更新机制

### v1.1.0 (2024-12-15) - 初始版本

#### 🚀 核心功能
- 网站卡片管理系统
- 基于 Supabase 的云端同步
- 响应式设计和动态壁纸
- 拖拽排序和智能搜索
- PWA 支持和离线功能

#### 🏗️ 技术架构
- React 18 + TypeScript + Vite
- Tailwind CSS 样式系统
- 多层缓存架构
- CORS 代理解决方案
- 性能监控和优化

---

**文档维护**: 本文档由项目开发团队编写和维护  
**最后更新**: 2024年12月19日  
**版本**: v1.2.1