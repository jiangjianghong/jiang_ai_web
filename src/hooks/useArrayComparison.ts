import { useRef, useMemo } from 'react';

/**
 * 浅比较数组长度和关键字段的 hook
 * 用于避免不必要的深度比较和重新渲染
 */
export function useShallowWebsiteComparison(websites: any[]) {
  const prevSignature = useRef<string>('');

  // 创建一个轻量级的签名来比较数组变化
  const signature = useMemo(() => {
    if (!websites || websites.length === 0) {
      return 'empty';
    }

    // 使用长度和几个关键字段的哈希来创建签名
    const keyFields = websites.slice(0, 5).map(w => `${w.id || ''}-${w.name || ''}`).join('|');
    return `${websites.length}-${keyFields}`;
  }, [websites]);

  const hasChanged = prevSignature.current !== signature;
  if (hasChanged) {
    prevSignature.current = signature;
  }

  return {
    hasChanged,
    signature,
    length: websites.length
  };
}

/**
 * 稳定的数组长度比较 hook
 * 只有在长度真正变化时才触发更新
 */
export function useStableArrayLength<T>(array: T[]): number {
  const prevLength = useRef(array.length);
  const currentLength = array.length;

  // 只有长度真正变化时才更新
  if (prevLength.current !== currentLength) {
    prevLength.current = currentLength;
  }

  return prevLength.current;
}

/**
 * 优化的数组依赖比较 hook
 * 避免频繁的重新执行
 */
export function useOptimizedArrayDeps<T>(
  array: T[],
  keyExtractor?: (item: T) => string | number
) {
  const signature = useMemo(() => {
    if (!array || array.length === 0) return 'empty';
    
    if (keyExtractor) {
      // 使用提供的 key 提取器
      return array.map(keyExtractor).join('-');
    } else {
      // 默认使用长度和前几个元素的简单标识
      const sample = array.slice(0, 3).map((item: any) => 
        item?.id || item?.name || String(item).slice(0, 10)
      ).join('|');
      return `${array.length}:${sample}`;
    }
  }, [array, keyExtractor]);

  return signature;
}
