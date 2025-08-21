import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import CardEditModal from '@/components/CardEditModal';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import AuthForm from '@/components/AuthForm';
import PrivacySettings from '@/components/PrivacySettings';
import ConfirmModal from '@/components/ConfirmModal';
import { ColorPicker } from '@/components/ColorPicker';
import { useTransparency, WallpaperResolution } from '@/contexts/TransparencyContext';
import { customWallpaperManager } from '@/lib/customWallpaperManager';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSyncStatus } from '@/contexts/SyncContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { WebsiteData, UserSettings, saveUserSettings, getUserSettings, saveUserWebsites, getUserWebsites } from '@/lib/supabaseSync';
import { useDataManager } from '@/hooks/useDataManager';
import { faviconCache } from '@/lib/faviconCache';

interface SettingsProps {
  onClose: () => void;
  websites: WebsiteData[];
  setWebsites: (websites: WebsiteData[]) => void;
}

export default function Settings({ onClose, websites, setWebsites }: SettingsProps) {
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [isFixingIcons, setIsFixingIcons] = useState(false);
  const [fixIconsMessage, setFixIconsMessage] = useState('');

  // 自定义壁纸相关状态
  const [customWallpaperInfo, setCustomWallpaperInfo] = useState<{
    exists: boolean;
    size?: number;
    sizeText?: string;
  }>({ exists: false });
  const [uploadingWallpaper, setUploadingWallpaper] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);

  // 使用统一的数据管理Hook
  const {
    exportAllData,
    importAllData,
    isExporting,
    isImporting
  } = useDataManager(websites, setWebsites);
  const {
    cardOpacity,
    searchBarOpacity,
    parallaxEnabled,
    wallpaperResolution,
    cardColor,
    searchBarColor,
    autoSyncEnabled,
    autoSyncInterval,
    searchInNewTab,
    autoSortEnabled,
    setCardOpacity,
    setSearchBarOpacity,
    setParallaxEnabled,
    setWallpaperResolution,
    setIsSettingsOpen,
    setCardColor,
    setSearchBarColor,
    setCustomWallpaperUrl,
    setAutoSyncEnabled,
    setAutoSyncInterval,
    setSearchInNewTab,
    setAutoSortEnabled,
  } = useTransparency();
  const { currentUser, logout } = useAuth();
  const { updateSyncStatus } = useSyncStatus();
  const { displayName, updateDisplayName } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当 displayName 更新时，同步更新 newName
  useEffect(() => {
    setNewName(displayName || '');
  }, [displayName]);

  // 加载自定义壁纸信息
  useEffect(() => {
    const loadCustomWallpaperInfo = async () => {
      const info = await customWallpaperManager.getWallpaperInfo();
      setCustomWallpaperInfo(info);
    };
    loadCustomWallpaperInfo();
  }, []);

  // 全局拖拽检测
  useEffect(() => {
    let dragCounter = 0;

    const handleGlobalDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;

      // 检查是否拖拽的是图片文件
      const items = Array.from(e.dataTransfer?.items || []);
      const hasImageFile = items.some(item => item.type.startsWith('image/'));

      if (hasImageFile && !uploadingWallpaper) {
        setIsGlobalDragOver(true);
      }
    };

    const handleGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;

      if (dragCounter === 0) {
        setIsGlobalDragOver(false);
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsGlobalDragOver(false);
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('dragenter', handleGlobalDragEnter);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragenter', handleGlobalDragEnter);
      document.removeEventListener('dragleave', handleGlobalDragLeave);
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, [uploadingWallpaper]);

  // 处理文件上传的通用逻辑
  const processWallpaperFile = async (file: File) => {
    if (!file) return;

    setUploadingWallpaper(true);

    try {
      const result = await customWallpaperManager.uploadWallpaper(file);

      if (result.success && result.url) {
        // 更新自定义壁纸URL
        setCustomWallpaperUrl(result.url);
        // 切换到自定义壁纸
        setWallpaperResolution('custom');
        // 更新壁纸信息
        const info = await customWallpaperManager.getWallpaperInfo();
        setCustomWallpaperInfo(info);

        setSyncMessage('自定义壁纸上传成功！');
        setTimeout(() => setSyncMessage(''), 3000);
      } else {
        setSyncMessage(result.error || '上传失败');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (error) {
      setSyncMessage('上传失败，请重试');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setUploadingWallpaper(false);
    }
  };

  // 处理自定义壁纸上传
  const handleWallpaperUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processWallpaperFile(file);

    // 清空文件输入
    if (event.target) {
      event.target.value = '';
    }
  };

  // 拖拽处理函数
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadingWallpaper) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当鼠标真正离开拖拽区域时才设置为false
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleWallpaperDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (uploadingWallpaper) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      await processWallpaperFile(imageFile);
    } else {
      setSyncMessage('请拖拽图片文件 (JPG、PNG、WebP)');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  // 删除自定义壁纸
  const handleDeleteCustomWallpaper = async () => {
    const success = await customWallpaperManager.deleteCustomWallpaper();

    if (success) {
      setCustomWallpaperUrl('');
      setCustomWallpaperInfo({ exists: false });

      // 如果当前使用的是自定义壁纸，切换到默认分辨率
      if (wallpaperResolution === 'custom') {
        setWallpaperResolution('1080p');
      }

      setSyncMessage('自定义壁纸已删除');
      setTimeout(() => setSyncMessage(''), 3000);
    } else {
      setSyncMessage('删除失败，请重试');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  // 处理用户名保存
  const handleSaveName = async () => {
    if (!newName.trim()) {
      setNameError('用户名不能为空');
      return;
    }

    if (newName.length < 2 || newName.length > 20) {
      setNameError('用户名长度需在2-20个字符之间');
      return;
    }

    if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(newName)) {
      setNameError('用户名只能包含字母、数字、中文、下划线和短横线');
      return;
    }

    setNameLoading(true);
    setNameError('');

    try {
      const success = await updateDisplayName(newName);
      if (success) {
        setIsEditingName(false);
        alert('用户名更新成功！');
      } else {
        setNameError('更新失败，请重试');
      }
    } catch (error) {
      setNameError('更新失败，请重试');
      console.error('更新用户名失败:', error);
    } finally {
      setNameLoading(false);
    }
  };

  // 处理用户名取消编辑
  const handleCancelName = () => {
    setNewName(displayName || '');
    setIsEditingName(false);
    setNameError('');
  };

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

  // 导出所有用户数据 - 使用统一的数据管理Hook
  const exportData = async () => {
    await exportAllData();
  };

  // 导入用户数据
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件大小 (限制为5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('文件过大！请选择小于5MB的文件。');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // 验证文件类型
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      alert('请选择JSON格式的文件！');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // 设置待导入文件并显示确认对话框
    setPendingImportFile(file);
    setShowImportConfirm(true);

    // 清空 input 值，以便下次可以选择同一个文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 确认导入数据 - 使用统一的数据管理Hook
  const confirmImportData = async () => {
    if (!pendingImportFile || isImporting) return;

    const result = await importAllData(pendingImportFile);

    if (result.success) {
      const details = result.details;
      let message = '数据导入成功！';

      if (details?.websitesImported) {
        message += `导入了 ${details.websitesImported} 个网站。`;
      }
      if (details?.settingsApplied && details.settingsApplied.length > 0) {
        message += `应用了设置：${details.settingsApplied.join('、')}。`;
      }
      message += '页面将刷新以应用新设置。';

      alert(message);
      window.location.reload();
    } else {
      alert(result.message);
    }

    setPendingImportFile(null);
  };

  // 一键修复图标
  const handleFixIcons = async () => {
    if (isFixingIcons) return;

    setIsFixingIcons(true);
    setFixIconsMessage('正在清除图标缓存并重新下载...');

    try {
      // 清空所有favicon缓存
      await faviconCache.clearCache();
      console.log('✅ 图标缓存已清空');

      // 延迟一下让用户看到提示
      setTimeout(() => {
        setFixIconsMessage('✅ 图标缓存已清空，页面将刷新');

        // 再延迟一下后刷新页面重新加载图标
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 500);

    } catch (error) {
      console.error('修复图标失败:', error);
      setFixIconsMessage('❌ 修复失败，请重试');
      setTimeout(() => {
        setFixIconsMessage('');
        setIsFixingIcons(false);
      }, 3000);
    }
  };

  // 手动同步到云端
  const handleUploadToCloud = async () => {
    if (!currentUser || !currentUser.email_confirmed_at || isManualSyncing) return;

    setIsManualSyncing(true);
    setSyncMessage('正在上传数据到云端...');

    try {
      const settings: UserSettings = {
        cardOpacity,
        searchBarOpacity,
        parallaxEnabled,
        wallpaperResolution,
        theme: localStorage.getItem('theme') || 'light',
        cardColor,
        searchBarColor,
        autoSyncEnabled,
        autoSyncInterval,
        autoSortEnabled,
        lastSync: new Date().toISOString()
      };

      await saveUserSettings(currentUser, settings);
      await saveUserWebsites(currentUser, websites);

      // 更新同步状态
      updateSyncStatus({
        syncInProgress: false,
        lastSyncTime: new Date(),
        syncError: null,
        pendingChanges: 0
      });

      setSyncMessage('✅ 数据已成功上传到云端');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (error) {
      setSyncMessage('❌ 上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // 手动从云端下载
  const handleDownloadFromCloud = async () => {
    if (!currentUser || !currentUser.email_confirmed_at || isManualSyncing) return;

    setIsManualSyncing(true);
    setSyncMessage('正在从云端下载数据...');

    try {
      const cloudSettings = await getUserSettings(currentUser);
      const cloudWebsites = await getUserWebsites(currentUser);

      if (cloudSettings) {
        setCardOpacity(cloudSettings.cardOpacity);
        setSearchBarOpacity(cloudSettings.searchBarOpacity);
        setParallaxEnabled(cloudSettings.parallaxEnabled);
        setWallpaperResolution(cloudSettings.wallpaperResolution);
        setCardColor(cloudSettings.cardColor);
        setSearchBarColor(cloudSettings.searchBarColor);
        setAutoSyncEnabled(cloudSettings.autoSyncEnabled);
        setAutoSyncInterval(cloudSettings.autoSyncInterval);
        setAutoSortEnabled(cloudSettings.autoSortEnabled ?? false); // 提供默认值
        localStorage.setItem('theme', cloudSettings.theme || 'light');
      }

      if (cloudWebsites) {
        setWebsites(cloudWebsites);
      }

      // 更新同步状态
      updateSyncStatus({
        syncInProgress: false,
        lastSyncTime: new Date(),
        syncError: null,
        pendingChanges: 0
      });

      setSyncMessage('✅ 数据已成功从云端下载');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (error) {
      setSyncMessage('❌ 下载失败: ' + (error instanceof Error ? error.message : '未知错误'));
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none">
      {/* 背景遮罩 - 增强模糊效果 */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        className="w-[420px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 max-h-[85vh] flex flex-col select-none overflow-hidden"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      >
        {/* 简洁的顶部标题栏 */}
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
        {/* 主要内容区域 - 优化滚动和间距 */}
        <div className="flex-1 px-6 py-4 pb-6 space-y-8 overflow-y-auto select-none custom-scrollbar">

          {/* 账号管理部分 - 现代化设计 */}
          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-user text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">账号管理</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            {currentUser ? (
              <div className="space-y-4">
                {/* 用户信息卡片 - 现代化升级版 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <i className="fa-solid fa-cat text-white text-2xl"></i>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${currentUser.email_confirmed_at ? 'bg-white' : 'bg-white'
                          }`}>
                          <i className={`fa-solid ${currentUser.email_confirmed_at ? 'fa-envelope-circle-check text-emerald-500' : 'fa-envelope-open text-amber-500'
                            } text-xs flex items-center justify-center w-full h-full`}></i>
                        </div>
                      </div>
                      <div className="flex-1">
                        {isEditingName ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="w-full px-2 py-1 text-lg font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              placeholder="请输入用户名"
                              maxLength={20}
                              disabled={nameLoading}
                              autoFocus
                            />

                            {nameError && (
                              <p className="text-xs text-red-600 select-none">{nameError}</p>
                            )}

                            <div className="flex space-x-2 select-none">
                              <button
                                onClick={handleSaveName}
                                disabled={nameLoading || !newName.trim()}
                                className="text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-2 py-1 rounded select-none"
                              >
                                {nameLoading ? (
                                  <>
                                    <i className="fa-solid fa-spinner fa-spin mr-1 select-none"></i>
                                    <span className="select-none">保存中...</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-check mr-1 select-none"></i>
                                    <span className="select-none">保存</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={handleCancelName}
                                disabled={nameLoading}
                                className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded select-none"
                              >
                                <i className="fa-solid fa-times mr-1 select-none"></i>
                                <span className="select-none">取消</span>
                              </button>
                            </div>

                            <p className="text-xs text-gray-500 select-none">
                              支持中文、英文、数字、下划线和短横线，2-20个字符
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="text-left hover:bg-blue-50/50 rounded-lg p-1 transition-colors duration-200 group w-full"
                          >
                            <div className="text-lg font-semibold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors duration-200 select-none">
                              {displayName || '用户'}
                              <i className="fa-solid fa-edit text-xs text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-500 transition-all duration-200 ml-2 select-none"></i>
                            </div>
                          </button>
                        )}
                        <div className="flex items-center gap-2 mt-2 select-none">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium select-none ${currentUser.email_confirmed_at
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300'
                            : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-300'
                            }`}>
                            <i className={`fa-solid ${currentUser.email_confirmed_at ? 'fa-shield-check' : 'fa-envelope'
                              } text-xs ${currentUser.email_confirmed_at ? 'text-emerald-500' : 'text-amber-500'
                              } select-none`}></i>
                            <span className="select-none">{currentUser.email_confirmed_at ? '邮箱已验证' : '待验证邮箱'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 邮箱信息显示 */}
                    <div className="border-t border-blue-200/50 pt-3 select-none">
                      <div className="flex items-center justify-between select-none">
                        <div className="flex items-center space-x-2 select-none">
                          <i className="fa-solid fa-envelope text-indigo-500 text-sm select-none"></i>
                          <span className="text-xs text-gray-600 select-none">{currentUser.email}</span>
                        </div>
                        <i className="fa-solid fa-check-circle text-green-500 text-xs select-none" title="邮箱已验证"></i>
                      </div>
                    </div>

                    {/* 优雅的退出登录 */}
                    <div className="mt-4 pt-4 border-t border-blue-200/50 select-none">
                      <button
                        onClick={async () => {
                          try {
                            await logout();
                            handleClose(); // 登出后关闭设置面板
                          } catch (error) {
                            console.error('登出失败:', error);
                          }
                        }}
                        className="group flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-all duration-200 select-none"
                      >
                        <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 select-none">
                          <i className="fa-solid fa-arrow-right-from-bracket text-xs select-none"></i>
                        </div>
                        <span className="font-medium select-none">退出登录</span>
                        <i className="fa-solid fa-arrow-right text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <i className="fa-solid fa-cat text-white text-xl"></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-slate-800 mb-1 select-none">账号登录</div>
                      <div className="text-sm text-slate-600 select-none">登录后可同步数据到云端</div>
                    </div>
                  </div>

                  <AuthForm onSuccess={handleClose} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-cloud text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">云端同步</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            {/* 同步控制区域 - 现代化卡片 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-5">
              {/* 同步状态显示 */}
              <SyncStatusIndicator />

              {/* 分割线 */}
              <div className="border-t border-gray-100"></div>

              {/* 自动同步开关 */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 select-none">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${autoSyncEnabled ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
                      <i className={`fa-solid text-sm ${autoSyncEnabled ? 'fa-sync' : 'fa-hand-paper'} select-none`}></i>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 select-none">
                      {autoSyncEnabled ? '自动同步模式' : '手动同步模式'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 ml-11 select-none">
                    {autoSyncEnabled ? '数据变化后自动同步到云端，保持实时更新' : '需要手动操作同步数据，完全由您控制'}
                  </p>
                </div>
                <button
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${autoSyncEnabled ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-300/50' : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${autoSyncEnabled ? 'translate-x-6 shadow-blue-200' : 'translate-x-1 shadow-gray-200'
                      }`}
                  />
                </button>
              </div>

              {/* 自动同步间隔设置 */}
              {autoSyncEnabled && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 select-none">
                      同步间隔
                    </label>
                    <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                      {autoSyncInterval}秒
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={autoSyncInterval}
                    onChange={(e) => setAutoSyncInterval(parseInt(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((autoSyncInterval - 3) / 57) * 100}%, #e2e8f0 ${((autoSyncInterval - 3) / 57) * 100}%, #e2e8f0 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 select-none">
                    <span className="select-none">3秒</span>
                    <span className="text-green-600 select-none">快速</span>
                    <span className="text-blue-600 select-none">平衡</span>
                    <span className="text-purple-600 select-none">悠闲</span>
                    <span className="select-none">60秒</span>
                  </div>
                </div>
              )}

              {/* 手动同步按钮 */}
              {!autoSyncEnabled && currentUser && currentUser.email_confirmed_at && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleUploadToCloud}
                      disabled={isManualSyncing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg select-none"
                    >
                      <i className={`fa-solid ${isManualSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} select-none`}></i>
                      <span className="select-none">{isManualSyncing ? '上传中...' : '上传到云端'}</span>
                    </button>
                    <button
                      onClick={handleDownloadFromCloud}
                      disabled={isManualSyncing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg select-none"
                    >
                      <i className={`fa-solid ${isManualSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-download-alt'} select-none`}></i>
                      <span className="select-none">{isManualSyncing ? '下载中...' : '从云端下载'}</span>
                    </button>
                  </div>
                  {syncMessage && (
                    <div className={`text-xs text-center px-3 py-2 rounded-lg ${syncMessage.includes('✅') ? 'text-green-700 bg-green-50 border border-green-200' :
                      syncMessage.includes('❌') ? 'text-red-700 bg-red-50 border border-red-200' :
                        'text-blue-700 bg-blue-50 border border-blue-200'
                      }`}>
                      {syncMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-palette text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">外观设置</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            {/* 透明度控制区域 - 现代化卡片 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-5">
              {/* 搜索框不透明度控制 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-search text-blue-500 text-sm"></i>
                    <label className="text-sm font-medium text-gray-700 select-none">
                      搜索框不透明度
                    </label>
                  </div>
                  <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded select-none">
                    {Math.round(searchBarOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.01"
                  value={searchBarOpacity}
                  onChange={(e) => setSearchBarOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((searchBarOpacity - 0.05) / 0.45) * 100}%, #e2e8f0 ${((searchBarOpacity - 0.05) / 0.45) * 100}%, #e2e8f0 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 select-none">
                  <span className="select-none">5%</span>
                  <span className="text-gray-600 select-none">透明</span>
                  <span className="text-gray-600 select-none">清晰</span>
                  <span className="select-none">50%</span>
                </div>
              </div>

              {/* 搜索框颜色选择 */}
              <div className="pt-2 border-t border-gray-100/60">
                <ColorPicker
                  label="搜索框颜色"
                  selectedColor={searchBarColor}
                  onChange={setSearchBarColor}
                />
              </div>

              {/* 卡片不透明度控制 */}
              <div className="space-y-3 pt-4 border-t border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-layer-group text-blue-500 text-sm"></i>
                    <label className="text-sm font-medium text-gray-700 select-none">
                      卡片不透明度
                    </label>
                  </div>
                  <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded select-none">
                    {Math.round(cardOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.01"
                  value={cardOpacity}
                  onChange={(e) => setCardOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((cardOpacity - 0.05) / 0.45) * 100}%, #e2e8f0 ${((cardOpacity - 0.05) / 0.45) * 100}%, #e2e8f0 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 select-none">
                  <span className="select-none">5%</span>
                  <span className="text-gray-600 select-none">透明</span>
                  <span className="text-gray-600 select-none">清晰</span>
                  <span className="select-none">50%</span>
                </div>
              </div>

              {/* 卡片颜色选择 */}
              <div className="pt-2 border-t border-gray-100/60">
                <ColorPicker
                  label="卡片颜色"
                  selectedColor={cardColor}
                  onChange={setCardColor}
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-cogs text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">功能管理</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            {/* 特效设置区域 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
              {/* 视差效果开关 */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-mouse text-blue-500 text-sm"></i>
                    <span className="text-sm font-medium text-gray-700 select-none">
                      视差背景效果
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 select-none">
                    {parallaxEnabled ? '背景会跟随鼠标轻微移动' : '背景固定不动'}
                  </p>
                </div>
                <button
                  onClick={() => setParallaxEnabled(!parallaxEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${parallaxEnabled ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-300/50' : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${parallaxEnabled ? 'translate-x-6 shadow-blue-200' : 'translate-x-1 shadow-gray-200'
                      }`}
                  />
                </button>
              </div>

              <div className="border-t border-gray-100"></div>

              {/* 搜索行为开关 */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-external-link-alt text-blue-500 text-sm"></i>
                    <span className="text-sm font-medium text-gray-700 select-none">
                      搜索打开方式
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 select-none">
                    {searchInNewTab ? '在新标签页中打开搜索结果' : '在当前页面直接跳转'}
                  </p>
                </div>
                <button
                  onClick={() => setSearchInNewTab(!searchInNewTab)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${searchInNewTab ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-300/50' : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${searchInNewTab ? 'translate-x-6 shadow-blue-200' : 'translate-x-1 shadow-gray-200'
                      }`}
                  />
                </button>
              </div>

              <div className="border-t border-gray-100"></div>

              {/* 自动排序开关 */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-sort text-blue-500 text-sm"></i>
                    <span className="text-sm font-medium text-gray-700 select-none">
                      卡片自动排序
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 select-none">
                    {autoSortEnabled ? '按访问次数自动排序卡片' : '保持手动拖拽的顺序'}
                  </p>
                </div>
                <button
                  onClick={() => setAutoSortEnabled(!autoSortEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${autoSortEnabled ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-300/50' : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${autoSortEnabled ? 'translate-x-6 shadow-blue-200' : 'translate-x-1 shadow-gray-200'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-image text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">壁纸设置</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            {/* 壁纸设置区域 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-5">

              {/* 壁纸分辨率选择 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-image text-blue-500 text-sm"></i>
                    <label className="text-sm font-medium text-gray-700 select-none">
                      壁纸分辨率
                    </label>
                  </div>
                  <div className="relative group">
                    <i className="fa-solid fa-info-circle text-gray-400 text-xs cursor-help"></i>
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      💡 更改分辨率后会重新加载壁纸并更新缓存
                      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 select-none">
                  {[
                    { value: '4k', label: '4K 超高清', desc: '大屏设备', icon: 'fa-desktop' },
                    { value: '1080p', label: '1080p 高清', desc: '推荐', icon: 'fa-laptop' },
                    { value: '720p', label: '720p 标清', desc: '网络较慢', icon: 'fa-wifi' },
                    { value: 'mobile', label: '竖屏壁纸', desc: '移动设备', icon: 'fa-mobile-alt' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setWallpaperResolution(option.value as WallpaperResolution)}
                      className={`group p-3 rounded-lg border-2 transition-all duration-200 text-left select-none cursor-pointer ${wallpaperResolution === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <i className={`fa-solid ${option.icon} text-sm transition-colors ${wallpaperResolution === option.value ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                          } select-none`}></i>
                        <div className="font-medium text-sm select-none">{option.label}</div>
                      </div>
                      <div className="text-xs text-gray-500 select-none">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义壁纸管理 */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-upload text-blue-500 text-sm"></i>
                      <span className="text-sm font-medium text-gray-700">自定义壁纸</span>
                    </div>
                    <div className="relative group">
                      <i className="fa-solid fa-info-circle text-gray-400 text-xs cursor-help"></i>
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        <div className="space-y-1">
                          <div>• 支持 JPG、PNG、WebP 格式</div>
                          <div>• 文件大小不超过 10MB</div>
                          <div>• 图片会自动压缩优化</div>
                          {customWallpaperInfo.exists && (
                            <div>• 当前壁纸: {customWallpaperInfo.sizeText}</div>
                          )}
                        </div>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>

                  {/* 自定义壁纸选项卡 */}
                  <button
                    onClick={() => setWallpaperResolution('custom')}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left select-none cursor-pointer ${wallpaperResolution === 'custom'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <i className={`fa-solid fa-image text-sm transition-colors ${wallpaperResolution === 'custom' ? 'text-blue-500' : 'text-gray-400'
                        } select-none`}></i>
                      <div className="font-medium text-sm select-none">自定义壁纸</div>
                      {customWallpaperInfo.exists && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          已上传
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 select-none">
                      {customWallpaperInfo.exists ? customWallpaperInfo.sizeText : '点击下方上传图片'}
                    </div>
                  </button>

                  {/* 拖拽上传区域 */}
                  <div className="flex gap-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleWallpaperUpload}
                      className="hidden"
                      id="wallpaper-upload"
                      disabled={uploadingWallpaper}
                    />
                    <div
                      className={`flex-1 relative ${uploadingWallpaper ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      onDrop={handleWallpaperDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                    >
                      <label
                        htmlFor="wallpaper-upload"
                        className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border-2 border-dashed transition-all w-full ${uploadingWallpaper
                          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isDragOver
                            ? 'border-blue-500 bg-blue-100 text-blue-700'
                            : isGlobalDragOver
                              ? 'border-blue-400 bg-blue-50 text-blue-600 animate-pulse'
                              : 'border-blue-300 bg-white text-blue-600 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                      >
                        {uploadingWallpaper ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <span>上传中...</span>
                          </>
                        ) : isDragOver ? (
                          <>
                            <i className="fa-solid fa-hand-point-down text-lg"></i>
                            <span>拖动到此处上传</span>
                          </>
                        ) : isGlobalDragOver ? (
                          <>
                            <i className="fa-solid fa-download text-lg"></i>
                            <span>拖动到此处上传壁纸</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-upload-alt"></i>
                            <span>{customWallpaperInfo.exists ? '更换壁纸' : '点击或拖拽上传壁纸'}</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* 删除按钮 */}
                    {customWallpaperInfo.exists && (
                      <button
                        onClick={handleDeleteCustomWallpaper}
                        className="px-4 py-3 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                        disabled={uploadingWallpaper}
                        title="删除自定义壁纸"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-layer-group text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">卡片管理</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-layer-group text-white text-sm"></i>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 select-none">卡片收藏</div>
                    <div className="text-xs text-gray-500 select-none">当前有 {websites.length} 个卡片</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAddCardModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] select-none"
              >
                <i className="fa-solid fa-plus select-none"></i>
                <span className="select-none">添加新卡片</span>
              </button>
            </div>
          </div>

          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-database text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">数据管理</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-database text-white text-sm"></i>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800 select-none">备份与恢复</div>
                  <div className="text-xs text-gray-500 select-none">导出或导入您的数据</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 select-none">
                <button
                  onClick={exportData}
                  disabled={isExporting}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 select-none ${isExporting
                    ? 'bg-gray-400 cursor-not-allowed text-white shadow-lg shadow-gray-400/30'
                    : 'bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-600/40 hover:scale-[1.02]'
                    }`}
                >
                  {isExporting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin select-none"></i>
                      <span className="select-none">导出中</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-download select-none"></i>
                      <span className="select-none">导出数据</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 select-none ${isImporting
                    ? 'bg-gray-400 cursor-not-allowed text-white shadow-lg shadow-gray-400/30'
                    : 'bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-600/40 hover:scale-[1.02]'
                    }`}
                >
                  {isImporting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin select-none"></i>
                      <span className="select-none">导入中</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-upload select-none"></i>
                      <span className="select-none">导入数据</span>
                    </>
                  )}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 select-none">
                <div className="flex items-start gap-2 select-none">
                  <i className="fa-solid fa-exclamation-triangle text-amber-500 text-sm mt-0.5 select-none"></i>
                  <div className="select-none">
                    <div className="text-xs font-medium text-amber-700 mb-1 select-none">重要提醒</div>
                    <div className="text-xs text-amber-600 select-none">
                      导入会覆盖所有当前数据，建议先导出备份
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 隐私与帮助 */}
          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-shield-halved text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">隐私与帮助</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-shield-halved text-white text-sm"></i>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800 select-none">隐私与帮助</div>
                  <div className="text-xs text-gray-500 select-none">管理隐私设置和查看使用教程</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setShowPrivacySettings(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] select-none"
                >
                  <i className="fa-solid fa-shield-halved select-none"></i>
                  <span className="select-none">隐私设置</span>
                </button>

                <a
                  href={`${import.meta.env.BASE_URL}tutorial.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] select-none"
                  style={{ textDecoration: 'none' }}
                >
                  <i className="fa-solid fa-graduation-cap select-none"></i>
                  <span className="select-none">使用教程</span>
                  <i className="fa-solid fa-external-link-alt text-xs opacity-70 select-none"></i>
                </a>
              </div>

              {/* 图标修复功能 */}
              <div className="pt-3 border-t border-gray-100">
                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-500 select-none">
                    图标显示不正确？<button
                      onClick={handleFixIcons}
                      disabled={isFixingIcons}
                      className="text-blue-500 hover:text-blue-600 underline ml-1 disabled:text-gray-400 disabled:no-underline"
                    >
                      点击修复
                    </button>
                  </p>

                  {fixIconsMessage && (
                    <div className={`text-xs px-3 py-2 rounded-lg ${fixIconsMessage.includes('✅') ? 'text-green-700 bg-green-50 border border-green-200' :
                      fixIconsMessage.includes('❌') ? 'text-red-700 bg-red-50 border border-red-200' :
                        'text-blue-700 bg-blue-50 border border-blue-200'
                      }`}>
                      {isFixingIcons && !fixIconsMessage.includes('✅') && !fixIconsMessage.includes('❌') && (
                        <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                      )}
                      {fixIconsMessage}
                    </div>
                  )}
                </div>
              </div>
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

      {/* 隐私设置面板 */}
      {showPrivacySettings && (
        <PrivacySettings
          isOpen={showPrivacySettings}
          onClose={() => setShowPrivacySettings(false)}
        />
      )}

      {/* 导入确认对话框 */}
      <ConfirmModal
        isOpen={showImportConfirm}
        onClose={() => {
          setShowImportConfirm(false);
          setPendingImportFile(null);
        }}
        onConfirm={confirmImportData}
        title="确认导入数据"
        message="⚠️ 导入数据前请注意：

• 导入会完全覆盖当前所有数据
• 包括所有网站卡片、透明度设置、主题等
• 建议先导出当前数据作为备份

确定要继续导入吗？"
        confirmText="确定导入"
        cancelText="取消"
        type="warning"
      />
    </div>
  );
}

