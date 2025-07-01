import { useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 导出所有用户数据
  const exportData = () => {
    try {
      const allData = {
        websites,
        settings: {
          cardOpacity,
          searchBarOpacity,
          parallaxEnabled,
          theme: localStorage.getItem('theme') || 'light'
        },
        exportTime: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `炫酷收藏夹_导出数据_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('数据导出成功！');
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败，请重试！');
    }
  };

  // 导入用户数据
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 确认导入前的警告
    const confirmed = confirm(
      '⚠️ 导入数据前请注意：\n\n' +
      '• 导入会完全覆盖当前所有数据\n' +
      '• 包括所有网站卡片、透明度设置、主题等\n' +
      '• 建议先导出当前数据作为备份\n\n' +
      '确定要继续导入吗？'
    );

    if (!confirmed) {
      // 清空 input 值，以便下次可以选择同一个文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // 验证数据格式
        if (!importedData.websites || !Array.isArray(importedData.websites)) {
          throw new Error('无效的数据格式：缺少网站数据');
        }

        // 导入网站数据
        setWebsites(importedData.websites);

        // 导入设置数据
        if (importedData.settings) {
          const { cardOpacity: newCardOpacity, searchBarOpacity: newSearchBarOpacity, parallaxEnabled: newParallaxEnabled, theme } = importedData.settings;
          
          if (typeof newCardOpacity === 'number') setCardOpacity(newCardOpacity);
          if (typeof newSearchBarOpacity === 'number') setSearchBarOpacity(newSearchBarOpacity);
          if (typeof newParallaxEnabled === 'boolean') setParallaxEnabled(newParallaxEnabled);
          if (theme) localStorage.setItem('theme', theme);
        }

        alert('数据导入成功！页面将刷新以应用新设置。');
        // 刷新页面以确保所有设置生效
        window.location.reload();
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入数据失败：文件格式不正确或数据损坏！');
      }
    };

    reader.onerror = () => {
      alert('读取文件失败！');
    };

    reader.readAsText(file);
    
    // 清空 input 值，以便下次可以选择同一个文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        className="w-96 bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col select-none"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="p-6 pb-0 select-none">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-800 select-none">设置</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 select-none"
            >
              <i className="fa-solid fa-xmark text-lg select-none"></i>
            </button>
          </div>
        </div>
        <div className="flex-1 px-6 py-2 pb-6 space-y-6 overflow-y-auto select-none">
          <div className="space-y-4 select-none">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider select-none">透明度设置</h3>
            
            {/* 卡片透明度控制 */}
            <div className="space-y-2 select-none">
              <label className="text-sm font-medium text-gray-700 select-none">
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
            <div className="space-y-2 select-none">
              <label className="text-sm font-medium text-gray-700 select-none">
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
            <div className="space-y-2 select-none">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between select-none">
                <span className="select-none">视差背景效果</span>
                <button
                  onClick={() => setParallaxEnabled(!parallaxEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors select-none ${
                    parallaxEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform select-none ${
                      parallaxEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <p className="text-xs text-gray-500 select-none">
                {parallaxEnabled ? '背景会跟随鼠标轻微移动' : '背景固定不动'}
              </p>
            </div>
          </div>
          
          <div className="space-y-4 select-none">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider select-none">卡片管理</h3>
            <button
              onClick={() => setShowAddCardModal(true)}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors select-none"
            >
              <i className="fa-solid fa-plus mr-2 select-none"></i>添加新卡片
            </button>
          </div>
          
          <div className="space-y-4 select-none">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider select-none">数据管理</h3>
            
            {/* 导出数据 */}
            <button
              onClick={exportData}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors select-none"
            >
              <i className="fa-solid fa-download mr-2 select-none"></i>导出数据
            </button>
            
            {/* 导入数据 */}
            <div className="space-y-2 select-none">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors select-none"
              >
                <i className="fa-solid fa-upload mr-2 select-none"></i>导入数据
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
              <p className="text-xs text-gray-500 select-none">
                ⚠️ 导入会覆盖所有当前数据，建议先导出备份
              </p>
            </div>
          </div>
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

