// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: { [key: string]: number } = {};

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 记录性能指标
  mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(name);
      this.metrics[name] = performance.now();
    }
  }

  // 测量两个标记之间的时间
  measure(name: string, startMark: string, endMark?: string): number {
    if (typeof window !== 'undefined' && window.performance) {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const entries = performance.getEntriesByName(name, 'measure');
      const lastEntry = entries[entries.length - 1];
      return lastEntry ? lastEntry.duration : 0;
    }
    return 0;
  }

  // 获取页面加载性能数据
  getPageLoadMetrics(): {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  } {
    if (typeof window === 'undefined' || !window.performance) {
      return {
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        firstContentfulPaint: 0
      };
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

    return {
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
      loadComplete: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      firstPaint: firstPaint ? firstPaint.startTime : 0,
      firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0
    };
  }

  // 记录组件渲染时间
  startComponentRender(componentName: string): void {
    this.mark(`${componentName}-render-start`);
  }

  endComponentRender(componentName: string): number {
    this.mark(`${componentName}-render-end`);
    return this.measure(
      `${componentName}-render-duration`,
      `${componentName}-render-start`,
      `${componentName}-render-end`
    );
  }

  // 获取资源加载性能
  getResourceMetrics(): Array<{
    name: string;
    size: number;
    duration: number;
    type: string;
  }> {
    if (typeof window === 'undefined' || !window.performance) {
      return [];
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources.map(resource => ({
      name: resource.name,
      size: resource.transferSize || 0,
      duration: resource.responseEnd - resource.requestStart,
      type: this.getResourceType(resource.name)
    }));
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'JavaScript';
    if (url.includes('.css')) return 'CSS';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/i)) return 'Image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'Font';
    return 'Other';
  }

  // 打印性能报告
  printReport(): void {
    if (typeof window === 'undefined') return;

    console.group('🚀 性能监控报告');
    
    const pageMetrics = this.getPageLoadMetrics();
    console.log('📊 页面加载指标:');
    console.table(pageMetrics);

    const resourceMetrics = this.getResourceMetrics();
    if (resourceMetrics.length > 0) {
      console.log('📦 资源加载指标:');
      console.table(resourceMetrics.slice(0, 10)); // 只显示前10个资源
    }

    console.log('⚡ 自定义指标:');
    console.table(this.metrics);

    console.groupEnd();
  }

  // 监控内存使用情况
  getMemoryUsage(): { used: number; total: number } | null {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) // MB
      };
    }
    return null;
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// 自动在页面加载完成后打印报告（仅开发环境）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.printReport();
      
      const memory = performanceMonitor.getMemoryUsage();
      if (memory) {
        console.log(`💾 内存使用: ${memory.used}MB / ${memory.total}MB`);
      }
    }, 1000);
  });
}
