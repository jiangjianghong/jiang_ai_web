import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('zh-CN', options);
  };

  return (
    <motion.div
      className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center select-none pointer-events-none"
      style={{ 
        top: '-40px', // 在搜索框上方40px
        left: 'calc(50% - 20px)', // 向左偏移20px
        transform: 'translateX(-50%)',
        zIndex: 10 
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-white/80 font-mono text-2xl font-semibold tracking-wide mb-1 drop-shadow-sm">
        {formatTime(currentTime)}
      </div>
      <div className="text-white/60 text-sm font-medium drop-shadow-sm">
        {formatDate(currentTime)}
      </div>
    </motion.div>
  );
}