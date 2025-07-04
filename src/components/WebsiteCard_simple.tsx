import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);
  const [clickAnimation, setClickAnimation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { cardOpacity } = useTransparency();
  const { faviconUrl, isLoading, error } = useFavicon(url, favicon);
  const { isMobile, getCardClasses } = useResponsiveLayout();

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

  // 处理卡片悬停效果（简化版）
  const handleMouseEnter = () => {
    if (!isMobile && !isDragging) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
    }
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
        className={`${getCardClasses()} relative rounded-lg`}
        style={{ 
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: `rgba(255, 255, 255, ${cardOpacity})`,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: clickAnimation && isMobile ? 'scale(0.95)' : 'scale(1)',
          transition: isMobile ? 'transform 0.2s ease' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        ref={cardRef}
      >
        {/* 设置按钮 */}
        <div className={`absolute ${isMobile ? 'top-1 right-1' : 'bottom-0.5 right-0.5'} z-10`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
            className={`p-1 text-white/50 hover:text-white select-none transition-all duration-200 ${
              isMobile ? 'text-xs bg-black/20 rounded-full' : ''
            } ${isHovered && !isMobile ? 'opacity-100' : isMobile ? 'opacity-70' : 'opacity-0'}`}
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
              />
              {/* 状态指示器 */}
              {isLoading && (
                <div className={`absolute top-0 right-0 ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-yellow-400 rounded-full animate-pulse`} 
                     title="加载中..."></div>
              )}
              {!isLoading && error && (
                <div className={`absolute top-0 right-0 ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-red-400 rounded-full`} 
                     title="加载失败"></div>
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

        {/* 悬停效果边框 */}
        {!isMobile && isHovered && (
          <div className="absolute inset-0 rounded-lg ring-2 ring-white/30 pointer-events-none transition-opacity duration-300" />
        )}

        {/* 悬停时的阴影效果 */}
        {!isMobile && isHovered && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              zIndex: -1,
            }}
          />
        )}
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
