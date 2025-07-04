import { motion } from 'framer-motion';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import CardEditModal from './CardEditModal';
import { useTransparency } from '@/contexts/TransparencyContext';
import { useFavicon } from '@/hooks/useFavicon';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface WebsiteCardProps {
  id: string;
  name: string;
  url: string;
  favicon: string;
  tags: string[];
  visitCount: number;
  note?: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
}

export function WebsiteCard({ id, name, url, favicon, tags, visitCount, note, index, moveCard, onSave, onDelete }: WebsiteCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [clickAnimation, setClickAnimation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { cardOpacity } = useTransparency();
  const { faviconUrl, isLoading } = useFavicon(url, favicon);
  const { isMobile, getCardClasses } = useResponsiveLayout();

  // 缓存样式计算以避免每次渲染重新计算
  const cardStyle = useMemo(() => ({
    opacity: 1, // 移除拖拽透明度，交给framer-motion处理
    backgroundColor: `rgba(255, 255, 255, ${cardOpacity})`,
    backdropFilter: cardOpacity < 0.8 ? 'blur(10px)' : 'none', // 条件性应用blur
    border: '1px solid rgba(255, 255, 255, 0.2)',
  }), [cardOpacity]);

  // 优化动画配置
  const animationVariants = useMemo(() => ({
    initial: { opacity: 0, y: 10 }, // 减少初始偏移
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  }), []);

  const [{ isDragging }, drag] = useDrag({
    type: 'WEBSITE_CARD',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isMobile, // 移动端禁用拖拽
  });

  const [, drop] = useDrop({
    accept: 'WEBSITE_CARD',
    hover(item: { id: string; index: number }) {
      if (!cardRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drop(cardRef);
  drag(cardRef);

  // 清理定时器
  const cleanupTimers = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, []);

  // 处理卡片悬停效果（简化版）- 移除状态管理，使用CSS
  const handleMouseEnter = () => {
    // 移除状态设置，使用纯CSS处理悬停效果
  };

  const handleMouseLeave = () => {
    // 移除状态设置，使用纯CSS处理悬停效果
  };

  // 处理卡片点击动画
  const handleCardClick = () => {
    if (isMobile) {
      setClickAnimation(true);
      setTimeout(() => setClickAnimation(false), 200);
    }
    
    // 访问网站
    window.open(url, '_blank');
    
    // 更新访问次数
    onSave({
      id,
      name,
      url,
      favicon,
      tags,
      note,
      visitCount: visitCount + 1,
      lastVisit: new Date().toISOString().split('T')[0]
    });
  };

  // 移动端长按菜单
  const handleLongPress = () => {
    if (isMobile) {
      setShowEditModal(true);
    }
  };

  const startLongPress = () => {
    if (isMobile) {
      longPressTimer.current = setTimeout(handleLongPress, 500);
    }
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <>
      {/* 简化的卡片容器 - 保留圆角 */}
      <motion.div 
        className={`${getCardClasses()} relative rounded-lg ${!isMobile ? 'hover:shadow-xl hover:ring-2 hover:ring-white/30' : ''}`}
        style={{ 
          ...cardStyle,
          opacity: isDragging ? 0.5 : 1,
          transform: clickAnimation && isMobile ? 'scale(0.95)' : 'scale(1)',
          transition: isMobile ? 'transform 0.15s ease-out' : 'box-shadow 0.2s ease-out, transform 0.2s ease-out', // 优化过渡
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={startLongPress}
        onTouchEnd={clearLongPress}
        onTouchMove={clearLongPress}
        onTouchCancel={clearLongPress}
        onClick={handleCardClick}
        whileTap={isMobile ? { scale: 0.95 } : {}}
        whileHover={!isMobile ? { scale: 1.02, y: -2 } : {}}
        variants={animationVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: "easeOut" }}
        ref={cardRef}
        layout={false} // 禁用布局动画以提高性能
      >
        {/* 设置按钮 */}
        <div className={`absolute ${isMobile ? 'top-1 right-1' : 'bottom-0.5 right-0.5'} z-10`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
            className={`p-1 text-white/50 hover:text-white select-none transition-all duration-200 ${
              isMobile ? 'text-xs bg-black/20 rounded-full opacity-70' : 'opacity-0 hover:opacity-100'
            }`}
          >
            <i className="fa-solid fa-gear text-xs select-none"></i>
          </button>
        </div>

        <div className={`h-full flex flex-col ${isMobile ? 'pt-2' : 'pt-3'} select-none`}>
          {/* 网站图标和名称区域 */}
          <div className={`flex flex-col items-center ${isMobile ? 'px-1' : 'px-2'} select-none`}>
            <div className={`${isMobile ? 'w-8 h-8 mb-1' : 'w-11 h-11 mb-1'} rounded-md overflow-hidden select-none relative`}>
              <img 
                src={faviconUrl}
                alt={`${name} favicon`} 
                className="w-full h-full object-contain select-none"
                loading="lazy"
                draggable="false"
                onLoad={() => {}} // 移除不必要的onLoad处理
                style={{ 
                  imageRendering: 'auto',
                  backfaceVisibility: 'hidden', // 提高渲染性能
                  transform: 'translate3d(0,0,0)' // 启用硬件加速
                }}
              />
              {/* 简化状态指示器 */}
              {isLoading && !isMobile && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full opacity-70" 
                     title="加载中..."></div>
              )}
            </div>
            <h3 className={`${isMobile ? 'text-[0.65rem]' : 'text-xs'} font-medium text-white text-center line-clamp-2 px-2 mt-1 select-none`}>
              {name}
            </h3>
          </div>

          {/* 备注区域 - 移动端简化 */}
          {!isMobile && (
            <div className="px-2 mb-1 select-none">
              <p className="text-white/60 text-[0.65rem] text-center line-clamp-2 select-none">
                {note || new URL(url).hostname}
              </p>
            </div>
          )}

          {/* 标签区域 */}
          <div className={`mt-0 ${isMobile ? 'px-1 pb-1' : 'px-3 pb-2'} select-none`}>
            <div className="flex flex-wrap gap-1 justify-center select-none">
              {tags.slice(0, isMobile ? 2 : 6).map(tag => (
                <span 
                  key={tag} 
                  className={`px-1.5 py-0.5 bg-white/20 rounded-full ${isMobile ? 'text-[0.55rem]' : 'text-[0.65rem]'} text-white ${isMobile ? 'max-w-[45px]' : 'max-w-[60px]'} truncate select-none`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 访问次数显示 - 恢复直接显示 */}
          {visitCount > 0 && (
            <div className={`px-2 pb-2 select-none`}>
              <div className="text-center">
                <span className={`px-2 py-1 bg-blue-500/20 text-blue-200 rounded-full ${isMobile ? 'text-[0.55rem]' : 'text-[0.65rem]'} border border-blue-300/30`}>
                  <i className="fa-solid fa-eye mr-1"></i>
                  {visitCount}次访问
                </span>
              </div>
            </div>
          )}

          {/* 占位空间，保持卡片高度一致 */}
          <div className="flex-1"></div>
        </div>
      </motion.div>

      {showEditModal && (
        <CardEditModal
          id={id}
          name={name}
          url={url}
          favicon={favicon}
          tags={tags}
          note={note}
          onClose={() => setShowEditModal(false)}
          onSave={(data) => {
            onSave(data);
            setShowEditModal(false);
          }}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
