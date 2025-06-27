import { motion } from 'framer-motion';
import { useState } from 'react';
import CardEditModal from './CardEditModal';

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
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个卡片吗？')) {
      onDelete?.(id);
    }
    setShowMenu(false);
  };

  return (
    <>
      <motion.div
        className="w-32 h-32 rounded-xl cursor-pointer shadow-lg bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        onClick={() => window.open(url, '_blank')}
      >
        {/* 设置按钮 */}
        <div className="absolute bottom-0.5 right-0.5 z-11">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
            className="p-1 text-white/50 hover:text-white"
          >
            <i className="fa-solid fa-gear text-xs"></i>
          </button>
        </div>



        <div className="h-full flex flex-col pt-3">
          {/* 网站图标和名称区域 */}
          <div className="flex flex-col items-center px-2">
            <div className="w-11 h-11 mb-1 rounded-md overflow-hidden">
              <img 
                src={favicon} 
                alt={`${name} favicon`} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://www.google.com/s2/favicons?domain=${url}`;
                }}
              />
            </div>

             <h3 className="text-xs font-medium text-white text-center line-clamp-2 px-2 mt-1">{name}</h3>
           </div>

            {/* 备注区域 */}
            <div className="px-2 mb-1">
              <p className="text-white/60 text-[0.65rem] text-center line-clamp-2">
               {note || new URL(url).hostname}
              </p>
           </div>

            {/* 标签区域 - 等分间距 */}
            <div className="mt-0 px-3 pb-2">
              <div className="flex flex-wrap gap-1 justify-center">
                {tags.slice(0, 6).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-white/20 rounded-full text-[0.65rem] text-white max-w-[60px] truncate">
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
          onDelete={onDelete} // 传递 onDelete，编辑时才有删除按钮
        />
      )}
    </>
  );
}