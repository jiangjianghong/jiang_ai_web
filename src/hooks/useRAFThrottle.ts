import { useCallback, useRef } from 'react';

/**
 * 使用 requestAnimationFrame 进行节流的 hook
 * 专门用于优化高频事件（如鼠标移动、滚动等）的性能
 */
export function useRAFThrottle<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): T {
  const rafId = useRef<number | null>(null);
  const argsRef = useRef<Parameters<T>>();

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    // 保存最新的参数
    argsRef.current = args;

    // 如果已经有待执行的 RAF，直接返回
    if (rafId.current !== null) {
      return;
    }

    // 使用 requestAnimationFrame 延迟执行
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (argsRef.current) {
        callback(...argsRef.current);
      }
    });
  }, deps) as T;

  // 清理函数
  const cancel = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  // 返回节流后的函数和取消函数
  return Object.assign(throttledCallback, { cancel }) as T;
}

/**
 * 专门用于鼠标移动事件的 RAF 节流 hook
 */
export function useRAFThrottledMouseMove(
  callback: (event: MouseEvent) => void,
  enabled: boolean = true
) {
  const throttledCallback = useRAFThrottle(callback, [enabled]);

  const eventHandler = useCallback((event: MouseEvent) => {
    if (enabled) {
      throttledCallback(event);
    }
  }, [throttledCallback, enabled]);

  return eventHandler;
}
