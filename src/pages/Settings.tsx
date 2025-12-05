import { useState, useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import CardEditModal from '@/components/CardEditModal';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import AuthForm from '@/components/AuthForm';
import PrivacySettings from '@/components/PrivacySettings';
import ConfirmModal from '@/components/ConfirmModal';
import { ColorPicker } from '@/components/ColorPicker';
import UserStatsDisplay from '@/components/UserStatsDisplay';
import { userStatsManager } from '@/hooks/useUserStats';
import { useTransparency, WallpaperResolution } from '@/contexts/TransparencyContext';
import { customWallpaperManager } from '@/lib/customWallpaperManager';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSyncStatus } from '@/contexts/SyncContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import {
  WebsiteData,
  UserSettings,
  saveUserSettings,
  getUserSettings,
  saveUserWebsites,
  getUserWebsites,
} from '@/lib/supabaseSync';
import { useDataManager } from '@/hooks/useDataManager';
import { faviconCache } from '@/lib/faviconCache';

interface SettingsProps {
  onClose: () => void;
  websites: WebsiteData[];
  setWebsites: (websites: WebsiteData[]) => void;
  onSettingsClose?: () => void; // 可选的关闭回调，用于触发同步
}

function SettingsComponent({ onClose, websites, setWebsites, onSettingsClose }: SettingsProps) {
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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 自定义壁纸相关状态
  const [customWallpaperInfo, setCustomWallpaperInfo] = useState<{
    exists: boolean;
    size?: number;
    sizeText?: string;
  }>({ exists: false });
  const [uploadingWallpaper, setUploadingWallpaper] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);
  const [wallpapers, setWallpapers] = useState<
    Array<{ metadata: any; thumbnailUrl: string; isActive: boolean }>
  >([]);
  const [showWallpaperGallery, setShowWallpaperGallery] = useState(false);
  const [previewWallpaper, setPreviewWallpaper] = useState<{
    metadata: any;
    fullImageUrl: string;
  } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showUserStatsModal, setShowUserStatsModal] = useState(false);
  
  // 记录上一次选择的必应壁纸分辨率，用于切换回必应模式时恢复
  const [lastBingResolution, setLastBingResolution] = useState<WallpaperResolution>('1080p');

  // 使用统一的数据管理Hook
  const { exportAllData, importAllData, isExporting, isImporting } = useDataManager(
    websites,
    setWebsites
  );
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
    timeComponentEnabled,
    showFullDate,
    showSeconds,
    showWeekday,
    showYear,
    showMonth,
    showDay,
    searchBarBorderRadius,
    animationStyle,
    setCardOpacity,
    setSearchBarOpacity,
    setParallaxEnabled,
    setWallpaperResolution,
    setIsSettingsOpen,
    setCardColor,
    setSearchBarColor,
    setAutoSyncEnabled,
    setAutoSyncInterval,
    setSearchInNewTab,
    setAutoSortEnabled,
    setTimeComponentEnabled,
    setShowFullDate,
    setShowSeconds,
    setShowWeekday,
    setShowYear,
    setShowMonth,
    setShowDay,
    setSearchBarBorderRadius,
    setAnimationStyle,
  } = useTransparency();
  const { currentUser, logout, updatePassword } = useAuth();
  const { updateSyncStatus } = useSyncStatus();
  const { displayName, updateDisplayName } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当 displayName 更新时，同步更新 newName
  useEffect(() => {
    setNewName(displayName || '');
  }, [displayName]);

  // 记录非自定义模式下的分辨率选择
  useEffect(() => {
    if (wallpaperResolution !== 'custom') {
      setLastBingResolution(wallpaperResolution);
    }
  }, [wallpaperResolution]);

  // 记录设置页面打开次数
  useEffect(() => {
    userStatsManager.recordSettingsOpen();
  }, []);

  // 加载自定义壁纸信息
  useEffect(() => {
    const loadCustomWallpaperInfo = async () => {
      const info = await customWallpaperManager.getWallpaperInfo();
      setCustomWallpaperInfo(info);
    };
    loadCustomWallpaperInfo();
    loadWallpapers(); // 同时加载壁纸列表
  }, []);

  // 加载壁纸列表
  const loadWallpapers = async () => {
    try {
      const list = await customWallpaperManager.getAllWallpapers();
      setWallpapers(list);
    } catch (error) {
      console.error('加载壁纸列表失败:', error);
    }
  };

  // 全局拖拽检测
  useEffect(() => {
    let dragCounter = 0;

    const handleGlobalDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;

      // 检查是否拖拽的是图片文件
      const items = Array.from(e.dataTransfer?.items || []);
      const hasImageFile = items.some((item) => item.type.startsWith('image/'));

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

      if (result.success && result.id) {
        setSyncMessage('✅ 自定义壁纸上传成功！页面即将刷新...');

        // 延迟后刷新页面以应用新壁纸
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setSyncMessage(result.error || '上传失败');
        setTimeout(() => setSyncMessage(''), 3000);
        setUploadingWallpaper(false);
      }
    } catch (error) {
      setSyncMessage('上传失败，请重试');
      setTimeout(() => setSyncMessage(''), 3000);
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
    const imageFile = files.find((file) => file.type.startsWith('image/'));

    if (imageFile) {
      await processWallpaperFile(imageFile);
    } else {
      setSyncMessage('请拖拽图片文件 (JPG、PNG、WebP)');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  // 删除指定壁纸
  const handleDeleteWallpaper = async (id: string) => {
    const success = await customWallpaperManager.deleteWallpaper(id);

    if (success) {
      // 重新加载壁纸信息
      const info = await customWallpaperManager.getWallpaperInfo();
      setCustomWallpaperInfo(info);

      // 重新加载壁纸列表
      await loadWallpapers();

      // 如果删除的是当前使用的壁纸，且没有其他自定义壁纸，切换到默认分辨率
      if (!info.exists && wallpaperResolution === 'custom') {
        setWallpaperResolution('1080p');
      }

      setSyncMessage('壁纸已删除');
      setTimeout(() => setSyncMessage(''), 3000);
    } else {
      setSyncMessage('删除失败，请重试');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  // 选择/激活壁纸
  const handleSelectWallpaper = async (id: string) => {
    const success = await customWallpaperManager.setCurrentWallpaper(id);

    if (success) {
      setSyncMessage('✅ 壁纸已切换，页面即将刷新...');

      // 延迟后刷新页面以应用新壁纸
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      setSyncMessage('❌ 切换失败，请重试');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  // 预览壁纸（加载原图）
  const handlePreviewWallpaper = async (wallpaper: { metadata: any; thumbnailUrl: string }) => {
    setLoadingPreview(true);
    setShowPreviewModal(true);

    try {
      // 获取原图URL
      const fullImageUrl = await customWallpaperManager.getWallpaperFullImage(wallpaper.metadata.id);

      if (fullImageUrl) {
        setPreviewWallpaper({
          metadata: wallpaper.metadata,
          fullImageUrl,
        });
      } else {
        setSyncMessage('❌ 加载预览失败');
        setTimeout(() => setSyncMessage(''), 3000);
        setShowPreviewModal(false);
      }
    } catch (error) {
      setSyncMessage('❌ 加载预览失败');
      setTimeout(() => setSyncMessage(''), 3000);
      setShowPreviewModal(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  // 下载壁纸
  const handleDownloadWallpaper = async (id: string) => {
    const success = await customWallpaperManager.downloadWallpaper(id);

    if (success) {
      setSyncMessage('✅ 壁纸已下载');
      setTimeout(() => setSyncMessage(''), 2000);
    } else {
      setSyncMessage('❌ 下载失败，请重试');
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

  // 处理密码修改
  const handleChangePassword = async () => {
    setPasswordError('');

    // 验证密码
    if (!newPassword || !confirmPassword) {
      setPasswordError('请填写完整密码信息');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('密码至少需要6位字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    setPasswordLoading(true);

    try {
      await updatePassword(newPassword);
      // 成功后重置表单
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      alert('✅ 密码修改成功！');
    } catch (error) {
      console.error('修改密码失败:', error);
      setPasswordError((error as Error).message || '修改密码失败，请重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 取消密码���改
  const handleCancelChangePassword = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowChangePassword(false);
  };

  // 设置页面打开时暂时关闭视差
  useEffect(() => {
    setIsSettingsOpen(true);
    return () => setIsSettingsOpen(false);
  }, [setIsSettingsOpen]);

  // ESC键关闭设置页面
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleClose = () => {
    setIsSettingsOpen(false);
    // 触发同步（如果设置了回调）
    onSettingsClose?.();
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
      lastVisit: new Date().toISOString().split('T')[0],
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
        searchInNewTab,
        autoSortEnabled,
        timeComponentEnabled,
        showFullDate,
        showSeconds,
        showWeekday,
        showYear,
        showMonth,
        showDay,
        searchBarBorderRadius,
        lastSync: new Date().toISOString(),
      };

      await saveUserSettings(currentUser, settings);
      await saveUserWebsites(currentUser, websites);

      // 更新同步状态
      updateSyncStatus({
        syncInProgress: false,
        lastSyncTime: new Date(),
        syncError: null,
        pendingChanges: 0,
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

        // 新增设置项的同步
        setSearchInNewTab(cloudSettings.searchInNewTab ?? true);
        setAutoSortEnabled(cloudSettings.autoSortEnabled ?? false);
        setTimeComponentEnabled(cloudSettings.timeComponentEnabled ?? true);
        setShowFullDate(cloudSettings.showFullDate ?? true);
        setShowSeconds(cloudSettings.showSeconds ?? true);
        setShowWeekday(cloudSettings.showWeekday ?? true);
        setShowYear(cloudSettings.showYear ?? true);
        setShowMonth(cloudSettings.showMonth ?? true);
        setShowDay(cloudSettings.showDay ?? true);
        setSearchBarBorderRadius(cloudSettings.searchBarBorderRadius ?? 12);

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
        pendingChanges: 0,
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
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 select-none">
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
                        <div
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${
                            currentUser.email_confirmed_at ? 'bg-white' : 'bg-white'
                          }`}
                        >
                          <i
                            className={`fa-solid ${
                              currentUser.email_confirmed_at
                                ? 'fa-envelope-circle-check text-emerald-500'
                                : 'fa-envelope-open text-amber-500'
                            } text-xs flex items-center justify-center w-full h-full`}
                          ></i>
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
                                className="text-xs bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:bg-gray-400 text-white px-2 py-1 rounded select-none"
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
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium select-none ${
                              currentUser.email_confirmed_at
                                ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300'
                                : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-300'
                            }`}
                          >
                            <i
                              className={`fa-solid ${
                                currentUser.email_confirmed_at ? 'fa-shield-check' : 'fa-envelope'
                              } text-xs ${
                                currentUser.email_confirmed_at
                                  ? 'text-emerald-500'
                                  : 'text-amber-500'
                              } select-none`}
                            ></i>
                            <span className="select-none">
                              {currentUser.email_confirmed_at ? '邮箱已验证' : '待验证邮箱'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 邮箱信息显示 */}
                    <div className="border-t border-blue-200/50 pt-3 select-none">
                      <div className="flex items-center justify-between select-none">
                        <div className="flex items-center space-x-2 select-none">
                          <i className="fa-solid fa-envelope text-indigo-500 text-sm select-none"></i>
                          <span className="text-xs text-gray-600 select-none">
                            {currentUser.email}
                          </span>
                        </div>
                        <i
                          className="fa-solid fa-check-circle text-green-500 text-xs select-none"
                          title="邮箱已验证"
                        ></i>
                      </div>
                    </div>

                    {/* 密码修改区域 */}
                    <div className="mt-4 pt-4 border-t border-blue-200/50 select-none">
                      {!showChangePassword ? (
                        <button
                          onClick={() => setShowChangePassword(true)}
                          className="group flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-all duration-200 select-none"
                        >
                          <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 select-none">
                            <i className="fa-solid fa-key text-xs select-none"></i>
                          </div>
                          <span className="font-medium select-none">修改密码</span>
                          <i className="fa-solid fa-arrow-right text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none"></i>
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <i className="fa-solid fa-key text-blue-500 text-sm"></i>
                              <span className="text-sm font-medium text-gray-700 select-none">修改密码</span>
                            </div>
                            <button
                              onClick={handleCancelChangePassword}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </div>

                          {passwordError && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                              {passwordError}
                            </div>
                          )}

                          <div>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              placeholder="请输入新密码（至少6位）"
                              disabled={passwordLoading}
                            />
                          </div>

                          <div>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              placeholder="请再次输入新密码"
                              disabled={passwordLoading}
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleChangePassword}
                              disabled={passwordLoading || !newPassword || !confirmPassword}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm rounded-lg transition-all duration-200 select-none"
                            >
                              {passwordLoading ? (
                                <>
                                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                                  <span>修改中...</span>
                                </>
                              ) : (
                                <>
                                  <i className="fa-solid fa-check text-xs"></i>
                                  <span>确认修改</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelChangePassword}
                              disabled={passwordLoading}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors select-none"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}
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
                      <div className="text-lg font-semibold text-slate-800 mb-1 select-none">
                        账号登录
                      </div>
                      <div className="text-sm text-slate-600 select-none">
                        登录后可同步数据到云端
                      </div>
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
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${autoSyncEnabled ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}
                    >
                      <i
                        className={`fa-solid text-sm ${autoSyncEnabled ? 'fa-sync' : 'fa-hand-paper'} select-none`}
                      ></i>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 select-none">
                      {autoSyncEnabled ? '自动同步模式' : '手动同步模式'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 ml-11 select-none">
                    {autoSyncEnabled
                      ? '数据变化后自动同步到云端，保持实时更新'
                      : '需要手动操作同步数据，完全由您控制'}
                  </p>
                </div>
                <button
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${
                    autoSyncEnabled
                      ? 'bg-gradient-to-r from-blue-400 to-cyan-500 shadow-lg shadow-cyan-300/50'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                      autoSyncEnabled
                        ? 'translate-x-6 shadow-cyan-200'
                        : 'translate-x-1 shadow-gray-200'
                    }`}
                  />
                </button>
              </div>

              {/* 自动同步间隔设置 */}
              {autoSyncEnabled && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 select-none">
                      数据变化后延迟同步
                    </label>
                    <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                      {autoSyncInterval}秒
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 select-none">
                    数据变化后等待此时间再同步，避免频繁请求。关闭设置或保存卡片时会立即同步。
                  </p>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={autoSyncInterval}
                    onChange={(e) => setAutoSyncInterval(parseInt(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((autoSyncInterval - 3) / 57) * 100}%, #e2e8f0 ${((autoSyncInterval - 3) / 57) * 100}%, #e2e8f0 100%)`,
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
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-400 to-cyan-500 text-white text-sm rounded-lg hover:from-blue-500 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg select-none"
                    >
                      <i
                        className={`fa-solid ${isManualSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} select-none`}
                      ></i>
                      <span className="select-none">
                        {isManualSyncing ? '上传中...' : '上传到云端'}
                      </span>
                    </button>
                    <button
                      onClick={handleDownloadFromCloud}
                      disabled={isManualSyncing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-400 to-cyan-500 text-white text-sm rounded-lg hover:from-blue-500 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg select-none"
                    >
                      <i
                        className={`fa-solid ${isManualSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-download-alt'} select-none`}
                      ></i>
                      <span className="select-none">
                        {isManualSyncing ? '下载中...' : '从云端下载'}
                      </span>
                    </button>
                  </div>
                  {syncMessage && (
                    <div
                      className={`text-xs text-center px-3 py-2 rounded-lg ${
                        syncMessage.includes('✅')
                          ? 'text-green-700 bg-green-50 border border-green-200'
                          : syncMessage.includes('❌')
                            ? 'text-red-700 bg-red-50 border border-red-200'
                            : 'text-blue-700 bg-blue-50 border border-blue-200'
                      }`}
                    >
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
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((searchBarOpacity - 0.05) / 0.45) * 100}%, #e2e8f0 ${((searchBarOpacity - 0.05) / 0.45) * 100}%, #e2e8f0 100%)`,
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

              {/* 搜索框圆角调节 */}
              <div className="space-y-3 pt-4 border-t border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-border-all text-blue-500 text-sm"></i>
                    <label className="text-sm font-medium text-gray-700 select-none">
                      搜索框圆角
                    </label>
                  </div>
                  <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded select-none">
                    {searchBarBorderRadius >= 50 ? '全圆角' : `${searchBarBorderRadius}px`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={searchBarBorderRadius >= 50 ? 50 : searchBarBorderRadius}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSearchBarBorderRadius(value === 50 ? 9999 : value);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(Math.min(searchBarBorderRadius, 50) / 50) * 100}%, #e2e8f0 ${(Math.min(searchBarBorderRadius, 50) / 50) * 100}%, #e2e8f0 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 select-none">
                  <span className="select-none">直角</span>
                  <span className="text-gray-600 select-none">圆角</span>
                  <span className="text-gray-600 select-none">全圆</span>
                </div>
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
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((cardOpacity - 0.05) / 0.45) * 100}%, #e2e8f0 ${((cardOpacity - 0.05) / 0.45) * 100}%, #e2e8f0 100%)`,
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
                <ColorPicker label="卡片颜色" selectedColor={cardColor} onChange={setCardColor} />
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
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${
                    parallaxEnabled
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-purple-300/50'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                      parallaxEnabled
                        ? 'translate-x-6 shadow-purple-200'
                        : 'translate-x-1 shadow-gray-200'
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-gray-100"></div>

              <div className="border-t border-gray-100"></div>

              {/* 搜索行为开关 */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-external-link-alt text-blue-500 text-sm"></i>
                    <span className="text-sm font-medium text-gray-700 select-none">
                      链接打开方式
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 select-none">
                    {searchInNewTab ? '在新标签页中打开搜索结果和卡片' : '在当前页面直接跳转'}
                  </p>
                </div>
                <button
                  onClick={() => setSearchInNewTab(!searchInNewTab)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${
                    searchInNewTab
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-purple-300/50'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                      searchInNewTab
                        ? 'translate-x-6 shadow-purple-200'
                        : 'translate-x-1 shadow-gray-200'
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
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${
                    autoSortEnabled
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-purple-300/50'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                      autoSortEnabled
                        ? 'translate-x-6 shadow-purple-200'
                        : 'translate-x-1 shadow-gray-200'
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-gray-100"></div>

              {/* 动画样式开关 */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-wand-magic-sparkles text-blue-500 text-sm"></i>
                    <span className="text-sm font-medium text-gray-700 select-none">
                      动画样式
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 select-none">
                    {animationStyle === 'dynamic' ? '灵动弹簧动画，更多视觉反馈' : '简约平滑动画，更稳定流畅'}
                  </p>
                </div>
                <button
                  onClick={() => setAnimationStyle(animationStyle === 'dynamic' ? 'simple' : 'dynamic')}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${
                    animationStyle === 'dynamic'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-purple-300/50'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                      animationStyle === 'dynamic'
                        ? 'translate-x-6 shadow-purple-200'
                        : 'translate-x-1 shadow-gray-200'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-clock text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">时间设置</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            {/* 时间设置区域 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
              {/* 时间组件开关 */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-clock text-orange-500 text-sm"></i>
                    <span className="text-sm font-medium text-gray-700 select-none">
                      显示时间组件
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 select-none">
                    {timeComponentEnabled ? '在搜索框上方显示当前时间和日期' : '隐藏时间和日期显示'}
                  </p>
                </div>
                <button
                  onClick={() => setTimeComponentEnabled(!timeComponentEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${
                    timeComponentEnabled
                      ? 'bg-gradient-to-r from-orange-400 to-yellow-500 shadow-lg shadow-orange-300/50'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                      timeComponentEnabled
                        ? 'translate-x-6 shadow-orange-200'
                        : 'translate-x-1 shadow-gray-200'
                    }`}
                  />
                </button>
              </div>

              {timeComponentEnabled && (
                <>
                  <div className="border-t border-gray-100"></div>

                  {/* 年月日独立开关 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-calendar text-orange-500 text-sm"></i>
                      <span className="text-sm font-medium text-gray-700 select-none">
                        日期显示控制
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* 年份开关 */}
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() => setShowYear(!showYear)}
                          className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-center select-none cursor-pointer ${
                            showYear
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <i
                              className={`fa-solid fa-calendar-alt text-sm transition-colors ${
                                showYear ? 'text-orange-400' : 'text-gray-400'
                              } select-none`}
                            ></i>
                            <div className="font-medium text-sm select-none">年份</div>
                          </div>
                          <div className="text-xs text-gray-500 select-none">2024年</div>
                        </button>
                      </div>

                      {/* 月份开关 */}
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() => setShowMonth(!showMonth)}
                          className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-center select-none cursor-pointer ${
                            showMonth
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <i
                              className={`fa-solid fa-calendar-check text-sm transition-colors ${
                                showMonth ? 'text-orange-400' : 'text-gray-400'
                              } select-none`}
                            ></i>
                            <div className="font-medium text-sm select-none">月份</div>
                          </div>
                          <div className="text-xs text-gray-500 select-none">8月</div>
                        </button>
                      </div>

                      {/* 日期开关 */}
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() => setShowDay(!showDay)}
                          className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-center select-none cursor-pointer ${
                            showDay
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <i
                              className={`fa-solid fa-calendar-day text-sm transition-colors ${
                                showDay ? 'text-orange-400' : 'text-gray-400'
                              } select-none`}
                            ></i>
                            <div className="font-medium text-sm select-none">日期</div>
                          </div>
                          <div className="text-xs text-gray-500 select-none">28日</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100"></div>

                  {/* 显示星期开关 */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <i className="fa-solid fa-calendar-week text-orange-500 text-sm"></i>
                        <span className="text-sm font-medium text-gray-700 select-none">
                          显示星期
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 select-none">
                        {showWeekday ? '显示当前是星期几' : '隐藏星期信息'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowWeekday(!showWeekday)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${
                        showWeekday
                          ? 'bg-gradient-to-r from-orange-400 to-yellow-500 shadow-lg shadow-orange-300/50'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                          showWeekday
                            ? 'translate-x-6 shadow-orange-200'
                            : 'translate-x-1 shadow-gray-200'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="border-t border-gray-100"></div>

                  {/* 精确到秒设置 */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <i className="fa-solid fa-stopwatch text-orange-500 text-sm"></i>
                        <span className="text-sm font-medium text-gray-700 select-none">
                          精确到秒
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 select-none">
                        {showSeconds ? '显示精确的秒数时间' : '只显示时:分，冒号每秒闪烁'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSeconds(!showSeconds)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 ${
                        showSeconds
                          ? 'bg-gradient-to-r from-orange-400 to-yellow-500 shadow-lg shadow-orange-300/50'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-300/50'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                          showSeconds
                            ? 'translate-x-6 shadow-orange-200'
                            : 'translate-x-1 shadow-gray-200'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}
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
              {/* 模式切换 Tab */}
              <div className="flex p-1 bg-gray-100 rounded-xl select-none">
                <button
                  onClick={() => setWallpaperResolution(lastBingResolution)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    wallpaperResolution !== 'custom'
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="fa-solid fa-image"></i>
                  每日必应
                </button>
                <button
                  onClick={() => setWallpaperResolution('custom')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    wallpaperResolution === 'custom'
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="fa-solid fa-upload"></i>
                  自定义壁纸
                </button>
              </div>

              {/* 内容区域 */}
              <div className="min-h-[180px]">
                {wallpaperResolution !== 'custom' ? (
                  /* 必应壁纸分辨率选择 */
                  <div className="space-y-4 animate-fadeIn">
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
                        { value: 'mobile', label: '竖屏壁纸', desc: '移动设备', icon: 'fa-mobile-alt' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setWallpaperResolution(option.value as WallpaperResolution)}
                          className={`group p-3 rounded-lg border-2 transition-all duration-200 text-left select-none cursor-pointer ${
                            wallpaperResolution === option.value
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <i
                              className={`fa-solid ${option.icon} text-sm transition-colors ${
                                wallpaperResolution === option.value
                                  ? 'text-pink-500'
                                  : 'text-gray-400 group-hover:text-gray-500'
                              } select-none`}
                            ></i>
                            <div className="font-medium text-sm select-none">{option.label}</div>
                          </div>
                          <div className="text-xs text-gray-500 select-none">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* 自定义壁纸管理 */
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-upload text-blue-500 text-sm"></i>
                        <span className="text-sm font-medium text-gray-700">上传壁纸</span>
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
                          className={`flex items-center justify-center gap-2 px-4 py-8 text-sm font-medium rounded-lg border-2 border-dashed transition-all w-full ${
                            uploadingWallpaper
                              ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isDragOver
                                ? 'border-pink-500 bg-pink-100 text-pink-700'
                                : isGlobalDragOver
                                  ? 'border-pink-400 bg-pink-50 text-pink-600 animate-pulse'
                                  : 'border-pink-300 bg-white text-pink-600 hover:border-pink-400 hover:bg-pink-50'
                          }`}
                        >
                          <div className="text-center space-y-2">
                            {uploadingWallpaper ? (
                              <>
                                <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
                                <div>上传中...</div>
                              </>
                            ) : isDragOver ? (
                              <>
                                <i className="fa-solid fa-hand-point-down text-2xl"></i>
                                <div>松开鼠标上传</div>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-cloud-upload-alt text-2xl mb-1"></i>
                                <div>点击或拖拽上传壁纸</div>
                                <div className="text-xs text-gray-400 font-normal">支持 JPG, PNG, WebP</div>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* 壁纸管理按钮 */}
                    {wallpapers.length > 0 && (
                      <button
                        onClick={() => setShowWallpaperGallery(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      >
                        <i className="fa-solid fa-images"></i>
                        <span>管理壁纸库 ({wallpapers.length})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-layer-group text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">卡片管理</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-layer-group text-white text-sm"></i>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 select-none">卡片收藏</div>
                    <div className="text-xs text-gray-500 select-none">
                      当前有 {websites.length} 个卡片
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAddCardModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-b from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] select-none"
              >
                <i className="fa-solid fa-plus select-none"></i>
                <span className="select-none">添加新卡片</span>
              </button>
            </div>
          </div>

          <div className="space-y-5 select-none settings-section">
            <div className="flex items-center gap-3 select-none">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-database text-white text-xs"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-800 select-none">数据管理</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
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
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 select-none ${
                    isExporting
                      ? 'bg-gray-400 cursor-not-allowed text-white shadow-lg shadow-gray-400/30'
                      : 'bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:scale-[1.02]'
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
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 select-none ${
                    isImporting
                      ? 'bg-gray-400 cursor-not-allowed text-white shadow-lg shadow-gray-400/30'
                      : 'bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:scale-[1.02]'
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

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 select-none">
                <div className="flex items-start gap-2 select-none">
                  <i className="fa-solid fa-exclamation-triangle text-teal-500 text-sm mt-0.5 select-none"></i>
                  <div className="select-none">
                    <div className="text-xs font-medium text-teal-700 mb-1 select-none">
                      重要提醒
                    </div>
                    <div className="text-xs text-teal-600 select-none">
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
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-shield-halved text-white text-sm"></i>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800 select-none">隐私与帮助</div>
                  <div className="text-xs text-gray-500 select-none">
                    管理隐私设置和查看使用教程
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setShowPrivacySettings(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-b from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] select-none"
                >
                  <i className="fa-solid fa-shield-halved select-none"></i>
                  <span className="select-none">隐私设置</span>
                </button>

                <button
                  onClick={() => setShowUserStatsModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-b from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] select-none"
                >
                  <i className="fa-solid fa-chart-simple select-none"></i>
                  <span className="select-none">查看使用统计</span>
                </button>

                <a
                  href="/help/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-b from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] select-none"
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
                    图标显示不正确？
                    <button
                      onClick={handleFixIcons}
                      disabled={isFixingIcons}
                      className="text-purple-500 hover:text-purple-600 underline ml-1 disabled:text-gray-400 disabled:no-underline"
                    >
                      点击修复
                    </button>
                  </p>

                  {fixIconsMessage && (
                    <div
                      className={`text-xs px-3 py-2 rounded-lg ${
                        fixIconsMessage.includes('✅')
                          ? 'text-green-700 bg-green-50 border border-green-200'
                          : fixIconsMessage.includes('❌')
                            ? 'text-red-700 bg-red-50 border border-red-200'
                            : 'text-blue-700 bg-blue-50 border border-blue-200'
                      }`}
                    >
                      {isFixingIcons &&
                        !fixIconsMessage.includes('✅') &&
                        !fixIconsMessage.includes('❌') && (
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

      {/* 壁纸管理画廊 */}
      {showWallpaperGallery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWallpaperGallery(false)}
          />
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-images text-white"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">壁纸管理</h3>
                  <p className="text-sm text-gray-500">共 {wallpapers.length} 张壁纸</p>
                </div>
              </div>
              <button
                onClick={() => setShowWallpaperGallery(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* 壁纸网格 */}
            <div className="flex-1 overflow-y-auto p-6">
              {wallpapers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <i className="fa-solid fa-image text-6xl mb-4"></i>
                  <p className="text-lg">暂无壁纸</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {wallpapers.map((wallpaper) => (
                    <motion.div
                      key={wallpaper.metadata.id}
                      className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        wallpaper.isActive
                          ? 'border-pink-500 shadow-lg shadow-pink-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* 壁纸缩略图 */}
                      <div className="aspect-video bg-gray-100 relative">
                        <img
                          src={wallpaper.thumbnailUrl}
                          alt={wallpaper.metadata.name}
                          className="w-full h-full object-cover"
                        />

                        {/* 当前使用指示器 */}
                        {wallpaper.isActive && (
                          <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <i className="fa-solid fa-check"></i>
                            <span>使用中</span>
                          </div>
                        )}

                        {/* 悬浮操作按钮 */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          {/* 预览 */}
                          <button
                            onClick={() => handlePreviewWallpaper(wallpaper)}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                            title="预览"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>

                          {/* 使用 */}
                          {!wallpaper.isActive && (
                            <button
                              onClick={() => handleSelectWallpaper(wallpaper.metadata.id)}
                              className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white hover:bg-pink-600 transition-colors"
                              title="使用此壁纸"
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                          )}

                          {/* 下载 */}
                          <button
                            onClick={() => handleDownloadWallpaper(wallpaper.metadata.id)}
                            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                            title="下载"
                          >
                            <i className="fa-solid fa-download"></i>
                          </button>

                          {/* 删除 */}
                          <button
                            onClick={() => handleDeleteWallpaper(wallpaper.metadata.id)}
                            className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                            title="删除"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>

                      {/* 壁纸信息 */}
                      <div className="p-3 bg-white">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {wallpaper.metadata.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {wallpaper.metadata.width} × {wallpaper.metadata.height}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(wallpaper.metadata.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* 壁纸预览模态框 */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowPreviewModal(false);
              setPreviewWallpaper(null);
            }}
          />
          <motion.div
            className="relative max-w-6xl max-h-[90vh] mx-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => {
                setShowPreviewModal(false);
                setPreviewWallpaper(null);
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <i className="fa-solid fa-xmark text-3xl"></i>
            </button>

            {/* 预览图片 */}
            {loadingPreview ? (
              <div className="flex items-center justify-center w-96 h-64 bg-gray-800 rounded-xl">
                <div className="text-center text-white">
                  <i className="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
                  <p className="text-lg">正在加载原图...</p>
                </div>
              </div>
            ) : previewWallpaper ? (
              <>
                <img
                  src={previewWallpaper.fullImageUrl}
                  alt={previewWallpaper.metadata.name}
                  className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
                />

                {/* 图片信息 */}
                <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {previewWallpaper.metadata.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {previewWallpaper.metadata.width} × {previewWallpaper.metadata.height} •{' '}
                      {(previewWallpaper.metadata.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectWallpaper(previewWallpaper.metadata.id)}
                      className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-check"></i>
                      <span>使用此壁纸</span>
                    </button>
                    <button
                      onClick={() => handleDownloadWallpaper(previewWallpaper.metadata.id)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-download"></i>
                      <span>下载</span>
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        </div>
      )}

      {/* 使用统计模态框 */}
      {showUserStatsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserStatsModal(false)}
          />
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-chart-pie text-white text-sm"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">使用统计</h3>
              </div>
              <button
                onClick={() => setShowUserStatsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200/80 text-gray-500 transition-colors"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* 内容区域 */}
            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <UserStatsDisplay websites={websites} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const Settings = memo(SettingsComponent);
export default Settings;
