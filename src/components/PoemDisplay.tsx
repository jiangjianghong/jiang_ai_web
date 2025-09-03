import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';

export function PoemDisplay() {
  const [poem, setPoem] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { isSearchFocused } = useTransparency();

  const fetchPoem = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://v1.hitokoto.cn/?c=i&encode=text');
      if (response.ok) {
        const text = await response.text();
        setPoem(text);
      } else {
        setPoem('诗词歌赋，尽在不言中。');
      }
    } catch (error) {
      console.warn('获取诗句失败:', error);
      setPoem('山高水长，人间值得。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 页面加载时立即获取诗句
    fetchPoem();

    // 每10分钟更新一次诗句
    const interval = setInterval(fetchPoem, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 监听页面刷新和可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 页面重新可见时刷新诗句
      if (document.visibilityState === 'visible') {
        fetchPoem();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isSearchFocused ? 1 : 0, 
          y: isSearchFocused ? 0 : 20
        }}
        transition={{ duration: 0.6, delay: isSearchFocused ? 0.6 : 0 }}
        className="relative"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 shadow-lg border border-white/20 max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* 左引号 */}
              <span className="absolute left-4 top-2 text-white/30 text-2xl font-serif">"</span>
              
              {/* 诗句内容 */}
              <p className="text-white/90 text-sm font-medium tracking-wide leading-relaxed px-4 py-1 font-serif">
                {poem}
              </p>
              
              {/* 右引号 */}
              <span className="absolute right-4 bottom-2 text-white/30 text-2xl font-serif">"</span>
              
              {/* 装饰性分割线 */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-16 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </motion.div>
          )}
        </div>
        
        {/* 光晕效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl -z-10 opacity-50"></div>
      </motion.div>
    </div>
  );
}