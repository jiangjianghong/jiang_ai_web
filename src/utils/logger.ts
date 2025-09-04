// 生产环境日志管理器
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    // 错误信息在生产环境也保留，但可以发送到错误监控服务
    console.error(...args);
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

// 性能监控工具
export const perf = {
  mark: (name: string) => {
    if (isDevelopment && performance.mark) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    if (isDevelopment && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        logger.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        logger.warn('Performance measurement failed:', error);
      }
    }
  },
};
