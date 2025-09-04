// 错误处理和重试机制
import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface ErrorInfo {
  message: string;
  userMessage: string;
  category: string;
  recoverable: boolean;
  retryable: boolean;
}

class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // 默认重试配置
  private defaultRetryOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    shouldRetry: (error: Error, attempt: number) => {
      // 网络错误和超时错误可以重试
      const retryableErrors = [
        'NetworkError',
        'TimeoutError',
        'AbortError',
        'TypeError', // 通常是网络问题
      ];

      const isRetryable = retryableErrors.some(
        (type) => error.name.includes(type) || error.message.includes(type.toLowerCase())
      );

      // HTTP 5xx 错误也可以重试
      const isServerError =
        error.message.includes('HTTP 5') || error.message.includes('Internal Server Error');

      return (isRetryable || isServerError) && attempt < 3;
    },
  };

  // 带重试的异步函数执行
  async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
    context?: string
  ): Promise<T> {
    const config = { ...this.defaultRetryOptions, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await fn();

        if (attempt > 1) {
          logger.info(`重试成功`, { context, attempt, totalAttempts: config.maxAttempts });
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        logger.warn(`尝试 ${attempt}/${config.maxAttempts} 失败`, {
          context,
          error: lastError.message,
          attempt,
        });

        // 检查是否应该重试
        if (attempt === config.maxAttempts || !config.shouldRetry(lastError, attempt)) {
          break;
        }

        // 计算延迟时间（指数退避）
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );

        logger.debug(`等待 ${delay}ms 后重试`, { context, attempt, delay });
        await this.delay(delay);
      }
    }

    // 所有重试都失败了
    logger.error(`所有重试都失败`, {
      context,
      error: lastError!.message,
      totalAttempts: config.maxAttempts,
    });

    throw lastError!;
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 错误分类和用户友好消息
  categorizeError(error: Error, _context?: string): ErrorInfo {
    const message = error.message.toLowerCase();

    // 网络相关错误
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('cors') ||
      error.name === 'TypeError'
    ) {
      return {
        message: error.message,
        userMessage: '网络连接出现问题，请检查网络后重试',
        category: 'network',
        recoverable: true,
        retryable: true,
      };
    }

    // 超时错误
    if (message.includes('timeout') || message.includes('abort')) {
      return {
        message: error.message,
        userMessage: '请求超时，请稍后重试',
        category: 'timeout',
        recoverable: true,
        retryable: true,
      };
    }

    // HTTP 错误
    if (message.includes('http') && (message.includes('4') || message.includes('5'))) {
      const isClientError = message.includes('4');
      return {
        message: error.message,
        userMessage: isClientError
          ? '请求出现问题，请刷新页面重试'
          : '服务器暂时不可用，请稍后重试',
        category: isClientError ? 'client-error' : 'server-error',
        recoverable: !isClientError,
        retryable: !isClientError,
      };
    }

    // 缓存相关错误
    if (message.includes('indexeddb') || message.includes('cache') || message.includes('storage')) {
      return {
        message: error.message,
        userMessage: '本地存储出现问题，部分功能可能受影响',
        category: 'storage',
        recoverable: true,
        retryable: false,
      };
    }

    // 权限错误
    if (message.includes('permission') || message.includes('unauthorized')) {
      return {
        message: error.message,
        userMessage: '权限不足，请重新登录',
        category: 'permission',
        recoverable: true,
        retryable: false,
      };
    }

    // 未知错误
    return {
      message: error.message,
      userMessage: '出现未知错误，请刷新页面重试',
      category: 'unknown',
      recoverable: false,
      retryable: false,
    };
  }

  // 处理错误并返回用户友好的信息
  handleError(error: Error, context?: string): ErrorInfo {
    const errorInfo = this.categorizeError(error, context);

    logger.error(`错误处理`, {
      context,
      category: errorInfo.category,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      recoverable: errorInfo.recoverable,
      retryable: errorInfo.retryable,
    });

    return errorInfo;
  }

  // 创建带有重试功能的 fetch 包装器
  createRetryableFetch(options: RetryOptions = {}) {
    return async (url: string, init?: RequestInit): Promise<Response> => {
      return this.withRetry(
        async () => {
          const response = await fetch(url, init);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response;
        },
        options,
        `fetch ${url}`
      );
    };
  }

  // 壁纸专用的重试配置
  getWallpaperRetryOptions(): RetryOptions {
    return {
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 8000,
      shouldRetry: (error: Error, _attempt: number) => {
        // 壁纸加载失败时的重试策略
        const message = error.message.toLowerCase();

        // CORS 错误不重试（需要使用代理）
        if (message.includes('cors')) {
          return false;
        }

        // 网络错误和服务器错误可以重试
        return (
          (message.includes('network') ||
            message.includes('timeout') ||
            message.includes('http 5')) &&
          _attempt < 3
        );
      },
    };
  }

  // Favicon 专用的重试配置
  getFaviconRetryOptions(): RetryOptions {
    return {
      maxAttempts: 2, // favicon 失败影响较小，减少重试次数
      baseDelay: 1000,
      maxDelay: 3000,
      shouldRetry: (error: Error, _attempt: number) => {
        const message = error.message.toLowerCase();
        return message.includes('network') || message.includes('timeout');
      },
    };
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

// 全局错误处理器
export function setupGlobalErrorHandler(): void {
  // 处理未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    const errorInfo = errorHandler.handleError(error, 'unhandledrejection');

    logger.error('未处理的 Promise 错误', {
      error: errorInfo.message,
      userMessage: errorInfo.userMessage,
    });

    // 阻止默认的错误处理（避免控制台报错）
    event.preventDefault();
  });

  // 处理未捕获的 JavaScript 错误
  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    const errorInfo = errorHandler.handleError(error, 'javascript-error');

    logger.error('未处理的 JavaScript 错误', {
      error: errorInfo.message,
      userMessage: errorInfo.userMessage,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  logger.info('全局错误处理器已设置');
}
