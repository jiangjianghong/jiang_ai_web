import { useEffect } from 'react';

interface UsePageTitleOptions {
  displayName?: string;
}

export const usePageTitle = (options: UsePageTitleOptions = {}) => {
  const { displayName = '江' } = options;

  useEffect(() => {
    // 设置初始标题（根据用户名动态生成）
    const defaultTitle = `${displayName}的标签页`;
    document.title = defaultTitle;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面失去焦点时显示哭哭表情
        document.title = '😭你就要离开我了吗';
      } else {
        // 页面获得焦点时显示默认标题
        document.title = defaultTitle;
      }
    };

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 清理事件监听器
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [displayName]);
};
