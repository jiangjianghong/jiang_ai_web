// AbortSignal 兼容性工具
import { logger } from './logger';

/**
 * 创建带超时的 AbortSignal，兼容旧浏览器
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  // 检查是否支持 AbortSignal.timeout (Chrome 103+, Firefox 100+)
  if (typeof AbortSignal.timeout === 'function') {
    try {
      return AbortSignal.timeout(timeoutMs);
    } catch (error) {
      logger.warn('AbortSignal.timeout 调用失败，使用兼容方案', error);
    }
  }

  // 兼容性实现
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // 清理定时器（当信号被其他方式abort时）
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  });

  return controller.signal;
}

/**
 * 合并多个 AbortSignal
 */
export function combineAbortSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const validSignals = signals.filter(Boolean) as AbortSignal[];

  if (validSignals.length === 0) {
    return new AbortController().signal;
  }

  if (validSignals.length === 1) {
    return validSignals[0];
  }

  const controller = new AbortController();

  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }

    signal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  return controller.signal;
}

/**
 * 创建带超时和取消的 AbortSignal
 */
export function createCombinedSignal(timeoutMs: number, cancelSignal?: AbortSignal): AbortSignal {
  const timeoutSignal = createTimeoutSignal(timeoutMs);

  if (cancelSignal) {
    return combineAbortSignals(timeoutSignal, cancelSignal);
  }

  return timeoutSignal;
}
