// 智能日志管理器 - 生产环境自动禁用调试日志
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: number;
  category?: string;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  // 日志级别优先级
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  // 生产环境最低日志级别
  private productionMinLevel: LogLevel = 'warn';

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // 开发环境记录所有日志
    }

    // 生产环境只记录警告和错误
    return this.levelPriority[level] >= this.levelPriority[this.productionMinLevel];
  }

  private formatMessage(level: LogLevel, message: string, category?: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const categoryStr = category ? `[${category}]` : '';
    const emoji = this.getEmoji(level);

    return `${emoji} ${timestamp} ${categoryStr} ${message}`;
  }

  private getEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🔧',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return emojis[level];
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);

    // 限制历史记录大小
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }
  }

  private log(level: LogLevel, message: string, data?: any, category?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: Date.now(),
      category,
    };

    // 添加到历史记录（始终记录，用于调试）
    this.addToHistory(entry);

    // 检查是否应该输出到控制台
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, category);

    // 输出到控制台
    switch (level) {
      case 'debug':
        console.log(formattedMessage, data || '');
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
    }
  }

  // 公共日志方法
  debug(message: string, data?: any, category?: string): void {
    this.log('debug', message, data, category);
  }

  info(message: string, data?: any, category?: string): void {
    this.log('info', message, data, category);
  }

  warn(message: string, data?: any, category?: string): void {
    this.log('warn', message, data, category);
  }

  error(message: string, data?: any, category?: string): void {
    this.log('error', message, data, category);
  }

  // 特定类别的日志方法
  wallpaper = {
    debug: (message: string, data?: any) => this.debug(message, data, 'Wallpaper'),
    info: (message: string, data?: any) => this.info(message, data, 'Wallpaper'),
    warn: (message: string, data?: any) => this.warn(message, data, 'Wallpaper'),
    error: (message: string, data?: any) => this.error(message, data, 'Wallpaper'),
  };

  favicon = {
    debug: (message: string, data?: any) => this.debug(message, data, 'Favicon'),
    info: (message: string, data?: any) => this.info(message, data, 'Favicon'),
    warn: (message: string, data?: any) => this.warn(message, data, 'Favicon'),
    error: (message: string, data?: any) => this.error(message, data, 'Favicon'),
  };

  sync = {
    debug: (message: string, data?: any) => this.debug(message, data, 'Sync'),
    info: (message: string, data?: any) => this.info(message, data, 'Sync'),
    warn: (message: string, data?: any) => this.warn(message, data, 'Sync'),
    error: (message: string, data?: any) => this.error(message, data, 'Sync'),
  };

  cache = {
    debug: (message: string, data?: any) => this.debug(message, data, 'Cache'),
    info: (message: string, data?: any) => this.info(message, data, 'Cache'),
    warn: (message: string, data?: any) => this.warn(message, data, 'Cache'),
    error: (message: string, data?: any) => this.error(message, data, 'Cache'),
  };

  // 获取日志历史（用于调试）
  getHistory(level?: LogLevel, category?: string): LogEntry[] {
    let filtered = this.logHistory;

    if (level) {
      filtered = filtered.filter((entry) => entry.level === level);
    }

    if (category) {
      filtered = filtered.filter((entry) => entry.category === category);
    }

    return filtered.slice().reverse(); // 最新的在前面
  }

  // 清空日志历史
  clearHistory(): void {
    this.logHistory = [];
  }

  // 导出日志（用于调试）
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  // 获取统计信息
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<string, number>;
  } {
    const stats = {
      total: this.logHistory.length,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 } as Record<LogLevel, number>,
      byCategory: {} as Record<string, number>,
    };

    this.logHistory.forEach((entry) => {
      stats.byLevel[entry.level]++;

      if (entry.category) {
        stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
      }
    });

    return stats;
  }
}

// 导出单例实例
export const logger = Logger.getInstance();

// 开发环境下暴露到全局对象，方便调试
// 开发环境下暴露到全局对象，方便调试
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).logger = logger;
  logger.debug('日志管理器已初始化', { isDevelopment: import.meta.env.DEV });
  logger.debug('开发模式：可使用 window.logger 访问日志功能');
}
