import { useEffect, useRef, useCallback } from 'react';

/**
 * 智能防抖 hook - 只在用户停止活动时执行回调
 * @param callback 要执行的回调函数
 * @param delay 防抖延迟时间（毫秒）
 * @param dependencies 依赖项数组
 */
export function useSmartDebounce(
  callback: () => void,
  delay: number,
  dependencies: any[]
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  // 更新回调引用
  callbackRef.current = callback;

  // 清理函数
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 执行防抖回调
  const debouncedCallback = useCallback(() => {
    cleanup();
    
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    
    // 如果距离上次调用太近，延长等待时间
    const actualDelay = timeSinceLastCall < delay ? delay * 1.5 : delay;
    
    timeoutRef.current = setTimeout(() => {
      lastCallTimeRef.current = Date.now();
      callbackRef.current();
    }, actualDelay);
  }, [delay, cleanup]);

  // 监听依赖项变化
  useEffect(() => {
    debouncedCallback();
    return cleanup;
  }, dependencies);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return cleanup;
}
