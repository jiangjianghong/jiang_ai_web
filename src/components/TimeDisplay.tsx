import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';

export function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isColonVisible, setIsColonVisible] = useState(true);
  const {
    showFullDate,
    showSeconds,
    showWeekday,
    showYear,
    showMonth,
    showDay,
    timeComponentEnabled,
  } = useTransparency();

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
        setIsColonVisible((prev) => !prev);
      }, 500);
    }

    return () => clearInterval(timer);
  }, [showSeconds]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (showSeconds) {
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return { text: `${hours}:${minutes}:${seconds}`, colonOpacity: 1 };
    } else {
      // 不精确到秒时，冒号透明度闪烁效果
      const colonOpacity = isColonVisible ? 1 : 0.3;
      return { text: `${hours}:${minutes}`, colonOpacity };
    }
  };

  const formatDate = (date: Date) => {
    // 检查是否有任何日期元素被启用
    const hasAnyDateElement = showYear || showMonth || showDay || showWeekday;

    if (!hasAnyDateElement) {
      return ''; // 如果没有任何日期元素，返回空字符串
    }

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

  // 检查是否有任何日期元素被启用，用于调整时间位置
  const hasAnyDateElement = showYear || showMonth || showDay || showWeekday;

  return (
    <div
      className="absolute left-0 right-0 z-50 flex justify-center px-4 select-none pointer-events-none"
      style={{ top: '-45px' }} // 向下移动到-45px
    >
      <motion.div
        className="w-full flex justify-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: timeComponentEnabled ? 1 : 0,
          y: 0,
          pointerEvents: timeComponentEnabled ? 'auto' : 'none',
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="relative flex flex-col items-center select-none pointer-events-none"
          style={{
            minHeight: '60px', // 固定最小高度，确保布局稳定
            // 当没有日期元素时，时间向下移动以居中显示
            transform: hasAnyDateElement ? 'translateY(0)' : 'translateY(15px)',
          }}
        >
          <div className="text-white/80 font-mono text-4xl font-semibold tracking-wide mb-1 drop-shadow-sm">
            {(() => {
              const timeData = formatTime(currentTime);
              if (showSeconds || timeData.text.includes(':')) {
                // 显示秒数或包含冒号的时间
                const parts = timeData.text.split(':');
                return (
                  <>
                    {parts[0]}
                    <span
                      className="transition-opacity duration-200"
                      style={{ opacity: timeData.colonOpacity }}
                    >
                      :
                    </span>
                    {parts[1]}
                    {parts[2] && (
                      <>
                        <span
                          className="transition-opacity duration-200"
                          style={{ opacity: timeData.colonOpacity }}
                        >
                          :
                        </span>
                        {parts[2]}
                      </>
                    )}
                  </>
                );
              } else {
                // 没有冒号的情况，直接显示
                return timeData.text;
              }
            })()}
          </div>
          {/* 始终占据固定空间，通过透明度控制显示 */}
          <div className="text-white/60 text-sm font-medium drop-shadow-sm h-5 flex items-center justify-center min-w-[200px]">
            <span
              className={`transition-opacity duration-200 ${showFullDate ? 'opacity-100' : 'opacity-0'} text-center`}
            >
              {showFullDate ? formatDate(currentTime) : '占位文本'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
