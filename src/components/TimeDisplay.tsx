import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';

export function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isColonVisible, setIsColonVisible] = useState(true);
  const { showFullDate, showSeconds, showWeekday, showYear, showMonth, showDay, timeComponentEnabled } = useTransparency();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (showSeconds) {
      // 精确到秒模式，每秒1更新
      timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    } else {
      // 不精确到秒模式，每500ms更新闪烁状态
      timer = setInterval(() => {
        setCurrentTime(new Date());
        setIsColonVisible(prev => !prev);
      }, 500);
    }

    return () => clearInterval(timer);
  }, [showSeconds]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (showSeconds) {
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } else {
      // 不精确到秒时，冒号闪烁效果
      const colon = isColonVisible ? ':' : ' ';
      return `${hours}${colon}${minutes}`;
    }
  };

  const formatDate = (date: Date) => {
    // 根据独立设置构建日期显示选项
    const options: Intl.DateTimeFormatOptions = {};

    // 根据年份开关
    if (showYear) {
      options.year = 'numeric';
    }

    // 根据月份开关
    if (showMonth) {
      options.month = 'long';
    }

    // 根据日期开关
    if (showDay) {
      options.day = 'numeric';
    }

    // 根据设置添加星期
    if (showWeekday) {
      options.weekday = 'long';
    }

    return date.toLocaleDateString('zh-CN', options);
  };

  return (
    <div className="absolute left-0 right-0 z-50 flex justify-center px-4 select-none pointer-events-none"
         style={{ top: '-80px' }} // 绝对定位，不影响文档流
    >
      <motion.div
        className="w-full flex justify-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ 
          opacity: timeComponentEnabled ? 1 : 0, 
          y: 0,
          pointerEvents: timeComponentEnabled ? 'auto' : 'none'
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="relative flex flex-col items-center select-none pointer-events-none"
          style={{ 
            minHeight: '60px' // 固定最小高度，确保布局稳定
          }}
        >
          <div className="text-white/80 font-mono text-2xl font-semibold tracking-wide mb-1 drop-shadow-sm">
            {formatTime(currentTime)}
          </div>
          {/* 始终占据固定空间，通过透明度控制显示 */}
          <div className="text-white/60 text-sm font-medium drop-shadow-sm h-5 flex items-center justify-center min-w-[200px]">
            <span className={`transition-opacity duration-200 ${showFullDate ? 'opacity-100' : 'opacity-0'} text-center`}>
              {showFullDate ? formatDate(currentTime) : '占位文本'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}