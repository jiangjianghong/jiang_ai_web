import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import CardEditModal from '@/components/CardEditModal';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import SyncStatsCards from '@/components/SyncStatsCards';
import AuthForm from '@/components/AuthForm';
import UserNameEditor from '@/components/UserNameEditor';
import PrivacySettings from '@/components/PrivacySettings';
import { useTransparency, WallpaperResolution } from '@/contexts/TransparencyContext';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsProps {
  onClose: () => void;
  websites: any[];
  setWebsites: (websites: any[]) => void;
}

export default function Settings({ onClose, websites, setWebsites }: SettingsProps) {
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const { 
    cardOpacity, 
    searchBarOpacity, 
    parallaxEnabled, 
    wallpaperResolution,
    setCardOpacity, 
    setSearchBarOpacity, 
    setParallaxEnabled,
    setWallpaperResolution,
    setIsSettingsOpen
  } = useTransparency();
  const { currentUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 设置页面打开时暂时关闭视差
  useEffect(() => {
    setIsSettingsOpen(true);
    return () => setIsSettingsOpen(false);
  }, [setIsSettingsOpen]);

  const handleClose = () => {
    setIsSettingsOpen(false);
    onClose();
  };

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
          wallpaperResolution,
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
          const { 
            cardOpacity: newCardOpacity, 
            searchBarOpacity: newSearchBarOpacity, 
            parallaxEnabled: newParallaxEnabled,
            wallpaperResolution: newWallpaperResolution,
            theme 
          } = importedData.settings;
          
          if (typeof newCardOpacity === 'number') setCardOpacity(newCardOpacity);
          if (typeof newSearchBarOpacity === 'number') setSearchBarOpacity(newSearchBarOpacity);
          if (typeof newParallaxEnabled === 'boolean') setParallaxEnabled(newParallaxEnabled);
          if (newWallpaperResolution && ['4k', '1080p', '720p', 'mobile'].includes(newWallpaperResolution)) {
            setWallpaperResolution(newWallpaperResolution as WallpaperResolution);
          }
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
        onClick={handleClose}
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
              onClick={handleClose} 
              className="text-gray-500 hover:text-gray-700 select-none"
            >
              <i className="fa-solid fa-xmark text-lg select-none"></i>
            </button>
          </div>
        </div>
        <div className="flex-1 px-6 py-2 pb-6 space-y-6 overflow-y-auto select-none">
          
          {/* 账号管理部分 - 移到最上面 */}
          <div className="space-y-4 select-none">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider select-none">账号管理</h3>
            
            {currentUser ? (
              <div className="bg-gray-100 rounded-lg p-4 space-y-4">
                <UserNameEditor />
                <div className="flex justify-center pt-1">
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        handleClose(); // 登出后关闭设置面板
                      } catch (error) {
                        console.error('登出失败:', error);
                      }
                    }}
                    className="text-red-500 hover:text-red-600 transition-colors flex items-center text-sm select-none"
                  >
                    <i className="fa-solid fa-sign-out-alt mr-1.5 text-xs select-none"></i>登出
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4">
                <AuthForm onSuccess={handleClose} />
              </div>
            )}
          </div>

          <div className="space-y-4 select-none">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider select-none">云端同步</h3>
            <div className="bg-gray-100 rounded-lg p-4">
              <SyncStatusIndicator />
            </div>
          </div>

          {/* 云端同步统计卡片 */}
          <div className="select-none -mt-4">
            <SyncStatsCards />
          </div>
          <div className="space-y-4 select-none">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider select-none">外观设置</h3>
            
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

            {/* 壁纸分辨率选择 - 重新设计为按钮组 */}
            <div className="space-y-2 select-none">
              <label className="text-sm font-medium text-gray-700 select-none">
                壁纸分辨率
              </label>
              <div className="grid grid-cols-2 gap-2 select-none">
                {[
                  { value: '4k', label: '4K 超高清', desc: '大屏设备' },
                  { value: '1080p', label: '1080p 高清', desc: '推荐' },
                  { value: '720p', label: '720p 标清', desc: '网络较慢' },
                  { value: 'mobile', label: '竖屏壁纸', desc: '移动设备' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setWallpaperResolution(option.value as WallpaperResolution)}
                    className={`p-3 rounded-lg border-2 transition-all text-left select-none cursor-pointer ${
                      wallpaperResolution === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 select-none">
                更改分辨率后会重新加载壁纸并更新缓存
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
            
            {/* 导入导出并排显示，小一点 */}
            <div className="grid grid-cols-2 gap-3 select-none">
              <button
                onClick={exportData}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors text-sm select-none"
              >
                <i className="fa-solid fa-download mr-1 select-none"></i>导出
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors text-sm select-none"
              >
                <i className="fa-solid fa-upload mr-1 select-none"></i>导入
              </button>
            </div>
            
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
          
          {/* 隐私与Cookie管理 - 放在最下面 */}
          <div className="space-y-4 select-none">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider select-none">隐私与Cookie</h3>
            <button
              onClick={() => setShowPrivacySettings(true)}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors select-none"
            >
              <i className="fa-solid fa-shield-halved mr-2 select-none"></i>隐私设置
            </button>
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
      
      {/* 隐私设置面板 */}
      {showPrivacySettings && (
        <PrivacySettings
          isOpen={showPrivacySettings}
          onClose={() => setShowPrivacySettings(false)}
        />
      )}
    </div>
  );
}

