
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

// ...回退，移除全局拖拽类型声明...
import { useDrag, useDrop } from 'react-dnd';
import CardEditModal from './CardEditModal';
import { useTransparency } from '@/contexts/TransparencyContext';
import { useFavicon } from '@/hooks/useFavicon';


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
  const cardRef = useRef<HTMLDivElement>(null);
  const { cardOpacity } = useTransparency();
  const { faviconUrl, isLoading, error } = useFavicon(url, favicon);

  // 长按拖拽实现
  const [canDrag, setCanDrag] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'WEBSITE_CARD',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => canDrag,
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

  // 长按逻辑
  const handlePointerDown = () => {
    if (isDragging) return;
    longPressTimer.current = setTimeout(() => {
      setCanDrag(true);
    }, 1000); // 1秒
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setCanDrag(false);
  };

  // 处理卡片点击，增加访问次数统计
  const handleCardClick = () => {
    onSave({
      id,
      name,
      url,
      favicon,
      tags,
      note,
      visitCount: (visitCount || 0) + 1,
      lastVisit: new Date().toISOString().split('T')[0]
    });
    window.open(url, '_blank');
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        className={`w-32 h-32 rounded-xl shadow-lg backdrop-blur-md border border-white/20 overflow-hidden relative group select-none ${canDrag ? 'cursor-grabbing' : 'cursor-pointer'}`}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${cardOpacity})`,
          opacity: isDragging ? 0.5 : 1,
        }}
        // 回退：不做全局抖动动画
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerCancel={clearLongPress}
        draggable={false}
      >
        {/* 设置按钮 */}
        <div className="absolute bottom-0.5 right-0.5 z-11">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
            className="p-1 text-white/50 hover:text-white select-none"
          >
            <i className="fa-solid fa-gear text-xs select-none"></i>
          </button>
        </div>
        <div className="h-full flex flex-col pt-3 select-none" style={{ pointerEvents: isDragging ? 'none' : undefined }}>
          {/* 网站图标和名称区域 */}
          <div className="flex flex-col items-center px-2 select-none">
            <div className="w-11 h-11 mb-1 rounded-md overflow-hidden select-none relative">
              <img 
                src={faviconUrl}
                alt={`${name} favicon`} 
                className="w-full h-full object-contain select-none"
                loading="lazy"
                draggable="false"
              />
              {/* 简化的状态指示器 - 仅显示加载和错误状态 */}
              {isLoading && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" 
                     title="加载中..."></div>
              )}
              {!isLoading && error && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full" 
                     title="加载失败"></div>
              )}
            </div>
             <h3 className="text-xs font-medium text-white text-center line-clamp-2 px-2 mt-1 select-none">{name}</h3>
           </div>
            {/* 备注区域 */}
            <div className="px-2 mb-1 select-none">
              <p className="text-white/60 text-[0.65rem] text-center line-clamp-2 select-none">
               {note || new URL(url).hostname}
              </p>
           </div>
            {/* 标签区域 - 等分间距 */}
            <div className="mt-0 px-3 pb-2 select-none">
              <div className="flex flex-wrap gap-1 justify-center select-none">
                {tags.slice(0, 6).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-white/20 rounded-full text-[0.65rem] text-white max-w-[60px] truncate select-none">
                   {tag}
                 </span>
               ))}
             </div>
           </div>
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