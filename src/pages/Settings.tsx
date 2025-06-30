import { useState } from 'react';
import { motion } from 'framer-motion';
import CardEditModal from '@/components/CardEditModal';
import { useTransparency } from '@/contexts/TransparencyContext';

interface SettingsProps {
  onClose: () => void;
  websites: any[];
  setWebsites: (websites: any[]) => void;
}

export default function Settings({ onClose, websites, setWebsites }: SettingsProps) {
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const { cardOpacity, searchBarOpacity, parallaxEnabled, setCardOpacity, setSearchBarOpacity, setParallaxEnabled } = useTransparency();

  const handleSaveNewCard = (data: {
    id: string;
    name: string;
    url: string;
    favicon: string;
    tags: string[];
    note?: string;
  }) => {
    const newCard = {
      ...data,
      visitCount: 0,
      lastVisit: new Date().toISOString().split('T')[0]
    };
    setWebsites([...websites, newCard]);
    setShowAddCardModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        className="w-96 bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="p-6 pb-0">
          <h2 className="text-xl font-medium text-gray-800 mb-4">设置</h2>
        </div>
        <div className="flex-1 px-6 py-2 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">透明度设置</h3>
            
            {/* 卡片透明度控制 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                卡片透明度 ({Math.round(cardOpacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.05"
                max="0.3"
                step="0.01"
                value={cardOpacity}
                onChange={(e) => setCardOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* 搜索框透明度控制 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                搜索框透明度 ({Math.round(searchBarOpacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.05"
                max="0.3"
                step="0.01"
                value={searchBarOpacity}
                onChange={(e) => setSearchBarOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* 视差效果开关 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                <span>视差背景效果</span>
                <button
                  onClick={() => setParallaxEnabled(!parallaxEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    parallaxEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      parallaxEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <p className="text-xs text-gray-500">
                {parallaxEnabled ? '背景会跟随鼠标轻微移动' : '背景固定不动'}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">卡片管理</h3>
            <button
              onClick={() => setShowAddCardModal(true)}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              <i className="fa-solid fa-plus mr-2"></i>添加新卡片
            </button>
          </div>
        </div>
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
          >
            关闭设置
          </button>
        </div>
      </motion.div>

       {showAddCardModal && (
        <CardEditModal
          id={`new-${Date.now()}`}
          name=""
          url=""
          favicon=""
          tags={[]}
          note=""
          onClose={() => setShowAddCardModal(false)}
          onSave={handleSaveNewCard}
        />
      )}
    </div>
  );
}

