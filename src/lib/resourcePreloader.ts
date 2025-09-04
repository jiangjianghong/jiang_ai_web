/**
 * 资源预加载管理器
 * 用于预加载关键资源，减少网络请求
 */

class ResourcePreloader {
  private preloadedResources = new Set<string>();
  private preloadQueue: string[] = [];
  private isProcessing = false;
  private maxConcurrent = 6; // 最大并发预加载数量（提升并发度）

  /**
   * 预加载图片资源
   */
  async preloadImage(url: string): Promise<boolean> {
    if (this.preloadedResources.has(url)) {
      return true; // 已经预加载过
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(url);
        resolve(true);
      };
      img.onerror = () => {
        resolve(false);
      };
      img.src = url;
    });
  }

  /**
   * 批量预加载图片
   */
  async preloadImages(urls: string[]): Promise<void> {
    const unloadedUrls = urls.filter((url) => !this.preloadedResources.has(url));

    if (unloadedUrls.length === 0) return;

    // 分批处理，避免同时发起太多请求
    for (let i = 0; i < unloadedUrls.length; i += this.maxConcurrent) {
      const batch = unloadedUrls.slice(i, i + this.maxConcurrent);
      await Promise.allSettled(batch.map((url) => this.preloadImage(url)));
    }
  }

  /**
   * 添加到预加载队列
   */
  queuePreload(url: string): void {
    if (!this.preloadedResources.has(url) && !this.preloadQueue.includes(url)) {
      this.preloadQueue.push(url);
      this.processQueue();
    }
  }

  /**
   * 处理预加载队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // 使用 requestIdleCallback 在浏览器空闲时预加载
      if ('requestIdleCallback' in window) {
        await new Promise<void>((resolve) => {
          requestIdleCallback(
            () => {
              this.processBatch();
              resolve();
            },
            { timeout: 100 }
          ); // 添加超时确保及时执行
        });
      } else {
        // 降级方案：使用 setTimeout
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            this.processBatch();
            resolve();
          }, 8); // 减少延迟，约0.5帧
        });
      }
    } finally {
      this.isProcessing = false;

      // 如果还有待处理的资源，继续处理
      if (this.preloadQueue.length > 0) {
        setTimeout(() => this.processQueue(), 50); // 减少处理间隔
      }
    }
  }

  /**
   * 处理一批预加载
   */
  private async processBatch(): Promise<void> {
    const batch = this.preloadQueue.splice(0, this.maxConcurrent);
    if (batch.length === 0) return;

    await Promise.allSettled(batch.map((url) => this.preloadImage(url)));
  }

  /**
   * 预加载字体文件
   */
  preloadFont(fontUrl: string, fontFamily: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = fontUrl;
    document.head.appendChild(link);

    // 创建字体加载器
    if ('FontFace' in window) {
      const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
      fontFace
        .load()
        .then(() => {
          document.fonts.add(fontFace);
        })
        .catch(() => {
          // 字体预加载失败不是关键错误，保持静默
        });
    }
  }

  /**
   * 预加载关键 CSS
   */
  preloadCSS(cssUrl: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = cssUrl;
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  }

  /**
   * 获取预加载统计
   */
  getStats(): { preloaded: number; queued: number } {
    return {
      preloaded: this.preloadedResources.size,
      queued: this.preloadQueue.length,
    };
  }

  /**
   * 清理预加载缓存
   */
  clear(): void {
    this.preloadedResources.clear();
    this.preloadQueue.length = 0;
  }
}

// 导出单例实例
export const resourcePreloader = new ResourcePreloader();
