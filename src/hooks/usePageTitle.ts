import { useEffect } from 'react';

export const usePageTitle = () => {
  useEffect(() => {
    // 设置初始标题
    document.title = '江的标签页';

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面失去焦点时显示哭哭表情
        document.title = '😭你就要离开我了吗';
      } else {
        // 页面获得焦点时显示默认标题
        document.title = '江的标签页';
      }
    };

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 清理事件监听器
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
