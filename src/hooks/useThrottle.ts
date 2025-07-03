import { useCallback, useRef } from 'react';

/**
 * 节流Hook - 限制函数调用频率
 * @param callback 要执行的函数
 * @param delay 节流延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * 防抖Hook - 延迟执行函数直到停止调用
 * @param callback 要执行的函数  
 * @param delay 防抖延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * 动画帧节流Hook - 使用requestAnimationFrame进行节流
 * @param callback 要执行的函数
 * @returns 使用RAF节流的函数
 */
export function useRAFThrottle<T extends (...args: any[]) => any>(
  callback: T
): T {
  const rafId = useRef<number>();
  const lastArgs = useRef<any[]>();

  return useCallback(
    ((...args: any[]) => {
      lastArgs.current = args;
      if (rafId.current === undefined) {
        rafId.current = requestAnimationFrame(() => {
          if (lastArgs.current) {
            callback(...lastArgs.current);
          }
          rafId.current = undefined;
        });
      }
    }) as T,
    [callback]
  );
}
