import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
}

export const usePerformanceOptimization = () => {
  const startTimeRef = useRef<number>(Date.now());
  const renderTimeRef = useRef<number>(0);

  useEffect(() => {
    // 记录首次渲染完成时间
    renderTimeRef.current = Date.now();
    
    // 性能监控
    const measurePerformance = () => {
      const metrics: PerformanceMetrics = {
        loadTime: renderTimeRef.current - startTimeRef.current,
        renderTime: performance.now(),
        interactionTime: 0
      };

      // 只在开发环境输出性能信息
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 性能指标:', {
          '首屏加载时间': `${metrics.loadTime}ms`,
          '渲染时间': `${metrics.renderTime.toFixed(2)}ms`,
          '总页面大小': `${(performance.getEntriesByType('navigation')[0] as any)?.transferSize || 0} bytes`
        });
      }

      // 优化建议
      if (metrics.loadTime > 3000) {
        console.warn('⚠️ 首屏加载时间过长，建议优化');
      }
    };

    // 延迟测量性能，确保所有资源加载完成
    const timer = setTimeout(measurePerformance, 500);

    return () => clearTimeout(timer);
  }, []);

  // 返回优化建议
  return {
    // 懒加载组件的函数
    lazyLoad: (importFn: () => Promise<any>) => {
      return import('react').then(({ lazy }) => lazy(importFn));
    },
    
    // 预加载关键资源（使用高优先级预加载）
    preloadImage: (src: string) => {
      // 使用Image对象预加载，提供更好的缓存控制
      const img = new Image();
      img.loading = 'eager'; // 高优先级加载
      img.decoding = 'async'; // 异步解码避免阻塞
      img.src = src;
      
      // 对于关键图片，同时使用link preload
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    },
    
    // 优化scroll性能
    optimizeScroll: () => {
      let ticking = false;
      
      return (callback: () => void) => {
        if (!ticking) {
          requestAnimationFrame(() => {
            callback();
            ticking = false;
          });
          ticking = true;
        }
      };
    }
  };
};
