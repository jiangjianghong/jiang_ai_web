import { useRef, useCallback, useEffect } from 'react';

/**
 * 智能防抖 hook - 支持带参数的函数
 * @param callback 要执行的回调函数
 * @param delay 防抖延迟时间（毫秒）
 * @param maxDelay 最大延迟时间（毫秒）
 */
export function useSmartDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  maxDelay?: number
): [(...args: Parameters<T>) => void, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const firstCallTimeRef = useRef<number>(0);

  // 清理函数
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 执行防抖回调
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    cleanup();
    
    const now = Date.now();
    
    // 如果是第一次调用，记录时间
    if (!firstCallTimeRef.current) {
      firstCallTimeRef.current = now;
    }

    const timeSinceFirstCall = now - firstCallTimeRef.current;
    const timeSinceLastCall = now - lastCallTimeRef.current;
    
    // 如果有最大延迟时间限制，且已经超过，立即执行
    if (maxDelay && timeSinceFirstCall >= maxDelay) {
      lastCallTimeRef.current = now;
      firstCallTimeRef.current = 0;
      callback(...args);
      return;
    }
    
    // 如果距离上次调用太近，延长等待时间
    const actualDelay = timeSinceLastCall < delay ? delay * 1.5 : delay;
    
    timeoutRef.current = setTimeout(() => {
      lastCallTimeRef.current = Date.now();
      firstCallTimeRef.current = 0;
      callback(...args);
    }, actualDelay);
  }, [callback, delay, maxDelay, cleanup]);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return [debouncedCallback, cleanup];
}
