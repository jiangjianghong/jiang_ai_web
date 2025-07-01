import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import CardEditModal from './CardEditModal';
import { useTransparency } from '@/contexts/TransparencyContext';

interface WebsiteCardProps {
  id: string;
  name: string;
  url: string;
  favicon: string;
  tags: string[];
  visitCount: number;
  lastVisit: string;
  note?: string;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
}

export function WebsiteCard({ id, name, url, favicon, tags, visitCount, lastVisit, note, onSave, onDelete }: WebsiteCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { cardOpacity } = useTransparency();

  // 处理卡片点击，增加访问次数统计
  const handleCardClick = () => {
    // 更新访问次数和最后访问时间
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
    
    // 打开网址
    window.open(url, '_blank');
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        className="w-32 h-32 rounded-xl cursor-pointer shadow-lg backdrop-blur-md border border-white/20 overflow-hidden relative group select-none"
        style={{
          backgroundColor: `rgba(255, 255, 255, ${cardOpacity})`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        onClick={handleCardClick}
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
        <div className="h-full flex flex-col pt-3">
          {/* 网站图标和名称区域 */}
          <div className="flex flex-col items-center px-2 select-none">
            <div className="w-11 h-11 mb-1 rounded-md overflow-hidden select-none"> {/* 恢复原始图标大小 */}
              <img 
                src={favicon}
                alt={`${name} favicon`} 
                className="w-full h-full object-contain select-none"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // 先尝试 Google 高清接口
                  if (!target.dataset.triedGoogle) {
                    target.src = `https://www.google.com/s2/favicons?domain=${url}&sz=128`;
                    target.dataset.triedGoogle = '1';
                  } else if (!target.dataset.triedYandex) {
                    // 再尝试 yandex 高清接口
                    const domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                    target.src = `https://favicon.yandex.net/favicon/v2/${domain}?size=120`;
                    target.dataset.triedYandex = '1';
                  } else if (!target.dataset.triedApple) {
                    // 再尝试 apple-touch-icon
                    const domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                    target.src = `https://${domain}/apple-touch-icon.png`;
                    target.dataset.triedApple = '1';
                  } else if (!target.dataset.triedDuck) {
                    // 再尝试 DuckDuckGo
                    const domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                    target.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
                    target.dataset.triedDuck = '1';
                  } else {
                    // 最后兜底为 /favicon.ico
                    try {
                      const domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                      target.src = `https://${domain}/favicon.ico`;
                    } catch {}
                  }
                }}
              />
            </div>
             <h3 className="text-xs font-medium text-white text-center line-clamp-2 px-2 mt-1 select-none">{name}</h3> {/* 恢复原始字体大小 */}
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